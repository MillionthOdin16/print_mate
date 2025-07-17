'use client';

import { useState, useEffect } from 'react';
import filamentsData from '@/data/filaments.json';

interface FilamentCardProps {
  name: string;
  model: string;
}

interface Filament {
  id: string;
  brand: string;
  material: string;
  minTemp: number;
  maxTemp: number;
}

export default function FilamentCard({ name, model }: FilamentCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [activeView, setActiveView] = useState<'ams' | 'ext'>('ext');
  const [activeAction, setActiveAction] = useState(''); // TODO: retrieve from printer
  const [selectedBrand, setSelectedBrand] = useState(''); // TODO: retrieve from printer
  const [selectedFilament, setSelectedFilament] = useState('PLA Basic'); // TODO: retrieve from printer
  const [amsUnits, setAmsUnits] = useState(2); // TODO: retrieve from printer
  const [amsFilaments, setAmsFilaments] = useState<String[]>(['PLA Basic', 'PLA Matte', 'PETG HF', 'ABS-GF']); // TODO: retrieve from printer
  const [selectedColour, setSelectedColour] = useState('000000'); // TODO: retrieve from printer
  const [amsColours, setAmsColours] = useState<String[]>(['000000', 'ffffff', 'abcdef', '0fab9c']) // TODO: retrieve from printer
  
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

  const [selectedAms, setSelectedAms] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [loadingFilament, setLoadingFilament] = useState(false);
  const [unloadingFilament, setUnloadingFilament] = useState(false);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    const fetchFilaments = async () => {
      const data = filamentsData;

      setFilaments(data);
      
      const uniqueBrands = Array.from(new Set(data.map(f => f.brand)));
      setBrands(uniqueBrands);
      
      if (uniqueBrands.length > 0) {
        setSelectedBrand(uniqueBrands[0]);
      }
    };

    fetchFilaments();
  }, []);

  const handleButtonClick = (action: string) => {
    setActiveAction(action);
    setEditOpen(true);
  };

  const filteredFilaments = filaments.filter(f => f.brand === selectedBrand);

  return (
    <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-start justify-start">
      <div className="flex flex-row">
        <div 
          className={((activeView == 'ext')? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700') + " transition m-2 p-2 rounded-md"} 
          onClick={() => setActiveView('ext')}
        >
        <label className="text-lg">External Spool</label>
        </div>
        <div 
          className={((activeView == 'ams')? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700') + " transition m-2 p-2 rounded-md" + ((amsUnits >= 1)? "" : " hidden")} 
          onClick={() => setActiveView('ams')}
        >
          <label className="text-lg">AMS</label>
        </div>
      </div>
      {activeView == "ext" && (
        <div className="flex flex-row">
          <div className="flex flex-col">
            <div className="flex flex-col items-center">
              <img src="/filament.png" className="w-[50%]"/>
              <div className="flex flex-row items-center">
                <section className="w-8 h-8 m-2 bg-[#000000]"></section>
                <label className="text-3xl">{selectedFilament}</label>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center">
            <button disabled={loadingFilament || unloadingFilament} className={"flex rounded-lg text-3xl p-8 m-2 h-[20%] items-center justify-center w-[100%] " + ((loadingFilament || unloadingFilament)? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700")} onClick={() => {alert('loading filament');setLoadingFilament(true);}}>
              Load
            </button>
            <button disabled={loadingFilament || unloadingFilament} className={"flex rounded-lg text-3xl p-8 m-2 h-[20%] items-center justify-center w-[100%] " + ((loadingFilament || unloadingFilament)? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700")} onClick={() => {alert('unloading filament');setUnloadingFilament(true);}}>
              Unload
            </button>
            <button className={"flex bg-gray-800 rounded-lg hover:bg-gray-700 text-3xl p-8 m-2 h-[20%] items-center justify-center w-[100%]"} onClick={() => handleButtonClick('Edit')}>
              Edit
            </button>
          </div>
        </div>
      )}
      {(activeView == "ams") && (
        <div className="flex flex-col">
          <div className="flex flex-row">
            <div className="flex flex-col w-[40%]">
              {Array.from({ length: amsUnits }).map((_, i) => (
                <div 
                  className={((selectedAms == i)? "bg-blue-600" : "bg-gray-800 hover:bg-gray-700") + " p-2 m-1 rounded-md"}
                  onClick={() => setSelectedAms(i)}
                >
                  <label>AMS {i}</label>
                </div>
              ))}
            </div>
            <div 
              className={"flex flex-col items-center rounded-lg m-2 transition " + ((selectedSlot == 0)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(0)}
            >
              <img src="/filament.png" className="w-[50%]"/>
              <div className="flex flex-row items-center">
                <section className="w-8 h-8 m-2 bg-[#000000]"></section>
                <label className="text-3xl">{amsFilaments[(selectedAms+1)*4-4]}</label>
              </div>
            </div>
            <div 
              className={"flex flex-col items-center rounded-lg m-2 transition " + ((selectedSlot == 1)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(1)}
            >              
            <img src="/filament.png" className="w-[50%]"/>
              <div className="flex flex-row items-center">
                <section className="w-8 h-8 m-2 bg-[#000000]"></section>
                <label className="text-3xl">{amsFilaments[(selectedAms+1)*4-3]}</label>
              </div>
            </div>
            <div 
              className={"flex flex-col items-center rounded-lg m-2 transition " + ((selectedSlot == 2)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(2)}
            >              
              <img src="/filament.png" className="w-[50%]"/>
              <div className="flex flex-row items-center">
                <section className="w-8 h-8 m-2 bg-[#000000]"></section>
                <label className="text-3xl">{amsFilaments[(selectedAms+1)*4-2]}</label>
              </div>
            </div>
            <div 
              className={"flex flex-col items-center rounded-lg m-2 transition " + ((selectedSlot == 3)? "bg-gray-700" : "bg-gray-800")}
              onClick={() => setSelectedSlot(3)}
            >              
              <img src="/filament.png" className="w-[50%]"/>
              <div className="flex flex-row items-center">
                <section className="w-8 h-8 m-2 bg-[#000000]"></section>
                <label className="text-3xl">{amsFilaments[(selectedAms+1)*4-1]}</label>
              </div>
            </div>
          </div>

          <div className="flex flex-row justify-center items-center">
            <button disabled={loadingFilament || unloadingFilament} className={"flex rounded-lg text-3xl p-8 m-2 h-[20%] items-center justify-center " + ((loadingFilament || unloadingFilament)? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700")} onClick={() => {alert('loading filament');setLoadingFilament(true);}}>
              Load
            </button>
            <button disabled={loadingFilament || unloadingFilament} className={"flex rounded-lg text-3xl p-8 m-2 h-[20%] items-center justify-center " + ((loadingFilament || unloadingFilament)? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700")} onClick={() => {alert('unloading filament');setUnloadingFilament(true);}}>
              Unload
            </button>
            <button className={"flex bg-gray-800 rounded-lg hover:bg-gray-700 text-3xl p-8 m-2 h-[20%] items-center justify-center "} onClick={() => handleButtonClick('Edit')}>
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

              <div className="max-h-60 overflow-y-auto border border-gray-700 rounded">
                {filteredFilaments.length > 0 ? (
                  filteredFilaments.map((filament) => (
                    <div 
                      key={filament.id}
                      className="p-2 transition"
                      onClick={() => {
                        console.log('Selected:', filament.material);
                        if (activeView == 'ext') setSelectedFilament(filament.material);
                        else if (activeView == 'ams') {
                          switch (selectedSlot) {
                            case 0:
                              updateAmsFilament((((selectedAms + 1) * 4) - 4), filament.material)
                              break;
                            case 1:
                              updateAmsFilament((((selectedAms + 1) * 4) - 3), filament.material)
                              break;
                            case 2:
                              updateAmsFilament((((selectedAms + 1) * 4) - 2), filament.material)
                              break;
                            case 3:
                              updateAmsFilament((((selectedAms + 1) * 4) - 1), filament.material)
                              break;
                          }
                        }
                      }}
                      style={{backgroundColor:
                        `var(--color-gray-${(((activeView == 'ams')? amsFilaments[((selectedAms + 1) * 4) - (4 - selectedSlot)] : selectedFilament) == filament.material)? '700' : '800'})`}}
                    >
                      <div className="font-medium">{filament.material}</div>
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
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}