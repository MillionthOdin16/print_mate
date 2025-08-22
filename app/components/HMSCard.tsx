interface HMSCardProps {
  message: string,
  code: string,
}

export default function HMSCard({ message, code }: HMSCardProps) {
  return (
    <div className="flex flex-col sm:flex-row bg-gray-800 items-start sm:items-center rounded-md p-2 sm:justify-between gap-2">
      <div className="flex flex-row items-start flex-1 min-w-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-4 h-4 sm:w-6 sm:h-6 text-red-400 mx-1 sm:mx-2 flex-shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path 
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 8v4M12 16h.01"
          />
        </svg>
        <span className="line-clamp-3 text-sm sm:text-base break-words min-w-0 flex-1">{message}</span>
      </div>
      <span className="text-xs sm:text-sm text-gray-400 flex-shrink-0 self-end sm:self-center">{code}</span>
    </div>
  );
}