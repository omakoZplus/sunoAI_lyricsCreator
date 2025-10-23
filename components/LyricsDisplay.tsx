import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { WordSmithPopup } from './WordSmithPopup';
import { SuggestionsModal } from './SuggestionsModal';
import { SkeletonLoader } from './SkeletonLoader';
import { findRhymes, findSynonyms, generateImageryForLine, getThematicIdeas, generateSpeech } from '../services/geminiService';
import { SongSection } from '../types';
import { stringifyLyrics, stripMetatags } from '../utils/lyricsParser';
import { decode, decodeAudioData } from '../utils/audioUtils';
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
  onApplyTemplate: (template: string) => void;
  onReorderSections: (startIndex: number, endIndex: number) => void;
  onContinueSong: () => void;
  isContinuing: boolean;
  showMetatagEditor: boolean;
  onClearLyricsAndTitle: () => void;
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
  onApplyTemplate,
  onReorderSections,
  onContinueSong,
  isContinuing,
  showMetatagEditor,
  onClearLyricsAndTitle,
}) => {
  const [copyText, setCopyText] = useState('Copy');
  const [popup, setPopup] = useState<PopupState>({ visible: false, x: 0, y: 0, selection: '', sectionId: '', selectionStart: 0, selectionEnd: 0 });
  const [modal, setModal] = useState<ModalState>({ visible: false, title: '', suggestions: [], isLoading: false });
  const displayRef = useRef<HTMLDivElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  
  const [nowPlaying, setNowPlaying] = useState<{ source: AudioBufferSourceNode, sectionId: string } | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState<string | null>(null); // holds sectionId
  const audioCtxRef = useRef<AudioContext | null>(null);

  const handleCopy = () => {
    const fullText = stringifyLyrics(lyrics);
    navigator.clipboard.writeText(fullText);
    setCopyText('Copied!');
    setTimeout(() => setCopyText('Copy'), 2000);
  };

  const handleDownload = () => {
    const fullText = stringifyLyrics(lyrics);
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
  
  const handlePlaySection = async (sectionId: string) => {
    // Stop any currently playing audio
    if (nowPlaying) {
      nowPlaying.source.stop();
      setNowPlaying(null);
      // If the clicked section was the one playing, we just stop it.
      if (nowPlaying.sectionId === sectionId) {
        return;
      }
    }
    
    // Initialize AudioContext on first use
    if (!audioCtxRef.current) {
        try {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.", e);
            alert("Sorry, the audio preview feature is not supported in your browser.");
            return;
        }
    }
    const audioCtx = audioCtxRef.current;

    const section = lyrics.find(s => s.id === sectionId);
    if (!section) return;

    const textToSpeak = stripMetatags(section.content);
    if (!textToSpeak) {
        alert("This section has no lyrics to read.");
        return;
    }

    setIsSpeechLoading(sectionId);
    try {
        const base64Audio = await generateSpeech(textToSpeak);
        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);

        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        
        source.onended = () => {
            setNowPlaying(null);
        };
        
        source.start();
        setNowPlaying({ source, sectionId });

    } catch (err) {
        console.error("Failed to play audio:", err);
        alert("Could not generate audio preview. Please try again.");
    } finally {
        setIsSpeechLoading(null);
    }
  };

  const showPopup = (
    event: React.MouseEvent,
    section: SongSection,
    selection: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    const displayRect = displayRef.current?.getBoundingClientRect();
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

  const handleAction = async (action: 'rhymes' | 'synonyms' | 'thematic' | 'imagery') => {
    const { selection } = popup;
    setPopup(p => ({ ...p, visible: false }));

    const wordToAnalyze = selection.trim().split(/\s+/).pop() || '';
    if (!wordToAnalyze && (action === 'rhymes' || action === 'synonyms' || action === 'thematic')) {
      return;
    }

    let results: string[] = [];
    let title = '';
    let promise: Promise<string[]>;

    switch(action) {
      case 'rhymes':
        title = `Finding rhymes for "${wordToAnalyze}"...`;
        promise = findRhymes(wordToAnalyze);
        break;
      case 'synonyms':
        title = `Finding synonyms for "${wordToAnalyze}"...`;
        promise = findSynonyms(wordToAnalyze);
        break;
      case 'thematic':
        title = `Thematic ideas for "${wordToAnalyze}"...`;
        promise = getThematicIdeas(wordToAnalyze);
        break;
      case 'imagery':
        title = `Generating imagery for "${selection}"...`;
        promise = generateImageryForLine(selection);
        break;
      default:
        return;
    }

    setModal({ visible: true, title, suggestions: [], isLoading: true });
    
    try {
      results = await promise;
      const finalTitle = title.replace('...', `for "${action === 'imagery' ? selection : wordToAnalyze}"`);
      setModal({ visible: true, title: finalTitle, suggestions: results, isLoading: false });
    } catch (e) {
      console.error(`Error performing action ${action}:`, e);
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
            
            {isLoading && <SkeletonLoader lines={12} />}
            
            {lyrics.map((section, index) => (
              <LyricSectionBlock 
                key={section.id} 
                section={section}
                onUpdateContent={onUpdateSectionContent}
                onRegenerate={onRegenerateSection}
                onDelete={onDeleteSection}
                onShowPopup={showPopup}
                onPlaySection={handlePlaySection}
                isSpeechLoading={isSpeechLoading === section.id}
                isSpeaking={nowPlaying?.sectionId === section.id}
                showMetatagEditor={showMetatagEditor}
                // Drag and drop props
                index={index}
                onDragStart={(idx) => dragItem.current = idx}
                onDragEnter={(idx) => dragOverItem.current = idx}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>

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
          <StructureControls onAddSection={onAddSection} onApplyTemplate={onApplyTemplate} />
          {hasLyrics && !isLoading && (
            <div className="flex items-center space-x-3">
              <Button onClick={onClearLyricsAndTitle} variant="secondary" className="!bg-rose-500/20 hover:!bg-rose-500/40 text-rose-200" title="Clear Title & Lyrics">
                  <Icon name="delete" />
                  Clear
              </Button>
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