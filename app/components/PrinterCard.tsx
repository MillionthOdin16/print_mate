import { getPrinters } from "@/lib/printers";
import CameraCard from "./CameraCard";
import '@/data/printers.json'
import { useEffect } from "react";

interface PrinterCardProps {
  name: string;
  model: string;
  ip: string;
  password: string;
  status: string;
}

export default function PrinterCard({ name, model, ip, password, status }: PrinterCardProps) {  
  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800">
      <div>
        <span className="text-lg font-semibold text-gray-300">{name} </span>
        ·
        <span className="text-sm font-bold text-gray-300"> {model}</span>
      </div>
      <span className={status === 'Printing' ? 'text-green-600' : 'text-gray-300'}>
        {status}
      </span>
      <div className="bg-gray-800 my-4 rounded">
        <CameraCard slug={name} ip={ip} password={password} model={model}/>
      </div>
    </div>
  );
}