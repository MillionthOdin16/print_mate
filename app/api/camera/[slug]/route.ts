import { NextRequest, NextResponse } from 'next/server';
import { TLSSocket, connect as tlsConnect } from 'tls';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Printer {
  slug: string;
  name: string;
  model: string;
  ip: string;
  password: string;
  code: string;
  serial: string;
}

interface Connection {
  socket: TLSSocket | null;
  connecting: boolean;
  lastFrame: Buffer | null;
  lastFrameTime: number;
  subscribers: Set<ReadableStreamDefaultController>;
  timeout: NodeJS.Timeout | null;
  reconnect: boolean;
  retries: number;
}

class CameraManager {
  private static instance: CameraManager;
  private connections: Map<string, Connection> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  private constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // 5m
    
    this.initCameras();
  }

  static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager();
    }
    return CameraManager.instance;
  }

  private loadPrinters(): Printer[] {
    const filePath = path.join(process.cwd(), 'data', 'printers.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  }

  private initCameras(): void {
    const printers = this.loadPrinters();
    for (const printer of printers) {
      this.getConnection(printer.slug);
    }
  }

  private createAuthPacket(username: string, password: string): Buffer {
    const packet = Buffer.alloc(80);
    
    packet.writeUInt32LE(0x40, 0);
    packet.writeUInt32LE(0x3000, 4);
    packet.writeUInt32LE(0, 8);
    packet.writeUInt32LE(0, 12);
    
    const uBuffer = Buffer.from(username, 'ascii');
    uBuffer.copy(packet, 16);
    
    const pBuffer = Buffer.from(password, 'ascii');
    pBuffer.copy(packet, 48);
    
    return packet;
  }

  private parseHeader(headerBuffer: Buffer) {
    return {
      payloadSize: headerBuffer.readUInt32LE(0),
      itrack: headerBuffer.readUInt32LE(4),
      flags: headerBuffer.readUInt32LE(8),
      reserved: headerBuffer.readUInt32LE(12)
    };
  }

  private connect(slug: string): void {
    const printers = this.loadPrinters();
    const printer = printers.find(p => p.slug === slug);
    if (!printer) return;

    const connection = this.connections.get(slug);
    if (!connection || connection.connecting) return;

    if (connection.socket) {
      // already connected
      return;
    }

    connection.connecting = true;
    connection.retries = (connection.retries || 0) + 1;

    let headerBuffer = Buffer.alloc(0);
    let imageBuffer = Buffer.alloc(0);
    let imageSize = 0;
    let receiving = false;

    try {
      console.log(`connect camera ${printer.ip}:6000`);
      connection.socket = tlsConnect({
        host: printer.ip,
        port: 6000,
        rejectUnauthorized: false,
        timeout: 10000
      });

      connection.socket.on('connect', () => {
        console.log(`connected, ${printer.ip}:6000`);
        connection.connecting = false;
        connection.retries = 0;
        
        const auth = this.createAuthPacket('bblp', printer.code);
        connection.socket?.write(auth);
      });

      connection.socket.on('data', (data: Buffer) => {
        let offset = 0;
        
        while (offset < data.length) {
          if (!receiving) {
            const headerBytes = 16 - headerBuffer.length;
            const dataBytes = data.length - offset;
            const bytesToRead = Math.min(headerBytes, dataBytes);
            
            headerBuffer = Buffer.concat([headerBuffer, data.subarray(offset, offset + bytesToRead)]);
            offset += bytesToRead;
            
            if (headerBuffer.length === 16) {
              const header = this.parseHeader(headerBuffer);
              imageSize = header.payloadSize;
              
              if (imageSize > 0 && imageSize < 10 * 1024 * 1024) {
                receiving = true;
                headerBuffer = Buffer.alloc(0);
                imageBuffer = Buffer.alloc(0);
              } else {
                console.error('invalid payload size:', imageSize);
                headerBuffer = Buffer.alloc(0);
              }
            }
          } else {
            const imageBytes = imageSize - imageBuffer.length;
            const dataBytes = data.length - offset;
            const bytesToRead = Math.min(imageBytes, dataBytes);
            
            imageBuffer = Buffer.concat([imageBuffer, data.subarray(offset, offset + bytesToRead)]);
            offset += bytesToRead;
            
            if (imageBuffer.length === imageSize) {
              if (imageBuffer.length >= 4 &&
                  imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && 
                  imageBuffer[imageBuffer.length - 2] === 0xFF && 
                  imageBuffer[imageBuffer.length - 1] === 0xD9) {
                
                connection.lastFrame = imageBuffer;
                connection.lastFrameTime = Date.now();
                this.broadcast(slug, imageBuffer);
              } else {
                console.warn('invalid frame received');
              }
              
              receiving = false;
              imageSize = 0;
              imageBuffer = Buffer.alloc(0);
            }
          }
        }
      });

      connection.socket.on('error', (error) => {
        console.error(`camera connection error: ${slug}:`, error);
        this.disconnect(slug);
      });

      connection.socket.on('close', () => {
        console.log(`camera connection closed: ${slug}`);
        this.disconnect(slug);
      });

      connection.socket.on('timeout', () => {
        console.log(`camera connection timeout: ${slug}`);
        this.disconnect(slug);
      });

    } catch (error) {
      console.error(`failed to connect to ${slug} camera:`, error);
      this.disconnect(slug);
    }
  }

  private disconnect(slug: string): void {
    const connection = this.connections.get(slug);
    if (!connection) return;

    connection.connecting = false;
    if (connection.timeout) {
      clearTimeout(connection.timeout);
      connection.timeout = null;
    }
    if (connection.socket) {
      try {
        connection.socket.destroy();
      } catch {}
      connection.socket = null;
    }
  }

  private broadcast(slug: string, frame: Buffer): void {
    const connection = this.connections.get(slug);
    if (!connection) return;

    const boundary = '\r\n--mjpegboundary\r\n';
    const headers = `Content-Type: image/jpeg\r\nContent-Length: ${frame.length}\r\n\r\n`;
    
    const boundaryBuffer = new TextEncoder().encode(boundary);
    const headersBuffer = new TextEncoder().encode(headers);

    connection.subscribers.forEach(controller => {
      try {
        controller.enqueue(boundaryBuffer);
        controller.enqueue(headersBuffer);
        controller.enqueue(frame);
      } catch (error) {
        connection.subscribers.delete(controller);
      }
    });
  }

  getConnection(slug: string): Connection {
    if (!this.connections.has(slug)) {
      const connection: Connection = {
        socket: null,
        connecting: false,
        lastFrame: null,
        lastFrameTime: 0,
        subscribers: new Set(),
        timeout: null,
        reconnect: true,
        retries: 0
      };
      
      this.connections.set(slug, connection);
      this.connect(slug);
    }

    return this.connections.get(slug)!;
  }

  subscribe(slug: string, controller: ReadableStreamDefaultController): () => void {
    const connection = this.getConnection(slug);
    connection.subscribers.add(controller);

    // trigger reconnect if needed
    if (!connection.socket && !connection.connecting && connection.reconnect) {
      this.connect(slug);
    }

    if (connection.lastFrame && Date.now() - connection.lastFrameTime < 5000) {
      try {
        const boundary = '\r\n--mjpegboundary\r\n';
        const headers = `Content-Type: image/jpeg\r\nContent-Length: ${connection.lastFrame.length}\r\n\r\n`;
        
        controller.enqueue(new TextEncoder().encode(boundary));
        controller.enqueue(new TextEncoder().encode(headers));
        controller.enqueue(connection.lastFrame);
      } catch (error) {
        console.error('error sending cached frame:', error);
      }
    }

    return () => {
      connection.subscribers.delete(controller);
    };
  }

  private cleanup(): void {
    for (const [slug, connection] of this.connections) {
      if (connection.subscribers.size === 0) {
        const timeSinceFrame = Date.now() - connection.lastFrameTime;
        if (timeSinceFrame > 10 * 60 * 1000) { // 10m
          console.log(`cleaning up inactive camera connection: ${slug}`);
          connection.reconnect = false;
          if (connection.timeout) {
            clearTimeout(connection.timeout);
          }
          if (connection.socket) {
            connection.socket.destroy();
          }
          this.connections.delete(slug);
        }
      }
    }
  }
}

const cameraManager = CameraManager.getInstance();

function loadPrinters(): Printer[] {
  const filePath = path.join(process.cwd(), 'data', 'printers.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}


export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = await params;
  
  const printers = loadPrinters();
  const printer = printers.find(p => p.slug === slug);
  
  if (!printer) {
    return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
  }

  const stream = new ReadableStream<Uint8Array>({
    start: (controller) => {
      const unsubscribe = cameraManager.subscribe(slug, controller);

      // close stream when client disconnects
      const close = () => {
        try { unsubscribe(); } catch {}
        try { controller.close(); } catch {}
      };

      // Attach to request abort if available
      const signal = (request as any).signal as AbortSignal | undefined;
      if (signal) {
        if (signal.aborted) {
          close();
        } else {
          const onAbort = () => {
            signal.removeEventListener('abort', onAbort);
            close();
          };
          signal.addEventListener('abort', onAbort);
        }
      }
    },
    cancel: () => {
      // Reader cancelled; subscriber cleanup happens via unsubscribe in start's close
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'multipart/x-mixed-replace; boundary=mjpegboundary',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
      Connection: 'keep-alive'
    }
  });
}