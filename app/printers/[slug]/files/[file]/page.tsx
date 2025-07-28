'use client';
import Link from 'next/link';
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface FilePageProps {
  params: {
    file: string;
  };
}

export default function MainView({ params }: FilePageProps) {
  const { file } = React.use(params);
  const model = useSearchParams().get('model');
  const [ams, setAms] = useState(false);
  const [leveling, setLeveling] = useState(true);
  const [flowcali, setFlowcali] = useState(true);
  const [layerins, setLayerins] = useState(true);
  const [timelapse, setTimelapse] = useState(false);

  return (
    <div className="view bg-gray-900">
      <header className="flex flex-row items-center m-2">
        <Link href={location.href.replace(/(.*\/).*\/.*$/, '$1')} className="flex items-center gap-2 text-white hover:text-gray-300 m-2">
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
        <span className="m-2">{file}</span>
      </header>
      <div className="flex flex-row justify-between">
        <img src="/no_image.png" className="w-[40%]"/>
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
          <button className="bg-gray-800 m-1 p-2 hover:bg-gray-700 transition rounded-md" onClick={() => {
            alert('sending print');
            location.href = location.href.replace(/(.*\/).*\/.*$/, '$1');
          }}>
            Start Print
          </button>
        </div>
      </div>
    </div>
  );
}