import { Client } from 'basic-ftp';
import { NextRequest } from 'next/server';
import { getCachedFile, cacheFile } from '@/lib/fileCache';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const filename = decodeURIComponent(url.searchParams.get('filename') || '');
  const progress = url.searchParams.get('progress') === 'true';
  
  if (filename) { 
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

    if (progress) {
      const stream = new ReadableStream({
        start(controller) {
          downloadFileWithProgress(controller, host, port, password, serial, filename, printerKey);
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        },
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
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      console.log(`downloading: ${filename}`);
      
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
        const timelapseList = await client.list('/timelapse');
        fileExists = timelapseList.some(item => item.name === filename && item.type === 1);
        if (fileExists) {
          filePath = `/timelapse/${filename}`;
        }
      } catch (error) {
        try {
          const rootList = await client.list('/');
          fileExists = rootList.some(item => item.name === filename && item.type === 1);
          filePath = `/${filename}`;
        } catch (error2) {
          try {
            const cacheList = await client.list('/cache');
            fileExists = cacheList.some(item => item.name === filename && item.type === 1);
            if (fileExists) {
              filePath = `/cache/${filename}`;
            }
          } catch (error3) {
            console.error('file does not exist in any directory');
          }
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

  const { host, port, password, directory } = await req.json();

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

    if (!directory) {
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
    } else {
      const list = await client.list(directory);

      return new Response(JSON.stringify(list), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
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

async function downloadFileWithProgress(
  controller: ReadableStreamDefaultController,
  host: string,
  port: string,
  password: string,
  serial: string,
  filename: string,
  printerKey: string
) {
  const client = new Client(20000);
  client.ftp.verbose = true;

  try {
    const cachedFilePath = await getCachedFile(printerKey, filename);
    
    if (cachedFilePath) {
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(cachedFilePath);
      
      controller.enqueue(`data: ${JSON.stringify({ type: 'progress', progress: 50 })}\n\n`);
      controller.enqueue(`data: ${JSON.stringify({ type: 'progress', progress: 100 })}\n\n`);
      
      const base64Data = fileBuffer.toString('base64');
      controller.enqueue(`data: ${JSON.stringify({ 
        type: 'complete', 
        filename: filename,
        data: base64Data,
        contentType: getContentType(filename)
      })}\n\n`);
      controller.close();
      return;
    }

    console.log(`downloading with progress: ${filename}`);
    
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
      const timelapseList = await client.list('/timelapse');
      fileExists = timelapseList.some(item => item.name === filename && item.type === 1);
      if (fileExists) {
        filePath = `/timelapse/${filename}`;
      }
    } catch (error) {
      try {
        const rootList = await client.list('/');
        fileExists = rootList.some(item => item.name === filename && item.type === 1);
        filePath = `/${filename}`;
      } catch (error2) {
        try {
          const cacheList = await client.list('/cache');
          fileExists = cacheList.some(item => item.name === filename && item.type === 1);
          if (fileExists) {
            filePath = `/cache/${filename}`;
          }
        } catch (error3) {
          console.error('file does not exist in any directory');
        }
      }
    }

    if (!fileExists) {
      controller.enqueue(`data: ${JSON.stringify({ type: 'error', error: 'File not found' })}\n\n`);
      controller.close();
      return;
    }

    let fileSize = 0;
    try {
      const fileStats = await client.size(filePath);
      fileSize = fileStats;
    } catch (error) {
      console.warn('Could not get file size, progress will be estimated');
    }

    const { Writable } = require('stream');
    const chunks: Buffer[] = [];
    let downloadedBytes = 0;

    const writeStream = new Writable({
      write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void) {
        chunks.push(chunk);
        downloadedBytes += chunk.length;
        
        if (fileSize > 0) {
          const progress = Math.min(Math.round((downloadedBytes / fileSize) * 100), 100);
          controller.enqueue(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`);
        }
        
        callback();
      }
    });

    client.trackProgress(info => {
      if (fileSize > 0) {
        const progress = Math.min(Math.round((info.bytes / fileSize) * 100), 100);
        controller.enqueue(`data: ${JSON.stringify({ type: 'progress', progress })}\n\n`);
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

    const base64Data = fileBuffer.toString('base64');
    controller.enqueue(`data: ${JSON.stringify({ 
      type: 'complete', 
      filename: filename,
      data: base64Data,
      contentType: getContentType(filename)
    })}\n\n`);
    
    controller.close();
    
  } catch (error) {
    controller.enqueue(`data: ${JSON.stringify({ 
      type: 'error', 
      error: String(error) 
    })}\n\n`);
    controller.close();
  } finally {
    client.close();
  }
}