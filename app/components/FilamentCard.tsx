interface FilamentCard {
  name: string;
  model: string;
}

export default function FilamentCard ({ name, model }: FilamentCard) {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 w-[100%] flex flex-row">
        <div className="flex flex-col">
          <label className="text-[100%]">External Spool</label>
          <div className="flex flex-col items-center">
            <img src="/filament.png" className="w-[50%]"/>
            <label className="text-[200%]">PETG-CF</label>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <button className="bg-gray-800 rounded-lg hover:bg-gray-700 text-[300%] p-8 m-2 w-[150%]">
            Load
          </button>
          <button className="bg-gray-800 rounded-lg hover:bg-gray-700 text-[300%] p-8 m-2 w-[150%]">
            Unload
          </button>
          <button className="bg-gray-800 rounded-lg hover:bg-gray-700 text-[300%] p-8 m-2 w-[150%]">
            Edit
          </button>
        </div>
    </div>
  );
}