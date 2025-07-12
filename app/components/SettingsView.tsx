'use client';

import SettingsCard from "./SettingsCard";

interface Props {
  onBack: () => void;
  slug: string;
  model: string;
}

/*{
    "print": {
        "sequence_id": "0",
        "command": "ams_user_setting",
        "ams_id": 0, // Index of the AMS
        "startup_read_option": true, // Read RFID on startup
        "tray_read_option": true // Read RFID on insertion
    }
} 
    
{
    "print": {
        "sequence_id": "0",
        "command": "calibration"
    }
}*/

export default function SettingsView({ onBack, slug, model }: Props) {
  return (
    <div className="view" id="settings-page">
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
        <h2 className="text-xl text-white ml-4">Settings</h2>
      </header>
      <SettingsCard name={slug} model='fat'/>
    </div>
  );
}
