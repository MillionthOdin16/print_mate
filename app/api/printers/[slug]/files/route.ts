import { Client } from 'basic-ftp';

export async function GET() {
  const client = new Client(20000);
  client.ftp.verbose = true;

  try {
    await client.access({
      host: '192.168.0.77',
      port: 990,
      user: 'bblp',
      password: '15577925',
      secure: 'implicit',
      secureOptions: {
        rejectUnauthorized: false,
      },
    });

    const rootList = await client.list('/');
    const cacheList = await client.list('/cache');
    
    const exclude = [ 'logger', 'recorder', 'image', 'ipcam', 'cache', 'model', 'timelapse', 'verify_job' ]

    const mapped = [
      ...rootList
      .filter(item => !exclude.includes(item.name))
      .map((item) => ({
        filename: `${item.name}`,
        thumbnail: 'nonexistant.png',
      })),
      ...cacheList
      .map((item) => ({
        filename: `${item.name}`,
        thumbnail: 'nonexistant.png',
      }))
    ];

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Error retrieving file listing', detail: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    client.close();
  }
}
