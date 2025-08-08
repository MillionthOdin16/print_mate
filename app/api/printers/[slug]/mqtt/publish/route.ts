import { NextRequest } from 'next/server';
import mqttManager from '@/lib/mqtt';

export async function POST(req: NextRequest) {
  try {
    const { host, password, serial, payload } = await req.json();

    if (!host || !password || !serial || !payload) {
      return new Response(JSON.stringify({ error: 'Missing required parameters: host, password, serial, payload' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log(JSON.stringify(payload))
    await mqttManager.publish(host, password, serial, JSON.stringify(payload));

    return new Response(JSON.stringify({ success: true }), { 
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
