'use client';

import { useState } from "react";
import ControlCard from "./ControlCard";

interface Props {
  slug: string;
  ip: string;
  password: string;
  serial: string;
  model: string;
  printerState?: any;
  online: boolean;
  setOnline: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ControlView({ slug, ip, password, serial, model, printerState, online, setOnline }: Props) {
  return (
    <div className="view" id="control-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Control</h2>
        <span className="text-xl text-white m-2">{slug} ⋅ {online? "Online" : "Offline"}</span>
      </header>
      <div>
        <ControlCard 
          name={slug} 
          ip={ip} 
          password={password} 
          serial={serial} 
          model={model} 
          printerState={printerState}
        />
      </div>
    </div>
  );
}
