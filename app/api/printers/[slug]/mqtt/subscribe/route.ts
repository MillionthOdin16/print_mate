import { NextRequest } from 'next/server';
import mqttManager from '@/lib/mqtt';

export async function POST(req: NextRequest) {
  try {
    const { host, password, serial, subscriberId } = await req.json();

    if (!host || !password || !serial || !subscriberId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: host, password, serial, subscriberId' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await mqttManager.subscribe(host, serial, password, subscriberId, (topic, message) => {
      console.log(`Message received on ${topic}:`, message.toString());
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Successfully subscribed to MQTT broker',
      connected: mqttManager.isConnected(host, serial)
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { host, serial, subscriberId } = await req.json();

    if (!host || !serial || !subscriberId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: host, serial, subscriberId' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    mqttManager.unsubscribe(host, serial, subscriberId);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Successfully unsubscribed from MQTT broker'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const host = searchParams.get('host');
    const serial = searchParams.get('serial');

    if (!host || !serial) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: host, serial' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const connected = mqttManager.isConnected(host, serial);
    const stats = mqttManager.getConnectionStats();

    return new Response(JSON.stringify({ 
      success: true,
      connected,
      stats: stats[`${host}:${serial}`] || null
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
