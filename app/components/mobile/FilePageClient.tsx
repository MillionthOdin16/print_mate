'use client';
// Simplified version of the file page for mobile - just shows "File: {file} for Printer: {slug}"
interface FilePageClientProps {
  slug: string;
  file: string;
}

export default function FilePageClient({ slug, file }: FilePageClientProps) {
  return (
    <div className="min-h-screen bg-gray-1000 mobile-safe-area">
      <div className="px-6">
        <div className="mobile-header-safe pb-6">
          <h1 className="text-3xl font-bold text-gray-300">File: {file}</h1>
          <p className="text-gray-400">Printer: {slug}</p>
        </div>
        <p className="text-gray-400 mt-4">Mobile file interface coming soon...</p>
        <button 
          onClick={() => window.history.back()}
          className="mt-4 bg-blue-600 hover:bg-blue-500 rounded-sm p-2 text-white"
        >
          Back
        </button>
      </div>
    </div>
  );
}