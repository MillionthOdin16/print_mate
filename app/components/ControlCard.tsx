import mqtt from "@/lib/mqtt";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import * as commands from "@/lib/commands"
import SkipCard from "@/app/components/SkipCard"

interface ControlCardProps {
  name: string;
  ip: string;
  password: string;
  serial: string;
  model: string;
  printerState?: any;
}

interface PrintObject {
  id: string;
  name: string;
  bbox: number[];
}

export default function ControlCard({ name, ip, password, serial, model, printerState }: ControlCardProps) {
  const [previewImage, setPreviewImage] = useState<string>("/no_image.png");
  const [skipImage, setSkipImage] = useState<string>("/no_image.png");
  const [objects, setObjects] = useState<PrintObject[]>([])
  
  const [moveOpen, setMoveOpen] = useState(false);
  const [nozzleOpen, setNozzleOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [fanOpen, setFanOpen] = useState(false);

  const currentPrinterState = printerState || { print: {} };

  const rawTimeRemaining = currentPrinterState?.print?.mc_remaining_time || 0;
  const timeRemaining = `${(rawTimeRemaining - (rawTimeRemaining % 60))/60}h${(rawTimeRemaining % 60)}m`;
  const currentLayer = currentPrinterState.print.layer_num || 0;
  const totalLayer = currentPrinterState.print.total_layer_num || 0;
  const printProgress = Math.round(currentPrinterState.print.mc_percent || 0);
  const gcodeFile = currentPrinterState.print?.gcode_file || "No print in progress";

  const gcodeStatus = currentPrinterState.print?.gcode_state || "IDLE";
  const chamberLight = (currentPrinterState.print?.lights_report?.[0]?.mode === "on") || false;

  const nozzleTemperature = Math.round(currentPrinterState.print?.nozzle_temper || 0) || 0;
  const nozzleTarget = currentPrinterState.print?.nozzle_target_temper || 0;
  const bedTemperature = Math.round(currentPrinterState.print?.bed_temper || 0) || 0;
  const bedTarget = currentPrinterState.print?.bed_target_temper || 0;
  const objectsSkipped = (currentPrinterState.print?.s_obj ? Object.keys(currentPrinterState.print.s_obj).length : 0) || 0;
  const printSpeed = currentPrinterState.print?.spd_mag || 0;
  const fanPercentage = (() => {
    const percentage = (currentPrinterState.print?.cooling_fan_speed / 15) * 100 // approx, not fully accurate
    return Math.round(percentage / 10) * 10;
  })();

  const [nozzleTargetInput, setNozzleTargetInput] = useState(0);
  const [bedTargetInput, setBedTargetInput] = useState(0);
  const [fanTargetInput, setFanTargetInput] = useState(fanPercentage);
  const [skipObjectsInput, setSkipObjectsInput] = useState<number[]>([])

  const fanValuePercentage = (percentage: number): number => {
    const value = Math.max(0, Math.min(100, percentage));
    
    const fanValue = Math.round((value / 100) * 255);
    
    return fanValue;
  };

  useEffect(() => {
    if (fanOpen) {
      setFanTargetInput(fanPercentage);
    }
  }, [fanOpen]);

  const retrieveGcodeFile = async (filename: string) => {
    if (!filename || filename === "No print in progress") return;
    
    try {
      // get 3mf
      const res = await fetch(`/api/printers/${name}/files?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          host: ip,
          port: '990',
          password: password,
          serial: serial
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        console.log(`successfully retrieved file: ${filename}`);
        
        if (filename.toLowerCase().endsWith('.3mf')) {
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(arrayBuffer);
            
            const infoFile = zipContent.file('Metadata/slice_info.config'); // slicer info, plate & object ids
            let plate = '1'; // default
            
            if (infoFile) {
              const sliceInfo = await infoFile.async('text');
              
              const parser = new DOMParser();
              const xmlDoc = parser.parseFromString(sliceInfo, 'text/xml');
              const metadataElements = xmlDoc.getElementsByTagName('metadata');
              
              for (let i = 0; i < metadataElements.length; i++) {
                const element = metadataElements[i];
                if (element.getAttribute('key') === 'index') {
                  plate = element.getAttribute('value') || '1';
                  console.log(`extracted plate index: ${plate}`);
                  break;
                }
              }
            }
            
            const metadataFile = zipContent.file(`Metadata/plate_${plate}.json`); // object bbox data
            const sliceFile = zipContent.file(`Metadata/slice_info.config`); // object id data
            const previewFile = zipContent.file(`Metadata/plate_${plate}.png`); // print banner image
            const skipFile = zipContent.file(`Metadata/top_${plate}.png`); // skip objects top view

            if (sliceFile && metadataFile) {
              try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(await sliceFile.async('text'), 'text/xml')
                const json = JSON.parse(await metadataFile.async('text')).bbox_objects || {};

                const elements = xml.getElementsByTagName('object');
                const tempObjects: PrintObject[] = []

                for (let i = 0; i < Math.min(elements.length, json.length); i++) {
                  const element = elements[i];
                  const object = json[i];
                  tempObjects.push({
                    id: element.getAttribute('identify_id') || '0',
                    name: element.getAttribute('name') || '',
                    bbox: object.bbox
                  })
                }

                setObjects(tempObjects);
              } catch (e) {
                console.error(`failed to get slice info: ${e || 'unknown error'}`)
              }
            }

            if (previewFile) {
              const imageBlob = await previewFile.async('blob');
              const imageUrl = URL.createObjectURL(imageBlob);
              setPreviewImage(imageUrl);
            } else {
              // no image found
              setPreviewImage("/no_image.png");
            }

            if (skipFile) {
              const imageBlob = await skipFile.async('blob');
              const imageUrl = URL.createObjectURL(imageBlob);
              setSkipImage(imageUrl);
            } else {
              // no skip image found
              setSkipImage("/no_image.png");
            }
          } catch (error) {
            console.error(`error extracting 3mf, file may be corrrupt: ${error || 'unknown error'}`);
            setPreviewImage("/no_image.png");
          }
        } else {
          // file is not a 3mf
          setPreviewImage("/no_image.png");
        }
      } else {
        // http or ftp error
        const error = await res.json();
        console.error(`failed to retrieve file ${filename}: ${error || 'unknown error'}`); 
        setPreviewImage("/no_image.png");
      }
    } catch (error) {
      // other error
      console.log(`failed to retrieve file ${filename}: ${error || 'unknown error'}`);
      setPreviewImage("/no_image.png");
    }
  };

  useEffect(() => {
    if (gcodeFile && gcodeFile !== "No print in progress") {
      retrieveGcodeFile(gcodeFile);
    }
  }, [gcodeFile, ip, password, name]);

  return (
    <div className="flex flex-col sm:flex-row bg-gray-900 rounded-lg p-2 sm:p-4">
      <div className="flex flex-col w-full sm:w-[80%] m-1 sm:m-2">
        <img src={previewImage} className="w-[100%]"/>
        <div className="flex flex-row justify-between">
          <label className="text-sm sm:text-lg">-{timeRemaining}</label>
          <label className="text-sm sm:text-lg">{printProgress}%</label>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${printProgress}%` }}
          />
        </div>
        <label className="text-med">{currentLayer}/{totalLayer}</label>
        <label className="text-sm">{gcodeFile}</label>
      </div>
      <div className="flex flex-col justify-center items-center">
        <button 
          className="m-2 bg-gray-800 hover:bg-gray-700 transition rounded-md p-2" 
          style={{ display: (gcodeStatus === "PAUSE"? 'block' : 'none') }}
          onClick={() => commands.sendCommand(name, ip, password, serial, commands.resume_print(printerState?.sequence_id))}
        >
          <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button 
          className="m-2 bg-gray-800 hover:bg-gray-700 transition rounded-md p-2" 
          style={{ display: (gcodeStatus === "RUNNING"? 'block' : 'none') }}
          onClick={() => commands.sendCommand(name, ip, password, serial, commands.pause_print((printerState?.sequence_id)))}
        >
          <svg className="w-10 h-10 text-orange-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
          </svg>
        </button>
        <button
          className="m-2 bg-gray-800 hover:bg-gray-700 transition rounded-md p-2"
          style={{ display: (gcodeStatus === "RUNNING" || gcodeStatus === "PAUSE") ? 'block' : 'none' }}
          onClick={
            () => {
              if (confirm('Are you sure you want to cancel the print?')) 
                commands.sendCommand(name, ip, password, serial, commands.stop_print(printerState?.sequence_id))
            }
          }>
          <svg className="w-5 h-5 m-2.5 text-red-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" fill="currentColor" />
          </svg>
        </button>
        <button className="bg-gray-800 hover:bg-gray-700 m-2 transition rounded-md p-2" 
          style={{ 
            border: chamberLight ? '1px solid white' : 'none',
          }}
          onClick={() => {
            commands.sendCommand(name, ip, password, serial, commands.led_control(printerState.sequence_id, 'chamber_light', (chamberLight ? 'off' : 'on')));
          }}
        >
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a6 6 0 00-3.63 10.68c.37.29.63.74.63 1.23v1.09a1 1 0 001 1h3a1 1 0 001-1v-1.09c0-.49.26-.94.63-1.23A6 6 0 0012 2z"/>
            <path d="M9.5 19a2 2 0 104 0h-4z"/>
          </svg>
        </button>
        <button className="m-2 bg-gray-800 hover:bg-gray-700 transition rounded-md p-2" onClick={() => setMoveOpen(true)}>
            <img src="/move.png" className="h-10 w-10"/>
        </button>
      </div>
      <div className="flex justify-end w-full">
        <div className="flex flex-col w-full sm:w-[45%] m-1 sm:m-2">
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md max-h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setNozzleOpen(true)}
          >
            <img src="/nozzle.png" className="h-32"/>
            <span className="text-sm sm:text-xl m-2 sm:m-4">{nozzleTemperature}° / {nozzleTarget}°</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md max-h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setBedOpen(true)}
          >
            <img src="/bed.png" className="h-32"/>
            <span className="text-sm sm:text-xl m-2 sm:m-4">{bedTemperature}° / {bedTarget}°</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md max-h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setSkipOpen(true)}
          >
            <img src="/skip.png" className="h-32"/>
            <span className="text-sm sm:text-xl m-2 sm:m-4">{objectsSkipped} skipped</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md max-h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setSpeedOpen(true)}
          >
            <img src="/speed.png" className="h-32"/>
            <span className="text-sm sm:text-xl m-2 sm:m-4">{printSpeed}%</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md max-h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setFanOpen(true)}
          >
            <img src="/fan.png" className="h-32"/>
            <span className="text-sm sm:text-xl m-2 sm:m-4">{fanPercentage}%</span>
          </div>
        </div>
      </div>
      
      {moveOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setMoveOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Move Axes</h2>
            <div className="flex flex-row items-center space-y-4 justify-between">
              <div className="grid grid-cols-3 grid-rows-3 gap-2">
                <div/>
                <button
                  className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md p-3 flex items-center justify-center"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.manual_move(
                    printerState?.print.sequence_id,
                    "Y",
                    "5",
                    "3000"
                  ))}
                >
                  Y+
                </button>
                <div/>

                <button
                  className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md p-3 flex items-center justify-center"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.manual_move(
                    printerState?.print.sequence_id,
                    "X",
                    "-5",
                    "3000"
                  ))}                >
                  X-
                </button>
                <button
                  className="bg-blue-600 rounded-md hover:bg-blue-700 text-sm sm:text-md p-3 flex items-center justify-center"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.auto_home(printerState?.print.sequence_id))}
                >
                  Home
                </button>
                <button
                  className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md p-3 flex items-center justify-center"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.manual_move(
                    printerState?.print.sequence_id,
                    "X",
                    "5",
                    "3000"
                  ))}
                >
                  X+
                </button>
                
                <div/>
                <button
                  className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md p-3 flex items-center justify-center"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.manual_move(
                    printerState?.print.sequence_id,
                    "Y",
                    "-5",
                    "3000"
                  ))}
                >
                  Y-
                </button>
                <div/>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <button
                  className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md px-4 py-2"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.manual_move(
                    printerState?.print.sequence_id,
                    "Z",
                    "5",
                    "900"
                  ))}
                >
                  Z+
                </button>
                <button
                  className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md px-4 py-2"
                  onClick={() => commands.sendCommand(name, ip, password, serial, commands.manual_move(
                    printerState?.print.sequence_id,
                    "Z",
                    "-5",
                    "900"
                  ))}
                >
                  Z-
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {nozzleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setNozzleOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Nozzle {nozzleTemperature}/{nozzleTarget}°</h2>
            <input 
              type="number" 
              defaultValue={nozzleTarget}
              onChange={(e) => setNozzleTargetInput(Number(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded"
            />
            <button
              className="p-2 m-1 bg-blue-600 rounded-md hover:bg-blue-700"
              onClick={() => {
                let temp = nozzleTargetInput;
                if (temp < 0) temp = 0;
                 switch(model) {
                  case "A1M":
                  case "A1":
                  case "P1P":
                  case "P1S":
                  case "X1":
                  case "X1C":
                    if (temp > 300) temp = 300;
                    break;
                  case "X1E":
                    if (temp > 320) setNozzleTargetInput(320);
                  case "H2D":
                    if (temp > 350) setNozzleTargetInput(350);
                    break;
                }
                setNozzleOpen(false);
                commands.sendCommand(name, ip, password, serial, commands.temp_nozzle(printerState.sequence_id, temp.toString()));
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
      {bedOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setBedOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Bed {bedTemperature}/{bedTarget}°</h2>
            <input 
              type="number" 
              defaultValue={bedTarget}
              onChange={(e) => setBedTargetInput(Number(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded"
            />
            <button
              className="p-2 m-1 bg-blue-600 rounded-md hover:bg-blue-700"
              onClick={() => {
                if (bedTargetInput < 0) setBedTargetInput(0);
                switch(model) {
                  case "A1M":
                    if (bedTargetInput > 80) setBedTargetInput(80);
                    break;
                  case "A1":
                  case "P1P":
                  case "P1S":
                    if (bedTargetInput > 100) setBedTargetInput(100);
                    break;
                  case "X1":
                  case "X1C": 
                  case "X1E":
                  case "H2D":
                    if (bedTargetInput > 120) setBedTargetInput(120);
                    break;
                }
                setBedOpen(false);
                commands.sendCommand(name, ip, password, serial, commands.temp_bed(printerState.sequence_id, bedTargetInput.toString()));
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
      {skipOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-[100%] max-w-xl relative border border-gray-700 mx-2">
            <button
              onClick={() => setSkipOpen(false)}
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
            <h2 className="text-xl mb-4 text-white">Skip Objects {objectsSkipped} skipped</h2>
            <div className="flex flex-row">
              <div className="w-[70%]">
                <SkipCard
                  imageUrl={skipImage}
                  objects={objects}
                  skippedObjects={skipObjectsInput}
                  onClick={(id) => {
                    setSkipObjectsInput(prev =>
                      prev.includes(parseInt(id))
                        ? prev.filter(prevId => prevId !== parseInt(id))
                        : [...prev, parseInt(id)]
                    );
                  }}
                />
              </div>
              <div className="flex flex-col w-[30%] justify-between">
                <div>
                  <span className="text-sm sm:text-lg m-1 sm:m-2">Skip</span>
                  {objects.map(object => {
                    return (
                      <div key={object.id}>
                        <input type="checkbox" 
                          checked={
                            (currentPrinterState.print?.s_obj).some((e: number) => e.toString() === object.id) ||
                            skipObjectsInput.some(obj => obj == Number.parseInt(object.id))                            
                          }
                          disabled={(currentPrinterState.print?.s_obj).some((e: number) => e.toString() === object.id)}
                          onClick={(e) => {
                            setSkipObjectsInput(
                              (e.target as HTMLInputElement).checked ?
                                [...skipObjectsInput, Number.parseInt(object.id)]:
                                skipObjectsInput.filter(item => item !== Number.parseInt(object.id))
                            );
                          }}
                          readOnly
                        />
                        {object.name}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col">
                  <button 
                    className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md m-1 p-2"
                    onClick={() => {
                      commands.sendCommand(name, ip, password, serial, commands.skip_objects(printerState.print?.sequence_id, skipObjectsInput))
                      setSkipOpen(false);
                    }}>Finish</button>
                  <button 
                    className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md m-1 p-2"
                    onClick={() => setSkipOpen(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {speedOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-[100%] max-w-xl relative border border-gray-700">
            <button
              onClick={() => setSpeedOpen(false)}
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
            <h2 className="text-xl mb-4 text-white">Print Speed</h2>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => commands.sendCommand(name, ip, password, serial, commands.print_speed(printerState.print?.sequence_id, "1"))}
            >
              Silent 50%
            </button>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => commands.sendCommand(name, ip, password, serial, commands.print_speed(printerState.print?.sequence_id, "2"))}
            >
              Standard 100%
            </button>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => commands.sendCommand(name, ip, password, serial, commands.print_speed(printerState.print?.sequence_id, "3"))}
            >
              Sport 124%
            </button>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => commands.sendCommand(name, ip, password, serial, commands.print_speed(printerState.print?.sequence_id, "4"))}
            >
              Ludicrous 166%
            </button>
          </div>
        </div>
      )}
      {fanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md relative border border-gray-700 mx-2">
            <button
              onClick={() => setFanOpen(false)}
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Fan {fanPercentage}%</h2>
            <div className="flex flex-row items-center">
              <button 
                onClick={() => {
                  const newPercentage = Math.max(0, fanTargetInput - 10);
                  setFanTargetInput(newPercentage);
                  commands.sendCommand(name, ip, password, serial, commands.part_fan_speed(
                    printerState.print?.sequence_id, 
                    fanValuePercentage(newPercentage).toString()
                  ));
                }}
                disabled={fanTargetInput <= 0}
                className="p-2 h-[50%] w-[10%] bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-md"
              >
                -
              </button>
              <div className="flex bg-gray-700 rounded-md flex-1 h-8 sm:h-10 justify-center items-center mx-2">
                <span className="text-sm sm:text-base">{fanTargetInput}%</span>
              </div>
              <button 
                onClick={() => {
                  const newPercentage = Math.min(100, fanTargetInput + 10);
                  setFanTargetInput(newPercentage);
                  commands.sendCommand(name, ip, password, serial, commands.part_fan_speed(
                    printerState.print?.sequence_id, 
                    fanValuePercentage(newPercentage).toString()
                  ));
                }}
                disabled={fanTargetInput >= 100}
                className="p-2 h-[50%] w-[10%] bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-md"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
