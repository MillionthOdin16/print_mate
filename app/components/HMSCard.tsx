interface HMSCardProps {
  message: String,
  code: String,
}

export default function HMSCard({ message, code }: HMSCardProps) {
  return (
    <div className="flex flex-row bg-gray-800 items-center rounded-md p-2 justify-between">
      <div className="flex flex-row">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="w-6 h-6 text-red-400 mx-2"
        >
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path 
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 8v4M12 16h.01"
          />
        </svg>
        <span className="line-clamp-3">{message}</span>
      </div>
      <span>{code}</span>
    </div>
  );
}