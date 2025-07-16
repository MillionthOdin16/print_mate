'use client';

import ControlCard from "./ControlCard";

interface Props {
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

export default function ControlView({ slug, model }: Props) {
  return (
    <div className="view" id="control-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Control</h2>
        <span className="text-xl text-white m-2">{slug}</span>
      </header>
      <div className="flex">
        <ControlCard name={slug} model="A1"/>
      </div>
    </div>
  );
}
