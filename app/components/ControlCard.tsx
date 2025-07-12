interface ControlCardProps {
  name: string;
  model: string;
}

export default function ControlCard({ name, model }: ControlCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800 w-[100%] h-[100%]">
      <img src="nonexistant.png" className="w-[60%]"/>
    </div>
  );
}