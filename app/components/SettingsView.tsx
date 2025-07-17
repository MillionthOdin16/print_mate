'use client';

import SettingsCard from "./SettingsCard";

interface Props {
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

export default function SettingsView({ slug, model }: Props) {
  return (
    <div className="view" id="settings-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">Settings</h2>
        <span className="text-xl text-white m-2">{slug}</span>
      </header>
      <SettingsCard name={slug} model={model}/>
    </div>
  );
}
