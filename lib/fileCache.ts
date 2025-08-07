import fs from 'fs/promises';
import path from 'path';

const FILE_CACHE_DIR = path.join(process.cwd(), '.cache', '3mf-files');
const IMG_CACHE_DIR = path.join(process.cwd(), '.cache', 'img-files');

export interface CachedFile {
  filePath: string;
  originalFilename: string;
  printerKey: string;
  timestamp: number;
  size: number;
}

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(FILE_CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

export async function getCachedFile(printerKey: string, filename: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    
    const cacheFilePath = path.join(FILE_CACHE_DIR, filename)

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
    
    const cacheFilePath = path.join(FILE_CACHE_DIR, filename)

    await fs.writeFile(cacheFilePath, fileBuffer);

    return cacheFilePath;
  } catch (error) {
    console.error('error caching file:', error);
    throw error;
  }
}