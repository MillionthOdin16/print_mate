import fs from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET() {
  const filePath = path.join(process.cwd(), 'data/printers.json');
  const content = await fs.readFile(filePath, 'utf-8');
  let data = JSON.parse(content);
  
  return NextResponse.json(data);
}
