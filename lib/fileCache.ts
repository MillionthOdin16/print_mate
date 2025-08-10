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
    
    const printerCacheDir = path.join(CACHE_DIR, sanitize(printerKey));
    
    await fs.mkdir(printerCacheDir, { recursive: true });
    
    const cacheFilePath = path.join(printerCacheDir, filename);

    await fs.writeFile(cacheFilePath, fileBuffer);

    return cacheFilePath;
  } catch (error) {
    console.error('error caching file:', error);
    throw error;
  }
}