

import React, { useState, useRef, useEffect } from 'react';
import { SongSection } from '../types';
import { Icon } from './Icon';
import { stripMetatags } from '../utils/lyricsParser';

interface SongStructureVisualizerProps {
  sections: SongSection[];
  onReorderSections: (startIndex: number, endIndex: number) => void;
  onAddSection: (type: string, atIndex: number) => void;
  onScrollToSection: (sectionId: string) => void;
}

const getSectionColor = (type: string): string => {
    const baseType = type.toLowerCase().replace(/ \d+$/, '').trim();
    if (baseType.includes('verse')) return 'border-blue-500 bg-blue-900/50 text-blue-300 hover:bg-blue-800/50';
    if (baseType.includes('chorus')) return 'border-purple-500 bg-purple-900/50 text-purple-300 hover:bg-purple-800/50';
    if (baseType.includes('bridge')) return 'border-emerald-500 bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/50';
    if (baseType.includes('intro') || baseType.includes('outro')) return 'border-gray-500 bg-gray-700/50 text-gray-300 hover:bg-gray-600/50';
    if (baseType.includes('solo') || baseType.includes('instrumental')) return 'border-amber-500 bg-amber-900/50 text-amber-300 hover:bg-amber-800/50';
    return 'border-cyan-500 bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800/50';
};

const AddSectionButton: React.FC<{ onAdd: (type: string) => void }> = ({ onAdd }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const SECTIONS = ["Verse", "Pre-Chorus", "Chorus", "Bridge", "Guitar Solo", "Outro"];

    return (
        <div className="relative flex-shrink-0" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-24 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
                title="Add a new section"
            >
                <Icon name="plus" className="w-6 h-6" />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-0 left-full ml-2 w-40 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1">
                    {SECTIONS.map(type => (
                        <button
                            key={type}
                            onClick={() => { onAdd(type); setIsOpen(false); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-200 hover:bg-purple-600/50"
                        >
                            Add {type}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const SectionCard: React.FC<{
  section: SongSection;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  isDragged: boolean;
}> = ({ section, onDragStart, onDragEnter, onDragEnd, onClick, isDragged }) => {
    const firstLines = stripMetatags(section.content).split('\n').slice(0, 2).join('\n');

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            onDragEnd={onDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onClick={onClick}
            className={`w-40 h-24 flex-shrink-0 p-2 border rounded-lg flex flex-col cursor-pointer transition-all duration-200 ${getSectionColor(section.type)} ${isDragged ? 'opacity-30' : 'opacity-100'}`}
        >
            <h4 className="font-bold text-sm truncate">{section.type}</h4>
            <p className="text-xs text-gray-400 mt-1 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {firstLines || <span className="italic">No lyrics yet...</span>}
            </p>
        </div>
    );
};

export const SongStructureVisualizer: React.FC<SongStructureVisualizerProps> = ({ sections, onReorderSections, onAddSection, onScrollToSection }) => {
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
        if (dragItem.current !== null && dragItem.current !== index) {
            onReorderSections(dragItem.current, index);
            dragItem.current = index;
        }
    };

    const handleDragEnd = () => {
        dragItem.current = null;
        dragOverItem.current = null;
    };

    if (sections.length === 0) {
        return null;
    }

    return (
        <div className="mb-4 -mx-2 px-2">
            <div className="p-2 bg-gray-900/50 rounded-lg overflow-x-auto">
                <div className="flex items-center gap-2">
                    <AddSectionButton onAdd={(type) => onAddSection(type, 0)} />
                    {sections.map((section, index) => (
                        <React.Fragment key={section.id}>
                            <SectionCard
                                section={section}
                                onDragStart={() => handleDragStart(index)}
                                onDragEnter={() => handleDragEnter(index)}
                                onDragEnd={handleDragEnd}
                                onClick={() => onScrollToSection(section.id)}
                                isDragged={dragItem.current === index}
                            />
                            <AddSectionButton onAdd={(type) => onAddSection(type, index + 1)} />
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};
