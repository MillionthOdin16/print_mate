'use client';
// Simplified version of the printer page for mobile - just shows "Printer: {slug}"
interface PrinterPageClientProps {
  slug: string;
}

export default function PrinterPageClient({ slug }: PrinterPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-1000 p-6">
      <h1 className="text-3xl font-bold text-gray-300">Printer: {slug}</h1>
      <p className="text-gray-400 mt-4">Mobile printer interface coming soon...</p>
      <button 
        onClick={() => window.history.back()}
        className="mt-4 bg-blue-600 hover:bg-blue-500 rounded-sm p-2 text-white"
      >
        Back
      </button>
    </div>
  );
}