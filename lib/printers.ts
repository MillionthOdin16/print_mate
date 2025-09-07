import { Capacitor } from '@capacitor/core';
import * as MobileStorage from './mobile-storage';

// Check if we're running on a mobile platform
const isMobile = Capacitor.isNativePlatform();

export async function getPrinters() {
  if (isMobile) {
    return await MobileStorage.getPrinters();
  }
  const res = await fetch('/api/printers');
  return await res.json();
}

export async function addPrinter(printerData: {
  slug: string;
  name: string;
  model: string;
  ip: string;
  username: string;
  password: string;
  code: string;
  cloud: boolean;
  serial: string;
}) {
  if (isMobile) {
    await MobileStorage.addPrinter(printerData);
    return { success: true };
  }
  const res = await fetch('/api/printers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(printerData)
  });
  return await res.json();
}

export async function removePrinter(slug: string) {
  if (isMobile) {
    await MobileStorage.removePrinter(slug);
    return { success: true };
  }
  const res = await fetch('/api/printers', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug })
  });
  return await res.json();
}

export async function editPrinter(printerData: {
  oldSlug: string;
  slug: string;
  name: string;
  model: string;
  ip: string;
  username: string;
  password: string;
  code: string;
  cloud: boolean;
  serial: string;
}) {
  if (isMobile) {
    await MobileStorage.editPrinter(printerData.oldSlug, {
      slug: printerData.slug,
      name: printerData.name,
      model: printerData.model,
      ip: printerData.ip,
      username: printerData.username,
      password: printerData.password,
      code: printerData.code,
      cloud: printerData.cloud,
      serial: printerData.serial
    });
    return { success: true };
  }
  const res = await fetch('/api/printers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(printerData)
  });
  return await res.json();
}