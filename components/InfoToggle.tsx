import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface InfoToggleProps {
  text: string;
}

export const InfoToggle: React.FC<InfoToggleProps> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative inline-block align-middle" ref={wrapperRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-gray-500 hover:text-gray-300 transition-colors"
        aria-label="More information"
      >
        <Icon name="info" className="w-4 h-4" />
      </button>
      {isOpen && (
        <div 
          className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900/90 backdrop-blur-sm border border-gray-600 rounded-lg shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm text-gray-300 font-normal leading-relaxed">{text}</p>
        </div>
      )}
    </div>
  );
};
