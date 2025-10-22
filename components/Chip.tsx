
import React from 'react';

interface ChipProps {
  text: string;
  onRemove: () => void;
}

export const Chip: React.FC<ChipProps> = ({ text, onRemove }) => {
  return (
    <div className="flex items-center bg-purple-500/20 text-purple-200 text-sm font-medium px-2.5 py-1 rounded-full">
      <span>{text}</span>
      <button
        onClick={onRemove}
        className="ml-2 -mr-1 flex-shrink-0 text-purple-300 hover:text-white hover:bg-purple-500/40 rounded-full focus:outline-none"
        aria-label={`Remove ${text}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};
