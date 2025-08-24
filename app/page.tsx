'use client';
import { useState } from 'react';
import PrinterGrid from './components/PrinterGrid';
import { addPrinter } from '@/lib/printers';

export default function Home() {
  const [lanOpen, setLanOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [show2FA, setShow2FA] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleLanSubmit = async (e: React.FormEvent) => {
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

      if (!data.ip.match(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)) {
        throw new Error("Invalid IP address")
      }

      await addPrinter({
        slug: data.name.toLowerCase().replaceAll(' ', '-'),
        name: data.name, 
        model: data.model, 
        ip: data.ip,
        username: "bblp",
        password: data.pwd, 
        code: data.pwd,
        cloud: false,
        serial: data.serial});
      setLanOpen(false);
      location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add printer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const data = {
        name: (document.getElementById('in-name1') as HTMLInputElement).value,
        model: (document.getElementById('in-model1') as HTMLSelectElement).value,
        email: (document.getElementById('in-email') as HTMLInputElement).value,
        pwd: (document.getElementById('in-pwd1') as HTMLInputElement).value,
        serial: (document.getElementById('in-sn1') as HTMLInputElement).value,
        ip: (document.getElementById('in-ip1') as HTMLInputElement).value,
        code: (document.getElementById('in-pwd2') as HTMLInputElement).value
      };

      let token = '';
      let user = '';

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
        setSubmitted(false);
        setShow2FA(true);

        while (!submitted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        setSubmitted(false);
        setShow2FA(false);
        
        const code = (document.getElementById('in-2fa') as HTMLInputElement).value;
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

      const params = {
        token: token
      }

      const res1 = await fetch('/api/cloud/user', {
        method: "POST",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(params)
      });

      const json1 = await res1.json();
      if (json1.uid) user = json1.uid;
      else {
        setError("Failed to fetch user id from api");
        return;
      }

      await addPrinter({
        slug: data.name.toLowerCase().replaceAll(' ', '-'),
        name: data.name, 
        model: data.model, 
        ip: data.ip,
        username: `u_${user}`,
        password: token, 
        code: data.code,
        cloud: true,
        serial: data.serial});
      setLanOpen(false);
      location.reload();
    } catch (err) {
      setError(err instanceof Error? err.message: 'Failed to add printer');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-1000 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-row justify-between">
          <h1 className="text-3xl font-bold text-gray-300 mb-2">Printers</h1>
          <div className="relative">
            <button 
              className="flex text-3xl bg-gray-800 hover:bg-gray-700 w-8 h-8 rounded-md items-center justify-center"
              onClick={() => setMenuOpen(open => !open)}
            >
              +
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-gray-800 rounded shadow-lg z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700"
                  onClick={() => { setLanOpen(true); setMenuOpen(false); }}
                >
                  LAN
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-200 hover:bg-gray-700"
                  onClick={() => { setCloudOpen(true); setMenuOpen(false); }}
                >
                  Cloud
                </button>
              </div>
            )}
          </div>
        </header>
        <PrinterGrid />
      </div>
      {lanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setLanOpen(false)}
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
            
            <h2 className="text-xl mb-4 text-white">Add LAN Printer</h2>
            <form onSubmit={handleLanSubmit}>
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
                  required
                />
                <input 
                  type="text" 
                  id="in-sn" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Serial Number"
                  required
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
      {cloudOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setCloudOpen(false)}
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
            
            <h2 className="text-xl mb-4 text-white">Add Cloud Printer</h2>
            <form onSubmit={handleCloudSubmit}>
              <div className="flex">
                <input 
                  type="text" 
                  id="in-name1" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Name"
                  required
                />
                <select className="m-1 bg-gray-700 rounded-sm p-2" id="in-model1" required>
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
                  type="email" 
                  id="in-email" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Bambu Account Email"
                  required
                />
                <input 
                  type="password" 
                  id="in-pwd1" 
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Bambu Account Password"
                  required
                />
                <input 
                  type="text"
                  id="in-sn1"
                  className="m-1 bg-gray-700 rounded-sm p-2" 
                  placeholder="Serial Number"
                  required
                />
                <label className="text-sm text-gray-300">If you would like to use the FTP and camera functions please provide the local access details.</label>
                <input
                  type="text"
                  id="in-ip1"
                  className="m-1 bg-gray-700 rounded-sm p-2"
                  placeholder="Local IP Address (optional)"
                />
                <input
                  type="password"
                  id="in-pwd2"
                  className="m-1 bg-gray-700 rounded-sm p-2"
                  placeholder="Local Access Code (optional)"
                />
                {show2FA &&
                  <div className="flex flex-col">
                    <input
                      type="text"
                      id="in-2fa"
                      className="m-1 bg-gray-700 rounded-sm p-2"
                      placeholder="2FA code"
                    />
                    <label>If you do not receive a code use the <a href="https://bambulab.com">Bambu Lab website</a> to sign in and get a code</label>
                    <input 
                      type="submit"
                      value="OK"
                      onClick={() => setSubmitted(true)}
                      className="m-1 bg-blue-600 hover:bg-blue-500 rounded-sm p-2 w-full"
                    />
                  </div>
                }
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