import path from 'path';
import fs from 'fs/promises'

export async function getPrinters() {
  const filePath = path.join(process.cwd(), 'data/printers.json');
  const fileContent = JSON.parse(await fs.readFile(filePath, 'utf-8'));
  fileContent['status'] = "Idle";
  return fileContent;
}
