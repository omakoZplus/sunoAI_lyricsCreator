import React, { useState, useRef, useCallback } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { Waveform } from './Waveform';
import { WordSmithPopup } from './WordSmithPopup';
import { SuggestionsModal } from './SuggestionsModal';
import { findRhymes, findSynonyms, rephraseLine } from '../services/geminiService';

interface LyricsDisplayProps {
  title: string;
  lyrics: string;
  setLyrics: (lyrics: string) => void;
  isLoading: boolean;
  onRegenerate: () => void;
  error: string | null;
}

type PopupState = {
  visible: boolean;
  x: number;
  y: number;
  selection: string;
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
  onRegenerate,
  error,
}) => {
  const [copyText, setCopyText] = useState('Copy');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [popup, setPopup] = useState<PopupState>({ visible: false, x: 0, y: 0, selection: '', selectionStart: 0, selectionEnd: 0 });
  const [modal, setModal] = useState<ModalState>({ visible: false, title: '', suggestions: [], isLoading: false });

  const handleCopy = () => {
    const fullText = `${title}\n\n${lyrics}`;
    navigator.clipboard.writeText(fullText);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  const handleDownload = () => {
    const fullText = `${title}\n\n${lyrics}`;
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

  const handleMouseUp = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    const textarea = textareaRef.current;
  
    if (selectedText && selection && textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const textareaRect = textarea.getBoundingClientRect();
  
      setPopup({
        visible: true,
        x: rect.left - textareaRect.left + rect.width / 2,
        y: rect.top - textareaRect.top - 10,
        selection: selectedText,
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
      });
    } else {
      setPopup({ visible: false, x: 0, y: 0, selection: '', selectionStart: 0, selectionEnd: 0 });
    }
  };

  const handleAction = async (action: 'rhymes' | 'synonyms' | 'rephrase') => {
    const { selection, selectionStart, selectionEnd } = popup;
    setPopup(p => ({ ...p, visible: false }));

    if (action === 'rephrase') {
      setModal({ visible: true, title: `Rephrasing "${selection}"...`, suggestions: [], isLoading: true });
      try {
        const rephrased = await rephraseLine(selection);
        const newLyrics = lyrics.substring(0, selectionStart) + rephrased + lyrics.substring(selectionEnd);
        setLyrics(newLyrics);
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
      setModal({ 
        visible: true, 
        title: `Error finding ${action}`, 
        suggestions: [`Could not fetch suggestions for "${wordToAnalyze}".`], 
        isLoading: false 
      });
    }
  };

  const hasLyrics = lyrics.length > 0;

  return (
    <>
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg h-full flex flex-col" style={{ minHeight: '500px' }}>
        <div className="flex-grow p-6 flex flex-col relative">
          {title && (
              <h2 className="text-2xl font-bold mb-4 text-purple-300 flex-shrink-0">{title}</h2>
          )}
          <div className="flex-grow relative">
              {popup.visible && <WordSmithPopup {...popup} onAction={handleAction} />}
              <textarea
                ref={textareaRef}
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                onMouseUp={handleMouseUp}
                onBlur={() => setTimeout(() => setPopup(p => ({ ...p, visible: false })), 200)}
                onScroll={() => setPopup(p => ({ ...p, visible: false }))}
                placeholder="Your generated lyrics will appear here..."
                className="absolute inset-0 w-full h-full bg-transparent text-gray-200 resize-none focus:outline-none placeholder-gray-500 text-base leading-relaxed"
              />
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center rounded-2xl">
              <Waveform />
              <p className="mt-4 text-lg text-purple-300 animate-pulse">Writing a masterpiece...</p>
            </div>
          )}
          {!isLoading && !hasLyrics && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
              <p className="text-gray-500 text-center">
                  {title ? '' : 'Enter a topic and generate some lyrics!'}
              </p>
            </div>
          )}
          {error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-6">
                  <p className="text-red-400 text-center">{error}</p>
              </div>
          )}
        </div>

        {hasLyrics && !isLoading && (
          <div className="p-4 bg-gray-900/50 border-t border-gray-700 rounded-b-2xl flex items-center justify-end space-x-3 flex-shrink-0">
            <Button onClick={onRegenerate} variant="secondary" disabled={isLoading}>
              <Icon name="regenerate" />
              Regenerate
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
      <SuggestionsModal {...modal} onClose={() => setModal({ visible: false, title: '', suggestions: [], isLoading: false })} />
    </>
  );
};
