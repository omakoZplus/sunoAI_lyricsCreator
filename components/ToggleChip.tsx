
import React from 'react';

interface ToggleChipProps {
  text: string;
  isActive: boolean;
  onClick: () => void;
}

export const ToggleChip: React.FC<ToggleChipProps> = ({ text, isActive, onClick }) => {
  const baseClasses = 'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer';
  const activeClasses = 'bg-purple-600 text-white shadow-md';
  const inactiveClasses = 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/70';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {text}
    </button>
  );
};
