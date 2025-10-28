

import React from 'react';
import { SongSection } from '../types';
import { Icon } from './Icon';
import { MetatagEditor } from './MetatagEditor';
import { SkeletonLoader } from './SkeletonLoader';
import { LyricEditor } from './LyricEditor';

interface LyricSectionBlockProps {
  section: SongSection;
  onUpdateContent: (sectionId: string, content: string) => void;
  onRegenerate: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onShowPopup: (
    event: React.MouseEvent,
    section: SongSection,
    selection: string,
    selectionStart: number,
    selectionEnd: number
  ) => void;
  onPlaySection: (sectionId: string) => void;
  isSpeechLoading: boolean;
  isSpeaking: boolean;
  showMetatagEditor: boolean;
  topic: string;
  genre: string;
  mood: string;
}

export const LyricSectionBlock: React.FC<LyricSectionBlockProps> = React.memo(({
  section,
  onUpdateContent,
  onRegenerate,
  onDelete,
  onShowPopup,
  onPlaySection,
  isSpeechLoading,
  isSpeaking,
  showMetatagEditor,
  topic,
  genre,
  mood,
}) => {
  const ariaStatus = section.isLoading
    ? `Regenerating ${section.type}...`
    : isSpeechLoading
    ? `Loading audio for ${section.type}...`
    : '';

  return (
    <div
      id={`section-block-${section.id}`}
      className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex gap-3 group relative"
    >
        <div className="flex-grow">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-300">{section.type}</h3>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onPlaySection(section.id)} title="Play Section" className="text-gray-400 hover:text-purple-400" disabled={isSpeechLoading}>
                      {isSpeechLoading ? <Icon name="loading" className="w-4 h-4 animate-spin" /> : isSpeaking ? <Icon name="stop" className="w-4 h-4" /> : <Icon name="play" className="w-4 h-4" />}
                    </button>
                    <button onClick={() => onRegenerate(section.id)} title="Regenerate Section" className="text-gray-400 hover:text-purple-400">
                        <Icon name="regenerate" className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(section.id)} title="Delete Section" className="text-gray-400 hover:text-red-400">
                        <Icon name="delete" className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {ariaStatus && (
              <span className="sr-only" role="status" aria-live="polite">
                {ariaStatus}
              </span>
            )}

            {section.isLoading ? (
                <SkeletonLoader lines={4} className="py-1" />
            ) : (
                <LyricEditor
                    section={section}
                    onContentChange={(newContent) => onUpdateContent(section.id, newContent)}
                    onShowPopup={onShowPopup}
                />
            )}
            
            {showMetatagEditor && !section.isLoading && (
              <MetatagEditor 
                section={section}
                onUpdateContent={(content) => onUpdateContent(section.id, content)}
                topic={topic}
                genre={genre}
                mood={mood}
              />
            )}
        </div>
    </div>
  );
});
