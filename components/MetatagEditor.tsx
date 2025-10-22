
import React, { useState } from 'react';
import { SongSection } from '../types';
import { extractMetatags, Metatag } from '../utils/lyricsParser';
import { Icon } from './Icon';

interface MetatagEditorProps {
    section: SongSection;
    onUpdateContent: (newContent: string) => void;
}

export const MetatagEditor: React.FC<MetatagEditorProps> = ({ section, onUpdateContent }) => {
    const [editingTag, setEditingTag] = useState<Metatag | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [newTagValue, setNewTagValue] = useState('');

    const metatags = extractMetatags(section.content);

    const handleEditClick = (tag: Metatag) => {
        setEditingTag(tag);
        setEditingValue(tag.content);
    };

    const handleSaveEdit = () => {
        if (!editingTag) return;
        const newFullTag = `[${editingValue}]`;
        const newSectionContent = 
            section.content.substring(0, editingTag.startIndex) + 
            newFullTag + 
            section.content.substring(editingTag.endIndex);
        
        onUpdateContent(newSectionContent);
        setEditingTag(null);
        setEditingValue('');
    };

    const handleRemove = (tagToRemove: Metatag) => {
        let startIndex = tagToRemove.startIndex;
        let endIndex = tagToRemove.endIndex;
        
        // If tag is on its own line, remove the line
        const prevChar = section.content[startIndex - 1];
        const nextChar = section.content[endIndex];
        if ((prevChar === '\n' || startIndex === 0) && nextChar === '\n') {
            endIndex++;
        }

        const newSectionContent = 
            section.content.substring(0, startIndex) + 
            section.content.substring(endIndex);

        onUpdateContent(newSectionContent.trim());
    };
    
    const handleAddTag = () => {
        if (!newTagValue.trim()) return;
        const newFullTag = `[${newTagValue.trim()}]\n`;
        onUpdateContent(newFullTag + section.content);
        setNewTagValue('');
    };


    return (
        <div className="mt-4 pt-3 border-t border-gray-700/50">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Metatag Inspector</h4>
            <div className="flex flex-wrap gap-2">
                {metatags.map((tag, i) => (
                    <div key={`${tag.startIndex}-${i}`} className="flex items-center bg-purple-500/20 text-purple-200 text-sm font-medium pl-2.5 pr-1 py-1 rounded-full">
                       {editingTag?.startIndex === tag.startIndex ? (
                           <input 
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleSaveEdit}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                autoFocus
                                className="bg-transparent focus:outline-none w-32"
                           />
                       ) : (
                        <span onClick={() => handleEditClick(tag)} className="cursor-pointer hover:opacity-80">{tag.content}</span>
                       )}
                        <button
                            onClick={() => handleRemove(tag)}
                            className="ml-2 flex-shrink-0 text-purple-300 hover:text-white hover:bg-purple-500/40 rounded-full focus:outline-none p-0.5"
                            aria-label={`Remove ${tag.content}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
                <input 
                    type="text"
                    value={newTagValue}
                    onChange={(e) => setNewTagValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="e.g., Energy: High"
                    className="flex-grow bg-gray-800 border border-gray-600 rounded-md px-2 py-1 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
                />
                <button onClick={handleAddTag} className="p-1.5 bg-gray-700/50 text-gray-200 rounded-md hover:bg-gray-600/70 transition-colors">
                    <Icon name="plus" className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
