'use client';

import { useEffect, useState } from 'react';

interface TimelapseCardProps {
  slug: string;
  ip: string;
  password: string;
  serial: string;
}

interface TimelapseFile {
  name: string;
  type: number;
  size: number;
  rawModifiedAt: string;
  modifiedAt: Date;
}

export default function TimelapseCard({ slug, ip, password, serial }: TimelapseCardProps) {
  const [timelapses, setTimelapses] = useState<TimelapseFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<{ [filename: string]: number }>({});
  const [downloading, setDownloading] = useState<{ [filename: string]: boolean }>({});

  useEffect(() => {
    const fetchTimelapses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/printers/${slug}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host: ip,
            port: 990,
            password: password,
            directory: '/timelapse'
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch timelapses: ${response.statusText}`);
        }

        const data = await response.json();
        setTimelapses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load timelapses');
        console.error('Error fetching timelapses:', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug && ip && password) {
      fetchTimelapses();
    }
  }, [slug, ip, password]);

  const handleDownload = async (filename: string) => {
    try {
      setDownloading(prev => ({ ...prev, [filename]: true }));
      setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));

      const response = await fetch(`/api/printers/${slug}/files?filename=${encodeURIComponent(filename)}&progress=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: ip,
          port: 990,
          password: password,
          serial: serial
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start download: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'progress':
                  setDownloadProgress(prev => ({ ...prev, [filename]: data.progress }));
                  break;
                  
                case 'complete':
                  const binaryString = atob(data.data);
                  const bytes = new Uint8Array(binaryString.length);
                  for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }
                  const blob = new Blob([bytes], { type: data.contentType });
                  
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = filename;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                  
                  setDownloading(prev => ({ ...prev, [filename]: false }));
                  setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));
                  return;
                  
                case 'error':
                  console.error('Download error:', data.error);
                  setDownloading(prev => ({ ...prev, [filename]: false }));
                  setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));
                  return;
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error);
            }
          }
        }
      }

    } catch (error) {
      console.error('Download error:', error);
      setDownloading(prev => ({ ...prev, [filename]: false }));
      setDownloadProgress(prev => ({ ...prev, [filename]: 0 }));
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Printer Timelapses</h3>
        <div className="text-sm text-gray-400">
          {loading ? 'Loading...' : `${timelapses.length} files`}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      {error && (
        <div className="text-red-400 text-center py-4">
          {error}
        </div>
      )}

      {!loading && !error && timelapses.length === 0 && (
        <div className="text-gray-400 text-center py-8">
          No timelapse files found
        </div>
      )}

      {!loading && !error && timelapses.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {timelapses
            .filter(timelapse => timelapse.type === 1)
            .map((timelapse, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-700 rounded p-3">
              <span className="text-white text-sm">{timelapse.name}</span>
              <button
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white transition-colors"
                onClick={() => handleDownload(timelapse.name)}
              >
                {downloading[timelapse.name] ? `${downloadProgress[timelapse.name] || 0}%` : 'Download'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}