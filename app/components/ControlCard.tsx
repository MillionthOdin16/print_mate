import mqtt from "@/lib/mqtt";
import { useEffect, useState } from "react";
import JSZip from "jszip";
import { send } from "process";

interface ControlCardProps {
  name: string;
  ip: string;
  password: string;
  serial: string;
  model: string;
  online: boolean;
  setOnline: React.Dispatch<React.SetStateAction<boolean>>;
  printerState?: any;
}

async function sendMqttCommand(command: string, ip: string, password: string, serial: string, params: any = {}, printer: string) {
  const res = await fetch(`/api/printers/${printer}/mqtt/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: printer,
      host: ip,
      password: password,
      serial: serial,
      command: command,
      params: params
    })
  });

  if (!res.ok) {
    console.error(res)
  }

  const result = await res.json();
  console.log('MQTT response:', result);
}

export default function ControlCard({ name, ip, password, serial, model, online, setOnline, printerState }: ControlCardProps) {
  const [previewImage, setPreviewImage] = useState<string>("/no_image.png");
  const [skipImage, setSkipImage] = useState<string>("/no_image.png");
  
  const [nozzleOpen, setNozzleOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [fanOpen, setFanOpen] = useState(false);

  const [nozzleTargetInput, setNozzleTargetInput] = useState(0);
  const [bedTargetInput, setBedTargetInput] = useState(0);

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
            const previewFile = zipContent.file(`Metadata/plate_${plate}.png`); // print banner image
            const skipFile = zipContent.file(`Metadata/top_${plate}.png`); // skip objects top view

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
    <div className="flex flex-row bg-gray-900 rounded-lg p-4 w-[100%] h-[100%]">
      <div className="flex flex-col w-[80%] m-2">
        <img src={previewImage} className="w-[100%]"/>
        <div className="flex flex-row justify-between">
          <label className="text-lg">-{timeRemaining}</label>
          <label className="text-lg">{printProgress}%</label>
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
          onClick={() => sendMqttCommand('resume_print', ip, password, serial, {}, name)}
        >
          <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </button>
        <button 
          className="m-2 bg-gray-800 hover:bg-gray-700 transition rounded-md p-2" 
          style={{ display: (gcodeStatus === "RUNNING"? 'block' : 'none') }}
          onClick={() => sendMqttCommand('pause_print', ip, password, serial, {}, name)}
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
                sendMqttCommand('stop_print', ip, password, serial, {}, name)
            }
          }>
          <svg className="w-5 h-5 m-2.5 text-red-600" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" fill="currentColor" />
          </svg>
        </button>
        <button className="m-2 transition rounded-md p-2" 
          style={{ 
            backgroundColor: chamberLight ? 'var(--color-gray-700)' : 'var(--color-gray-800)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-700)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = chamberLight ? 'var(--color-gray-700)' : 'var(--color-gray-800)'}
          onClick={(e) => {
            sendMqttCommand('led_control', ip, password, serial, { node: 'chamber_light', mode: (chamberLight ? 'off' : 'on') }, name);
          }}
        >
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2a6 6 0 00-3.63 10.68c.37.29.63.74.63 1.23v1.09a1 1 0 001 1h3a1 1 0 001-1v-1.09c0-.49.26-.94.63-1.23A6 6 0 0012 2z"/>
            <path d="M9.5 19a2 2 0 104 0h-4z"/>
          </svg>
        </button>
        <button className="m-2 bg-gray-800 hover:bg-gray-700 transition rounded-md p-2">
          {gcodeStatus}
        </button>
      </div>
      <div className="flex justify-end w-[100%]">
        <div className="flex flex-col w-[45%] m-2">
          <div
            className="flex bg-gray-800 m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={(e) => {
              setNozzleOpen(true);
            }}
          >
            <img src="nonexistant.png" className="h-[80%]" />
            <span className="text-xl m-4">{nozzleTemperature}° / {nozzleTarget}°</span>
          </div>
          <div
            className="flex bg-gray-800 m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setBedOpen(true)}
          >
            <img src="nonexistant.png" className="h-[80%]" />
            <span className="text-xl m-4">{bedTemperature}° / {bedTarget}°</span>
          </div>
          <div
            className="flex bg-gray-800 m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setSkipOpen(true)}
          >
            <img src="nonexistant.png" className="h-[80%]" />
            <span className="text-xl m-4">{objectsSkipped} skipped</span>
          </div>
          <div
            className="flex bg-gray-800 m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setSpeedOpen(true)}
          >
            <img src="nonexistant.png" className="h-[80%]" />
            <span className="text-xl m-4">{printSpeed}%</span>
          </div>
          <div
            className="flex bg-gray-800 m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setFanOpen(true)}
          >
            <img src="nonexistant.png" className="h-[80%]" />
            <span className="text-xl m-4">{fanPercentage}%</span>
          </div>
        </div>
      </div>

      {nozzleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => {
                sendMqttCommand('temp_nozzle', ip, password, serial, {"1": `S${nozzleTargetInput}`}, name);
                setNozzleOpen(false);
              }}
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
            <h2 className="text-xl mb-4 text-white">Nozzle {nozzleTemperature}/{nozzleTarget}°</h2>
            <input 
              type="number" 
              defaultValue={nozzleTarget}
              onChange={(e) => setNozzleTargetInput(Number(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded"
            />
          </div>
        </div>
      )}
      {bedOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
            <button
              onClick={() => {
                sendMqttCommand('temp_bed', ip, password, serial, {"1": `S${bedTargetInput}`}, name);
                setBedOpen(false);
              }}
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
            <h2 className="text-xl mb-4 text-white">Bed {bedTemperature}/{bedTarget}°</h2>
            <input 
              type="number" 
              defaultValue={bedTarget}
              onChange={(e) => setBedTargetInput(Number(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded"
            />
          </div>
        </div>
      )}
      {skipOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-[100%] max-w-xl relative border border-gray-700">
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
              <img src={skipImage} className="w-[60%] m-2"/>
              <div className="flex flex-col w-[30%] justify-between">
                <div>
                  <span className="text-lg m-2">Skip</span>
                  {/* TODO: [BEGIN] REPLACE REAL DATA */}
                  <div className="flex flex-row">
                    <input type="checkbox"></input>
                    <label className="m-2">something.stl</label>
                  </div>
                  {/* TODO: [END] REPLACE REAL DATA */}
                </div>
                <div className="flex flex-col">
                  <button 
                    className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
                    onClick={() => {
                      //TODO: ADD THE ACTUAL PROCESSING LOGIC
                      setSkipOpen(false);
                    }}>Finish</button>
                  <button 
                    className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
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
              onClick={() => sendMqttCommand('print_speed', ip, password, serial, { speed: '1' }, name)}
            >
              Silent 50%
            </button>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => sendMqttCommand('print_speed', ip, password, serial, { speed: '2' }, name)}
            >
              Standard 100%
            </button>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => sendMqttCommand('print_speed', ip, password, serial, { speed: '3' }, name)}
            >
              Sport 124%
            </button>
            <button
              className="bg-gray-700 rounded-md hover:bg-gray-600 text-md m-1 p-2"
              onClick={() => sendMqttCommand('print_speed', ip, password, serial, { speed: '4' }, name)}
            >
              Ludicrous 166%
            </button>
          </div>
        </div>
      )}
      {fanOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md relative border border-gray-700">
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
            <h2 className="text-xl mb-4 text-white">Fan {fanPercentage}%</h2>
            <div className="flex flex-row">
              <button 
                onClick={() => {
                  //TODO
                }}
                className="p-2 h-[50%] w-[10%] bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                -
              </button>
              <div className="flex bg-gray-700 rounded-md w-[20%] justify-center items-center mx-2">
                <span>{fanPercentage}</span>
              </div>
              <button 
                onClick={() => {
                  //TODO
                }}
                className="p-2 h-[50%] w-[10%] bg-gray-700 hover:bg-gray-600 rounded-md"
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