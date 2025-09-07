// Mobile-optimized storage using Capacitor Preferences
import { Preferences } from '@capacitor/preferences';

interface Printer {
  slug: string;
  name: string;
  model: string;
  ip: string;
  username: string;
  password: string;
  code: string;
  cloud: boolean;
  serial: string;
}

const PRINTERS_KEY = 'printers';

export async function getPrinters(): Promise<Printer[]> {
  try {
    const { value } = await Preferences.get({ key: PRINTERS_KEY });
    return value ? JSON.parse(value) : [];
  } catch (error) {
    console.error('Failed to get printers:', error);
    return [];
  }
}

export async function addPrinter(printer: Printer): Promise<void> {
  try {
    const printers = await getPrinters();
    printers.push(printer);
    await Preferences.set({
      key: PRINTERS_KEY,
      value: JSON.stringify(printers)
    });
  } catch (error) {
    console.error('Failed to add printer:', error);
    throw error;
  }
}

export async function removePrinter(slug: string): Promise<void> {
  try {
    const printers = await getPrinters();
    const filtered = printers.filter(p => p.slug !== slug);
    await Preferences.set({
      key: PRINTERS_KEY,
      value: JSON.stringify(filtered)
    });
  } catch (error) {
    console.error('Failed to remove printer:', error);
    throw error;
  }
}

export async function editPrinter(oldSlug: string, printer: Printer): Promise<void> {
  try {
    await removePrinter(oldSlug);
    await addPrinter(printer);
  } catch (error) {
    console.error('Failed to edit printer:', error);
    throw error;
  }
}