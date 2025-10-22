import React from 'react';

interface SuggestionsModalProps {
  visible: boolean;
  title: string;
  suggestions: string[];
  isLoading: boolean;
  onClose: () => void;
}

export const SuggestionsModal: React.FC<SuggestionsModalProps> = ({
  visible,
  title,
  suggestions,
  isLoading,
  onClose,
}) => {
  if (!visible) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 border border-purple-500 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-purple-300 truncate pr-4">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <p className="text-gray-400 text-center">Thinking...</p>
          ) : suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((word) => (
                <button
                  key={word}
                  onClick={() => handleCopy(word)}
                  title="Click to copy"
                  className="bg-gray-700 text-gray-200 px-3 py-1 rounded-full text-sm hover:bg-purple-600 hover:text-white transition cursor-pointer"
                >
                  {word}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center">No suggestions found.</p>
          )}
        </div>
      </div>
    </div>
  );
};
