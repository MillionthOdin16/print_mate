'use client';

import ControlCard from "./ControlCard";

interface Props {
  onBack: () => void;
  slug: string;
  model: string;
}

async function sendMqttCommand(printer: string) {
  const payload = {
    "print": {
      "sequence_id": "0",
      "command": "unload_filament"
    }
  };

  const res = await fetch(`/api/printers/${printer}/mqtt/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error(res)
  }

  const result = await res.json();
  console.log('MQTT response:', result);
}

export default function ControlView({ onBack, slug, model }: Props) {
  return (
    <div className="view" id="control-page">
      <header className="flex flex-row items-center">
        <button onClick={onBack} className="bg-gray-700 hover:bg-gray-600 rounded-full w-8 h-8 m-4 flex items-center justify-center border-0">
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
        <h2 className="text-xl text-white ml-4">Control</h2>
      </header>
      <div className="flex">
        <ControlCard name={slug} model="A1"/>
      </div>
    </div>
  );
}
