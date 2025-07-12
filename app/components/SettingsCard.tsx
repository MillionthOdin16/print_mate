interface SettingsCardProps {
  name: string;
  model: string;
}

export default function SettingsCard({ name, model }: SettingsCardProps) {
  return (
    <div>
      <div className="bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 m-2">
        Device
      </div>
      <div className="bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 m-2">
        Network
      </div>
      <div className="bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800">
        Firmware
      </div>
    </div>
  );
}