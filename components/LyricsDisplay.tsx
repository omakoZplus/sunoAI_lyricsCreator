
import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { Waveform } from './Waveform';
import { WordSmithPopup } from './WordSmithPopup';
import { SuggestionsModal } from './SuggestionsModal';
import { findRhymes, findSynonyms, rephraseLine } from '../services/geminiService';
import { SongSection } from '../types';
import { stringifyLyrics } from '../utils/lyricsParser';
import { LyricSectionBlock } from './LyricSectionBlock';
import { StructureControls } from './StructureControls';

interface LyricsDisplayProps {
  title: string;
  lyrics: SongSection[];
  setLyrics: (lyrics: SongSection[]) => void;
  isLoading: boolean;
  error: string | null;
  onUpdateSectionContent: (sectionId: string, content: string) => void;
  onRegenerateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddSection: (type: string) => void;
  onReorderSections: (startIndex: number, endIndex: number) => void;
  onContinueSong: () => void;
  isContinuing: boolean;
  showMetatagEditor: boolean;
}

type PopupState = {
  visible: boolean;
  x: number;
  y: number;
  selection: string;
  sectionId: string;
  selectionStart: number;
  selectionEnd: number;
};

type ModalState = {
  visible: boolean;
  title: string;
  suggestions: string[];
  isLoading: boolean;
};

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  title,
  lyrics,
  setLyrics,
  isLoading,
  error,
  onUpdateSectionContent,
  onRegenerateSection,
  onDeleteSection,
  onAddSection,
  onReorderSections,
  onContinueSong,
  isContinuing,
  showMetatagEditor,
}) => {
  const [copyText, setCopyText] = useState('Copy');
  const [popup, setPopup] = useState<PopupState>({ visible: false, x: 0, y: 0, selection: '', sectionId: '', selectionStart: 0, selectionEnd: 0 });
  const [modal, setModal] = useState<ModalState>({ visible: false, title: '', suggestions: [], isLoading: false });
  const displayRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleCopy = () => {
    const fullText = `${title}\n\n${stringifyLyrics(lyrics)}`;
    navigator.clipboard.writeText(fullText);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  const handleDownload = () => {
    const fullText = `${title}\n\n${stringifyLyrics(lyrics)}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.download = `${safeTitle || 'lyrics'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const showPopup = (
    event: React.MouseEvent<HTMLTextAreaElement>,
    section: SongSection,
    selection: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    const displayRect = displayRef.current?.getBoundingClientRect();
    const targetRect = (event.target as HTMLElement).getBoundingClientRect();
    if (displayRect) {
        setPopup({
            visible: true,
            x: event.clientX - displayRect.left,
            y: event.clientY - displayRect.top - 20,
            selection: selection,
            sectionId: section.id,
            selectionStart,
            selectionEnd
        });
    }
  };

  const handleAction = async (action: 'rhymes' | 'synonyms' | 'rephrase') => {
    const { selection, selectionStart, selectionEnd, sectionId } = popup;
    const targetSection = lyrics.find(s => s.id === sectionId);
    if (!targetSection) return;

    setPopup(p => ({ ...p, visible: false }));

    if (action === 'rephrase') {
      setModal({ visible: true, title: `Rephrasing "${selection}"...`, suggestions: [], isLoading: true });
      try {
        const rephrased = await rephraseLine(selection);
        const newContent = targetSection.content.substring(0, selectionStart) + rephrased + targetSection.content.substring(selectionEnd);
        onUpdateSectionContent(sectionId, newContent);
      } catch (e) {
        console.error("Error rephrasing line:", e);
      } finally {
        setModal({ visible: false, title: '', suggestions: [], isLoading: false });
      }
      return;
    }

    const wordToAnalyze = selection.split(' ').pop() || '';
    if (!wordToAnalyze) return;

    const actionTitle = action.charAt(0).toUpperCase() + action.slice(1);
    setModal({ visible: true, title: `Finding ${action} for "${wordToAnalyze}"...`, suggestions: [], isLoading: true });
    
    try {
      let results: string[] = [];
      if (action === 'rhymes') {
        results = await findRhymes(wordToAnalyze);
      } else { // 'synonyms'
        results = await findSynonyms(wordToAnalyze);
      }
      setModal({ visible: true, title: `${actionTitle} for "${wordToAnalyze}"`, suggestions: results, isLoading: false });
    } catch (e) {
      console.error(`Error finding ${action}:`, e);
      setModal({ visible: true, title: `Error finding ${action}`, suggestions: [`Could not fetch suggestions.`], isLoading: false });
    }
  };
  
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      onReorderSections(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };
  
  const hasLyrics = lyrics.length > 0;

  return (
    <>
      <div ref={displayRef} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg h-full flex flex-col" style={{ minHeight: '600px' }}>
        <div className="flex-grow p-6 flex flex-col relative overflow-hidden">
          {title && <h2 className="text-2xl font-bold mb-4 text-purple-300 flex-shrink-0">{title}</h2>}
          <div 
            className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2"
            onMouseLeave={() => setPopup(p => ({ ...p, visible: false }))}
          >
            {popup.visible && <WordSmithPopup {...popup} onAction={handleAction} />}
            {lyrics.map((section, index) => (
              <LyricSectionBlock 
                key={section.id} 
                section={section}
                onUpdateContent={onUpdateSectionContent}
                onRegenerate={onRegenerateSection}
                onDelete={onDeleteSection}
                onShowPopup={showPopup}
                showMetatagEditor={showMetatagEditor}
                // Drag and drop props
                index={index}
                onDragStart={(idx) => dragItem.current = idx}
                onDragEnter={(idx) => dragOverItem.current = idx}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center rounded-2xl z-10">
              <Waveform />
              <p className="mt-4 text-lg text-purple-300 animate-pulse">Writing a masterpiece...</p>
            </div>
          )}
          {!isLoading && !hasLyrics && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
              <p className="text-gray-500 text-center">Enter a topic and generate some lyrics!</p>
            </div>
          )}
          {error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                  <p className="text-red-400 text-center">{error}</p>
              </div>
          )}
        </div>

        <div className="p-4 bg-gray-900/50 border-t border-gray-700 rounded-b-2xl flex items-center justify-between space-x-3 flex-shrink-0">
          <StructureControls onAddSection={onAddSection} />
          {hasLyrics && !isLoading && (
            <div className="flex items-center space-x-3">
              <Button onClick={onContinueSong} variant="secondary" disabled={isContinuing}>
                <Icon name="plus" />
                {isContinuing ? 'Continuing...' : 'Continue'}
              </Button>
              <Button onClick={handleCopy} variant="secondary">
                <Icon name="copy" />
                {copyText}
              </Button>
              <Button onClick={handleDownload} variant="secondary">
                <Icon name="download" />
                Download
              </Button>
            </div>
          )}
        </div>
      </div>
      <SuggestionsModal {...modal} onClose={() => setModal({ visible: false, title: '', suggestions: [], isLoading: false })} />
    </>
  );
};
