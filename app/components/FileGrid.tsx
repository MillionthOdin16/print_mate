'use client';
import Link from 'next/link';
import FileCard from './FileCard';
import { useEffect } from 'react';

interface PrinterFile {
  filename: string;
  thumbnail: string;
}

interface FileGridProps {
  printer: string;
  model: string;
  host: string;
  port: number;
  password: string;
  files: PrinterFile[];
  setFiles: (files: PrinterFile[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function FileGrid({
  printer,
  model,
  host,
  port,
  password,
  files,
  setFiles,
  isLoading,
  setIsLoading,
  error,
  setError
}: FileGridProps) {
  useEffect(() => {
    async function fetchFiles() {
      if (files.length === 0) {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/printers/${printer}/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              host,
              port,
              password
            })
          });
          if (!res.ok) {
            const errData = await res.json();
            setError(errData.detail || 'Unknown error');
            return;
          }
          const data = await res.json();
          setFiles(data);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch files');
        } finally {
          setIsLoading(false);
        }
      }
    }

    fetchFiles();
  }, [printer, host, port, password, files.length, setFiles, setIsLoading, setError]);

  if (isLoading) {
    return (
      <div className="flex space-x-2 justify-center items-end h-8">
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
        <div className="h-2 w-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
      </div>
    );
  }

  if (error) {
    let suggestion: string = 'unknown error';
    if (error.includes('550')) {
      suggestion = 'File/Directory does not exist. Check the SD card is inserted, or reboot the printer.';
    } else if (error.includes('530')) {
      suggestion = 'Access denied. Check the printer access code.';
    }
    return (
      <div className="p-6 text-center text-gray-300">
        <p>Could not load files list from {printer}: {suggestion}</p>
        <p>Returned error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-4">
        {files.map((file) => (
          <Link key={file.filename} href={`/printers/${printer}/files/${file.filename}?model=${model}`} className='block'>
            <FileCard
              filename={file.filename}
              thumbnail={file.thumbnail}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}