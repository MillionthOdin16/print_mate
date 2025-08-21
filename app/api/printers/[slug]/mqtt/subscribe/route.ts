import { NextRequest } from 'next/server';
import mqttManager from '@/lib/mqtt';

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

    await mqttManager.subscribe(host, username, password, serial, subscriberId, () => {
      
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