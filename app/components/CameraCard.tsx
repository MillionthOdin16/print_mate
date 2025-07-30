'use client';

import { useEffect, useRef, useState } from 'react';

interface CameraCardProps {
  slug: string;
  ip: string;
  password: string;
  model: string;
}

export default function CameraCard({ slug, ip, model }: CameraCardProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!slug) return;

    const imgElement = imgRef.current;

    const connectToStream = () => {
      setIsLoading(true);
      setError(null);
      
      if (imgElement) {
        imgElement.src = `/api/camera/${slug}`;
        
        imgElement.onload = () => {
          setIsLoading(false);
          setIsConnected(true);
          setError(null);
        };

        imgElement.onerror = () => {
          setIsLoading(false);
          setIsConnected(false);
          setError('Failed to connect to camera stream');
        };
      }
    };

    connectToStream();

    return () => {
      if (imgElement) {
        imgElement.src = '';
      }
    };
  }, [slug]);

  const handleRetry = () => {
    if (imgRef.current) {
      imgRef.current.src = '';
      setTimeout(() => {
        if (imgRef.current) {
          imgRef.current.src = `/api/camera/${slug}`;
        }
      }, 1000);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 w-full max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Printer Camera</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-300">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="ml-2 text-white">Connecting to camera...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-red-400 mb-2">{error}</div>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        <img
          ref={imgRef}
          className={`w-full h-full object-contain ${isLoading || error ? 'hidden' : ''}`}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    </div>
  );
}