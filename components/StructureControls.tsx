import React from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface StructureControlsProps {
    onAddSection: (type: string) => void;
}

const SECTIONS = ["Intro", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Guitar Solo", "Outro"];

export const StructureControls: React.FC<StructureControlsProps> = ({ onAddSection }) => {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-400 mr-2">Add Section:</span>
            {SECTIONS.map(section => (
                <button
                    key={section}
                    onClick={() => onAddSection(section)}
                    className="px-2.5 py-1 bg-gray-700/50 text-gray-200 text-xs font-semibold rounded-md hover:bg-gray-600/70 transition-colors"
                >
                   + {section}
                </button>
            ))}
        </div>
    );
};
