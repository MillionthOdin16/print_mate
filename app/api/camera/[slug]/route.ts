import { NextRequest, NextResponse } from 'next/server';
import { TLSSocket, connect as tlsConnect } from 'tls';
import fs from 'fs';
import path from 'path';

interface Printer {
  slug: string;
  name: string;
  model: string;
  ip: string;
  password: string;
  serial: string;
}

function loadPrinters(): Printer[] {
  const filePath = path.join(process.cwd(), 'data', 'printers.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

function createAuthPacket(username: string, password: string): Buffer {
  const packet = Buffer.alloc(80);
  
  // payload size 0x40 = 64 bytes
  packet.writeUInt32LE(0x40, 0);
  
  // type 0x3000
  packet.writeUInt32LE(0x3000, 4);
  
  // flags (0)
  packet.writeUInt32LE(0, 8);
  
  // reserved (0)
  packet.writeUInt32LE(0, 12);
  
  // 32 byte ascii username (null padded)
  const usernameBuffer = Buffer.from(username, 'ascii');
  usernameBuffer.copy(packet, 16);
  
  // 32 byte ascii password (null padded)
  const passwordBuffer = Buffer.from(password, 'ascii');
  passwordBuffer.copy(packet, 48);
  
  return packet;
}

function parseFrameHeader(headerBuffer: Buffer) {
  return {
    payloadSize: headerBuffer.readUInt32LE(0),
    itrack: headerBuffer.readUInt32LE(4),
    flags: headerBuffer.readUInt32LE(8),
    reserved: headerBuffer.readUInt32LE(12)
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const printers = loadPrinters();
  const printer = printers.find(p => p.slug === slug);
  
  if (!printer) {
    return NextResponse.json({ error: 'Printer not found' }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      let socket: TLSSocket;
      let headerBuffer = Buffer.alloc(0);
      let imageBuffer = Buffer.alloc(0);
      let expectedImageSize = 0;
      let receivingImage = false;

      const connectToCamera = () => {
        try {
          console.log(`Connecting to camera at ${printer.ip}:6000`);
          socket = tlsConnect({
            host: printer.ip,
            port: 6000,
            rejectUnauthorized: false
          });

          socket.on('connect', () => {
            console.log(`Connected to camera on ${printer.ip}:6000`);
            
            const authPacket = createAuthPacket('bblp', printer.password);
            socket.write(authPacket);
          });

          socket.on('data', (data: Buffer) => {
            let offset = 0;
            
            while (offset < data.length) {
              if (!receivingImage) {
                // receiving header
                const remainingHeaderBytes = 16 - headerBuffer.length;
                const availableBytes = data.length - offset;
                const bytesToRead = Math.min(remainingHeaderBytes, availableBytes);
                
                headerBuffer = Buffer.concat([headerBuffer, data.subarray(offset, offset + bytesToRead)]);
                offset += bytesToRead;
                
                if (headerBuffer.length === 16) {
                  // fully received
                  const frameHeader = parseFrameHeader(headerBuffer);
                  expectedImageSize = frameHeader.payloadSize;
                  
                  if (expectedImageSize > 0 && expectedImageSize < 10 * 1024 * 1024) { // Max 10MB
                    receivingImage = true;
                    headerBuffer = Buffer.alloc(0);
                    imageBuffer = Buffer.alloc(0);
                  } else {
                    console.error('Invalid payload size:', expectedImageSize);
                    headerBuffer = Buffer.alloc(0);
                  }
                }
              } else {
                // receiving image
                const remainingImageBytes = expectedImageSize - imageBuffer.length;
                const availableBytes = data.length - offset;
                const bytesToRead = Math.min(remainingImageBytes, availableBytes);
                
                imageBuffer = Buffer.concat([imageBuffer, data.subarray(offset, offset + bytesToRead)]);
                offset += bytesToRead;
                
                if (imageBuffer.length === expectedImageSize) {
                  // check magic bytes
                  if (imageBuffer.length >= 4 &&
                      imageBuffer[0] === 0xFF && imageBuffer[1] === 0xD8 && 
                      imageBuffer[imageBuffer.length - 2] === 0xFF && 
                      imageBuffer[imageBuffer.length - 1] === 0xD9) {
                    
                    try {
                      const boundary = '\r\n--mjpegboundary\r\n';
                      const headers = `Content-Type: image/jpeg\r\nContent-Length: ${imageBuffer.length}\r\n\r\n`;
                      
                      controller.enqueue(new TextEncoder().encode(boundary));
                      controller.enqueue(new TextEncoder().encode(headers));
                      controller.enqueue(imageBuffer);
                    } catch (error) {
                      console.error('Error sending frame:', error);
                    }
                  } else {
                    console.warn('Invalid JPEG frame received');
                  }
                  
                  receivingImage = false;
                  expectedImageSize = 0;
                  imageBuffer = Buffer.alloc(0);
                }
              }
            }
          });

          socket.on('error', (error) => {
            console.error('Camera connection error:', error);
            controller.error(error);
          });

          socket.on('close', () => {
            console.log('Camera connection closed');
            controller.close();
          });

        } catch (error) {
          console.error('Failed to connect to camera:', error);
          controller.error(error);
        }
      };

      connectToCamera();

      return () => {
        if (socket) {
          socket.destroy();
        }
      };
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'multipart/x-mixed-replace; boundary=mjpegboundary',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Connection': 'keep-alive'
    },
  });
}