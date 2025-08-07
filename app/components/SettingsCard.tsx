'use client';

import * as commands from '@/lib/commands';
import { useState } from 'react';

interface SettingsCardProps {
  name: string;
  model: string;
  serial: string;
  ip: string;
  password: string;
  printerState?: any;
}

export default function SettingsCard({ name, model, serial, ip, password, printerState }: SettingsCardProps) {
  const [activeView, setActiveView] = useState<'main' | 'device' | 'network' | 'firmware' | 'ams'>('main');
  const [nozzleOpen, setNozzleOpen] = useState(false);
  const [calibrationOpen, setCalibrationOpen] = useState(false);

  const [motorCancellation, setMotorCancellation] = useState(true);
  const [vibrationCompensation, setVibrationCompensation] = useState(true);
  const [bedLevelling, setBedLevelling] = useState(true);
  
  const network = printerState.print?.wifi_signal;
  const amsStartupRead = printerState.print?.ams?.power_on_flag || false;
  const amsInsertRead = printerState.print?.ams?.insert_flag || false;
  const nozzleDiameter = printerState.print?.nozzle_diameter;
  const nozzleType = printerState.print?.nozzle_type;

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
            <label>Serial number: {serial}</label>

            <div className="flex flex-row items-center" onClick={() => setCalibrationOpen(true)}>
              <button className="bg-gray-800 rounded-md hover:bg-gray-700 p-2 m-2 w-min">Calibration</button>
              <label>Perform the printer calibration</label>
            </div>

            <div
              className="flex flex-row items-center"
              onClick={() => setNozzleOpen(true)}
            >
              <button className="bg-gray-800 rounded-md hover:bg-gray-700 p-2 m-2 w-min">Nozzle</button>
              <label>Current: {nozzleDiameter}mm {nozzleType == "stainless_steel" ? "Stainless steel": "Harderned steel"}</label>
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
          <div className="grid grid-cols-1 gap-4">
            {printerState.info?.module.map((module: any) => {
              return (
                <div className="flex flex-col" key={module.hw_ver}>
                  <label>Module: {module.hw_ver}</label>
                  <label>Version: {module.sw_ver}</label>
                  <label>SN: {module.sn}</label>
                  <button
                    className="bg-gray-800 rounded-md hover:bg-gray-700 m-2 p-2 w-min"
                    style={{display: module.hw_ver === "OTA"? "block" : "none"}}
                    onClick={() => commands.sendCommand(name, ip, password, serial, commands.firmware_update())}
                  >
                    Update
                  </button>
                </div>
              )
            })}
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl my-8">Firmware history</h2>
            <div>
              {/* TODO */}
            </div>
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
              className="bg-gray-800 hover:bg-gray-700 w-fit p-2 rounded-md m-1 transition"
              style={amsStartupRead? {border: '1px solid white'} : {}}
              onClick={() => {
                //TODO
              }}
            >
              Read RFID on startup
            </label>
            <label 
              className="bg-gray-800 hover:bg-gray-700 w-fit p-2 rounded-md m-1 transition"
              style={amsInsertRead? {border: '1px solid white'} : {}}
              onClick={() => {
                //TODO
              }}
            >
              Read RFID on insertion
            </label>
          </div>
        </div>
      )}
      {nozzleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setNozzleOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Nozzle</h2>
            <form onSubmit={() => {}}>
              <label>Nozzle Type</label>
              <select
                className="m-1 bg-gray-700 rounded-sm p-2"
                id="in-type"
                defaultValue={nozzleType}
                required
              >
                <option value="stainless_steel">Stainless steel</option>
                <option value="hardened_steel">Hardened steel</option>
              </select>
              <br/>
              <label>Nozzle Diameter</label>
              <select
                className="m-1 bg-gray-700 rounded-sm p-2"
                id="in-diameter"
                defaultValue={nozzleDiameter}
                required
              >
                <option value="0.2">0.2mm</option>
                <option value="0.4">0.4mm</option>
                <option value="0.6">0.6mm</option>
                <option value="0.8">0.8mm</option>
              </select>
              <br/>
              <input 
                type="submit"
                className="p-2 bg-gray-700 rounded-sm hover:bg-gray-600"
                value="Finish"
                onClick={(e) => {
                  e.preventDefault();
                  const type = (document.getElementById("in-type") as HTMLInputElement).value;
                  const diameter = (document.getElementById('in-diameter') as HTMLInputElement).value;
                  commands.sendCommand(name, ip, password, serial, commands.nozzle_settings(diameter, type));
                  setNozzleOpen(false);
                }}
              />
            </form>
          </div>
        </div>
      )}
      {calibrationOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setCalibrationOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Calibration</h2>
            <form className="flex flex-col">
              <label 
                className="bg-gray-700 p-2 m-1 hover:bg-gray-600 rounded-md w-fit"
                style={motorCancellation? {'border': '1px solid white'} : {}}
                onClick={() => setMotorCancellation(!motorCancellation)}
              >
                Motor Noise Cancellation
              </label>
              <label 
                className="bg-gray-700 p-2 m-1 hover:bg-gray-600 rounded-md w-fit"
                style={vibrationCompensation? {'border': '1px solid white'} : {}}
                onClick={() => setVibrationCompensation(!vibrationCompensation)}
              >
                Vibration Compensation
              </label>
              <label 
                className="bg-gray-700 p-2 m-1 hover:bg-gray-600 rounded-md w-fit"
                style={bedLevelling? {'border': '1px solid white'} : {}}
                onClick={() => setBedLevelling(!bedLevelling)}
              >
                Auto Bed Levelling
              </label>
              <input type="submit" className="bg-gray-700 hover:bg-gray-600 rounded-md p-2 m-1 w-fit" value="Start Calibration" onClick={(e) => {
                e.preventDefault();
                let bitmask = 0;
                if (bedLevelling) bitmask |= 1 << 1;
                if (vibrationCompensation) bitmask |= 1 << 2;
                if (motorCancellation) bitmask |= 1 << 3;
                commands.sendCommand(name, ip, password, serial, commands.calibration(printerState.print?.sequence_id, bitmask));
                setCalibrationOpen(false);
              }}/>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}