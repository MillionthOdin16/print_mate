'use client';

import { PrinterState } from "@/lib/printerState";
import FilamentCard from "./FilamentCard";

interface Props {
  slug: string;
  model: string;
  ip: string;
  username: string;
  password: string;
  serial: string;
  printerState: PrinterState;
  online: boolean;
}

export default function FilamentView({ slug, model, ip, username, password, serial, printerState, online }: Props) {
  return (
    <div className="view justify-center items-center content-center" id="filament-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Filament</h2>
        <span className="text-xl text-white m-2">{slug} ⋅ {online? "Online" : "Offline"}</span>
      </header>
      <div className="flex flex-row justify-center">
        <FilamentCard name={slug} model={model} ip={ip} username={username} password={password} serial={serial} printerState={printerState}/>
      </div>
    </div>
  );
}
