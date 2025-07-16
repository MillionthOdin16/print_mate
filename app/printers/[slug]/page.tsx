'use client';
import { removePrinter } from '@/lib/printers';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ControlView from '@/app/components/ControlView';
import FilesView from '@/app/components/FilesView';
import FilamentView from '@/app/components/FilamentView';
import HMSView from '@/app/components/HMSView';
import SettingsView from '@/app/components/SettingsView';
import React from 'react';

interface PrinterPageProps {
  params: {
    printer: string;
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
  const [activeView, setActiveView] = useState<'files' | 'settings' | 'filament' | 'control' | 'hms'>('files');
  const [files, setFiles] = useState<File[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  if (!printer) {
    return (
      <div className="p-6 text-center text-gray-300">
        <p>Printer not found.</p>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'files':
        return <FilesView slug={slug} files={files} setFiles={setFiles} isLoading={filesLoading} setIsLoading={setFilesLoading} error={filesError} setError={setFilesError}/>;
      case 'settings':
        return <SettingsView slug={slug} model="A1"/>; // TODO: CHANGE THE HARDCODED VALUE
      case 'filament':
        return <FilamentView slug={slug} model="A1"/>; //TODO: CHANGE THE HARDCODED VALUE
      case 'control':
        return <ControlView slug={slug} model="A1"/>; //TODO: UNHARDCODE
      case 'hms':
        return <HMSView slug={slug} model="A1"/>; //TODO: UNHARDCODE
      default:
        return <FilesView slug={slug} files={files} setFiles={setFiles} isLoading={filesLoading} setIsLoading={setFilesLoading} error={filesError} setError={setFilesError}/>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="w-24 bg-gray-800 p-4 flex flex-col justify-between">
        <div>
          <Link href="/" className="mb-8 flex items-center gap-2 text-white hover:text-gray-300">
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

          <nav className="flex flex-col">
            {[
              { id: 'files', icon: '/file.svg' },
              { id: 'control', icon: '/control.png' },
              { id: 'filament', icon: '/filament.png' },
              { id: 'settings', icon: '/settings.png' },
              { id: 'hms', label: 'HMS', icon: '/hms.png' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                  activeView === item.id? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <img src={item.icon} alt={item.label} className="w-[100%] h-[100%]" />
              </button>
            ))}
          </nav>
        </div>
        <button 
          className="flex justify-center items-center"
          onClick={() => {
            setMenuOpen(!menuOpen);
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-6 h-6 text-white-800 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {menuOpen && (
          <div className="absolute bg-gray-700 m-2 bottom-[5%] rounded-md shadow-lg">
            <div 
              className="bg-gray-700 hover:bg-gray-600 rounded-md p-2"
              onClick={() => {
                setMenuOpen(false);
              }}
            >
              Edit Printer
            </div>
            <div 
              className="bg-gray-700 text-red-600 hover:bg-gray-600 rounded-md p-2"
              onClick={async () => {
                setMenuOpen(false);
                if (confirm("Are you sure you want to delete this printer from the list?")) {
                  document.getElementsByTagName("body")[0].textContent = 'Deleting...';
                  await removePrinter(slug);
                  window.location.href = "/";
                }
              }}
            >
              Delete Printer
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {renderView()}
      </div>
    </div>
  );
}