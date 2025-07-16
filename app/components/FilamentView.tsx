'use client';

import FilamentCard from "./FilamentCard";

interface Props {
  slug: string;
  model: string;
}

export default function FilamentView({ slug, model }: Props) {
  return (
    <div className="view justify-center items-center content-center" id="filament-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Filament</h2>
        <span className="text-xl text-white m-2">{slug}</span>
      </header>
      <div className="flex flex-row justify-center">
        <FilamentCard name={slug} model={model}/>
      </div>
    </div>
  );
}
