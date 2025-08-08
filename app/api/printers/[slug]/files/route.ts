import { Client } from 'basic-ftp';
import { NextRequest } from 'next/server';
import { getCachedFile, cacheFile } from '@/lib/fileCache';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const filename = decodeURIComponent(url.searchParams.get('filename') || '');
  
  if (filename) { 
    // file retrieval request
    const { host, port, password, serial } = await req.json();
    const printerKey = `${host}:${serial}`;

    if (!host || !port || !password || !serial) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: host, port, password, serial' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const client = new Client(20000);
    client.ftp.verbose = true;

    try {
      const cachedFilePath = await getCachedFile(printerKey, filename);
      
      if (cachedFilePath) {
        const fs = require('fs');
        const fileBuffer = fs.readFileSync(cachedFilePath);
        
        return new Response(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': getContentType(filename),
            'Cache-Control': 'public, max-age=86400', // 1d
          },
        });
      }

      console.log(`downloading to cache: ${filename}`);
      
      await client.access({
        host: host,
        port: parseInt(port),
        user: 'bblp',
        password: password,
        secure: 'implicit',
        secureOptions: {
          rejectUnauthorized: false,
        },
      });

      let filePath = `/${filename}`;
      let fileExists = false;

      try {
        const rootList = await client.list('/');
        fileExists = rootList.some(item => item.name === filename && item.type === 1); // type 1 = file
      } catch (error) {
        
      }

      if (!fileExists) {
        try {
          const cacheList = await client.list('/cache');
          const foundInCache = cacheList.some(item => item.name === filename && item.type === 1);
          if (foundInCache) {
            filePath = `/cache/${filename}`;
            fileExists = true;
          }
        } catch (error) {
          
        }
      }

      if (!fileExists) {
        return new Response(JSON.stringify({ 
          error: 'File not found in printer root or cache directory' 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { Writable } = require('stream');
      const chunks: Buffer[] = [];
      
      const writeStream = new Writable({
        write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
          chunks.push(chunk);
          callback();
        }
      });

      await client.downloadTo(writeStream, filePath);
      const fileBuffer = Buffer.concat(chunks);
      
      try {
        await cacheFile(printerKey, filename, fileBuffer);
        console.log(`successfully added file to cache: ${filename}`);
      } catch (error) {
        console.warn(`failed to cache file: ${error || 'unknown error'}`);
      }
      
      return new Response(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': getContentType(filename),
          'Cache-Control': 'public, max-age=86400',
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error retrieving file', detail: String(error) }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    } finally {
      client.close();
    }
  }

  // file listing request
  const { host, port, password } = await req.json();

  if (!host || !port || !password) {
    return new Response(JSON.stringify({ 
      error: 'Missing required parameters: host, port, password' 
    }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const client = new Client(20000);
  client.ftp.verbose = true;

  try {
    await client.access({
      host: host,
      port: port,
      user: 'bblp',
      password: password,
      secure: 'implicit',
      secureOptions: {
        rejectUnauthorized: false,
      },
    });

    const rootList = await client.list('/');
    const cacheList = await client.list('/cache');
    
    const exclude = [ 'logger', 'recorder', 'image', 'ipcam', 'cache', 'model', 'timelapse', 'verify_job', 'corelogger' ]

    const mapped = [
      ...rootList
      .filter(item => !exclude.includes(item.name))
      .filter(item => !item.name.endsWith('.gcode'))
      .filter(item => !item.name.endsWith('.bbl'))
      .map((item) => ({
        filename: `${item.name}`,
        thumbnail: 'nonexistant.png',
      })),
      ...cacheList
      .filter(item => !item.name.endsWith('.gcode'))
      .filter(item => !item.name.endsWith('.bbl'))
      .map((item) => ({
        filename: `cache/${item.name}`,
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

const getContentType = (filename: string) => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'gcode') return 'text/plain';
  else return 'application/octet-stream';
};