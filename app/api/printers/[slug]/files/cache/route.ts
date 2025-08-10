import { NextRequest, NextResponse } from 'next/server';
import { cacheFile, deleteCacheFile } from '@/lib/fileCache';

export async function PUT(req: NextRequest) {
  try {
    const { filename, fileBuffer, printerKey } = await req.json();

    if (!filename || !fileBuffer || !printerKey) {
      return NextResponse.json({ error: 'Missing required parameters: filename, fileBuffer, or printerKey' }, { status: 400 });
    }

    const buffer = Buffer.from(fileBuffer, 'base64');

    await cacheFile(printerKey, filename, buffer);
    return NextResponse.json({ success: true, message: 'File cached successfully' });
  } catch (error) {
    console.error(`failed to cache file: ${error}`);
    return NextResponse.json({ error: 'Failed to save file to cache', detail: String(error) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { filename, printerKey } = await req.json();

    if (!filename || !printerKey) {
      return NextResponse.json({ error: 'Missing required parameters: filename or printerKey' }, { status: 400 });
    }

    const res = await deleteCacheFile(printerKey, filename);
    return NextResponse.json({success: res});
  } catch (error) {
    console.error(`failed to delete file: ${error}`)
    return NextResponse.json({ error: 'Failed to delete file from cache', detail: String(error) }, { status: 400 });
  }
}