'use client';

import ControlCard from "./ControlCard";

interface Props {
  slug: string;
  ip: string;
  host: string;
  username: string;
  code: string;
  password: string;
  serial: string;
  model: string;
  printerState?: any;
  online: boolean;
  setOnline: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ControlView({ slug, ip, host, code, username, password, serial, model, printerState, online }: Props) {
  return (
    <div className="view" id="control-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Control</h2>
        <span className="text-xl text-white m-2">
          {slug} ⋅ {online? printerState.print?.gcode_state : "Offline"}
        </span>
      </header>
      <div>
        <ControlCard 
          name={slug} 
          ip={ip} 
          host={host}
          code={code}
          username={username}
          password={password} 
          serial={serial} 
          model={model} 
          printerState={printerState}
        />
      </div>
    </div>
  );
}
