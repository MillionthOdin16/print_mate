'use client'

import Link from 'next/link';
import PrinterCard from './PrinterCard';
import {useState, useEffect} from 'react'

interface Printer {
  slug: string;
  name: string;
  model: string;
  status: string;
}

export default function PrinterGrid() {
    const [printers, setPrinters] = useState<Printer[]>([]);
  
    useEffect(() => {
      async function fetchPrinters() {
        const res = await fetch('/api/printers');
        if (!res.ok) {
          console.error('Failed to fetch printers');
          return;
        }
        const data = await res.json();
        setPrinters(data);
      }
  
      fetchPrinters();
    }, []);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {printers.map((printer: any) => (
          <Link key={printer.slug} href={`/printers/${printer.slug}`} className='block'>
            <PrinterCard
            key={printer.name}
            name={printer.name}
            model={printer.model}
            status={printer.status}
            />
          </Link>
      ))}
    </div>
  );
}
