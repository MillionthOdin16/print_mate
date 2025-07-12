'use client';

import FilamentCard from "./FilamentCard";

interface Props {
  onBack: () => void;
  slug: string;
  model: string;
}

export default function FilamentView({ onBack, slug, model }: Props) {
  return (
    <div className="view justify-center items-center content-center" id="filament-page">
      <header className="flex flex-row items-center">
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 flex items-center justify-center border-0 m-4">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <polyline
              points="16,4 8,12 16,20"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h2 className="text-xl text-white ml-4">Filament</h2>
      </header>
      <div className="flex flex-row justify-center">
        <FilamentCard name={slug} model={model}/>
      </div>
    </div>
  );
}
