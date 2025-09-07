'use client';
import { editPrinter, removePrinter } from '@/lib/printers';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ControlView from '@/app/components/ControlView';
import FilesView from '@/app/components/FilesView';
import FilamentView from '@/app/components/FilamentView';
import HMSView from '@/app/components/HMSView';
import SettingsView from '@/app/components/SettingsView';
import React from 'react';
import CameraView from '@/app/components/CameraView';
import * as commands from '@/lib/commands';
import { PrinterState } from '@/lib/printerState';

interface PrinterPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface PrinterFile {
  filename: string;
}

interface Printer {
  slug: string;
  name: string;
  model: string;
  ip: string;
  username: string;
  password: string;
  code: string;
  cloud: boolean;
  serial: string;
  status: string;
  port?: number;
}

export default function MainView({ params }: PrinterPageProps) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [activeView, setActiveView] = useState<'files' | 'settings' | 'filament' | 'control' | 'hms' | 'camera'>('control');
  const [files, setFiles] = useState<PrinterFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [printerState, setPrinterState] = useState<PrinterState>({
    print: {}, info: {}, upgrade: {}, event: {}
  });
  const [online, setOnline] = useState(false);
  const subscriberId = useRef(`printer-page-${Date.now()}`);

  const { slug } = React.use(params);
  const printer = printers.find((p) => p.slug === slug);

  const connectToStream = async () => {
    if (!printer) return null;

    try {
      const response = await fetch(`/api/printers/${printer.name}/mqtt/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: printer.cloud? 'us.mqtt.bambulab.com' : printer.ip,
          username: printer.username,
          password: printer.password,
          serial: printer.serial,
          subscriberId: subscriberId.current
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to establish stream: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('Stream ended');
              setOnline(false);
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  switch (data.type) {
                    case 'initial':
                    case 'update':
                      setPrinterState(data.data);
                      setOnline(data.connected);
                      break;
                    case 'connected':
                      setOnline(data.connected);
                      console.log('conn')
                      commands.sendCommand(slug, printer.cloud? 'us.mqtt.bambulab.com' : printer.ip, printer.username, printer.password, printer.serial, commands.pushall(printerState?.print?.sequence_id || '0'))
                      break;
                    case 'heartbeat':
                      setOnline(data.connected);
                      break;
                    case 'error':
                      console.error('Stream error:', data.error);
                      setOnline(false);
                      break;
                  }
                } catch (error) {
                  console.error('Failed to parse stream data:', error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream processing error:', error);
          setOnline(false);
        } finally {
          reader.releaseLock();
        }
      };

      processStream();

      return () => {
        reader.cancel();
      };
      
    } catch (error) {
      console.error('Failed to connect to stream:', error);
      setOnline(false);
      return null;
    }
  };

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

  useEffect(() => {
    if (!printer) return;

    let cleanup: (() => void) | null = null;

    const initializePrinter = async () => {
      cleanup = await connectToStream();
    };

    initializePrinter();
    
    const handleBeforeUnload = () => {
      if (cleanup) {
        cleanup();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      
      if (cleanup) {
        cleanup();
      }
    };
  }, [printer?.ip, printer?.password, printer?.serial, printer?.name]);

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
        return <FilesView 
          slug={slug} 
          model={printer.model} 
          host={printer.ip}
          port={990}
          password={printer.code}
          serial={printer.serial}
          files={files} 
          setFiles={setFiles} 
          loading={filesLoading} 
          setLoading={setFilesLoading} 
          error={filesError} 
          setError={setFilesError}
          online={online}
        />;
      case 'settings':
        return <SettingsView
          slug={slug}
          model={printer.model}
          serial={printer.serial}
          ip={printer.cloud? 'us.mqtt.bambulab.com' : printer.ip}
          username={printer.username}
          password={printer.password}
          printerState={printerState}
          online={online}
        />;
      case 'filament':
        return <FilamentView
          slug={slug}
          model={printer.model}
          ip={printer.cloud? 'us.mqtt.bambulab.com' : printer.ip}
          username={printer.username}
          password={printer.password}
          serial={printer.serial}
          printerState={printerState}
          online={online}
        />;
      case 'control':
        return <ControlView 
          slug={slug} 
          ip={printer.cloud? 'us.mqtt.bambulab.com' : printer.ip}
          host={printer.ip}
          code={printer.code}
          username={printer.username}
          password={printer.password} 
          serial={printer.serial} 
          model={printer.model}
          printerState={printerState}
          online={online}
          setOnline={setOnline}
        />;
      case 'hms':
        return <HMSView 
          slug={slug}
          model={printer.model}
          printerState={printerState}
          online={online}
        />;
      case 'camera':
        return <CameraView 
          slug={slug}
          ip={printer.ip}
          password={printer.code}
          model={printer.model}
          online={online}
          serial={printer.serial}
        />
      default:
        return <ControlView 
          slug={slug} 
          ip={printer.cloud? 'us.mqtt.bambulab.com' : printer.ip}
          host={printer.ip}
          code={printer.code}
          username={printer.username}
          password={printer.password} 
          serial={printer.serial} 
          model={printer.model}
          printerState={printerState}
          online={online}
          setOnline={setOnline}
        />;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = {
        name: (document.getElementById('in-name') as HTMLInputElement).value,
        model: (document.getElementById('in-model') as HTMLSelectElement).value,
        ip: (document.getElementById('in-ip') as HTMLInputElement).value,
        pwd: (document.getElementById('in-pwd') as HTMLInputElement).value,
        serial: (document.getElementById('in-sn') as HTMLInputElement).value
      };

      if (!data.name) data.name = printer.name;
      if (!data.model) data.model = printer.model;
      if (!data.ip) data.ip = printer.ip;
      if (!data.serial) data.serial = printer.serial;

      if (!data.ip.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) throw new Error("Invalid IP address")

      await editPrinter({
        oldSlug: slug,
        slug: data.name.toLowerCase().replaceAll(' ', '-'),
        name: data.name, 
        model: data.model, 
        ip: data.ip, 
        username: 'bblp',
        password: data.pwd,
        code: data.pwd,
        cloud: false, 
        serial: data.serial});
      setEditOpen(false);
      location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add printer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: slug,
      model: printer.model,
      email: (document.getElementById('in-email') as HTMLInputElement).value,
      pwd: (document.getElementById('in-pwd1') as HTMLInputElement).value,
      serial: printer.serial,
      ip: printer.ip,
      code: printer.code,
    };

    let token = '';

    const url = '/api/cloud/auth';
    const body = {
      "account": data.email,
      "password": data.pwd
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(body)
    });

    const json = await res.json();

    if (json.error) {
      setError(json.error);
      return;
    }

    if (json.loginType === 'verifyCode') {
      const code = prompt('Please enter the 6-digit 2FA code sent to your email. If the code does not arrive, please request a code by signing in to your Bambu account in a browser window and providing the code from that request.');
      if (code?.length != 6) {
        setError("Invalid code");
        return;
      }

      const body1 = {
        "account": data.email,
        "code": code
      }

      const res1 = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body1)
      });

      const json1 = await res1.json();
      if (json1.accessToken) token = json1.accessToken;
      else {
        if (json1.error) {
          setError(json1.error);
          return;
        }
      }
    } else {
      token = json.accessToken;
    }
    await editPrinter({
      oldSlug: slug,
      slug: slug,
      name: printer.name,
      model: printer.model,
      ip: printer.ip,
      username: printer.username,
      password: token,
      code: printer.code,
      cloud: printer.cloud,
      serial: printer.serial
    })
    setRegenOpen(false);
  }

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
              { id: 'files' as const, icon: '/file.svg' },
              { id: 'control' as const, icon: '/control.png' },
              { id: 'filament' as const, icon: '/filament.png' },
              { id: 'settings' as const, icon: '/settings.png' },
              { id: 'hms' as const, label: 'HMS', icon: '/hms.png' },
              { id: 'camera' as const, icon: '/camera.png' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
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
                setEditOpen(true);
              }}
            >
              Edit Printer
            </div>
            {printer.cloud && (
              <div 
                className="bg-gray-700 hover:bg-gray-600 rounded-md p-2"
                onClick={async () => {
                  setMenuOpen(false);
                  setRegenOpen(true);
                }}
              >
                Regenerate Access Token
              </div>
            )}
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
        {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <h2 className="text-xl mb-4 text-white">Edit Printer {slug}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="flex">
                <input 
                  type="text" 
                  id="in-name" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder={`Name: ${printer.name}`}
                />
                <select className="m-1 bg-gray-700 rounded-sm p-2" id="in-model" defaultValue={printer.model}>
                  <option value="A1">A1</option>
                  <option value="A1M">A1 Mini</option>
                  <option value="P1P">P1P</option>
                  <option value="P1S">P1S</option>
                  <option value="X1">X1</option>
                  <option value="X1C">X1C</option>
                  <option value="X1E">X1E</option>
                  <option value="H2D">H2D</option>
                </select>
              </div>
              <div className="flex flex-col">
                <input 
                  type="text" 
                  id="in-ip" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder={`IP: ${printer.ip}`}
                />
                <input 
                  type="password" 
                  id="in-pwd" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Password"
                  required
                />
                <input 
                  type="text" 
                  id="in-sn" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder={`Serial: ${printer.serial}`}
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button 
                type="submit" 
                className="m-1 bg-blue-600 hover:bg-blue-500 rounded-sm p-2 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Editing...' : 'Finish'}
              </button>
            </form>
          </div>
        </div>
      )}
      {regenOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setRegenOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <h2 className="text-xl mb-4 text-white">Regenerate {slug} Token</h2>

            <form onSubmit={handleRegenerate}>
              <input 
                type="email" 
                id="in-email" 
                className="m-1 bg-gray-700 rounded-sm p-2 w-full" 
                placeholder="Bambu Account Email"
                required
              />
              <input 
                type="password" 
                id="in-pwd1" 
                className="m-1 bg-gray-700 rounded-sm p-2 w-full" 
                placeholder="Bambu Account Password"
                required
              />
              <button 
                type="submit" 
                className="m-1 bg-blue-600 hover:bg-blue-500 rounded-sm p-2"
                disabled={isSubmitting}
              >
                Finish
              </button>
            </form>
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