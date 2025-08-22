import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const filePath = path.join(process.cwd(), 'data/printers.json');

export async function GET() {
  try {
    const printers = await getPrinters();
    return NextResponse.json(printers);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch printers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { slug, name, model, ip, username, password, code, cloud, serial } = await request.json();
    await addPrinter(slug, name, model, ip, username, password, code, cloud, serial);
    return NextResponse.json(
      { success: true },
      { status: 201 }
    );
  } catch {
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to remove printer' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { oldSlug, slug, name, model, ip, username, password, code, cloud, serial } = await request.json();
    await editPrinter( oldSlug, slug, name, model, ip, username, password, code, cloud, serial);
    return NextResponse.json(
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Failed to edit printer' }
    )
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

async function addPrinter(slug: string, name: string, model: string, ip: string, username: string, password: string, code: string, cloud: boolean, serial: string) {
  const printers = await getPrinters();
  printers.push({ slug, name, model, ip, username, password, code, cloud, serial });
  await fs.writeFile(filePath, JSON.stringify(printers, null, 2));
}

async function removePrinter(slug: string) {
  const printers = await getPrinters();
  const newPrinters = printers.filter((printer: { slug: string; }) => printer.slug !== slug);
  await fs.writeFile(filePath, JSON.stringify(newPrinters, null, 2));
}

async function editPrinter(oldSlug: string, slug: string, name: string, model: string, ip: string, username: string, password: string, code: string, cloud: boolean, serial: string) {
  await removePrinter(oldSlug);
  await addPrinter(slug, name, model, ip, username, password, code, cloud, serial);
}