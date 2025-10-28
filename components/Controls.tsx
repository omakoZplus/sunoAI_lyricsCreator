import React from 'react';
import { SongDNA } from './SongDNA';
import { StyleEditor } from './StyleEditor';

// This props interface now aggregates props for both child components.
// In a larger app, you might use context or state management instead.
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
  lyricalStyle: string;
  setLyricalStyle: (style: string) => void;
  countryVibe: string;
  setCountryVibe: (vibe: string) => void;
  language: string;
  setLanguage: (language: string) => void;
  voiceStyle: string;
  setVoiceStyle: (voiceStyle: string) => void;
  bpm: string;
  setBpm: (bpm: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  artists: string;
  setArtists: (artists: string) => void;
  onGenerateSunoPrompt: () => void;
  isPromptLoading: boolean;
  sunoPromptTags: string[];
  setSunoPromptTags: (tags: string[]) => void;
  sunoExcludeTags: string[];
  setSunoExcludeTags: (tags: string[]) => void;
  promptError: string | null;
  onClearSession: () => void;
  showMetatagEditor: boolean;
  setShowMetatagEditor: (show: boolean) => void;
  previousSunoPromptTags: string[] | null;
  onUndoStyleSuggestion: () => void;
  onSurpriseMe: () => void;
  isSurprisingMe: boolean;
  onClearSunoPromptTags: () => void;
  isImproving: boolean;
  onImproveTopic: () => void;
  previousTopic: string | null;
  onUndoTopicImprovement: () => void;
}

export const Controls: React.FC<ControlsProps> = (props) => {
  return (
    <div className="flex flex-col gap-8">
      <SongDNA {...props} />
      <StyleEditor {...props} />
    </div>
  );
};