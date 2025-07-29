'use client';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import JSZip from 'jszip';

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
  const [plate, setPlate] = useState(1);

  const retrieveGcodeFile = async (filename: string) => {
    if (!filename || filename === "No print in progress") return;
    
    try {
      // get 3mf
      if (printer == null) {
        return;
      }
      const res = await fetch(`/api/printers/${slug}/files?filename=${encodeURIComponent(filename)}`, {
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

      if (res.ok) {
        const blob = await res.blob();
        console.log(`successfully retrieved file: ${filename}`);
        
        if (filename.toLowerCase().endsWith('.3mf')) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(arrayBuffer);
            
            const infoFile = zipContent.file('Metadata/slice_info.config'); // slicer info, plate & object ids
            let plate = '1'; // default
            
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
            
            const previewFile = zipContent.file(`Metadata/plate_${plate}.png`); // print banner image

            if (previewFile) {
              const imageBlob = await previewFile.async('blob');
              const imageUrl = URL.createObjectURL(imageBlob);
              setPreviewImage(imageUrl);
            } else {
              // no image found
              setPreviewImage("/no_image.png");
            }
          } catch (error) {
            console.error(`error extracting 3mf, file may be corrrupt: ${error || 'unknown error'}`);
            setPreviewImage("/no_image.png");
          }
        } else {
          // file is not a 3mf
          setPreviewImage("/no_image.png");
        }
      } else {
        // http or ftp error
        const error = await res.json();
        console.error(`failed to retrieve file ${filename}: ${error || 'unknown error'}`); 
        setPreviewImage("/no_image.png");
      }
    } catch (error) {
      // other error
      console.log(`failed to retrieve file ${filename}: ${error || 'unknown error'}`);
      setPreviewImage("/no_image.png");
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
    retrieveGcodeFile(filename);
  }, [printer])

  const handleStartPrint = async () => {
    if (!printer) {
      console.error('printer is null');
      return;
    }

    try {
      const res = await fetch(`/api/printers/${slug}/mqtt/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: printer.name,
          host: printer.ip,
          password: printer.password,
          serial: printer.serial,
          command: 'print_file',
          params: {
            param: `Metadata/plate_2.gcode`,
            url: `ftp://${filename}`,
            timelapse: timelapse,
            bed_levelling: leveling,
            flow_cali: flowcali,
            vibration_cali: true,
            layer_inspect: layerins,
            ams_mapping: '',
            use_ams: ams
          }
        })
      });
    
      if (!res.ok) {
        const errorData = await res.json();
        console.error(`failed to start print: ${errorData}`);
        return;
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
        <img src={previewImage} className="w-[40%]"/>
        <div className="flex flex-col m-4">
          <div onClick={() => setAms(!ams)}
            className="flex m-1 p-2 transition rounded-md justify-center"
            style={{backgroundColor: `var(--color-gray-${ams? '700' : '800'})`}}
          >
            <label>Use AMS</label>
          </div>
          <div onClick={() => setLeveling(!leveling)}
            className="flex m-1 p-2 transition rounded-md justify-center"
            style={{backgroundColor: `var(--color-gray-${leveling? '700' : '800'})`}}
          >
            <label>Bed Leveling</label>
          </div>
          <div onClick={() => setFlowcali(!flowcali)}
            className="flex m-1 p-2 transition rounded-md justify-center"
            style={{backgroundColor: `var(--color-gray-${flowcali? '700' : '800'})`}}
          >
            <label>Dynamic Flow Calibration</label>
          </div>
          <div onClick={() => setLayerins(!layerins)} 
            className={((model == "X1" || model == "X1C" || model == "X1E" || model == "H2D")? "" : "hidden ") + "flex m-1 p-2 transition rounded-md justify-center"}
            style={{backgroundColor: `var(--color-gray-${layerins? '700' : '800'})`}}
          >
            <label>Layer Inspect</label>
          </div>
          <div onClick={() => setTimelapse(!timelapse)} 
            className="flex m-1 p-2 transition rounded-md justify-center"
            style={{backgroundColor: `var(--color-gray-${timelapse? '700' : '800'})`}}
          >
            <label>Timelapse</label>
          </div>
          <div className="h-[50%]"/>
          <button 
            className="bg-gray-800 m-1 p-2 hover:bg-gray-700 transition rounded-md" 
            onClick={handleStartPrint}
            disabled={isLoading || !printer}
          >
            Start Print
          </button>
        </div>
      </div>
    </div>
  );
}