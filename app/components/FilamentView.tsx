'use client';

interface Props {
  onBack: () => void;
}

export default function FilamentView({ onBack }: Props) {
  return (
    <div className="view flex flex-row items-center" id="filament-page">
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
    </div>
  );
}
