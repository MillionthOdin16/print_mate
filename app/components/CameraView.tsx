'use client';

import CameraCard from "./CameraCard";

interface Props {
  slug: string;
  ip: string;
  password: string;
  model: string;
  online: boolean;
}

export default function CameraView({ slug, ip, password, model, online }: Props) {
  return (
    <div className="view" id="camera-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Camera</h2>
        <span className="text-xl text-white m-2">{slug} ⋅ {online? "Online" : "Offline"}</span>
      </header>
      <div className="flex">
        <CameraCard slug={slug} ip={ip} password={password} model={model}/>
      </div>
    </div>
  );
}
