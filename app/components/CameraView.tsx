'use client';

import CameraCard from "./CameraCard";

interface Props {
  slug: string;
  ip: string;
  password: string;
  model: string;
}

export default function CameraView({ slug, ip, password, model }: Props) {
  return (
    <div className="view" id="camera-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Camera</h2>
      </header>
      <div className="flex">
        <CameraCard slug={slug} ip={ip} password={password} model={model}/>
      </div>
    </div>
  );
}
