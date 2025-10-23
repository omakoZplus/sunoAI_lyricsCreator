import React, { useRef, useEffect } from 'react';
import { SongSection } from '../types';
import { Icon } from './Icon';
import { MetatagEditor } from './MetatagEditor';
import { SkeletonLoader } from './SkeletonLoader';

interface LyricSectionBlockProps {
  section: SongSection;
  index: number;
  onUpdateContent: (sectionId: string, content: string) => void;
  onRegenerate: (sectionId: string) => void;
  onDelete: (sectionId: string) => void;
  onShowPopup: (
    event: React.MouseEvent<HTMLTextAreaElement>,
    section: SongSection,
    selection: string,
    selectionStart: number,
    selectionEnd: number
  ) => void;
  onPlaySection: (sectionId: string) => void;
  isSpeechLoading: boolean;
  isSpeaking: boolean;
  showMetatagEditor: boolean;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
}

export const LyricSectionBlock: React.FC<LyricSectionBlockProps> = ({
  section,
  index,
  onUpdateContent,
  onRegenerate,
  onDelete,
  onShowPopup,
  onPlaySection,
  isSpeechLoading,
  isSpeaking,
  showMetatagEditor,
  onDragStart,
  onDragEnter,
  onDragEnd
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [section.content]);

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      onShowPopup(e, section, selection, textarea.selectionStart, textarea.selectionEnd);
    }
  };

  return (
    <div
      className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 flex gap-3 group relative"
      draggable
      onDragStart={() => onDragStart(index)}
      onDragEnter={() => onDragEnter(index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
        <div className="text-gray-500 cursor-grab pt-1">
            <Icon name="drag" className="w-5 h-5" />
        </div>
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

            {section.isLoading ? (
                <SkeletonLoader lines={4} className="py-1" />
            ) : (
                <textarea
                    ref={textareaRef}
                    value={section.content}
                    onChange={(e) => onUpdateContent(section.id, e.target.value)}
                    onMouseUp={handleMouseUp}
                    placeholder={`Lyrics for ${section.type}...`}
                    className="w-full bg-transparent text-gray-200 resize-none focus:outline-none placeholder-gray-500 text-base leading-relaxed overflow-hidden"
                    rows={1}
                />
            )}
            
            {showMetatagEditor && !section.isLoading && (
              <MetatagEditor 
                section={section}
                onUpdateContent={(content) => onUpdateContent(section.id, content)}
              />
            )}
        </div>
    </div>
  );
};
