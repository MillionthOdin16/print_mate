'use client';
import HMSGrid from "./HMSGrid";

interface Props {
  slug: string;
  model: string;
  printerState: any;
}

export default function HMSView({ slug, model, printerState }: Props) {
  return (
    <div className="view" id="settings-page">
      <header className="flex flex-row items-center justify-between">
        <h2 className="text-xl text-white ml-4">HMS</h2>
        <span className="text-xl text-white m-2">{slug}</span>
      </header>
      <HMSGrid name={slug} model={model} printerState={printerState}/>
    </div>
  );
}
