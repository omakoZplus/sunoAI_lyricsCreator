import React, { useState, useEffect, useMemo } from 'react';
import { GENRES, MOODS, LANGUAGES, KEY_INSTRUMENTS, PRODUCTION_TECHNIQUES_CATEGORIZED, KEY_VSTS_CATEGORIZED } from '../constants';
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
}

type TagCategory = 'instruments' | 'production' | 'vsts';
const STUDIO_TABS: { key: TagCategory, name: string }[] = [
    { key: 'instruments', name: 'Instruments' },
    { key: 'production', name: 'Production' },
    { key: 'vsts', name: 'VSTs' },
];

export const Controls: React.FC<ControlsProps> = React.memo(({
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
  artists,
  setArtists,
  onGenerateSunoPrompt,
  isPromptLoading,
  sunoPromptTags,
  setSunoPromptTags,
  sunoExcludeTags,
  setSunoExcludeTags,
  promptError,
  onClearSession,
  showMetatagEditor,
  setShowMetatagEditor,
  previousSunoPromptTags,
  onUndoStyleSuggestion,
  onSurpriseMe,
  isSurprisingMe,
  onClearSunoPromptTags,
}) => {
  const [promptCopyText, setPromptCopyText] = useState('Copy');
  const [charCountExceeded, setCharCountExceeded] = useState(false);
  const [excludeCopyText, setExcludeCopyText] = useState('Copy');
  const [excludeCharCountExceeded, setExcludeCharCountExceeded] = useState(false);
  const [activeStudioTab, setActiveStudioTab] = useState<TagCategory>('instruments');

  const allTagSuggestions = useMemo(() => {
    const allInstruments = Object.values(KEY_INSTRUMENTS).flat();
    const allProduction = Object.values(PRODUCTION_TECHNIQUES_CATEGORIZED).flat();
    const allVSTs = Object.values(KEY_VSTS_CATEGORIZED).flat();
    return Array.from(new Set([...allInstruments, ...allProduction, ...allVSTs]));
  }, []);

  const sunoPromptText = sunoPromptTags.join(', ');
  const charCount = sunoPromptText.length;
  
  const sunoExcludeText = sunoExcludeTags.join(', ');
  const excludeCharCount = sunoExcludeText.length;

  useEffect(() => {
    if (charCountExceeded) {
      const timer = setTimeout(() => setCharCountExceeded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [charCountExceeded]);

  useEffect(() => {
    if (excludeCharCountExceeded) {
      const timer = setTimeout(() => setExcludeCharCountExceeded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [excludeCharCountExceeded]);

  const handlePromptCopy = () => {
    navigator.clipboard.writeText(sunoPromptText);
    setPromptCopyText('Copied!');
    setTimeout(() => setPromptCopyText('Copy'), 2000);
  };
  
  const handleExcludeCopy = () => {
    navigator.clipboard.writeText(sunoExcludeText);
    setExcludeCopyText('Copied!');
    setTimeout(() => setExcludeCopyText('Copy'), 2000);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSunoPromptTags(sunoPromptTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleRemoveExcludeTag = (tagToRemove: string) => {
    setSunoExcludeTags(sunoExcludeTags.filter(tag => tag !== tagToRemove));
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
  
  const handleAddExcludeTag = (tagToAdd: string): boolean => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag && !sunoExcludeTags.includes(trimmedTag)) {
       const prospectivePrompt = [...sunoExcludeTags, trimmedTag].join(', ');
       if (prospectivePrompt.length <= 1000) {
        setSunoExcludeTags([...sunoExcludeTags, trimmedTag]);
        return true; // Success
       } else {
        setExcludeCharCountExceeded(true);
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

  const renderStudioContent = () => {
      let categories: Record<string, string[]> = {};
      if (activeStudioTab === 'instruments') categories = KEY_INSTRUMENTS;
      if (activeStudioTab === 'production') categories = PRODUCTION_TECHNIQUES_CATEGORIZED;
      if (activeStudioTab === 'vsts') categories = KEY_VSTS_CATEGORIZED;
      
      return (
        <div className="space-y-6 max-h-80 overflow-y-auto pr-2">
            {Object.entries(categories).map(([category, tags]) => (
                <div key={category}>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <ToggleChip
                                key={tag}
                                text={tag}
                                isActive={sunoPromptTags.includes(tag)}
                                onClick={() => handleToggleTag(tag)}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
      );
  };


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col gap-8">
      
      {/* === SONG DNA === */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-gray-200">Song DNA</h2>
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-300">
              Song Topic
            </label>
            <Button onClick={onSurpriseMe} disabled={isSurprisingMe} variant="secondary" className="!py-1 !px-2.5 text-xs">
              <Icon name="regenerate" className="w-4 h-4" />
              {isSurprisingMe ? 'Thinking...' : 'Surprise Me'}
            </Button>
          </div>
          <textarea
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., a lonely astronaut watching Earth from Mars"
            className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            rows={3}
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
        <ToggleSwitch 
          label="Make Instrumental"
          enabled={isInstrumental}
          onChange={setIsInstrumental}
        />
        <Select label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={GENRES} />
        <Select label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={MOODS} />
      </div>

      {/* === STYLE OF MUSIC === */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-200">Style of Music</h2>
            <div className="flex items-center gap-3">
                <button 
                  onClick={onClearSunoPromptTags} 
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                  disabled={sunoPromptTags.length === 0}
                >
                  Clear All
                </button>
              <div className={`flex items-center gap-2 transition-transform duration-300 ${charCountExceeded ? 'scale-110' : ''}`}>
                <CharCountCircle count={charCount} limit={1000} color="purple" />
              </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={onGenerateSunoPrompt} disabled={isPromptLoading || !topic.trim()} variant="secondary" className="flex-grow">
              <Icon name="regenerate" />
              {isPromptLoading ? 'Working...' : 'Generate Suggestions'}
            </Button>
            {previousSunoPromptTags !== null && (
              <Button onClick={onUndoStyleSuggestion} variant="secondary" className="flex-shrink-0 !p-2.5" title="Undo suggestion">
                  <Icon name="undo" className="w-5 h-5" />
              </Button>
            )}
          </div>
          
          <div className="bg-gray-900/70 border border-gray-600 rounded-lg p-3 min-h-[120px]">
            {isPromptLoading && sunoPromptTags.length === 0 ? (
              <p className="text-gray-400">Thinking...</p>
            ) : promptError ? (
              <p className="text-red-400">{promptError}</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {sunoPromptTags.map(tag => (
                    <Chip key={tag} text={tag} onRemove={() => handleRemoveTag(tag)} color="purple" />
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
      </div>

      {/* === GENERATE ACTIONS === */}
      <div className="pt-8 border-t border-gray-700 space-y-4">
        <Button onClick={onGenerate} disabled={isLoading || !topic.trim()} fullWidth>
            {isLoading ? (isInstrumental ? 'Generating Track...' : 'Generating Lyrics...') : (isInstrumental ? 'Generate Instrumental Track' : 'Generate Lyrics')}
        </Button>
         <div className="text-center">
            <button onClick={onClearSession} className="text-sm text-gray-500 hover:text-red-400 transition-colors duration-200">
                Start New Song
            </button>
        </div>
      </div>

      {/* === ADVANCED STYLE EDITOR === */}
      <Accordion title="Advanced Style Editor">
        <div className="space-y-4 pt-4">
          
          <div className="space-y-6 px-3">
            <div>
              <label htmlFor="artists" className="block text-sm font-medium text-gray-300 mb-2">
                  Artists to inspire (for style)
              </label>
              <input
                type="text"
                id="artists"
                value={artists}
                onChange={(e) => setArtists(e.target.value)}
                placeholder="e.g., Daft Punk, Queen"
                className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
              />
            </div>
          </div>
          
          <div className="max-h-[45vh] overflow-y-auto pr-2 -mr-2">
            <Accordion title="Style Studio" defaultOpen={true}>
                <div className="flex border-b border-gray-600 mb-4">
                    {STUDIO_TABS.map(tab => (
                        <button 
                            key={tab.key}
                            onClick={() => setActiveStudioTab(tab.key)}
                            className={`px-4 py-2 text-sm font-medium transition-colors ${
                                activeStudioTab === tab.key
                                  ? 'border-b-2 border-purple-400 text-purple-300'
                                  : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </div>
                <div>
                    {renderStudioContent()}
                </div>
            </Accordion>
            
            <Accordion 
              title="Exclude From Style"
              headerControls={
                <div className={`flex items-center gap-2 transition-transform duration-300 ${excludeCharCountExceeded ? 'scale-110' : ''}`}>
                  <CharCountCircle count={excludeCharCount} limit={1000} color="rose"/>
                </div>
              }
            >
              <div className="space-y-4">
                <div className="bg-gray-900/70 border border-gray-600 rounded-lg p-3 min-h-[120px]">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {sunoExcludeTags.map(tag => (
                        <Chip key={tag} text={tag} onRemove={() => handleRemoveExcludeTag(tag)} color="rose" />
                      ))}
                      {sunoExcludeTags.length === 0 && <p className="text-gray-500 text-sm p-1">Add tags to exclude from the style...</p>}
                    </div>
                    <TagInput 
                      onAddTag={handleAddExcludeTag}
                      allSuggestions={[]}
                      existingTags={sunoExcludeTags}
                    />
                </div>
                {sunoExcludeTags.length > 0 && (
                   <Button onClick={handleExcludeCopy} variant="secondary" fullWidth>
                      <Icon name="copy" />
                      {excludeCopyText}
                  </Button>
                )}
              </div>
            </Accordion>
          </div>
          
           <div className="pt-4 border-t border-gray-700 space-y-6 px-3">
              <h3 className="text-lg font-semibold text-gray-300">Track Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} disabled={isInstrumental} />
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
              </div>
              <div>
                <label htmlFor="voiceStyle" className="block text-sm font-medium text-gray-300 mb-2">
                    Vocal Identity (Optional)
                </label>
                <input
                  type="text"
                  id="voiceStyle"
                  value={voiceStyle}
                  onChange={(e) => setVoiceStyle(e.target.value)}
                  placeholder="e.g., breathy female pop vocal"
                  className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:bg-gray-800/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  disabled={isInstrumental}
                />
              </div>
              <ToggleSwitch
                label="Advanced Metatag Editor"
                enabled={showMetatagEditor}
                onChange={setShowMetatagEditor}
              />
           </div>
        </div>
      </Accordion>
    </div>
  );
});