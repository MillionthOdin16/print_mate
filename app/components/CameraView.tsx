'use client';

import CameraCard from "./CameraCard";
import TimelapseCard from "./TimelapseCard";

interface Props {
  slug: string;
  ip: string;
  password: string;
  model: string;
  online: boolean;
  serial: string;
}

export default function CameraView({ slug, ip, password, serial }: Props) {
  return (
    <div className="view" id="camera-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Camera</h2>
      </header>
      <div className="flex justify-between">
        <CameraCard slug={slug} />
        <TimelapseCard slug={slug} ip={ip} password={password} serial={serial}/>
      </div>
    </div>
  );
}
