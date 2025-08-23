import mqttManager from '@/lib/mqtt';
import { PrinterState } from './printerState';

interface SubscriptionData {
  host: string;
  username: string;
  password: string;
  serial: string;
  subscriberId: string;
  controller?: ReadableStreamDefaultController<string>;
  heartbeatInterval?: NodeJS.Timeout;
  isActive: boolean;
  cleanup?: () => void;
}

const printersState: { [printerKey: string]: PrinterState } = {};
const activeSubscriptions: { [key: string]: SubscriptionData } = {};

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

export function getCurrentPrinterState(printerKey: string): PrinterState {
  return printersState[printerKey] || { print: {} };
}

export function createSubscription(
  host: string, 
  username: string,
  password: string, 
  serial: string, 
  subscriberId: string, 
  controller: ReadableStreamDefaultController<string>
): Promise<() => void> {
  const key = getPrinterKey(host, serial);
  const subscriptionKey = `${key}-${subscriberId}`;

  if (!printersState[key]) {
    printersState[key] = { print: {}, event: {
      event: '',
      disconnected_at: '',
      connected_at: ''
    } };
  }

  return new Promise(async (resolve, reject) => {
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let isStreamActive = true;
    let cleanupCalled = false;

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
        cleanup();
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
      username,
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
      data: printersState[key],
      connected: mqttManager.isConnected(host, serial)
    })}\n\n`);

    try {
      await mqttManager.subscribe(host, username, password, serial, subscriberId, (topic, message) => {
        if (!isStreamActive || cleanupCalled) return;
        
        try {
          const data = JSON.parse(message.toString());
          
          printersState[key].print = deepMerge(
            printersState[key].print, 
            data.print
          );
   
          const { ...otherProps } = data;
          if (Object.keys(otherProps).length > 0) {
            printersState[key] = deepMerge(
              printersState[key], 
              otherProps
            );
          }

          enqueue(`data: ${JSON.stringify({
            type: 'update',
            data: printersState[key],
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
      // eslint-disable-next-line
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