interface FileCardProps {
  filename: string,
  thumbnail: string
}

export default function PrinterCard({ filename, thumbnail }: FileCardProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center bg-gray-900 rounded-lg shadow p-2 sm:p-4 hover:shadow-lg transition hover:bg-gray-800">
      <div className="h-24 w-24 sm:h-32 sm:w-[30%] bg-gray-800 my-2 sm:my-4 rounded flex items-center justify-center text-gray-400 sm:m-8 flex-shrink-0">
        <img src={thumbnail} alt="No Image Found" className="max-h-full max-w-full object-contain"/>
      </div>
      <div className="w-full sm:flex-1 min-w-0 mt-2 sm:mt-0">
        <label className="text-sm sm:text-base text-center sm:text-left block line-clamp-3 break-words overflow-hidden">{filename}</label>
      </div>
    </div>
  );
}