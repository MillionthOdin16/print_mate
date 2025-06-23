import PrinterGrid from './components/PrinterGrid';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-1000 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-300 mb-2">Printers</h1>
        <PrinterGrid />
      </div>
    </main>
  );
}
