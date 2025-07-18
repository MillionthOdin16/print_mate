import { useState } from "react";

interface ControlCardProps {
  name: string;
  model: string;
}

export default function ControlCard({ name, model }: ControlCardProps) {
  //TODO: read from printer
  const [timeRemaining, setTimeRemaining] = useState("-5h32m");
  const [currentLayer, setCurrentLayer] = useState(590);
  const [totalLayer, setTotalLayer] = useState(1000);
  const [printProgress, setPrintProgress] = useState(69);
  const [nozzleTemperature, setNozzleTemperature] = useState(180);
  const [nozzleTarget, setNozzleTarget] = useState(250);
  const [bedTemperature, setBedTemperature] = useState(60);
  const [bedTarget, setBedTarget] = useState(65);
  const [objectsSkipped, setObjectsSkipped] = useState(2);
  const [objectsTotal, setObjectsTotal] = useState(11);
  const [chamberLight, setChamberLight] = useState(true);
  const [fanPercentage, setFanPercentage] = useState(60);

  const [nozzleOpen, setNozzleOpen] = useState(false);
  const [bedOpen, setBedOpen] = useState(false);
  const [skipOpen, setSkipOpen] = useState(false);
  const [fanOpen, setFanOpen] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row bg-gray-900 rounded-lg p-2 sm:p-4 w-[100%] h-[100%]">
      <div className="flex flex-col w-full sm:w-[80%] m-1 sm:m-2">
        <img src="/no_image.png" className="w-[100%]"/>
        <div className="flex flex-row justify-between">
          <label className="text-sm sm:text-lg">{timeRemaining}</label>
          <label className="text-sm sm:text-lg">{printProgress}%</label>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${printProgress}%` }}
          ></div>
        </div>
        <label className="text-xs sm:text-med">{currentLayer}/{totalLayer}</label>
      </div>
      <div className="flex justify-end w-[100%]">
        <div className="flex flex-col w-full sm:w-[45%] m-1 sm:m-2">
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setNozzleOpen(true)}
          >
            <img src="/nozzle.png" className="h-[100%]" />
            <span className="text-sm sm:text-xl m-2 sm:m-4">{nozzleTemperature}° / {nozzleTarget}°</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setBedOpen(true)}
          >
            <img src="/bed.png" className="h-[100%]" />
            <span className="text-sm sm:text-xl m-2 sm:m-4">{bedTemperature}° / {bedTarget}°</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setSkipOpen(true)}
          >
            <img src="nonexistant.png" className="h-[100%]" />
            <span className="text-sm sm:text-xl m-2 sm:m-4">{objectsSkipped} / {objectsTotal}</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setChamberLight(!chamberLight)}
          >
            <img src="nonexistant.png" className="h-[100%]" />
            <span className="text-sm sm:text-xl m-2 sm:m-4">{chamberLight ? "On" : "Off"}</span>
          </div>
          <div
            className="flex bg-gray-800 m-1 sm:m-2 rounded-md h-[15%] items-center hover:bg-gray-700 transition"
            onClick={() => setFanOpen(true)}
          >
            <img src="nonexistant.png" className="h-[100%]" />
            <span className="text-sm sm:text-xl m-2 sm:m-4">{fanPercentage}%</span>
          </div>
        </div>
      </div>

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
              value={nozzleTarget}
              onChange={(e) => setNozzleTarget(Number(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded w-full"
            />
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
              value={bedTarget}
              onChange={(e) => setBedTarget(Number(e.target.value))}
              className="bg-gray-700 text-white p-2 rounded w-full"
            />
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
            <h2 className="text-lg sm:text-xl mb-4 text-white">Skip Objects {objectsSkipped}/{objectsTotal}</h2>
            {/*TODO: READ SKIP OBJECTS DATA ON STARTUP & ADD PICK IMAGE HERE*/}
            <div className="flex flex-col sm:flex-row">
              <img src="nonexistent.png" className="w-full sm:w-[60%] m-1 sm:m-2"/>
              <div className="flex flex-col w-full sm:w-[30%] justify-between">
                <div>
                  <span className="text-sm sm:text-lg m-1 sm:m-2">Skip</span>
                  {/* TODO: [BEGIN] REPLACE REAL DATA */}
                  <div className="flex flex-row">
                    <input type="checkbox"></input>
                    <label className="m-1 sm:m-2 text-sm sm:text-base">something.stl</label>
                  </div>
                  {/* TODO: [END] REPLACE REAL DATA */}
                </div>
                <div className="flex flex-col">
                  <button 
                    className="bg-gray-700 rounded-md hover:bg-gray-600 text-sm sm:text-md m-1 p-2"
                    onClick={() => {
                      //TODO: ADD THE ACTUAL PROCESSING LOGIC
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
                onClick={() => setFanPercentage(v => Math.max(0, v - 10))}
                className="p-2 w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-md flex items-center justify-center"
              >
                -
              </button>
              <div className="flex bg-gray-700 rounded-md flex-1 h-8 sm:h-10 justify-center items-center mx-2">
                <span className="text-sm sm:text-base">{fanPercentage}</span>
              </div>
              <button 
                onClick={() => setFanPercentage(v => Math.min(100, v + 10))}
                className="p-2 w-8 h-8 sm:w-10 sm:h-10 bg-gray-600 rounded-md flex items-center justify-center"
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