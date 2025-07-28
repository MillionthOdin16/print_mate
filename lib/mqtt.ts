import mqtt, { MqttClient } from 'mqtt';

interface ConnectionConfig {
  host: string;
  password: string;
  serial: string;
}

interface ConnectionInfo {
  client: MqttClient;
  config: ConnectionConfig;
  lastUsed: number;
  subscribers: Set<string>;
}

type MessageHandler = (topic: string, message: Buffer) => void;

class MQTTConnectionManager {
  private static instance: MQTTConnectionManager;
  private connections: Map<string, ConnectionInfo> = new Map();
  private messageHandlers: Map<string, Map<string, MessageHandler>> = new Map();
  private connectionPromises: Map<string, Promise<MqttClient>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000); // 5m
  }

  static getInstance(): MQTTConnectionManager {
    if (!MQTTConnectionManager.instance) {
      MQTTConnectionManager.instance = new MQTTConnectionManager();
    }
    return MQTTConnectionManager.instance;
  }

  private getConnectionKey(host: string, serial: string): string {
    return `${host}:${serial}`;
  }

  async getConnection(config: ConnectionConfig): Promise<MqttClient> {
    const key = this.getConnectionKey(config.host, config.serial);
    
    if (this.connectionPromises.has(key)) {
      return this.connectionPromises.get(key)!;
    }
    
    if (this.connections.has(key)) {
      const connectionInfo = this.connections.get(key)!;
      if (connectionInfo.client.connected) {
        connectionInfo.lastUsed = Date.now();
        return connectionInfo.client;
      } else {
        this.cleanup(key);
      }
    }

    const connectionPromise = this.createConnection(config);
    this.connectionPromises.set(key, connectionPromise);
    
    try {
      const client = await connectionPromise;
      return client;
    } catch (error) {
      this.connectionPromises.delete(key);
      throw error;
    }
  }

  private async createConnection(config: ConnectionConfig): Promise<MqttClient> {
    const key = this.getConnectionKey(config.host, config.serial);
    
    return new Promise((resolve, reject) => {
      const client = mqtt.connect(`mqtts://${config.host}:8883`, {
        username: 'bblp',
        password: config.password,
        rejectUnauthorized: false,
        connectTimeout: 10000,
        keepalive: 60,
        clean: true,
        clientId: `printmate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reconnectPeriod: 0,
      });

      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          client.end(true);
          this.connectionPromises.delete(key);
          reject(new Error(`Connection timeout for ${key}`));
        }
      }, 15000);

      const handleResolve = (client: MqttClient) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        
        const connectionInfo: ConnectionInfo = {
          client,
          config,
          lastUsed: Date.now(),
          subscribers: new Set()
        };
        
        this.connections.set(key, connectionInfo);
        this.messageHandlers.set(key, new Map());
        this.connectionPromises.delete(key);
        resolve(client);
      };

      const handleReject = (error: Error) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeout);
        client.end(true);
        this.connectionPromises.delete(key);
        reject(error);
      };

      client.on('connect', () => {
        handleResolve(client);
      });

      client.on('error', (err) => {
        handleReject(new Error(`MQTT connection failed: ${err.message}`));
      });

      client.on('close', () => {
        const currentConnection = this.connections.get(key);
        if (currentConnection?.client === client) {
          this.cleanup(key);
        }
      });

      client.on('message', (topic, message) => {
        const handlers = this.messageHandlers.get(key);
        if (handlers) {
          handlers.forEach(handler => {
            try {
              handler(topic, message);
            } catch (error) {
              console.error(`error in message handler for ${key}: ${error || 'unknown error'}`);
            }
          });
        }
      });
    });
  }

  private cleanup(key: string): void {
    const connectionInfo = this.connections.get(key);
    if (connectionInfo) {
      try {
        if (connectionInfo.client.connected) {
          connectionInfo.client.end(true);
        }
      } catch (error) {
        console.warn(`error cleaning up connection ${key}: ${error || 'unknown error'}`);
      }
    }
    this.connections.delete(key);
    this.messageHandlers.delete(key);
    this.connectionPromises.delete(key);
  }

  async publish(host: string, password: string, serial: string, payload: string): Promise<void> {
    const client = await this.getConnection({ host, password, serial });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Publish timeout'));
      }, 5000);

      client.publish(`device/${serial}/request`, payload, { qos: 0 }, (err) => {
        clearTimeout(timeout);
        if (err) {
          reject(new Error(`Publish failed: ${err.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  async subscribe(
    host: string, 
    password: string, 
    serial: string, 
    subscriberId: string, 
    handler: MessageHandler
  ): Promise<void> {
    const key = this.getConnectionKey(host, serial);
    
    const existingHandlers = this.messageHandlers.get(key);
    if (existingHandlers?.has(subscriberId)) {
      existingHandlers.set(subscriberId, handler);
      return;
    }
    
    const client = await this.getConnection({ host, password, serial });
    
    const handlers = this.messageHandlers.get(key);
    const isFirstSubscriber = !handlers || handlers.size === 0;
    
    if (isFirstSubscriber) {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Subscribe timeout'));
        }, 5000);

        client.subscribe(`device/${serial}/report`, { qos: 0 }, (err) => {
          clearTimeout(timeout);
          if (err) {
            reject(new Error(`Subscribe failed: ${err.message}`));
          } else {
            resolve();
          }
        });
      });
    }

    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, new Map());
    }
    this.messageHandlers.get(key)!.set(subscriberId, handler);

    const connectionInfo = this.connections.get(key);
    if (connectionInfo) {
      connectionInfo.subscribers.add(subscriberId);
    }
  }

  unsubscribe(host: string, serial: string, subscriberId: string): void {
    const key = this.getConnectionKey(host, serial);
    
    const handlers = this.messageHandlers.get(key);
    if (handlers) {
      handlers.delete(subscriberId);
    }

    const connectionInfo = this.connections.get(key);
    if (connectionInfo) {
      connectionInfo.subscribers.delete(subscriberId);
    }
  }

  isConnected(host: string, serial: string): boolean {
    const key = this.getConnectionKey(host, serial);
    const connectionInfo = this.connections.get(key);
    return connectionInfo?.client.connected ?? false;
  }

  disconnect(host: string, serial: string): void {
    const key = this.getConnectionKey(host, serial);
    this.cleanup(key);
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const maxIdleTime = 10 * 60 * 1000; // 10m

    for (const [key, connectionInfo] of this.connections) {
      if (connectionInfo.subscribers.size > 0) {
        continue;
      }

      if (now - connectionInfo.lastUsed > maxIdleTime) {
        console.log(`Cleaning up idle connection: ${key}`);
        this.cleanup(key);
      }
    }
  }
}

export default MQTTConnectionManager.getInstance();
