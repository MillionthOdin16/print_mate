'use client';

import { useState, useEffect } from 'react';
import filamentsData from '@/data/filaments.json';
import { buildCommand, sendCommand } from '@/lib/commands';

interface FilamentCardProps {
  name: string;
  model: string;
  ip: string;
  password: string;
  serial: string;
  printerState: any;
}

interface Filament {
  id: string;
  brand: string;
  material: string;
  type: string;
  minTemp: number;
  maxTemp: number;
}

export default function FilamentCard({ name, model, ip, password, serial, printerState }: FilamentCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [activeView, setActiveView] = useState<'ams' | 'ext'>('ext');
  const [activeAction, setActiveAction] = useState(''); // TODO: retrieve from printer
  const [selectedBrand, setSelectedBrand] = useState(''); // TODO: retrieve from printer
  const [amsFilaments, setAmsFilaments] = useState<String[]>(['PLA Basic', 'PLA Matte', 'PETG HF', 'ABS-GF', 'PC FR', 'Support for PLA/PETG', 'PLA-CF', 'PLA-CF']); // TODO: retrieve from printer
  const [amsColours, setAmsColours] = useState<string[]>(['#000000', '#ffffff', '#abcdef', '#0fab9c', '#000000', '#333333', '#f9a2b8', '#fafafa', '#aaaaaa']) // TODO: retrieve from printer
  
  const [selectedAms, setSelectedAms] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [inColour, setInColour] = useState('');
  const [inFilament, setInFilament] = useState<Filament>();

  const selectedColour = `#${(printerState.print.vt_tray.tray_color).substring(0, 6)}`;
  const selectedFilament = printerState.print.vt_tray.tray_type;
  const amsUnits = (printerState.print.ams.ams).length;
  const ams = printerState.print.ams;

  const updateAmsFilament = (index: number, newValue: string) => {
    setAmsFilaments(prev => {
      const newArray = [...prev];
      newArray[index] = newValue;
      return newArray;
    });
  };

  const updateAmsColour = (index: number, newValue: string) => {
    setAmsColours(prev => {
      const newArray = [...prev];
      newArray[index] = newValue;
      return newArray;
    });
  };

  useEffect(() => {
    ams.ams.forEach((element: { tray: any[]; }) => {
      element.tray.forEach(tray => {
        updateAmsFilament(tray.id, tray.tray_type || "Empty")
        updateAmsColour(tray.id, `#${(tray.tray_color?.substring(0, 6) || '')}`)
      })
    })
  }, [ams])

  useEffect(() => {
    const fetchFilaments = async () => {
      const data = filamentsData;

      setFilaments(data);
      
      const brands = Array.from(new Set(data.map(f => f.brand)));
      setBrands(brands);
      
      if (brands.length > 0) {
        setSelectedBrand(brands[0]);
      }
    };

    fetchFilaments();
  }, []);

  const handleButtonClick = (action: string) => {
    setActiveAction(action);
    setEditOpen(true);
  };

  const filteredFilaments = filaments.filter(f => 
    f.brand === selectedBrand && 
    f.material.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center">
      <div className="flex flex-col sm:flex-row">
        <div 
          className={((activeView == 'ext')? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700') + " transition m-1 sm:m-2 p-1 sm:p-2 rounded-md"} 
          onClick={() => setActiveView('ext')}
        >
        <label className="text-sm sm:text-lg">External Spool</label>
        </div>
        <div 
          className={((activeView == 'ams')? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700') + " transition m-1 sm:m-2 p-1 sm:p-2 rounded-md" + ((amsUnits >= 1)? "" : " hidden")} 
          onClick={() => setActiveView('ams')}
        >
          <label className="text-sm sm:text-lg">AMS</label>
        </div>
      </div>
      {activeView == "ext" && (
        <div className="flex flex-col sm:flex-row w-full">
          <div className="flex flex-col w-full sm:w-auto">
            <div className="flex flex-col items-center">
              <img src="/filament.png" className="w-[60%] sm:w-[50%]"/>
              <div className="flex flex-row items-center">
                <section className="w-6 h-6 sm:w-8 sm:h-8 m-1 sm:m-2" style={{backgroundColor: `${selectedColour}`}}></section>
                <label className="text-lg sm:text-3xl">{selectedFilament}</label>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center w-full sm:w-auto">
            <button
              className="bg-gray-800 hover:bg-gray-700 flex rounded-lg text-lg sm:text-3xl p-4 sm:p-8 m-1 sm:m-2 h-[20%] items-center justify-center w-[100%]" 
              onClick={() => sendCommand(name, ip, password, serial, buildCommand('filament_load'))
            }>
              Load
            </button>
            <button
              className="bg-gray-800 hover:bg-gray-700 flex rounded-lg text-lg sm:text-3xl p-4 sm:p-8 m-1 sm:m-2 h-[20%] items-center justify-center w-[100%]" 
              onClick={() => sendCommand(name, ip, password, serial, buildCommand('filament_unload'))
            }>
              Unload
            </button>
            <button className={"flex bg-gray-800 rounded-lg hover:bg-gray-700 text-lg sm:text-3xl p-4 sm:p-8 m-1 sm:m-2 h-[20%] items-center justify-center w-[100%]"} onClick={() => handleButtonClick('Edit')}>
              Edit
            </button>
          </div>
        </div>
      )}
      {(activeView == "ams") && (
        <div className="flex flex-col w-full">
          <div className="flex flex-col sm:flex-row w-full">
            <div className="flex flex-col w-full sm:w-[40%]">
              {Array.from({ length: amsUnits }).map((_, i) => (
                <div key={i}
                  className={((selectedAms == i)? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700") + " p-1 sm:p-2 m-1 rounded-md"}
                  onClick={() => setSelectedAms(i)}
                >
                  <label className="text-sm sm:text-base">AMS {i}</label>
                </div>
              ))}
            </div>
            <div className={"flex flex-col items-center rounded-lg m-1 sm:m-2 transition " + ((selectedSlot == 0)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(0)}
            >
              <img src="/filament.png" className="w-[40%] sm:w-[50%]"/>
              <div className="flex flex-row items-center">
                <section 
                  className="w-4 h-4 sm:w-8 sm:h-8 m-1 sm:m-2" 
                  style={{
                    backgroundColor: `${amsColours[((selectedAms + 1) * 4) - 4]}`,
                    display: (amsFilaments[((selectedAms + 1) * 4) - 4] === "Empty" ? 'none' : 'block')
                  }}
                />
                <label className="text-sm sm:text-3xl">{amsFilaments[(selectedAms+1)*4-4]}</label>
              </div>
            </div>
            <div className={"flex flex-col items-center rounded-lg m-1 sm:m-2 transition " + ((selectedSlot == 1)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(1)}
            >              
            <img src="/filament.png" className="w-[40%] sm:w-[50%]"/>
              <div className="flex flex-row items-center">
                <section 
                  className="w-4 h-4 sm:w-8 sm:h-8 m-1 sm:m-2" 
                  style={{
                    backgroundColor: `${amsColours[((selectedAms + 1) * 4) - 3]}`,
                    display: (amsFilaments[((selectedAms + 1) * 4) - 3] === "Empty" ? 'none' : 'block')
                  }}
                />
                <label className="text-sm sm:text-3xl">{amsFilaments[(selectedAms+1)*4-3]}</label>
              </div>
            </div>
            <div className={"flex flex-col items-center rounded-lg m-1 sm:m-2 transition " + ((selectedSlot == 2)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(2)}
            >              
              <img src="/filament.png" className="w-[40%] sm:w-[50%]"/>
              <div className="flex flex-row items-center">
                <section 
                  className="w-4 h-4 sm:w-8 sm:h-8 m-1 sm:m-2" 
                  style={{
                    backgroundColor: `${amsColours[((selectedAms + 1) * 4) - 2]}`,
                    display: (amsFilaments[((selectedAms + 1) * 4) - 2] === "Empty" ? 'none' : 'block')
                  }}
                />
                <label className="text-sm sm:text-3xl">{amsFilaments[(selectedAms+1)*4-2]}</label>
              </div>
            </div>
            <div className={"flex flex-col items-center rounded-lg m-1 sm:m-2 transition " + ((selectedSlot == 3)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(3)}
            >              
              <img src="/filament.png" className="w-[40%] sm:w-[50%]"/>
              <div className="flex flex-row items-center">
                <section 
                  className="w-4 h-4 sm:w-8 sm:h-8 m-1 sm:m-2" 
                  style={{
                    backgroundColor: `${amsColours[((selectedAms + 1) * 4) - 1]}`,
                    display: (amsFilaments[((selectedAms + 1) * 4) - 1] === "Empty" ? 'none' : 'block')
                  }}
                />
                <label className="text-sm sm:text-3xl">{amsFilaments[(selectedAms+1)*4-1]}</label>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center w-full">
            <button className="bg-gray-800 hover:bg-gray-700 flex rounded-lg text-lg sm:text-3xl p-4 sm:p-8 m-1 sm:m-2 h-[20%] items-center justify-center w-full sm:w-auto " onClick={() => alert('loading ams filament')}>
              Load
            </button>
            <button className="bg-gray-800 hover:bg-gray-700 flex rounded-lg text-lg sm:text-3xl p-4 sm:p-8 m-1 sm:m-2 h-[20%] items-center justify-center w-full sm:w-auto " onClick={() => alert('unloading ams filament')}>
              Unload
            </button>
            <button className={"flex bg-gray-800 rounded-lg hover:bg-gray-700 text-lg sm:text-3xl p-4 sm:p-8 m-1 sm:m-2 h-[20%] items-center justify-center w-full sm:w-auto "} onClick={() => handleButtonClick('Edit')}>
              Edit
            </button>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => setEditOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            
            <h2 className="text-xl mb-4 text-white">{activeAction} Filament</h2>
            <div className="text-gray-300 space-y-4">
              <div className="flex flex-col">
                <label className="mb-1">Brand</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => {
                    setSelectedBrand(e.target.value);
                  }}
                  className="bg-gray-700 text-white rounded p-2"
                >
                  {brands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
              <input 
                type="text" 
                className="bg-gray-700 w-full p-2 rounded-md"
                placeholder='Search...'
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
              />
              <div className="max-h-60 overflow-y-auto border border-gray-700 rounded">
                {filteredFilaments.length > 0 ? (
                  filteredFilaments.filter(f => f.material.toLowerCase().includes(searchTerm.toLowerCase())).map((filament) => (
                    <div
                      key={filament.id}
                      className="p-2 transition"
                      onClick={() => {
                        setInFilament(filament);
                      }}
                      style={{backgroundColor:
                        `var(--color-gray-${(inFilament?.material == filament.material)? '700' : '800'})`}}
                    >
                      <label>{filament.material}</label>
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-center text-gray-400">
                    No filaments found for this brand
                  </div>
                )}
              </div>

              <div className="flex flex-col">
                <label className="mb-1">Colour</label>
                <input
                  type="color"
                  className="w-full h-10 bg-gray-700 rounded cursor-pointer"
                  id="edit-colour"
                  defaultValue={
                    ((activeView == 'ams')? amsColours[((selectedAms + 1) * 4) - (4 - selectedSlot)] : selectedColour)
                  }
                  onChange={() => {
                    let colour = (document.getElementById("edit-colour") as HTMLInputElement).value;
                    setInColour(colour)
                  }}
                />
              </div>

              <button
                className="p-2 m-1 bg-blue-600 rounded-md hover:bg-blue-700"
                onClick={() => {
                  if (activeView == 'ext') {
                    sendCommand(
                      name,
                      ip,
                      password,
                      serial,
                      buildCommand('ams_filament', {
                        "ams_id": 255, // always 255 for ext spool
                        "tray_id": 254, // always 254 for ext spool
                        "tray_color": inColour.substring(1).toUpperCase() + "FF",
                        "nozzle_temp_min": inFilament?.minTemp,
                        "nozzle_temp_max": inFilament?.maxTemp,
                        "tray_type": inFilament?.type
                      })
                    )
                  }
                  else if (activeView == 'ams') {
                    const trayId = ((selectedAms + 1) * 4) - (4 - selectedSlot);
                    sendCommand(name, ip, password, serial, buildCommand('ams_filament', {
                      "ams_id": selectedAms,
                      "tray_id": trayId,
                      "tray_color": inColour.substring(1).toUpperCase() + "FF",
                      "nozzle_temp_min": inFilament?.minTemp,
                      "nozzle_temp_max": inFilament?.maxTemp,
                      "tray_type": inFilament?.type
                    }));
                  }
                  setEditOpen(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}