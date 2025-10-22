import React from 'react';

interface WordSmithPopupProps {
  x: number;
  y: number;
  onAction: (action: 'rhymes' | 'synonyms' | 'rephrase') => void;
}

export const WordSmithPopup: React.FC<WordSmithPopupProps> = ({ x, y, onAction }) => {
  return (
    <div
      className="absolute z-10 bg-gray-900 border border-purple-500 rounded-lg shadow-xl flex items-center divide-x divide-gray-700"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translateX(-50%) translateY(-100%)',
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevents textarea from losing focus
    >
      <button
        onClick={() => onAction('rhymes')}
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-purple-600/50 rounded-l-md transition-colors"
      >
        Rhymes
      </button>
      <button
        onClick={() => onAction('synonyms')}
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-purple-600/50 transition-colors"
      >
        Synonyms
      </button>
      <button
        onClick={() => onAction('rephrase')}
        className="px-3 py-1.5 text-sm text-gray-200 hover:bg-purple-600/50 rounded-r-md transition-colors"
      >
        Rephrase Line
      </button>
    </div>
  );
};
