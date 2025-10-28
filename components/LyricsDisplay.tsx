

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { WordSmithPopup } from './WordSmithPopup';
import { SuggestionsModal } from './SuggestionsModal';
import { SkeletonLoader } from './SkeletonLoader';
import { findRhymes, findSynonyms, generateImageryForLine, getThematicIdeas, generateSpeech } from '../services/geminiService';
import { SongSection } from '../types';
import { stringifyLyrics, stripMetatags, stringifyLyricsOnly } from '../utils/lyricsParser';
import { decode, decodeAudioData } from '../utils/audioUtils';
import { LyricSectionBlock } from './LyricSectionBlock';
import { StructureControls } from './StructureControls';
import { SongStructureVisualizer } from './SongStructureVisualizer';
import { Metronome } from './Metronome';

interface LyricsDisplayProps {
  title: string;
  lyrics: SongSection[];
  sunoPromptTags: string[];
  bpm: string;
  setLyrics: (lyrics: SongSection[]) => void;
  isLoading: boolean;
  error: string | null;
  onUpdateSectionContent: (sectionId: string, content: string) => void;
  onRegenerateSection: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
  onAddSection: (type: string, atIndex?: number) => void;
  onApplyTemplate: (template: string) => void;
  onReorderSections: (startIndex: number, endIndex: number) => void;
  onContinueSong: () => void;
  isContinuing: boolean;
  showMetatagEditor: boolean;
  onClearLyricsAndTitle: () => void;
  topic: string;
  genre: string;
  mood: string;
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

type CopyStatus = 'suno' | 'lyricsOnly' | 'download' | null;

export const LyricsDisplay: React.FC<LyricsDisplayProps> = React.memo(({
  title,
  lyrics,
  sunoPromptTags,
  bpm,
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
  topic,
  genre,
  mood,
}) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>(null);
  const [popup, setPopup] = useState<PopupState>({ visible: false, x: 0, y: 0, selection: '', sectionId: '', selectionStart: 0, selectionEnd: 0 });
  const [modal, setModal] = useState<ModalState>({ visible: false, title: '', suggestions: [], isLoading: false });
  const displayRef = useRef<HTMLDivElement>(null);
  
  const [nowPlaying, setNowPlaying] = useState<{ source: AudioBufferSourceNode, sectionId: string } | null>(null);
  const [isSpeechLoading, setIsSpeechLoading] = useState<string | null>(null); // holds sectionId
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const triggerCopyAnimation = (type: CopyStatus) => {
    setCopyStatus(type);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleSunoCopy = () => {
    const stylePrompt = sunoPromptTags.length > 0 ? `[Style of Music: ${sunoPromptTags.join(', ')}]` : '';
    const lyricsText = stringifyLyrics(lyrics);
    const fullText = `${stylePrompt}\n\n${title ? `${title}\n` : ''}${lyricsText}`.trim();
    navigator.clipboard.writeText(fullText);
    triggerCopyAnimation('suno');
  };

  const handleLyricsOnlyCopy = () => {
    const lyricsOnlyText = stringifyLyricsOnly(lyrics);
    const fullText = `${title ? `${title}\n` : ''}${lyricsOnlyText}`.trim();
    navigator.clipboard.writeText(fullText);
    triggerCopyAnimation('lyricsOnly');
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
    triggerCopyAnimation('download');
  };
  
  const handlePlaySection = useCallback(async (sectionId: string) => {
    if (nowPlaying) {
      nowPlaying.source.stop();
      setNowPlaying(null);
      if (nowPlaying.sectionId === sectionId) return;
    }
    
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
        const errorMessage = err instanceof Error ? err.message : "Could not generate audio preview.";
        alert(errorMessage);
    } finally {
        setIsSpeechLoading(null);
    }
  }, [nowPlaying, lyrics]);

  const showPopup = useCallback((
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
  }, []);

  const handleAction = useCallback(async (action: 'rhymes' | 'synonyms' | 'thematic' | 'imagery') => {
    const { selection } = popup;
    setPopup(p => ({ ...p, visible: false }));

    const wordToAnalyze = selection.trim().split(/\s+/).pop() || '';
    if (!wordToAnalyze && (action === 'rhymes' || action === 'synonyms' || action === 'thematic')) {
      return;
    }

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
      const results = await promise;
      const finalTitle = title.replace('...', `for "${action === 'imagery' ? selection : wordToAnalyze}"`);
      setModal({ visible: true, title: finalTitle, suggestions: results, isLoading: false });
    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
      const errorMessage = err instanceof Error ? err.message : `Could not fetch suggestions.`;
      setModal({ visible: true, title: `Error finding ${action}`, suggestions: [errorMessage], isLoading: false });
    }
  }, [popup]);

  const handleScrollToSection = useCallback((sectionId: string) => {
    const sectionElement = document.getElementById(`section-block-${sectionId}`);
    if (sectionElement) {
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  const hasLyrics = lyrics.length > 0;

  return (
    <>
      <div id="lyrics-display-section" ref={displayRef} className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg h-full flex flex-col" style={{ minHeight: '600px' }}>
        <div 
            className="flex-grow p-6 flex flex-col relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 flex-shrink-0 gap-4">
            <div className="flex-grow">
              {title && <h2 className="text-2xl font-bold text-purple-300">{title}</h2>}
            </div>
            <div className="flex-shrink-0 pt-1">
              <Metronome bpm={bpm} />
            </div>
          </div>
          
          <SongStructureVisualizer 
            sections={lyrics} 
            onReorderSections={onReorderSections}
            onAddSection={onAddSection}
            onScrollToSection={handleScrollToSection}
          />

          <div 
            className="flex-grow space-y-4 overflow-y-auto pr-2 -mr-2"
            onMouseLeave={() => setPopup(p => ({ ...p, visible: false }))}
          >
            {popup.visible && <WordSmithPopup {...popup} onAction={handleAction} />}
            
            {isLoading && <SkeletonLoader lines={12} />}
            
            {lyrics.map((section) => (
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
                topic={topic}
                genre={genre}
                mood={mood}
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
          <StructureControls onApplyTemplate={onApplyTemplate} />
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
              <div className="relative" ref={exportMenuRef}>
                <Button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} variant="secondary">
                  <Icon name="download" />
                  <span>Export</span>
                  <Icon name="chevron" className={`w-4 h-4 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                </Button>
                {isExportMenuOpen && (
                  <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 py-1">
                    <button
                      onClick={() => { handleSunoCopy(); setIsExportMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600/50 flex items-center gap-3 transition-colors"
                    >
                      <Icon name="copy" className="w-4 h-4" />
                      <span>{copyStatus === 'suno' ? 'Copied!' : 'Copy for Suno'}</span>
                    </button>
                    <button
                      onClick={() => { handleLyricsOnlyCopy(); setIsExportMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600/50 flex items-center gap-3 transition-colors"
                    >
                      <Icon name="copy" className="w-4 h-4" />
                      <span>{copyStatus === 'lyricsOnly' ? 'Copied!' : 'Copy Lyrics Only'}</span>
                    </button>
                    <button
                      onClick={() => { handleDownload(); setIsExportMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-purple-600/50 flex items-center gap-3 transition-colors"
                    >
                      <Icon name="download" className="w-4 h-4" />
                      <span>{copyStatus === 'download' ? 'Downloaded!' : 'Download as .txt'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <SuggestionsModal {...modal} onClose={() => setModal({ visible: false, title: '', suggestions: [], isLoading: false })} />
    </>
  );
});
