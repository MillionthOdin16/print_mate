interface FileCardProps {
  filename: string,
  thumbnail: string
}

export default function PrinterCard({ filename, thumbnail }: FileCardProps) {
  return (
    <div className="flex flex-row items-center bg-gray-900 rounded-lg shadow p-4 hover:shadow-lg transition hover:bg-gray-800">
      <div className="h-32 w-[20%] bg-gray-800 my-4 rounded flex items-center justify-center text-gray-400 m-8">
        <img src={thumbnail} alt="No Image Found"/>
      </div>
      <label className="max-w-[70%] line-clamp-1">{filename}</label>
    </div>
  );
}