'use client';

interface Props {
  onBack: () => void;
  slug: string;
}

export default function HMSView({ onBack, slug }: Props) {
  return (
    <div className="view" id="hms-page">
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
    </div>
  );
}
