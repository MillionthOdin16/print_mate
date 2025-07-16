import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const filePath = path.join(process.cwd(), 'data/printers.json');

export async function GET() {
  try {
    const printers = await getPrinters();
    return NextResponse.json(printers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch printers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { slug, name, model, ip, password, serial } = await request.json();
    await addPrinter(slug, name, model, ip, password, serial);
    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add printer' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { slug } = await request.json();
    await removePrinter(slug);
    return NextResponse.json(
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to remove printer' },
      { status: 500 }
    );
  }
}

async function getPrinters() {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

async function addPrinter(slug: string, name: string, model: string, ip: string, password: string, serial: string) {
  const printers = await getPrinters();
  printers.push({ slug, name, model, ip, password, serial });
  await fs.writeFile(filePath, JSON.stringify(printers, null, 2));
}

async function removePrinter(slug: string) {
  console.log('fat');
  const printers = await getPrinters();
  const newPrinters = printers.filter(printer => printer.slug !== slug);
  await fs.writeFile(filePath, JSON.stringify(newPrinters, null, 2));
}

async function editPrinter(slug: string, name: string, model: string, ip: string, password: string, serial: string) {
  removePrinter(slug);
  addPrinter(slug, name, model, ip, password, serial);
}