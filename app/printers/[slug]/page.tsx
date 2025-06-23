'use client';

import React, { Usable } from 'react';
import Link from 'next'
import { useState, useEffect } from 'react';

interface PrinterPageProps {
  params: {
    slug: string;
  };
}

interface Printer {
  slug: string;
  name: string;
  model: string;
  status: string;
}

export default function MainView({ params }: PrinterPageProps) {
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

  const { slug } = React.use(params);
  const printer = printers.find((p) => p.slug === slug);
  const [activeView, setActiveView] = useState<'main' | 'files' | 'settings' | 'filament' | 'control' | 'assistant' | any>('main');

  const iconMap = {
    Settings: '/icons/settings.png',
    Filament: '/icons/filament.png',
    Control: '/icons/control.png',
    Assistant: '/icons/assistant.png',
  };
  

  if (!printer) {
    return (
      <div className="p-6 text-center text-gray-300">
        <p>Printer not found.</p>
      </div>
    );
  }

  return (
    <>
      {activeView === 'main' && (
        <div className="view h-screen content-center" id="main-page">
          <div className="flex flex-row">
            <a href='/'>
              <button onClick={() => setActiveView('main')} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <polyline
                    points="16,4 8,12 16,20"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </a>
            <label className="text-2xl content-center">{printer.name} ⋅ {printer.model}</label>
            <label className="m-2 text-med content-center">{printer.status}</label>
          </div>
          <div className="bg-gray-800 rounded-md flex flex-col justify-center items-center h-[60%] m-2 cursor-pointer hover:bg-gray-700"
            onClick={() => setActiveView('files')}>
            <img src="/file.svg" className="w-80" alt="Print Files" />
            <label className="mt-5 text-2xl">Print Files</label>
          </div>

          <div className="flex flex-wrap mt-4 h-[30%]">
            {['Settings', 'Filament', 'Control', 'Assistant'].map((label) => (
              <div key={label} onClick={() => setActiveView(`${label.toLowerCase()}`)} className="bg-gray-800 rounded-md flex flex-col justify-center items-center w-[24%] m-2 cursor-pointer hover:bg-gray-700">
                <img src={`/${label.toLowerCase()}.png`} alt={label} className="w-[40%]" />
                <label className="mt-2 text-xl">{label}</label>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeView === 'files' && (
        <div className="view" id="files-page">
          <button onClick={() => setActiveView('main')} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline
                points="16,4 8,12 16,20"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {activeView === 'settings' && (
        <div className="view" id="settings-page">
          <button onClick={() => setActiveView('main')} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline
                points="16,4 8,12 16,20"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {activeView === 'filament' && (
        <div className="view" id="filament-page">
          <button onClick={() => setActiveView('main')} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline
                points="16,4 8,12 16,20"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {activeView === 'control' && (
        <div className="view" id="control-page">
          <button onClick={() => setActiveView('main')} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline
                points="16,4 8,12 16,20"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}

      {activeView === 'assistant' && (
        <div className="view" id="assistant-page">
          <button onClick={() => setActiveView('main')} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <polyline
                points="16,4 8,12 16,20"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
