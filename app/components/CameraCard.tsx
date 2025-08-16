'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraCardProps {
  slug: string;
}

export default function CameraCard({ slug }: CameraCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  const clearTimeout = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const startStream = () => {
    if (!imgRef.current) return;
    
    clearTimeout();
    setStatus('connecting');
    
    timeoutRef.current = window.setTimeout(() => {
      setStatus('error');
    }, 10000);
    
    const url = `/api/camera/${slug}?t=${Date.now()}`;
    imgRef.current.src = '';
    imgRef.current.src = url;
  };

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleError = () => {
      clearTimeout();
      setStatus('error');
    };

    const handleLoad = () => {
      clearTimeout();
      setStatus('connected');
    };

    const handleStart = () => {
      if (status === 'connecting') {
        clearTimeout();
        timeoutRef.current = window.setTimeout(() => {
          setStatus('error');
        }, 15000);
      }
    };

    img.addEventListener('error', handleError);
    img.addEventListener('load', handleLoad);
    img.addEventListener('loadstart', handleStart);

    startStream();

    return () => {
      clearTimeout();
      try {
        img.removeEventListener('error', handleError);
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('loadstart', handleStart);
      } catch {}
      if (imgRef.current) {
        imgRef.current.src = '';
      }
    };
  }, [slug]);

  const handleRefresh = () => {
    startStream();
  };

  const statusText = {
    connecting: 'Connecting',
    connected: 'Connected',
    error: 'Error'
  }[status];

  const statusColor = {
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    error: 'bg-red-500'
  }[status];

  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-semibold text-white">{slug}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
          <span className="text-sm text-gray-300">{statusText}</span>
        </div>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <img
          ref={imgRef}
          className="w-full h-full object-contain"
          alt={`${slug} camera feed`}
        />
        {status !== 'connected' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 backdrop-blur-[1px]">
            {status === 'error' && (
              <button
                onClick={handleRefresh}
                className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}