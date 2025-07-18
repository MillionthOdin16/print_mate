'use client';
import FileGrid from "./FileGrid";

interface Props {
  slug: string;
  model: string;
  files: File[];
  setFiles: (files: File[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export default function FilesView({ slug, model, files, setFiles, isLoading, setIsLoading, error, setError }: Props) {
  return (
    <div className="view" id="files-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
        <label className="text-lg sm:text-2xl content-center">Print Files</label>
        <div className="flex content-center justify-center items-center">
          <span className="text-sm sm:text-xl text-white m-1 sm:m-2">{slug}</span>
          <button onClick={() => {window.location.reload()}}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 hover:text-blue-500 transition-colors"
            >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
            </svg>
          </button>
        </div>
      </div>
      <FileGrid printer={slug} model={model} files={files} setFiles={setFiles} isLoading={isLoading} setIsLoading={setIsLoading} error={error} setError={setError}/>
    </div>
  );
}
