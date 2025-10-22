
import React, { useState, useEffect, useMemo } from 'react';
import { GENRES, MOODS, SONG_STRUCTURES, LANGUAGES, KEY_INSTRUMENTS, PRODUCTION_TECHNIQUES, KEY_VSTS } from '../constants';
import { Select } from './Select';
import { Button } from './Button';
import { Icon } from './Icon';
import { ToggleSwitch } from './ToggleSwitch';
import { Chip } from './Chip';
import { Accordion } from './Accordion';
import { ToggleChip } from './ToggleChip';
import { TagInput } from './TagInput';
import { CharCountCircle } from './CharCountCircle';

interface ControlsProps {
  topic: string;
  setTopic: (topic: string) => void;
  title: string;
  setTitle: (title: string) => void;
  isInstrumental: boolean;
  setIsInstrumental: (isInstrumental: boolean) => void;
  genre: string;
  setGenre: (genre: string) => void;
  mood: string;
  setMood: (mood: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  voiceStyle: string;
  setVoiceStyle: (voiceStyle: string) => void;
  bpm: string;
  setBpm: (bpm: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  setLyrics: (lyrics: string) => void;
  artists: string;
  setArtists: (artists: string) => void;
  onGenerateSunoPrompt: () => void;
  isPromptLoading: boolean;
  sunoPromptTags: string[];
  setSunoPromptTags: (tags: string[]) => void;
  promptError: string | null;
  onClearSession: () => void;
}

// Moved TagSection outside of the Controls component to preserve state on re-render.
const TagSection: React.FC<{
  title: string; 
  tags: string[];
  sunoPromptTags: string[];
  onToggleTag: (tag: string) => void;
}> = ({ title, tags, sunoPromptTags, onToggleTag }) => (
   <Accordion title={title}>
      <div className="pt-4 flex flex-wrap gap-2">
          {tags.map(tag => (
              <ToggleChip
                  key={tag}
                  text={tag}
                  isActive={sunoPromptTags.includes(tag)}
                  onClick={() => onToggleTag(tag)}
              />
          ))}
      </div>
  </Accordion>
);

export const Controls: React.FC<ControlsProps> = ({
  topic,
  setTopic,
  title,
  setTitle,
  isInstrumental,
  setIsInstrumental,
  genre,
  setGenre,
  mood,
  setMood,
  language,
  setLanguage,
  voiceStyle,
  setVoiceStyle,
  bpm,
  setBpm,
  onGenerate,
  isLoading,
  setLyrics,
  artists,
  setArtists,
  onGenerateSunoPrompt,
  isPromptLoading,
  sunoPromptTags,
  setSunoPromptTags,
  promptError,
  onClearSession,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(SONG_STRUCTURES[0].name);
  const [promptCopyText, setPromptCopyText] = useState('Copy');
  const [charCountExceeded, setCharCountExceeded] = useState(false);

  const allTagSuggestions = useMemo(() => {
    return Array.from(new Set([...KEY_INSTRUMENTS, ...PRODUCTION_TECHNIQUES, ...KEY_VSTS]));
  }, []);

  const sunoPromptText = sunoPromptTags.join(', ');
  const charCount = sunoPromptText.length;
  
  useEffect(() => {
    if (charCountExceeded) {
      const timer = setTimeout(() => setCharCountExceeded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [charCountExceeded]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const templateName = e.target.value;
      setSelectedTemplate(templateName);
      const structure = SONG_STRUCTURES.find(s => s.name === templateName);
      if (structure) {
          setLyrics(structure.template);
      }
  };

  const handlePromptCopy = () => {
    navigator.clipboard.writeText(sunoPromptText);
    setPromptCopyText('Copied!');
    setTimeout(() => setPromptCopyText('Copy'), 2000);
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setSunoPromptTags(sunoPromptTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddTag = (tagToAdd: string): boolean => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag && !sunoPromptTags.includes(trimmedTag)) {
       const prospectivePrompt = [...sunoPromptTags, trimmedTag].join(', ');
       if (prospectivePrompt.length <= 1000) {
        setSunoPromptTags([...sunoPromptTags, trimmedTag]);
        return true; // Success
       } else {
        setCharCountExceeded(true);
        return false; // Failed
       }
    }
    return false; // Failed (empty or duplicate)
  };

  const handleToggleTag = (tag: string) => {
    if (sunoPromptTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      handleAddTag(tag);
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col gap-6">
      
      <Accordion title="Core Idea" defaultOpen>
        <div className="space-y-6 pt-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">
              Song Topic
            </label>
            <textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., a detailed story about a lonely astronaut watching Earth from Mars"
              className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              rows={4}
            />
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Song Title (Optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="If blank, AI will generate one"
              className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
        </div>
      </Accordion>

      <Accordion title="Musical Style">
        <div className="space-y-6 pt-4">
          <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} disabled={isInstrumental} />
          <Select label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={GENRES} />
          <Select label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={MOODS} />
          <div>
            <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">
                BPM (Optional)
            </label>
            <input
              type="number"
              id="bpm"
              value={bpm}
              onChange={(e) => setBpm(e.target.value)}
              placeholder="e.g., 120"
              className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>
          <div>
            <label htmlFor="artists" className="block text-sm font-medium text-gray-300 mb-2">
                Artists to inspire (for prompt)
            </label>
            <input
              type="text"
              id="artists"
              value={artists}
              onChange={(e) => setArtists(e.target.value)}
              placeholder="e.g., Daft Punk, Queen"
              className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
            <p className="text-xs text-gray-500 mt-1">Used for Style Prompt generation only.</p>
          </div>
        </div>
      </Accordion>

      <TagSection title="Key Instruments" tags={KEY_INSTRUMENTS} sunoPromptTags={sunoPromptTags} onToggleTag={handleToggleTag} />
      <TagSection title="Production & Style" tags={PRODUCTION_TECHNIQUES} sunoPromptTags={sunoPromptTags} onToggleTag={handleToggleTag} />
      <TagSection title="Sound Design & VSTs" tags={KEY_VSTS} sunoPromptTags={sunoPromptTags} onToggleTag={handleToggleTag} />

      <Accordion title="Advanced Settings">
        <div className="space-y-6 pt-4">
          <Select label="Song Structure (Optional)" value={selectedTemplate} onChange={handleTemplateChange} options={SONG_STRUCTURES.map(s => s.name)} />
          <div>
            <label htmlFor="voiceStyle" className="block text-sm font-medium text-gray-300 mb-2">
                Vocal Identity (Optional)
            </label>
            <input
              type="text"
              id="voiceStyle"
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              placeholder="e.g., breathy female pop vocal, aggressive rap flow"
              className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={isInstrumental}
            />
            <p className="text-xs text-gray-500 mt-1">Describe the singer's voice and delivery.</p>
          </div>
          <ToggleSwitch 
            label="Make Instrumental"
            enabled={isInstrumental}
            onChange={setIsInstrumental}
          />
        </div>
      </Accordion>

      {/* Prompt Generator Section */}
      <div className="pt-6 border-t border-gray-700 space-y-4">
          <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-purple-300">Suno Style Prompt</h3>
              <div className={`flex items-center gap-2 transition-transform duration-300 ${charCountExceeded ? 'scale-110' : ''}`}>
                 <CharCountCircle count={charCount} limit={1000} />
                 <span className={`font-mono text-sm ${charCount > 1000 ? 'text-red-400' : 'text-gray-400'}`}>/ 1000</span>
              </div>
          </div>
          
          <Button onClick={onGenerateSunoPrompt} disabled={isPromptLoading || !topic.trim()} variant="secondary" fullWidth>
            <Icon name="regenerate" />
            {isPromptLoading ? 'Working...' : 'Generate Style Suggestions'}
          </Button>
          
          <div className="bg-gray-900/70 border border-gray-600 rounded-lg p-3 min-h-[120px]">
            {isPromptLoading && sunoPromptTags.length === 0 ? (
              <p className="text-gray-400">Thinking...</p>
            ) : promptError ? (
              <p className="text-red-400">{promptError}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {sunoPromptTags.map(tag => (
                    <Chip key={tag} text={tag} onRemove={() => handleRemoveTag(tag)} />
                  ))}
                  {sunoPromptTags.length === 0 && <p className="text-gray-500 text-sm p-1">Generate or add style tags...</p>}
                </div>
                <TagInput 
                  onAddTag={handleAddTag}
                  allSuggestions={allTagSuggestions}
                  existingTags={sunoPromptTags}
                />
              </>
            )}
          </div>
          {sunoPromptTags.length > 0 && !promptError && (
             <Button onClick={handlePromptCopy} variant="secondary" fullWidth>
                <Icon name="copy" />
                {promptCopyText}
            </Button>
          )}
      </div>

      {/* Lyrics Generator Section */}
      <div className="pt-6 border-t border-gray-700">
          <Button onClick={onGenerate} disabled={isLoading || !topic.trim()} fullWidth>
              {isLoading ? (isInstrumental ? 'Generating Track...' : 'Generating Lyrics...') : (isInstrumental ? 'Generate Instrumental Track' : 'Generate Lyrics')}
          </Button>
      </div>

      <div className="pt-4 text-center">
        <button onClick={onClearSession} className="text-sm text-gray-500 hover:text-red-400 transition-colors duration-200">
            Start New Song
        </button>
      </div>
    </div>
  );
};
