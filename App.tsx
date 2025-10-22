import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { LyricsDisplay } from './components/LyricsDisplay';
import { generateLyricsStream, regenerateSectionStream, generateSunoPrompt, continueSongStream } from './services/geminiService';
import { GENRES, MOODS } from './constants';
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
  const [sunoExcludeTags, setSunoExcludeTags] = useState<string[]>(defaultExcludeTags);
  const [isPromptLoading, setIsPromptLoading] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const [isContinuing, setIsContinuing] = useState<boolean>(false);
  const [showMetatagEditor, setShowMetatagEditor] = useState<boolean>(false);

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

  const handleClearSession = () => {
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
    }
  };

  const handleGenerateLyrics = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a topic for your song.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLyrics([]);
    setTitle('');
    
    try {
      const stream = generateLyricsStream(topic, title, genre, mood, language, voiceStyle, isInstrumental, '', artists, sunoPromptTags, bpm);
      
      let fullResponse = '';
      let titleSet = false;

      for await (const chunk of stream) {
        fullResponse += chunk;

        if (!titleSet && fullResponse.includes('\n')) {
          const parts = fullResponse.split('\n');
          const generatedTitle = parts[0];
          const body = parts.slice(1).join('\n');
          
          setTitle(generatedTitle);
          setLyrics(parseLyrics(body));
          titleSet = true;
        } else if (titleSet) {
          const body = fullResponse.substring(fullResponse.indexOf('\n') + 1);
          setLyrics(parseLyrics(body));
        }
      }

    } catch (err) {
      setError('Failed to generate lyrics. Please try again.');
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
    
    // Set loading state for the specific section
    const newLyrics = lyrics.map(s => s.id === sectionId ? { ...s, content: '', isLoading: true } : s);
    setLyrics(newLyrics);

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
        setError(`Failed to regenerate ${sectionToRegenerate.type}.`);
        console.error(err);
    } finally {
        // Unset loading state
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
                // We have the first section, add it to the state with loading true
                const newSection = { ...newSectionParsed[0], isLoading: true };
                setLyrics(currentLyrics => [...currentLyrics, newSection]);
                sectionAdded = true;
            } else if (sectionAdded && newSectionParsed.length > 0) {
                // Update the content of the last added section
                setLyrics(currentLyrics => {
                    const updatedLyrics = [...currentLyrics];
                    const lastSection = updatedLyrics[updatedLyrics.length - 1];
                    lastSection.content = newSectionParsed[0].content;
                    return updatedLyrics;
                });
            }
        }
    } catch (err) {
        setError('Failed to continue song. Please try again.');
        console.error(err);
    } finally {
        // Unset loading state on the newly added section
        setLyrics(currentLyrics => {
            if (currentLyrics.length === 0) return [];
            const updatedLyrics = [...currentLyrics];
            const lastSection = updatedLyrics[updatedLyrics.length - 1];
            if (lastSection) {
              lastSection.isLoading = false;
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
      const generatedTags = await generateSunoPrompt(topic, genre, mood, artists, voiceStyle, isInstrumental, bpm);
      
      const baseTags: string[] = [];
      if (genre && genre !== 'None') {
        baseTags.push(genre);
      }
      if (mood && mood !== 'None') {
        baseTags.push(mood);
      }
      if (bpm) {
        baseTags.push(`${bpm} BPM`);
      }

      const combinedTags = Array.from(new Set([...baseTags, ...sunoPromptTags, ...generatedTags]));

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
      setPromptError('Failed to generate Suno prompt. Please try again.');
      console.error(err);
    } finally {
      setIsPromptLoading(false);
    }
  }, [topic, genre, mood, artists, voiceStyle, isInstrumental, sunoPromptTags, bpm]);

  const handleInstrumentalChange = (enabled: boolean) => {
    setIsInstrumental(enabled);
    if (enabled) {
      setLanguage('No Language');
    } else {
      if (language === 'No Language') {
        setLanguage('English');
      }
    }
  };

  const handleUpdateSectionContent = (sectionId: string, content: string) => {
    setLyrics(lyrics.map(s => s.id === sectionId ? { ...s, content } : s));
  };
  
  const handleDeleteSection = (sectionId: string) => {
    setLyrics(lyrics.filter(s => s.id !== sectionId));
  };
  
  const handleAddSection = (type: string) => {
    const newSection: SongSection = {
      id: crypto.randomUUID(),
      type: getNextSectionName(type, lyrics),
      content: '',
    };
    setLyrics([...lyrics, newSection]);
  };
  
  const handleReorderSections = (startIndex: number, endIndex: number) => {
    const result = Array.from(lyrics);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setLyrics(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/40 to-gray-900 text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
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
              onReorderSections={handleReorderSections}
              onContinueSong={handleContinueSong}
              isContinuing={isContinuing}
              showMetatagEditor={showMetatagEditor}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
