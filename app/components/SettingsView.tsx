'use client';

import SettingsCard from "./SettingsCard";

interface Props {
  slug: string;
  model: string;
  serial: string;
  ip: string;
  password: string;
  printerState?: any;
  online: boolean;
}

export default function SettingsView({ slug, model, serial, ip, password, printerState, online }: Props) {
  return (
    <div className="view" id="settings-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Settings</h2>
        <span className="text-xl text-white m-2">{slug} ⋅ {online? "Online" : "Offline"}</span>
      </header>
      <SettingsCard
        name={slug}
        model={model}
        serial={serial}
        ip={ip}
        password={password}
        printerState={printerState}
      />
    </div>
  );
}
