import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.join(process.cwd(), '.cache', '3mf-files');
const MAX_CACHE_AGE = 1 * 24 * 60 * 60 * 1000; // 1d

export interface CachedFile {
  filePath: string;
  originalFilename: string;
  printerKey: string;
  timestamp: number;
  size: number;
}

async function ensureCacheDir(): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create cache directory:', error);
  }
}

function getCacheKey(printerKey: string, filename: string): string {
  const hash = crypto.createHash('md5');
  hash.update(`${printerKey}:${filename}`);
  return hash.digest('hex');
}

function getCacheFilePath(cacheKey: string): string {
  return path.join(CACHE_DIR, `${cacheKey}.3mf`);
}

async function getFileMetadata(filePath: string): Promise<CachedFile | null> {
  try {
    const stats = await fs.stat(filePath);
    const filename = path.basename(filePath, '.3mf');
    
    return {
      filePath,
      originalFilename: filename,
      printerKey: '',
      timestamp: stats.mtime.getTime(),
      size: stats.size
    };
  } catch (error) {
    return null;
  }
}

export async function getCachedFile(printerKey: string, filename: string): Promise<string | null> {
  try {
    await ensureCacheDir();
    
    const cacheKey = getCacheKey(printerKey, filename);
    const cacheFilePath = getCacheFilePath(cacheKey);

    try {
      await fs.access(cacheFilePath);
    } catch {
      return null;
    }

    const metadata = await getFileMetadata(cacheFilePath);
    if (!metadata) {
      return null;
    }

    const age = Date.now() - metadata.timestamp;
    
    if (age > MAX_CACHE_AGE) {
      // clean up expired cache
      await fs.unlink(cacheFilePath).catch(() => {});
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
    
    const cacheKey = getCacheKey(printerKey, filename);
    const cacheFilePath = getCacheFilePath(cacheKey);

    await fs.writeFile(cacheFilePath, fileBuffer);

    return cacheFilePath;
  } catch (error) {
    console.error('error caching file:', error);
    throw error;
  }
}

export async function cleanupPrintCache(printerKey: string, filename: string): Promise<void> {
  try {
    const cacheKey = getCacheKey(printerKey, filename);
    const cacheFilePath = getCacheFilePath(cacheKey);
    
    console.log(`attempting to delete cache file: ${cacheFilePath}`);
    
    try {
      await fs.access(cacheFilePath);
    } catch (accessError) {
      console.log(`cache file does not exist: ${cacheFilePath}`);
      return;
    }

    try {
      await fs.unlink(cacheFilePath);
      console.log(`successfully deleted cache file: ${cacheFilePath}`);
    } catch (unlinkError) {
      console.error(`failed to delete cache file: ${cacheFilePath}`, unlinkError);
      throw unlinkError;
    }
  } catch (error) {
    console.error('error cleaning up cache:', error);
  }
}

export async function cleanupExpiredCache(): Promise<void> {
  try {
    await ensureCacheDir();
    
    const files = await fs.readdir(CACHE_DIR);
    const cacheFiles = files.filter(f => f.endsWith('.3mf'));

    for (const cacheFile of cacheFiles) {
      try {
        const cacheFilePath = path.join(CACHE_DIR, cacheFile);
        const metadata = await getFileMetadata(cacheFilePath);
        
        if (metadata) {
          const age = Date.now() - metadata.timestamp;
          
          if (age > MAX_CACHE_AGE) {
            await fs.unlink(cacheFilePath).catch(() => {});
          }
        }
      } catch (error) {
        console.error(`error processing cache file ${cacheFile}:`, error);
      }
    }
  } catch (error) {
    console.error('error cleaning up expired cache:', error);
  }
}