import { NextRequest } from 'next/server';
import { createSubscription, getCurrentPrinterState } from '@/lib/printerSubscriptions';

function getPrinterKey(host: string, serial: string): string {
  return `${host}:${serial}`;
}

export async function POST(req: NextRequest) {
  try {
    const { host, username, password, serial, subscriberId } = await req.json();

    if (!host || !password || !serial || !subscriberId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: host, password, serial, subscriberId' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const printerKey = getPrinterKey(host, serial);

    const stream = new ReadableStream({
      start(controller) {
        // send cached data
        controller.enqueue(`data: ${JSON.stringify({
          type: 'initial',
          data: getCurrentPrinterState(printerKey),
          connected: false
        })}\n\n`);

        createSubscription(host, username, password, serial, subscriberId, controller)
          .then(cleanup => {
            // cleanup func
            (controller as any).cleanup = cleanup;
          })
          .catch(error => {
            controller.enqueue(`data: ${JSON.stringify({
              type: 'error',
              error: error.message
            })}\n\n`);
            controller.close();
          });
      },
      
      cancel() {
        console.log('Stream cancelled by client');
        if ((controller as any).cleanup) {
          (controller as any).cleanup();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}