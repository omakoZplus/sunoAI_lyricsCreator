
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { LyricsDisplay } from './components/LyricsDisplay';
import { generateLyricsStream, generateSunoPrompt } from './services/geminiService';
import { GENRES, MOODS, LANGUAGES } from './constants';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isInstrumental, setIsInstrumental] = useState<boolean>(false);
  const [genre, setGenre] = useState<string>(GENRES[0]);
  const [mood, setMood] = useState<string>(MOODS[0]);
  const [language, setLanguage] = useState<string>('English');
  const [voiceStyle, setVoiceStyle] = useState<string>('');
  const [bpm, setBpm] = useState<string>('');
  const [lyrics, setLyrics] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [artists, setArtists] = useState<string>('');
  const [sunoPromptTags, setSunoPromptTags] = useState<string[]>([]);
  const [isPromptLoading, setIsPromptLoading] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const SAVED_STATE_KEY = 'sunoLyricsCreatorState';

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
        setLyrics(savedState.lyrics || '');
        setArtists(savedState.artists || '');
        setSunoPromptTags(savedState.sunoPromptTags || []);
      } catch (e) {
        console.error('Failed to parse saved state:', e);
        localStorage.removeItem(SAVED_STATE_KEY);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      topic, title, isInstrumental, genre, mood, language, voiceStyle, bpm, lyrics, artists, sunoPromptTags
    };
    localStorage.setItem(SAVED_STATE_KEY, JSON.stringify(stateToSave));
  }, [topic, title, isInstrumental, genre, mood, language, voiceStyle, bpm, lyrics, artists, sunoPromptTags]);

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
      setLyrics('');
      setError(null);
      setArtists('');
      setSunoPromptTags([]);
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
    
    const lyricsToGenerateFrom = lyrics.includes('[') && lyrics.includes(']') ? lyrics : '';

    // Clear previous results for a clean streaming experience
    setLyrics('');
    setTitle('');
    
    try {
      // The `title` variable from state is captured in the closure here
      const stream = generateLyricsStream(topic, title, genre, mood, language, voiceStyle, isInstrumental, lyricsToGenerateFrom, artists, sunoPromptTags, bpm);
      
      let fullResponse = '';
      let titleSet = false;

      for await (const chunk of stream) {
        fullResponse += chunk;

        if (!titleSet && fullResponse.includes('\n')) {
          const parts = fullResponse.split('\n');
          const generatedTitle = parts[0];
          const body = parts.slice(1).join('\n');
          
          setTitle(generatedTitle); // Always set title from response. Prompt ensures it's user's if provided.
          setLyrics(body);
          titleSet = true;
        } else if (titleSet) {
          const body = fullResponse.substring(fullResponse.indexOf('\n') + 1);
          setLyrics(body);
        }
      }

    } catch (err) {
      setError('Failed to generate lyrics. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [topic, title, genre, mood, language, voiceStyle, isInstrumental, lyrics, artists, sunoPromptTags, bpm]);

  const handleGenerateSunoPrompt = useCallback(async () => {
    setIsPromptLoading(true);
    setPromptError(null);
    try {
      const generatedTags = await generateSunoPrompt(topic, genre, mood, artists, voiceStyle, isInstrumental, bpm);
      
      const combinedTags = Array.from(new Set([...sunoPromptTags, ...generatedTags]));

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
              setLyrics={setLyrics}
              artists={artists}
              setArtists={setArtists}
              onGenerateSunoPrompt={handleGenerateSunoPrompt}
              isPromptLoading={isPromptLoading}
              sunoPromptTags={sunoPromptTags}
              setSunoPromptTags={setSunoPromptTags}
              promptError={promptError}
              onClearSession={handleClearSession}
            />
          </div>
          <div className="md:col-span-7">
            <LyricsDisplay
              title={title}
              lyrics={lyrics}
              setLyrics={setLyrics}
              isLoading={isLoading}
              onRegenerate={handleGenerateLyrics}
              error={error}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
