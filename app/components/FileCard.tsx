interface FileCardProps {
  filename: string,
}

export default function PrinterCard({ filename }: FileCardProps) {
  return (
    <div className="bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800">
      <div className="h-32 bg-gray-800 my-4 rounded flex items-center justify-center text-gray-400">
        {filename}
      </div>
    </div>
  );
}