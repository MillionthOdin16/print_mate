'use client';
import HMSCard from './HMSCard';
import hmsData from '@/data/hms.json';

interface HMSGridProps {
  name: string;
  model: string;
  printerState: any;
}

export default function HMSGrid({ name, model, printerState }: HMSGridProps) {  
  const currentPrinterState = printerState || { print: {} };
  const messages = currentPrinterState.print?.hms || [];

  const formatHMSCode = (attr: number, code: number): string => {
    // convert to hex (two's complement)
    const attrHex = (attr >>> 0).toString(16).toUpperCase().padStart(8, '0');
    const codeHex = (code >>> 0).toString(16).toUpperCase().padStart(8, '0');
    
    const combined = attrHex + codeHex;
    
    return `${combined.match(/.{1,4}/g)?.join('-') || combined}`;
  };

  const mapHMSCode = (code: string): string => {
    const entry = hmsData.find(entry => Object.keys(entry)[0] === code);
    return entry ? Object.values(entry)[0] : "Unknown error";
  }
  
  return (
    <div className="bg-gray-900 grid grid-cols-1 gap-2">
      {messages.map((item: any, index: number) => {
        const formattedCode = formatHMSCode(item.attr, item.code);
        return (
          <HMSCard 
            key={index} 
            message={mapHMSCode(formattedCode)} 
            code={formattedCode}
          />
        );
      })}
    </div>
  );
}