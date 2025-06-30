'use client'

import Link from 'next/link';
import FileCard from './FileCard';
import {useState, useEffect} from 'react'

interface File {
filename: string,
thumbnail: string
}

interface FileGridProps {
printer: string;
}

export default function FileGrid({printer}: FileGridProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch(`/api/printers/${printer}/files`);
        if (!res.ok) {
          const errData = await res.json();
          setError(errData.detail || 'Unknown error');
          return;
        }
        const data = await res.json();
        setFiles(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch files');
      }
    }

    fetchFiles();
  }, [printer]);

  if (error) {
    let suggestion: String = 'unknown error'
    if (error.includes('550')) {
      suggestion = 'File/Directory does not exist. Check the SD card is inserted, or reboot the printer.'
    } else if (error.includes('530')) {
      suggestion = 'Access denied. Check the printer access code.'
    }
    return (
      <div className="p-6 text-center text-gray-300">
        <p>Could not load files list from {printer}: {suggestion}</p>
        <p>Returned error: {error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      {files.map((file: any) => (
          <Link key={file.filename} href={`/printers/files/${file.filename}`} className='block'>
            <FileCard
            key={file.filename}
            filename={file.filename}
            thumbnail={file.thumbnail}
            />
          </Link>
      ))}
    </div>
  );
}
