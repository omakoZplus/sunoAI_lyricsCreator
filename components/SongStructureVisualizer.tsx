
import React from 'react';
import { SongSection } from '../types';
import { Icon } from './Icon';

interface SongStructureVisualizerProps {
  sections: SongSection[];
}

export const SongStructureVisualizer: React.FC<SongStructureVisualizerProps> = ({ sections }) => {
  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 -mx-2 px-2">
        <div className="p-2 bg-gray-900/50 rounded-lg overflow-x-auto">
            <div className="flex items-center gap-2 text-xs text-gray-400 whitespace-nowrap">
                {sections.map((section, index) => (
                <React.Fragment key={section.id}>
                    <span className="px-2 py-1 bg-gray-700/80 rounded-md font-medium">{section.type}</span>
                    {index < sections.length - 1 && (
                    <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    )}
                </React.Fragment>
                ))}
            </div>
        </div>
    </div>
  );
};
