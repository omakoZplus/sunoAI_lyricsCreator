

import React from 'react';
import { SONG_STRUCTURES } from '../constants';

interface StructureControlsProps {
    onApplyTemplate: (template: string) => void;
}

export const StructureControls: React.FC<StructureControlsProps> = ({ onApplyTemplate }) => {
    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const template = e.target.value;
        if (template) {
            onApplyTemplate(template);
            e.target.value = ''; // Reset dropdown after selection
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <select
                onChange={handleTemplateChange}
                className="bg-gray-700/50 text-gray-200 text-sm font-semibold rounded-md hover:bg-gray-600/70 transition-colors px-2.5 py-2 appearance-none focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.2rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '1.8rem',
                }}
                defaultValue=""
                title="Apply a song structure template"
            >
                {SONG_STRUCTURES.map(s => (
                    <option key={s.name} value={s.template} disabled={s.template === ''}>{s.name}</option>
                ))}
            </select>
        </div>
    );
};
