interface FileCardProps {
  filename: string,
}

export default function PrinterCard({ filename }: FileCardProps) {
  return (
    <div className="flex flex-row items-center bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800">
      <label className="line-clamp-1">{filename}</label>
    </div>
  );
}