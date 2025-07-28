'use client';

import { useState } from 'react';

interface SettingsCardProps {
  name: string;
  model: string;
  serial: string;
}

export default function SettingsCard({ name, model, serial }: SettingsCardProps) {
  const [activeView, setActiveView] = useState<'main' | 'device' | 'network' | 'firmware' | 'ams'>('main');
  const [amsSettings, setAmsSettings] = useState<boolean[]>([false, false]); //TODO: get from printer, set to printer
  const [firmware, setFirmware] = useState('01.04.01.00'); //TODO: get from printer
  const [network, setNetwork] = useState('-35dBm'); // TODO: get from printer

  return (
    <div>
      {activeView == "main" && (
        <div>
          <div 
            className="flex items-center justify-between bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 m-2"
            onClick={() => setActiveView('device')}
          >
            <span>Device</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div 
            className="flex items-center justify-between bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 m-2"
            onClick={() => setActiveView('network')}
          >
            <span>Network</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div 
            className="flex items-center justify-between bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 m-2"
            onClick={() => setActiveView('firmware')}
          >            
          <span>Firmware</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div 
            className="flex items-center justify-between bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 m-2"
            onClick={() => setActiveView('ams')}
          >            
            <span>AMS</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-white"
            >
              <path
                d="M6 12L10 8L6 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
      {activeView == 'device' && (
        <div>
          <div className="flex flex-row items-center">
            <button 
              className="flex bg-gray-800 p-2 rounded-[50%] hover:bg-gray-700 items-center justify-center m-2"
              onClick={() => setActiveView('main')}
            >
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
            </button>
            <h2 className="text-xl m-2">Device</h2>
          </div>
          <div className="flex flex-col">
            <label>Device ID: {name}</label>
            <label>Model: {model}</label>
            <label>Firmware version: {firmware}</label>
            <label>Serial number: {serial}</label>

            <div className="flex flex-row items-center">
              <button className="bg-gray-800 rounded-md hover:bg-gray-700 p-2 m-2 w-min">Calibration</button>
              <label>Perform the printer calibration</label> {/* TODO: add function */}
            </div>

            <div className="flex flex-row items-center">
              <button className="bg-gray-800 rounded-md hover:bg-gray-700 p-2 m-2 w-min">Nozzle</button>
              <label>Current: 0.4mm Hardened</label> {/* TODO: add function */}
            </div>
          </div>
        </div>
      )}
      {activeView == 'network' && (
        <div>
          <div className="flex flex-row items-center">
            <button 
              className="flex bg-gray-800 p-2 rounded-[50%] hover:bg-gray-700 items-center justify-center m-2"
              onClick={() => setActiveView('main')}
            >
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
            </button>
            <h2 className="text-xl m-2">Network</h2>
          </div>
          <div>
            <label>Signal strength: {network}</label>
          </div>
        </div>
      )}
      {activeView == 'firmware' && (
        <div>
          <div className="flex flex-row items-center">
            <button 
              className="flex bg-gray-800 p-2 rounded-[50%] hover:bg-gray-700 items-center justify-center m-2"
              onClick={() => setActiveView('main')}
            >
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
            </button>
            <h2 className="text-xl m-2">Firmware</h2>
          </div>
          <div className="flex flex-col">
            <label>Current firmware version: {firmware}</label>
            <button className="bg-gray-800 rounded-md hover:bg-gray-700 m-2 p-2 w-min">Update</button> {/* TODO: add function */}
          </div>
          <div className="flex flex-col">
            <label>Firmware history:</label>
            <div>
              {/* TODO */}
            </div>
            <button className="bg-gray-800 rounded-md hover:bg-gray-700 m-2 p-2 w-min">Get</button> {/* TODO: add function */}
          </div>
        </div>
      )}
      {activeView == 'ams' && (
        <div>
          <div className="flex flex-row items-center">
            <button 
              className="flex bg-gray-800 p-2 rounded-[50%] hover:bg-gray-700 items-center justify-center m-2"
              onClick={() => setActiveView('main')}
            >
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
            </button>
            <h2 className="text-xl m-2">AMS</h2>
          </div>
          <div className="flex flex-col">
            <label 
              className={(amsSettings[0]? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800 hover:bg-gray-700") + " w-fit p-2 rounded-md m-1 transition"}
              onClick={() => setAmsSettings([!amsSettings[0], amsSettings[1]])}
            >
              Read RFID on startup
            </label>
            <label 
              className={(amsSettings[1]? "bg-gray-700 hover:bg-gray-600" : "bg-gray-800 hover:bg-gray-700") + " w-fit p-2 rounded-md m-1 transition"}
              onClick={() => setAmsSettings([amsSettings[0], !amsSettings[1]])}
            >
              Read RFID on insertion
            </label>
          </div>
        </div>
      )}
    </div>
  );
}