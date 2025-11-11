
import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { InfoToggle } from './InfoToggle';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  infoText?: string;
  headerControls?: React.ReactNode;
  storageKey?: string;
  id?: string;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, infoText, headerControls, storageKey, id }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (!storageKey) return defaultOpen;
    try {
      const storedValue = localStorage.getItem(storageKey);
      return storedValue ? JSON.parse(storedValue) : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isOpen));
    }
  }, [isOpen, storageKey]);

  return (
    <div id={id} className="border-b border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-left text-base font-medium text-gray-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span>{title}</span>
          {infoText && <InfoToggle text={infoText} />}
        </div>
        <div className="flex items-center gap-2">
            {headerControls}
            <Icon name="chevron" className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-screen opacity-100 pb-4' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
};
