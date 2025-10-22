import React, { useState, useEffect, useRef } from 'react';

interface TagInputProps {
  onAddTag: (tag: string) => boolean;
  allSuggestions: string[];
  existingTags: string[];
}

export const TagInput: React.FC<TagInputProps> = ({ onAddTag, allSuggestions, existingTags }) => {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);
  
  useEffect(() => {
    if (inputValue.length > 1 && isFocused) {
      const suggestions = allSuggestions
        .filter(s => s.toLowerCase().includes(inputValue.toLowerCase()))
        .filter(s => !existingTags.includes(s))
        .slice(0, 5);
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }
    setActiveIndex(-1);
  }, [inputValue, allSuggestions, existingTags, isFocused]);

  const handleAdd = (tag: string) => {
    const success = onAddTag(tag.trim());
    if (success) {
      setInputValue('');
      setFilteredSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex > -1 && filteredSuggestions[activeIndex]) {
        handleAdd(filteredSuggestions[activeIndex]);
      } else if (inputValue.trim()) {
        handleAdd(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Escape') {
        setInputValue('');
        setIsFocused(false);
    }
  };
  
  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        placeholder="Add a custom tag or type to search..."
        className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
      />
       {isFocused && filteredSuggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={`px-3 py-2 text-sm cursor-pointer ${
                index === activeIndex ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-purple-800/50'
              }`}
              onMouseDown={(e) => {
                  e.preventDefault();
                  handleAdd(suggestion);
              }}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
