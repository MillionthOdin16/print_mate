import { NextRequest } from 'next/server';
import mqtt from 'mqtt';

export async function POST(req: NextRequest) {
  const payload = await req.json();

  return new Promise((resolve) => {
    try {
      const client = mqtt.connect(`mqtts://192.168.0.78:8883`, {
        username: 'bblp',
        password: '15577925',
        rejectUnauthorized: false,
        connectTimeout: 10000
      });

      client.on('connect', () => {
        client.publish('device/03919D471202367/request', payload, {}, (err) => {
          client.end();
          if (err) {
            resolve(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
          } else {
            resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
          }
        });
      });

      client.on('error', (err) => {
        client.end();
        resolve(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
      });
    } catch (err: any) {
      resolve(new Response(JSON.stringify({ error: err.message }), { status: 500 }));
    }
  });
}
