import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');

export interface CachedFile {
  filePath: string;
  originalFilename: string;
  printerKey: string;
  timestamp: number;
  size: number;
}

function sanitize(input: string): string {
  return input.replace(/[<>:"|?*\\/]/g, '_').replace(/\s+/g, '_');
}

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

export async function getCachedFile(printerKey: string, filename: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    
    const cacheFilePath = path.join(CACHE_DIR, sanitize(printerKey), filename)

    try {
      await fs.access(cacheFilePath);
    } catch {
      return null;
    }

    return cacheFilePath;
  } catch (error) {
    console.error('error checking cached file:', error);
    return null;
  }
}

export async function cacheFile(
  printerKey: string, 
  filename: string, 
  fileBuffer: Buffer
): Promise<string> {
  try {
    await ensureCacheDir();
    const cacheDir = path.join(CACHE_DIR, sanitize(printerKey));
    const filePath = path.join(cacheDir, filename);

    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);

    return filePath;
  } catch (error) {
    console.error(`failed to cache file: ${error || 'unknown error'}`);
    throw error;
  }
}

export async function deleteCacheFile(
  printerKey: string,
  filename: string
): Promise<boolean> {
  try {
    await ensureCacheDir();

    const cacheDir = path.join(CACHE_DIR, sanitize(printerKey));
    const filePath = path.join(cacheDir, filename)
    
    await fs.unlink(filePath);
    try {
      await fs.access(filePath)
    } catch {
      console.log(`successfully deleted ${filePath}`)
      return true;
    }

    return false;
  } catch (error) {
    console.error(`failed to delete file: ${error || 'unknown error'}`)
    return false;
  }
}