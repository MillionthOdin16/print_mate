import { NextRequest, NextResponse } from 'next/server';
import { cacheFile } from '@/lib/fileCache';

export async function POST(req: NextRequest) {
  try {
    const { filename, fileBuffer, printerKey } = await req.json();

    if (!filename || !fileBuffer || !printerKey) {
      return NextResponse.json({ error: 'Missing required parameters: filename, fileBuffer, or printerKey' }, { status: 400 });
    }

    const buffer = Buffer.from(fileBuffer, 'base64');

    try {
      await cacheFile(printerKey, filename, buffer);
      return NextResponse.json({ success: true, message: 'File cached successfully' });
    } catch (error) {
      console.error('Error caching file:', error);
      return NextResponse.json({ error: 'Failed to cache file', detail: String(error) }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request', detail: String(error) }, { status: 400 });
  }
}