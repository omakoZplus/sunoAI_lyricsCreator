
import React from 'react';

interface SuggestionTooltipProps {
  isLoading: boolean;
  suggestions: string[];
  description: string;
  onSelectSuggestion: (suggestion: string) => void;
  error?: string | null;
}

export const SuggestionTooltip: React.FC<SuggestionTooltipProps> = ({ isLoading, suggestions, description, onSelectSuggestion, error }) => {
  return (
    <div className="w-64 p-3 bg-gray-900/90 backdrop-blur-sm border border-purple-500 rounded-lg shadow-lg text-sm">
      <p className="text-gray-400 italic mb-2 font-medium">{description}</p>
      <div className="border-t border-gray-700 pt-2">
        {isLoading && <p className="text-gray-300 text-center">Finding ideas...</p>}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {!isLoading && !error && suggestions.length > 0 && (
          <ul className="space-y-1 max-h-48 overflow-y-auto">
            {suggestions.map(sugg => (
              <li key={sugg}>
                <button 
                  onClick={() => onSelectSuggestion(sugg)}
                  className="w-full text-left text-gray-200 p-1.5 rounded hover:bg-purple-600/50 transition-colors"
                >
                  {sugg}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!isLoading && !error && suggestions.length === 0 && (
          <p className="text-gray-500 text-center">No suggestions found.</p>
        )}
      </div>
    </div>
  );
};
