import mqttManager from '@/lib/mqtt';
import { cleanupPrintCache } from '@/lib/fileCache';

interface SubscriptionData {
  host: string;
  password: string;
  serial: string;
  subscriberId: string;
  controller?: ReadableStreamDefaultController<any>;
  heartbeatInterval?: NodeJS.Timeout;
  isActive: boolean;
  cleanup?: () => void;
}

let globalPrintersState: { [printerKey: string]: any } = {};
let activeSubscriptions: { [key: string]: SubscriptionData } = {};

function getPrinterKey(host: string, serial: string): string {
  return `${host}:${serial}`;
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

export function getCurrentPrinterState(printerKey: string): any {
  return globalPrintersState[printerKey] || { print: {} };
}

export function createSubscription(
  host: string, 
  password: string, 
  serial: string, 
  subscriberId: string, 
  controller: ReadableStreamDefaultController<any>
): Promise<() => void> {
  const key = getPrinterKey(host, serial);
  const subscriptionKey = `${key}-${subscriberId}`;

  if (!globalPrintersState[key]) {
    globalPrintersState[key] = { print: {} };
  }

  return new Promise(async (resolve, reject) => {
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let isStreamActive = true;
    let cleanupCalled = false;
    let lastPrintFile = '';
    let lastPrintState = '';

    const enqueue = (data: string) => {
      if (!isStreamActive || cleanupCalled) {
        return false;
      }
      
      try {
        controller.enqueue(data);
        return true;
      } catch (error) {
        console.error('failed to enqueue data:', error);
        isStreamActive = false;
        return false;
      }
    };

    const cleanup = () => {
      if (cleanupCalled) return;
      cleanupCalled = true;
      isStreamActive = false;
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      try {
        mqttManager.unsubscribe(host, serial, subscriberId);
      } catch (error) {
        console.error('failed to unsubscribe from mqtt:', error);
      }
      
      if (activeSubscriptions[subscriptionKey]) {
        delete activeSubscriptions[subscriptionKey];
      }
    };

    activeSubscriptions[subscriptionKey] = {
      host,
      password,
      serial,
      subscriberId,
      controller,
      heartbeatInterval: undefined,
      isActive: true,
      cleanup
    };

    // send cached data
    enqueue(`data: ${JSON.stringify({
      type: 'initial',
      data: globalPrintersState[key],
      connected: mqttManager.isConnected(host, serial)
    })}\n\n`);

    try {
      await mqttManager.subscribe(host, password, serial, subscriberId, (topic, message) => {
        if (!isStreamActive || cleanupCalled) return;
        
        try {
          const messageData = JSON.parse(message.toString());
          const currentPrintFile = globalPrintersState[key]?.print?.gcode_file || '';
          const currentPrintState = globalPrintersState[key]?.print?.gcode_state || '';
                    
          if ((lastPrintState !== 'FINISH' && currentPrintState === 'FINISH') ||
              (lastPrintState !== 'FAILED' && currentPrintState === 'FAILED')) {
            console.log(`cleaning up cache for: ${lastPrintFile}`);
            cleanupPrintCache(key, lastPrintFile).catch(err => 
              console.error('failed to cleanup print cache:', err)
            );
            console.log(`cleaned up cache for: ${lastPrintFile}`);
          }
          
          lastPrintFile = currentPrintFile;
          lastPrintState = currentPrintState;
          
          globalPrintersState[key].print = deepMerge(
            globalPrintersState[key].print, 
            messageData.print
          );
   
          const { print, ...otherProps } = messageData;
          if (Object.keys(otherProps).length > 0) {
            globalPrintersState[key] = deepMerge(
              globalPrintersState[key], 
              otherProps
            );
          }

          enqueue(`data: ${JSON.stringify({
            type: 'update',
            data: globalPrintersState[key],
            connected: mqttManager.isConnected(host, serial)
          })}\n\n`);
          
        } catch (parseError) {
          console.error(`failed to parse mqtt message for ${key}:`, parseError);
          enqueue(`data: ${JSON.stringify({
            type: 'error',
            error: 'Failed to parse MQTT message'
          })}\n\n`);
        }
      });

      enqueue(`data: ${JSON.stringify({
        type: 'connected',
        connected: mqttManager.isConnected(host, serial)
      })}\n\n`);

      heartbeatInterval = setInterval(() => {
        if (!isStreamActive || cleanupCalled) {
          cleanup();
          return;
        }
        
        enqueue(`data: ${JSON.stringify({ // update server state
          type: 'heartbeat',
          timestamp: Date.now(),
          connected: mqttManager.isConnected(host, serial)
        })}\n\n`);
      }, 30000);

      if (activeSubscriptions[subscriptionKey]) {
        activeSubscriptions[subscriptionKey].heartbeatInterval = heartbeatInterval;
      }

      resolve(cleanup);

    } catch (error: any) {
      cleanup();
      enqueue(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
      reject(error);
    }
  });
}

export function cleanupSubscription(subscriptionKey: string): void {
  const subscription = activeSubscriptions[subscriptionKey];
  if (subscription && subscription.cleanup) {
    subscription.cleanup();
  }
}

export function cleanupAllSubscriptions(): void {
  for (const key of Object.keys(activeSubscriptions)) {
    cleanupSubscription(key);
  }
}