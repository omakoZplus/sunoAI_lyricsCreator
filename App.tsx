
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { LyricsDisplay } from './components/LyricsDisplay';
import { generateLyricsStream, regenerateSectionStream, generateSunoPrompt, continueSongStream, generateRandomTopic } from './services/geminiService';
import { GENRES, MOODS, MOOD_COLORS } from './constants';
import { SongSection } from './types';
import { parseLyrics, stringifyLyrics, getNextSectionName } from './utils/lyricsParser';

const defaultExcludeTags = [
  'bad quality', 'out of tune', 'noisy', 'low fidelity', 'amateur', 'abrupt ending', 'static', 'distortion', 'mumbling', 'gibberish vocals', 'excessive reverb', 'clashing elements', 'generic', 'uninspired', 'robotic', 'artificial sound', 'metallic', 'harsh', 'shrill', 'muddy mix', 'undefined', 'chaotic', 'disjointed', 'monotone', 'repetitive', 'boring', 'flat', 'lifeless', 'thin', 'hollow', 'overproduced', 'under-produced'
];

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [mood, setMood] = useState<string>(MOODS[0]);
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
  
  const [bgStyle, setBgStyle] = useState({});
  const [isPulsing, setIsPulsing] = useState(false);
  const [ariaLiveStatus, setAriaLiveStatus] = useState('');

  const SAVED_STATE_KEY = 'sunoLyricsCreatorState_v2';

  // Load state from localStorage on initial render
  useEffect(() => {
    const savedStateRaw = localStorage.getItem(SAVED_STATE_KEY);
    if (savedStateRaw) {
      try {
        const savedState = JSON.parse(savedStateRaw);
        setTopic(savedState.topic || '');
        setTitle(savedState.title || '');
        setIsInstrumental(savedState.isInstrumental || false);
        setGenre(savedState.genre || GENRES[0]);
        setMood(savedState.mood || MOODS[0]);
        setLanguage(savedState.language || 'English');
        setVoiceStyle(savedState.voiceStyle || '');
        setBpm(savedState.bpm || '');
        setLyrics(savedState.lyrics || []);
        setArtists(savedState.artists || '');
        setSunoPromptTags(savedState.sunoPromptTags || []);
        setSunoExcludeTags(savedState.sunoExcludeTags || defaultExcludeTags);
        setShowMetatagEditor(savedState.showMetatagEditor || false);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        localStorage.removeItem(SAVED_STATE_KEY);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      topic, title, isInstrumental, genre, mood, language, voiceStyle, bpm, lyrics, artists, sunoPromptTags, sunoExcludeTags, showMetatagEditor
    };
    localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(stateToSave));
  }, [topic, title, isInstrumental, genre, mood, language, voiceStyle, bpm, lyrics, artists, sunoPromptTags, sunoExcludeTags, showMetatagEditor]);
  
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
      status = 'Generating a surprise topic, please wait.';
    }
    setAriaLiveStatus(status);
  }, [isLoading, isContinuing, isPromptLoading, isSurprisingMe, isInstrumental]);

  const handleInstrumentalChange = useCallback((enabled: boolean) => {
    setIsInstrumental(enabled);
    if (enabled) {
      setLanguage('No Language');
    } else {
      setLanguage(currentLanguage => currentLanguage === 'No Language' ? 'English' : currentLanguage);
    }
  }, []);

  // Effect to handle the [Instrumental] tag in the artist input
  useEffect(() => {
    const instrumentalTagRegex = /\[instrumental\]/i;
    if (instrumentalTagRegex.test(artists)) {
      // Remove the tag from the artist string
      setArtists(artists.replace(instrumentalTagRegex, '').trim());
      // Set the mode to instrumental, but only if it's not already set
      if (!isInstrumental) {
        handleInstrumentalChange(true);
      }
    }
  }, [artists, isInstrumental, handleInstrumentalChange]);

  const handleClearSession = useCallback(() => {
    if (window.confirm('Are you sure you want to start a new song? This will clear all current input and lyrics.')) {
      localStorage.removeItem(SAVED_STATE_KEY);
      setTopic('');
      setTitle('');
      setIsInstrumental(false);
      setGenre(GENRES[0]);
      setMood(MOODS[0]);
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
    }
  }, []);

  const handleSurpriseMe = useCallback(async () => {
    setIsSurprisingMe(true);
    setError(null);
    try {
      const availableGenres = GENRES.filter(g => g !== 'None');
      const availableMoods = MOODS.filter(m => m !== 'None');
      
      const randomGenre = availableGenres[Math.floor(Math.random() * availableGenres.length)];
      const randomMood = availableMoods[Math.floor(Math.random() * availableMoods.length)];

      const newTopic = await generateRandomTopic(randomGenre, randomMood);

      setGenre(randomGenre);
      setMood(randomMood);
      setTopic(newTopic);
      setTitle(''); // Clear title as it's a new idea
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not generate a surprise topic. Please try again.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsSurprisingMe(false);
    }
  }, []);

  const handleGenerateLyrics = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your song.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLyrics([]);
    setTitle('');
    setPreviousSunoPromptTags(null);
    
    try {
      const stream = generateLyricsStream(topic, title, genre, mood, language, voiceStyle, isInstrumental, '', artists, sunoPromptTags, bpm);
      
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
          setLyrics(currentLyrics => {
            if (parsedSections.length === 0) return currentLyrics;
            
            let newLyrics = [...currentLyrics];
            
            if (parsedSections.length > newLyrics.length) {
              if (newLyrics.length > 0) {
                newLyrics[newLyrics.length - 1].isLoading = false;
              }
              const sectionsToAdd = parsedSections.slice(newLyrics.length);
              newLyrics.push(...sectionsToAdd.map(s => ({ ...s, isLoading: true, content: '' })));
            }

            for (let i = 0; i < parsedSections.length; i++) {
              if (newLyrics[i]) {
                newLyrics[i].content = parsedSections[i].content;
              }
            }
            
            return newLyrics;
          });
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
  }, [topic, title, genre, mood, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm]);

  const handleRegenerateSection = useCallback(async (sectionId: string) => {
    const sectionIndex = lyrics.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const contextSections = lyrics.slice(0, sectionIndex);
    const lyricsContext = stringifyLyrics(contextSections);
    const sectionToRegenerate = lyrics[sectionIndex];
    
    setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, content: '', isLoading: true } : s));
    setError(null);

    try {
        const stream = regenerateSectionStream(topic, title, genre, mood, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm, lyricsContext, sectionToRegenerate.type);

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
  }, [lyrics, topic, title, genre, mood, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm]);

  const handleContinueSong = useCallback(async () => {
    setIsContinuing(true);
    setError(null);
    try {
        const lyricsContext = stringifyLyrics(lyrics);
        const stream = continueSongStream(topic, title, genre, mood, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm, lyricsContext);

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
  }, [lyrics, topic, title, genre, mood, language, voiceStyle, isInstrumental, artists, sunoPromptTags, bpm]);

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
  
  const handleAddSection = useCallback((type: string) => {
    const newSection: SongSection = {
      id: crypto.randomUUID(),
      type: getNextSectionName(type, lyrics),
      content: '',
    };
    setLyrics(currentLyrics => [...currentLyrics, newSection]);
  }, [lyrics]);
  
  const handleApplyTemplate = useCallback((template: string) => {
    if (!template) return;
    const apply = () => {
        const newSections = parseLyrics(template);
        setLyrics(newSections);
    };
    if (lyrics.length > 0) {
        if (window.confirm('Applying a template will replace your current lyrics. Are you sure?')) {
            apply();
        }
    } else {
        apply();
    }
  }, [lyrics]);

  const handleReorderSections = useCallback((startIndex: number, endIndex: number) => {
    setLyrics(currentLyrics => {
      const result = Array.from(currentLyrics);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const handleClearLyricsAndTitle = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the title and all lyrics? This cannot be undone.')) {
      setTitle('');
      setLyrics([]);
    }
  }, []);

  return (
    <div 
      className={`min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-[2000ms] ${isPulsing ? 'pulse-bg' : ''}`}
      style={bgStyle}
    >
      <span role="status" aria-live="polite" className="sr-only">
        {ariaLiveStatus}
      </span>
      <div className="w-full max-w-6xl mx-auto">
        <Header />
        <main className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
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
              language={language}
              setLanguage={setLanguage}
              voiceStyle={voiceStyle}
              setVoiceStyle={setVoiceStyle}
              bpm={bpm}
              setBpm={setBpm}
              onGenerate={handleGenerateLyrics}
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
            />
          </div>
          <div className="md:col-span-7">
            <LyricsDisplay
              title={title}
              lyrics={lyrics}
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
        </main>
      </div>
    </div>
  );
};

export default App;
