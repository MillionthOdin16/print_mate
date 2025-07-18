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

class MQTTConnectionManager {
  private static instance: MQTTConnectionManager;
  private connections: Map<string, ConnectionInfo> = new Map();
  private messageHandlers: Map<string, Map<string, (topic: string, message: Buffer) => void>> = new Map();

  private constructor() {
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000);
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
    
    if (this.connections.has(key)) {
      const connectionInfo = this.connections.get(key)!;
      if (connectionInfo.client.connected) {
        connectionInfo.lastUsed = Date.now();
        return connectionInfo.client;
      } else {
        this.connections.delete(key);
        this.messageHandlers.delete(key);
      }
    }

    return this.createConnection(config);
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
        clean: false,
        clientId: `printmate_${config.serial}_${Date.now()}`
      });

      client.on('connect', () => {
        console.log(`Connected to MQTT broker: ${config.host} for ${config.serial}`);
        
        const connectionInfo: ConnectionInfo = {
          client,
          config,
          lastUsed: Date.now(),
          subscribers: new Set()
        };
        
        this.connections.set(key, connectionInfo);
        this.messageHandlers.set(key, new Map());

        resolve(client);
      });

      client.on('error', (err) => {
        console.error(`MQTT connection error for ${key}:`, err);
        this.connections.delete(key);
        this.messageHandlers.delete(key);
        reject(err);
      });

      client.on('close', () => {
        console.log(`MQTT connection closed for ${key}`);
        this.connections.delete(key);
        this.messageHandlers.delete(key);
      });

      client.on('message', (topic, message) => {
        const handlers = this.messageHandlers.get(key);
        if (handlers) {
          handlers.forEach(handler => handler(topic, message));
        }
      });
    });
  }

  async publish(host: string, serial: string, password: string, payload: string): Promise<void> {
    const client = await this.getConnection({ host, password, serial });
    
    return new Promise((resolve, reject) => {
      client.publish(`device/${serial}/request`, payload, {}, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async subscribe(host: string, serial: string, password: string, subscriberId: string, handler: (topic: string, message: Buffer) => void): Promise<void> {
    const key = this.getConnectionKey(host, serial);
    const client = await this.getConnection({ host, password, serial });
    
    client.subscribe(`device/${serial}/report`, (err) => {
      if (err) {
        throw err;
      }
    });

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
    return connectionInfo ? connectionInfo.client.connected : false;
  }

  disconnect(host: string, serial: string): void {
    const key = this.getConnectionKey(host, serial);
    const connectionInfo = this.connections.get(key);
    if (connectionInfo) {
      connectionInfo.client.end();
      this.connections.delete(key);
      this.messageHandlers.delete(key);
    }
  }

  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const maxIdleTime = 10 * 60 * 1000; // 10m

    for (const [key, connectionInfo] of this.connections) {
      if (connectionInfo.subscribers.size > 0) {
        continue;
      }

      if (now - connectionInfo.lastUsed > maxIdleTime) {
        console.log(`Cleaning up inactive connection: ${key}`);
        connectionInfo.client.end();
        this.connections.delete(key);
        this.messageHandlers.delete(key);
      }
    }
  }

  getConnectionStats(): { [key: string]: { connected: boolean; subscribers: number; lastUsed: number } } {
    const stats: { [key: string]: { connected: boolean; subscribers: number; lastUsed: number } } = {};
    
    for (const [key, connectionInfo] of this.connections) {
      stats[key] = {
        connected: connectionInfo.client.connected,
        subscribers: connectionInfo.subscribers.size,
        lastUsed: connectionInfo.lastUsed
      };
    }
    
    return stats;
  }
}

export default MQTTConnectionManager.getInstance();
