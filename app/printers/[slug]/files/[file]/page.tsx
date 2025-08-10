'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import JSZip from 'jszip';
import * as commands from "@/lib/commands"

interface FilePageProps {
  params: {
    slug: string;
    file: string;
  };
}

interface Printer {
  slug: string;
  name: string;
  model: string;
  ip: string;
  password: string;
  serial: string;
}

export default function MainView({ params }: FilePageProps) {
  const { file, slug } = React.use(params);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const model = searchParams.get('model');
  
  const filename = decodeURIComponent(file);
  
  const [ams, setAms] = useState(false);
  const [leveling, setLeveling] = useState(true);
  const [flowcali, setFlowcali] = useState(true);
  const [layerins, setLayerins] = useState(true);
  const [timelapse, setTimelapse] = useState(false);
  
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [previewImage, setPreviewImage] = useState('/no_image.png');
  const [plate, setPlate] = useState('1');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const retrieveGcodeFile = async (filename: string) => {
    if (!filename || filename === "No print in progress") return;
    
    try {
      // get 3mf
      if (printer == null) {
        return;
      }
      
      if (!(filename.toLowerCase().endsWith('.3mf'))) {
        return;
      }

      setIsDownloading(true);
      setDownloadProgress(0);

      const response = await fetch(`/api/printers/${slug}/files?filename=${encodeURIComponent(filename)}&progress=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: printer.ip,
          port: '990',
          password: printer.password,
          serial: printer.serial
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setDownloadProgress(data.progress);
              } else if (data.type === 'complete') {
                console.log(`successfully retrieved file: ${filename}`);
                
                if (filename.toLowerCase().endsWith('.3mf')) {
                  try {
                    const binaryString = atob(data.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    
                    const zip = new JSZip();
                    const zipContent = await zip.loadAsync(bytes.buffer);
                    
                    const infoFile = zipContent.file('Metadata/slice_info.config');
                    let plate = '1';
                    
                    if (infoFile) {
                      const sliceInfo = await infoFile.async('text');
                      
                      const parser = new DOMParser();
                      const xmlDoc = parser.parseFromString(sliceInfo, 'text/xml');
                      const metadataElements = xmlDoc.getElementsByTagName('metadata');
                      
                      for (let i = 0; i < metadataElements.length; i++) {
                        const element = metadataElements[i];
                        if (element.getAttribute('key') === 'index') {
                          plate = element.getAttribute('value') || '1';
                          setPlate(plate);
                          console.log(`extracted plate index: ${plate}`);
                          break;
                        }
                      }
                    }
                    
                    const previewFile = zipContent.file(`Metadata/plate_${plate}.png`);

                    if (previewFile) {
                      const imageBlob = await previewFile.async('blob');
                      const imageUrl = URL.createObjectURL(imageBlob);
                      setPreviewImage(imageUrl);
                    } else {
                      setPreviewImage("/no_image.png");
                    }
                  } catch (error) {
                    console.error(`error extracting 3mf, file may be corrupt: ${error || 'unknown error'}`);
                    setPreviewImage("/no_image.png");
                  }
                } else {
                  setPreviewImage("/no_image.png");
                }
                setIsDownloading(false);
                return;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (error) {
              console.error(`error parsing sse data: ${error || 'unknown error'}`);
            }
          }
        }
      }
    } catch (error) {
      console.log(`failed to retrieve file ${filename}: ${error || 'unknown error'}`);
      setPreviewImage("/no_image.png");
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const fetchPrinter = async () => {
      try {
        const res = await fetch('/api/printers');
        const printers = await res.json();
        const foundPrinter = printers.find((p: Printer) => p.slug === slug);
        setPrinter(foundPrinter);
      } catch (error) {
        console.error(`failed to get printer info: ${error || 'unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPrinter();
    }
  }, [slug]);

  useEffect(() => {
    retrieveGcodeFile(filename.replace('cache/', ''));
  }, [printer])

  const handleStartPrint = async () => {
    if (!printer) {
      console.error('printer is null');
      return;
    }

    try {
      const res = await commands.sendCommand(printer.slug, printer.ip, printer.password, printer.serial, commands.print_file(
        "0", `Metadata/plate_${plate}.gcode`, `ftp:///${filename}`, timelapse, leveling, flowcali, true, layerins, '', ams
      ))

      if (!res.success) {
        console.log(`error starting print: ${res.message || 'unknown error'}`)
      }

      console.log('print started successfully');
      window.location.href = pathname.split('/').slice(0, -2).join('/');
    } catch (error) {
      console.error(`error starting print: ${error || 'unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="view bg-gray-900 flex items-center justify-center">
        <div className="text-white">Getting printer details...</div>
      </div>
    );
  }

  if (!printer) {
    return (
      <div className="view bg-gray-900 flex items-center justify-center">
        <div className="text-white">Printer not found</div>
      </div>
    );
  }

  return (
    <div className="view bg-gray-900">
      <header className="flex flex-row items-center m-2">
        <Link href={pathname.split('/').slice(0, -2).join('/')} className="flex items-center gap-2 text-white hover:text-gray-300 m-2">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <polyline
              points="16,4 8,12 16,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className="m-2">{filename}</span>
      </header>
      <div className="flex flex-row justify-between">
        <div className="flex flex-col w-[40%]">
          <img src={previewImage} className="w-full"/>
          {isDownloading && (
            <div className="mt-2">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Downloading...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col m-4">
          <div onClick={() => setAms(!ams)}
            className="flex bg-gray-800 hover:bg-gray-700 m-1 p-2 transition rounded-md justify-center"
            style={{border: ams? '1px solid white': ''}}
          >
            <label>Use AMS</label>
          </div>
          <div onClick={() => setLeveling(!leveling)}
            className="flex bg-gray-800 hover:bg-gray-700 m-1 p-2 transition rounded-md justify-center"
            style={{border: leveling? '1px solid white': ''}}
          >
            <label>Bed Leveling</label>
          </div>
          <div onClick={() => setFlowcali(!flowcali)}
            className="flex bg-gray-800 hover:bg-gray-700 m-1 p-2 transition rounded-md justify-center"
            style={{border: flowcali? '1px solid white': ''}}
          >
            <label>Dynamic Flow Calibration</label>
          </div>
          <div onClick={() => setLayerins(!layerins)} 
            className="flex bg-gray-800 hover:bg-gray-700 m-1 p-2 transition rounded-md justify-center"
            style={{
              display: ((model == "X1" || model == "X1C" || model == "X1E" || model == "H2D")? 'flex' : 'none'),
              border: layerins? '1px solid white': '',
            }}
          >
            <label>Layer Inspect</label>
          </div>
          <div onClick={() => setTimelapse(!timelapse)} 
            className="flex bg-gray-800 hover:bg-gray-700 m-1 p-2 transition rounded-md justify-center"
            style={{border: timelapse? '1px solid white': ''}}
          >
            <label>Timelapse</label>
          </div>
          <div className="h-[50%]"/>
          <button 
            className={`m-1 p-2 transition rounded-md ${
              isDownloading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
            }`}
            onClick={handleStartPrint}
            disabled={isLoading || !printer || isDownloading}
          >
            Start Print
          </button>
        </div>
      </div>
    </div>
  );
}