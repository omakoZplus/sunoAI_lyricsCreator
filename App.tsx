

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { SongDNA } from './components/SongDNA';
import { StyleEditor } from './components/StyleEditor';
import { LyricsDisplay } from './components/LyricsDisplay';
import { generateLyricsStream, regenerateSectionStream, generateSunoPrompt, continueSongStream, generateSongStarterKit, improveTopic } from './services/geminiService';
import { GENRES, MOODS, LYRICAL_STYLES, MOOD_COLORS } from './constants';
import { SongSection } from './types';
import { parseLyrics, stringifyLyrics, getNextSectionName } from './utils/lyricsParser';
import { Tour } from './components/Tour';
import { Icon } from './components/Icon';


const defaultExcludeTags = [
  'bad quality', 'out of tune', 'noisy', 'low fidelity', 'amateur', 'abrupt ending', 'static', 'distortion', 'mumbling', 'gibberish vocals', 'excessive reverb', 'clashing elements', 'generic', 'uninspired', 'robotic', 'artificial sound', 'metallic', 'harsh', 'shrill', 'muddy mix', 'undefined', 'chaotic', 'disjointed', 'monotone', 'repetitive', 'boring', 'flat', 'lifeless', 'thin', 'hollow', 'overproduced', 'under-produced'
];

type MobileTab = 'dna' | 'style' | 'lyrics';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [mood, setMood] = useState<string>(MOODS[0]);
  const [lyricalStyle, setLyricalStyle] = useState<string>('None');
  const [countryVibe, setCountryVibe] = useState<string>('None');
  const [language, setLanguage] = useState<string>('English');
  const [voiceStyle, setVoiceStyle] = useState<string>('');
  const [bpm, setBpm] = useState<string>('');
  const [lyrics, setLyrics] = useState<SongSection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [artists, setArtists] = useState<string>('');
  const [sunoPromptTags, setSunoPromptTags] = useState<string[]>([]);
  const [previousSunoPromptTags, setPreviousSunoPromptTags] = useState<string[] | null>(null);
  const [sunoExcludeTags, setSunoExcludeTags] = useState<string[]>(defaultExcludeTags);
  const [isPromptLoading, setIsPromptLoading] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const [isContinuing, setIsContinuing] = useState<boolean>(false);
  const [showMetatagEditor, setShowMetatagEditor] = useState<boolean>(false);
  const [isSurprisingMe, setIsSurprisingMe] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [previousTopic, setPreviousTopic] = useState<string | null>(null);
  
  const [bgStyle, setBgStyle] = useState({});
  const [isPulsing, setIsPulsing] = useState(false);
  const [ariaLiveStatus, setAriaLiveStatus] = useState('');
  const [activeTab, setActiveTab] = useState<MobileTab>('dna');

  const SAVED_STATE_KEY = 'sunoLyricsCreatorState_v2';
  const TOUR_COMPLETED_KEY = 'sunoLyricsCreatorTourCompleted_v1';
  const [isTourActive, setIsTourActive] = useState(false);

  // Load state from localStorage on initial render
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
        setIsTourActive(true);
    }

    const savedStateRaw = localStorage.getItem(SAVED_STATE_KEY);
    if (savedStateRaw) {
      try {
        const savedState = JSON.parse(savedStateRaw);
        setTopic(savedState.topic || '');
        setTitle(savedState.title || '');
        setIsInstrumental(savedState.isInstrumental || false);
        setGenre(savedState.genre || GENRES[0]);
        setMood(savedState.mood || MOODS[0]);
        setLyricalStyle(savedState.lyricalStyle || 'None');
        setCountryVibe(savedState.countryVibe || 'None');
        setLanguage(savedState.language || 'English');
        setVoiceStyle(savedState.voiceStyle || '');
        setBpm(savedState.bpm || '');
        setLyrics(savedState.lyrics || []);
        setArtists(savedState.artists || '');
        setSunoPromptTags(savedState.sunoPromptTags || []);
        setSunoExcludeTags(savedState.sunoExcludeTags || defaultExcludeTags);
        setShowMetatagEditor(savedState.showMetatagEditor || false);
        setPreviousTopic(savedState.previousTopic || null);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        localStorage.removeItem(SAVED_STATE_KEY);
      }
    }
  }, []);

  const handleTourComplete = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setIsTourActive(false);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      topic, title, isInstrumental, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, bpm, lyrics, artists, sunoPromptTags, sunoExcludeTags, showMetatagEditor, previousTopic
    };
    localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(stateToSave));
  }, [topic, title, isInstrumental, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, bpm, lyrics, artists, sunoPromptTags, sunoExcludeTags, showMetatagEditor, previousTopic]);
  
  // Effect for dynamic background based on mood
  useEffect(() => {
    const colors = MOOD_COLORS[mood] || MOOD_COLORS['None'];
    setBgStyle({
        backgroundImage: `linear-gradient(to bottom right, ${colors.from}, ${colors.via}, ${colors.to})`,
    });
    setIsPulsing(mood === 'Energetic');
  }, [mood]);

  // Effect for ARIA live region status updates
  useEffect(() => {
    let status = '';
    if (isLoading) {
      status = isInstrumental ? 'Generating instrumental track, please wait.' : 'Generating lyrics, please wait.';
    } else if (isContinuing) {
      status = 'Continuing song, please wait.';
    } else if (isPromptLoading) {
      status = 'Generating style suggestions, please wait.';
    } else if (isSurprisingMe) {
      status = 'Generating a surprise song starter kit, please wait.';
    } else if (isImproving) {
      status = 'Improving your song topic, please wait.';
    }
    setAriaLiveStatus(status);
  }, [isLoading, isContinuing, isPromptLoading, isSurprisingMe, isImproving, isInstrumental]);

  const handleInstrumentalChange = useCallback((enabled: boolean) => {
    setIsInstrumental(enabled);
    if (enabled) {
      setLanguage('No Language');
      setSunoPromptTags(currentTags => {
        const newTags = currentTags.filter(t => t.toLowerCase() !== 'instrumental');
        return ['instrumental', ...newTags];
      });
    } else {
      setLanguage(currentLanguage => currentLanguage === 'No Language' ? 'English' : currentLanguage);
      setSunoPromptTags(currentTags => currentTags.filter(tag => tag.toLowerCase() !== 'instrumental'));
    }
  }, []);

  // Effect to handle the [Instrumental] tag in the artist input
  useEffect(() => {
    const instrumentalTagRegex = /\[instrumental\]/i;
    if (instrumentalTagRegex.test(artists)) {
      setArtists(artists.replace(instrumentalTagRegex, '').trim());
      if (!isInstrumental) {
        handleInstrumentalChange(true);
      }
    }
  }, [artists, isInstrumental, handleInstrumentalChange]);

  const handleClearSession = useCallback(() => {
    localStorage.removeItem(SAVED_STATE_KEY);
    setTopic('');
    setTitle('');
    setIsInstrumental(false);
    setGenre(GENRES[0]);
    setMood(MOODS[0]);
    setLyricalStyle('None');
    setCountryVibe('None');
    setLanguage('English');
    setVoiceStyle('');
    setBpm('');
    setLyrics([]);
    setError(null);
    setArtists('');
    setSunoPromptTags([]);
    setSunoExcludeTags(defaultExcludeTags);
    setPromptError(null);
    setPreviousSunoPromptTags(null);
    setPreviousTopic(null);
  }, []);

  const handleSurpriseMe = useCallback(async () => {
    setIsSurprisingMe(true);
    setError(null);
    setPreviousTopic(null);
    try {
      const starterKit = await generateSongStarterKit();
      setTopic(starterKit.topic);
      setTitle(starterKit.title);
      setGenre(starterKit.genre);
      setMood(starterKit.mood);
      setSunoPromptTags(starterKit.styleTags);
      setPreviousSunoPromptTags(null);
      if (window.innerWidth < 768) {
          setActiveTab('dna');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not generate a surprise song starter. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsSurprisingMe(false);
    }
  }, []);

  const handleImproveTopic = useCallback(async () => {
    if (!topic.trim()) return;
    setIsImproving(true);
    setPreviousTopic(topic);
    setError(null);
    try {
        const improved = await improveTopic(topic);
        setTopic(improved);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Could not improve topic.";
        setError(errorMessage);
        setPreviousTopic(null);
    } finally {
        setIsImproving(false);
    }
  }, [topic]);

  const handleUndoTopicImprovement = useCallback(() => {
    if (previousTopic !== null) {
        setTopic(previousTopic);
        setPreviousTopic(null);
    }
  }, [previousTopic]);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your song.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLyrics([]);
    setTitle('');
    setPreviousTopic(null);
    
    if (window.innerWidth < 768) {
        setActiveTab('lyrics');
    }

    try {
      let finalStyleTags = sunoPromptTags;
      if (finalStyleTags.length === 0) {
        setAriaLiveStatus('Generating style suggestions...');
        const generatedTags = await generateSunoPrompt(topic, genre, mood, artists, voiceStyle, isInstrumental, bpm, []);
        
        const combinedTags = Array.from(new Set(generatedTags));
        let currentPrompt = '';
        const tagsWithinLimit: string[] = [];
        for (const tag of combinedTags) {
            const tempPrompt = currentPrompt ? `${currentPrompt}, ${tag}` : tag;
            if (tempPrompt.length <= 1000) {
                currentPrompt = tempPrompt;
                tagsWithinLimit.push(tag);
            } else {
                break;
            }
        }
        setSunoPromptTags(tagsWithinLimit);
        finalStyleTags = tagsWithinLimit;
      }

      setAriaLiveStatus(isInstrumental ? 'Generating instrumental track...' : 'Generating lyrics...');
      const stream = generateLyricsStream(topic, title, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, isInstrumental, '', artists, finalStyleTags, bpm);
      
      let buffer = '';
      let titleSet = false;

      for await (const chunk of stream) {
        buffer += chunk;
        if (!titleSet && buffer.includes('\n')) {
          const titleEndIndex = buffer.indexOf('\n');
          setTitle(buffer.substring(0, titleEndIndex));
          buffer = buffer.substring(titleEndIndex + 1);
          titleSet = true;
        }
        if (titleSet) {
          const parsedSections = parseLyrics(buffer);
          if (parsedSections.length > 0) {
            setLyrics(currentLyrics => {
              const reconciledLyrics = parsedSections.map((parsed, index) => {
                const existing = currentLyrics[index];
                return {
                  ...parsed,
                  id: existing ? existing.id : parsed.id,
                  isLoading: index === parsedSections.length - 1,
                };
              });
              return reconciledLyrics;
            });
          }
        }
      }

      setLyrics(currentLyrics => {
        if (currentLyrics.length > 0) {
          const lastSection = currentLyrics[currentLyrics.length - 1];
          if (lastSection.isLoading) {
            const finalLyrics = [...currentLyrics];
            finalLyrics[finalLyrics.length - 1] = { ...lastSection, isLoading: false };
            return finalLyrics;
          }
        }
        return currentLyrics;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while generating lyrics.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [topic, title, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm]);

  const handleRegenerateSection = useCallback(async (sectionId: string) => {
    const sectionIndex = lyrics.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const contextSections = lyrics.slice(0, sectionIndex);
    const lyricsContext = stringifyLyrics(contextSections);
    const sectionToRegenerate = lyrics[sectionIndex];
    
    setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, content: '', isLoading: true } : s));
    setError(null);

    try {
        const stream = regenerateSectionStream(topic, title, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm, lyricsContext, sectionToRegenerate.type);
        let newContent = '';
        for await (const chunk of stream) {
            newContent += chunk;
            setLyrics(currentLyrics => currentLyrics.map(s =>
                s.id === sectionId ? { ...s, content: newContent } : s
            ));
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to regenerate ${sectionToRegenerate.type}.`;
        setError(errorMessage);
        console.error(err);
    } finally {
        setLyrics(currentLyrics => currentLyrics.map(s =>
            s.id === sectionId ? { ...s, isLoading: false } : s
        ));
    }
  }, [lyrics, topic, title, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm]);

  const handleContinueSong = useCallback(async () => {
    setIsContinuing(true);
    setError(null);
    try {
        const lyricsContext = stringifyLyrics(lyrics);
        const stream = continueSongStream(topic, title, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm, lyricsContext);

        let newSectionRaw = '';
        let sectionAdded = false;

        for await (const chunk of stream) {
            newSectionRaw += chunk;
            const newSectionParsed = parseLyrics(newSectionRaw);
            
            if (newSectionParsed.length > 0 && !sectionAdded) {
                const newSection = { ...newSectionParsed[0], isLoading: true };
                setLyrics(currentLyrics => [...currentLyrics, newSection]);
                sectionAdded = true;
            } else if (sectionAdded && newSectionParsed.length > 0) {
                setLyrics(currentLyrics => {
                    const updatedLyrics = [...currentLyrics];
                    updatedLyrics[updatedLyrics.length - 1].content = newSectionParsed[0].content;
                    return updatedLyrics;
                });
            }
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to continue song.';
        setError(errorMessage);
        console.error(err);
    } finally {
        setLyrics(currentLyrics => {
            if (currentLyrics.length === 0) return [];
            const updatedLyrics = [...currentLyrics];
            if (updatedLyrics[updatedLyrics.length - 1]) {
              updatedLyrics[updatedLyrics.length - 1].isLoading = false;
            }
            return updatedLyrics;
        });
        setIsContinuing(false);
    }
  }, [lyrics, topic, title, genre, mood, lyricalStyle, countryVibe, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm]);

  const handleGenerateSunoPrompt = useCallback(async () => {
    setIsPromptLoading(true);
    setPromptError(null);
    try {
      setPreviousSunoPromptTags(sunoPromptTags);
      const generatedTags = await generateSunoPrompt(topic, genre, mood, artists, voiceStyle, isInstrumental, bpm, sunoPromptTags);
      const combinedTags = Array.from(new Set(generatedTags));

      let currentPrompt = '';
      const finalTags: string[] = [];

      for (const tag of combinedTags) {
        const tempPrompt = currentPrompt ? `${currentPrompt}, ${tag}` : tag;
        if (tempPrompt.length <= 1000) {
          currentPrompt = tempPrompt;
          finalTags.push(tag);
        } else {
          break;
        }
      }
      setSunoPromptTags(finalTags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate Suno prompt.';
      setPromptError(errorMessage);
      console.error(err);
    } finally {
      setIsPromptLoading(false);
    }
  }, [topic, genre, mood, artists, voiceStyle, isInstrumental, sunoPromptTags, bpm]);

  const handleUndoStyleSuggestion = useCallback(() => {
    if (previousSunoPromptTags !== null) {
      setSunoPromptTags(previousSunoPromptTags);
      setPreviousSunoPromptTags(null);
    }
  }, [previousSunoPromptTags]);

  const handleClearSunoPromptTags = useCallback(() => {
    setSunoPromptTags([]);
  }, []);

  const handleUpdateSectionContent = useCallback((sectionId: string, content: string) => {
    setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, content } : s));
  }, []);
  
  const handleDeleteSection = useCallback((sectionId: string) => {
    setLyrics(currentLyrics => currentLyrics.filter(s => s.id !== sectionId));
  }, []);
  
  const handleAddSection = useCallback((type: string, atIndex?: number) => {
    const newSection: SongSection = {
      id: crypto.randomUUID(),
      type: getNextSectionName(type, lyrics),
      content: '',
    };
    setLyrics(currentLyrics => {
      const result = Array.from(currentLyrics);
      if (atIndex !== undefined) {
        result.splice(atIndex, 0, newSection);
      } else {
        result.push(newSection);
      }
      return result;
    });
  }, [lyrics]);
  
  const handleApplyTemplate = useCallback((template: string) => {
    if (!template) return;
    const newSections = parseLyrics(template);
    setLyrics(newSections);
  }, []);

  const handleReorderSections = useCallback((startIndex: number, endIndex: number) => {
    setLyrics(currentLyrics => {
      const result = Array.from(currentLyrics);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleClearLyricsAndTitle = useCallback(() => {
    setTitle('');
    setLyrics([]);
  }, []);
  
  const MobileTabButton: React.FC<{tab: MobileTab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`w-full flex flex-col items-center justify-center gap-1 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'text-purple-300' : 'text-gray-400 hover:text-white'}`}
      >
        {icon}
        <span>{label}</span>
        {activeTab === tab && <div className="w-12 h-0.5 bg-purple-400 rounded-full mt-1"></div>}
      </button>
  );

  return (
    <div 
      className={`min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-[2000ms] ${isPulsing ? 'pulse-bg' : ''}`}
      style={bgStyle}
    >
      {isTourActive && <Tour onComplete={handleTourComplete} />}
      <span role="status" aria-live="polite" className="sr-only">
        {ariaLiveStatus}
      </span>
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-grow">
        <Header />
        
        <div className="md:hidden sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm -mx-4 sm:-mx-6 mt-4">
            <div className="flex justify-around border-b border-gray-700">
                <MobileTabButton tab="dna" label="Song DNA" icon={<Icon name="info" className="w-5 h-5"/>} />
                <MobileTabButton tab="style" label="Style" icon={<Icon name="regenerate" className="w-5 h-5"/>} />
                <MobileTabButton tab="lyrics" label="Lyrics" icon={<Icon name="copy" className="w-5 h-5"/>} />
            </div>
        </div>

        <main className="mt-8 flex-grow">
            {/* Desktop Grid Layout */}
            <div className="hidden md:grid md:grid-cols-12 md:gap-8 h-full">
                <div className="md:col-span-5">
                    <Controls
                        topic={topic}
                        setTopic={setTopic}
                        title={title}
                        setTitle={setTitle}
                        isInstrumental={isInstrumental}
                        setIsInstrumental={handleInstrumentalChange}
                        genre={genre}
                        setGenre={setGenre}
                        mood={mood}
                        setMood={setMood}
                        lyricalStyle={lyricalStyle}
                        setLyricalStyle={setLyricalStyle}
                        countryVibe={countryVibe}
                        setCountryVibe={setCountryVibe}
                        language={language}
                        setLanguage={setLanguage}
                        voiceStyle={voiceStyle}
                        setVoiceStyle={setVoiceStyle}
                        bpm={bpm}
                        setBpm={setBpm}
                        onGenerate={handleGenerate}
                        isLoading={isLoading}
                        artists={artists}
                        setArtists={setArtists}
                        onGenerateSunoPrompt={handleGenerateSunoPrompt}
                        isPromptLoading={isPromptLoading}
                        sunoPromptTags={sunoPromptTags}
                        setSunoPromptTags={setSunoPromptTags}
                        sunoExcludeTags={sunoExcludeTags}
                        setSunoExcludeTags={setSunoExcludeTags}
                        promptError={promptError}
                        onClearSession={handleClearSession}
                        showMetatagEditor={showMetatagEditor}
                        setShowMetatagEditor={setShowMetatagEditor}
                        previousSunoPromptTags={previousSunoPromptTags}
                        onUndoStyleSuggestion={handleUndoStyleSuggestion}
                        onSurpriseMe={handleSurpriseMe}
                        isSurprisingMe={isSurprisingMe}
                        onClearSunoPromptTags={handleClearSunoPromptTags}
                        onImproveTopic={handleImproveTopic}
                        isImproving={isImproving}
                        previousTopic={previousTopic}
                        onUndoTopicImprovement={handleUndoTopicImprovement}
                    />
                </div>
                <div className="md:col-span-7">
                    <LyricsDisplay
                        topic={topic}
                        genre={genre}
                        mood={mood}
                        title={title}
                        lyrics={lyrics}
                        sunoPromptTags={sunoPromptTags}
                        bpm={bpm}
                        setLyrics={setLyrics}
                        isLoading={isLoading}
                        error={error}
                        onUpdateSectionContent={handleUpdateSectionContent}
                        onRegenerateSection={handleRegenerateSection}
                        onDeleteSection={handleDeleteSection}
                        onAddSection={handleAddSection}
                        onApplyTemplate={handleApplyTemplate}
                        onReorderSections={handleReorderSections}
                        onContinueSong={handleContinueSong}
                        isContinuing={isContinuing}
                        showMetatagEditor={showMetatagEditor}
                        onClearLyricsAndTitle={handleClearLyricsAndTitle}
                    />
                </div>
            </div>

            {/* Mobile Single Column Layout */}
            <div className="md:hidden">
                {activeTab === 'dna' && <SongDNA
                    topic={topic} setTopic={setTopic}
                    title={title} setTitle={setTitle}
                    isInstrumental={isInstrumental} setIsInstrumental={handleInstrumentalChange}
                    genre={genre} setGenre={setGenre}
                    mood={mood} setMood={setMood}
                    lyricalStyle={lyricalStyle} setLyricalStyle={setLyricalStyle}
                    countryVibe={countryVibe} setCountryVibe={setCountryVibe}
                    onSurpriseMe={handleSurpriseMe} isSurprisingMe={isSurprisingMe}
                    onImproveTopic={handleImproveTopic} isImproving={isImproving}
                    previousTopic={previousTopic} onUndoTopicImprovement={handleUndoTopicImprovement}
                />}
                {activeTab === 'style' && <StyleEditor
                    topic={topic}
                    isInstrumental={isInstrumental}
                    language={language} setLanguage={setLanguage}
                    voiceStyle={voiceStyle} setVoiceStyle={setVoiceStyle}
                    bpm={bpm} setBpm={setBpm}
                    onGenerate={handleGenerate} isLoading={isLoading}
                    artists={artists} setArtists={setArtists}
                    onGenerateSunoPrompt={handleGenerateSunoPrompt} isPromptLoading={isPromptLoading}
                    sunoPromptTags={sunoPromptTags} setSunoPromptTags={setSunoPromptTags}
                    sunoExcludeTags={sunoExcludeTags} setSunoExcludeTags={setSunoExcludeTags}
                    promptError={promptError}
                    onClearSession={handleClearSession}
                    showMetatagEditor={showMetatagEditor} setShowMetatagEditor={setShowMetatagEditor}
                    previousSunoPromptTags={previousSunoPromptTags} onUndoStyleSuggestion={handleUndoStyleSuggestion}
                    onClearSunoPromptTags={handleClearSunoPromptTags}
                />}
                {activeTab === 'lyrics' && <LyricsDisplay
                    topic={topic}
                    genre={genre}
                    mood={mood}
                    title={title}
                    lyrics={lyrics}
                    sunoPromptTags={sunoPromptTags}
                    bpm={bpm}
                    setLyrics={setLyrics}
                    isLoading={isLoading}
                    error={error}
                    onUpdateSectionContent={handleUpdateSectionContent}
                    onRegenerateSection={handleRegenerateSection}
                    onDeleteSection={handleDeleteSection}
                    onAddSection={handleAddSection}
                    onApplyTemplate={handleApplyTemplate}
                    onReorderSections={handleReorderSections}
                    onContinueSong={handleContinueSong}
                    isContinuing={isContinuing}
                    showMetatagEditor={showMetatagEditor}
                    onClearLyricsAndTitle={handleClearLyricsAndTitle}
                />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;