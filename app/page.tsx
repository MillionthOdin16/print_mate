'use client';
import { useState } from 'react';
import PrinterGrid from './components/PrinterGrid';
import { addPrinter } from '@/lib/printers';

export default function Home() {
  const [addOpen, setAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

      if (!data.name || !data.ip) {
        throw new Error('Name and IP are required');
      }

      await addPrinter({
        slug: data.name.toLowerCase().replace(' ', '-'),
        name: data.name, 
        model: data.model, 
        ip: data.ip, 
        password: data.pwd, 
        serial: data.serial});
      setAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add printer');
    } finally {
      setIsSubmitting(false);
      location.reload();
    }
  };

  return (
    <main className="min-h-screen bg-gray-1000 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold text-gray-300 mb-2">Printers</h1>
          <button 
            className="flex text-3xl bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-md items-center justify-center"
            onClick={() => setAddOpen(true)}
          >
            +
          </button>
        </header>
        <PrinterGrid />
      </div>
      {addOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setAddOpen(false)}
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
            
            <h2 className="text-xl mb-4 text-white">Add Printer</h2>
            <form onSubmit={handleSubmit}>
              <div className="flex">
                <input 
                  type="text" 
                  id="in-name" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Name"
                  required
                />
                <select className="m-1 bg-gray-700 rounded-sm p-2" id="in-model" required>
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
                  placeholder="Printer IP"
                  required
                />
                <input 
                  type="password" 
                  id="in-pwd" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="LAN Access Code"
                />
                <input 
                  type="text" 
                  id="in-sn" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Serial Number"
                />
              </div>
              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
              <button 
                type="submit" 
                className="m-1 bg-blue-600 hover:bg-blue-500 rounded-sm p-2 w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Finish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}