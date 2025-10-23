
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

  const getTagsForCategory = (category: TagCategory): string[] => {
    switch (category) {
        case 'instruments':
            return Object.values(KEY_INSTRUMENTS).flat();
        case 'production':
            return Object.values(PRODUCTION_TECHNIQUES_CATEGORIZED).flat();
        case 'vsts':
            return Object.values(KEY_VSTS_CATEGORIZED).flat();
        default:
            return [];
    }
  };

  const handleSurpriseMeTags = (category: TagCategory) => {
      const tagsForCategory = getTagsForCategory(category);
      const tagsToClear = new Set(tagsForCategory);
      const otherTags = sunoPromptTags.filter(tag => !tagsToClear.has(tag));

      const shuffled = tagsForCategory.sort(() => 0.5 - Math.random());
      const numberOfTags = Math.floor(Math.random() * 3) + 3; // Pick 3, 4, or 5 tags
      const newTags = shuffled.slice(0, numberOfTags);
      
      const combinedTags = Array.from(new Set([...otherTags, ...newTags]));
      if (combinedTags.join(', ').length > 1000) {
          setCharCountExceeded(true);
          return;
      }
      setSunoPromptTags(combinedTags);
  };

  const handleClearTags = (category: TagCategory) => {
      const tagsToClear = new Set(getTagsForCategory(category));
      const newTags = sunoPromptTags.filter(tag => !tagsToClear.has(tag));
      setSunoPromptTags(newTags);
  };

  const renderAccordionHeaderControls = (category: TagCategory) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button onClick={() => handleSurpriseMeTags(category)} variant="secondary" className="!py-1 !px-2.5 text-xs" title="Surprise Me">
              <Icon name="regenerate" className="w-4 h-4" />
          </Button>
          <Button onClick={() => handleClearTags(category)} variant="secondary" className="!py-1 !px-2.5 text-xs !bg-rose-500/20 hover:!bg-rose-500/40" title="Clear All in Category">
              <Icon name="delete" className="w-4 h-4" />
          </Button>
      </div>
  );

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col gap-6">
      
      <Accordion title="Core Idea" defaultOpen>
        <div className="space-y-6 pt-4">
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

      <Accordion title="Musical Style" defaultOpen>
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

      <Accordion 
        title="Key Instruments"
        infoText="Select specific instruments to feature in your song. The AI will use these tags to build the core sound palette for the style prompt."
        headerControls={renderAccordionHeaderControls('instruments')}
      >
        <div className="pt-4 space-y-6 max-h-72 overflow-y-auto pr-2">
          {Object.entries(KEY_INSTRUMENTS).map(([category, instruments]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-400 mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {instruments.map(instrument => (
                  <ToggleChip
                    key={instrument}
                    text={instrument}
                    isActive={sunoPromptTags.includes(instrument)}
                    onClick={() => handleToggleTag(instrument)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion 
        title="Production & Style"
        infoText="Define the overall sound and arrangement. Use these tags to describe the rhythm, mixing techniques, and general vibe of the track."
        headerControls={renderAccordionHeaderControls('production')}
      >
        <div className="pt-4 space-y-6 max-h-72 overflow-y-auto pr-2">
          {Object.entries(PRODUCTION_TECHNIQUES_CATEGORIZED).map(([category, techniques]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-400 mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {techniques.map(technique => (
                  <ToggleChip
                    key={technique}
                    text={technique}
                    isActive={sunoPromptTags.includes(technique)}
                    onClick={() => handleToggleTag(technique)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Accordion>
      
      <Accordion 
        title="Sound Design & VSTs"
        infoText="For advanced users. Reference specific VSTs or sound design techniques to guide the AI towards a highly specific electronic or modern sound."
        headerControls={renderAccordionHeaderControls('vsts')}
      >
        <div className="pt-4 space-y-6 max-h-72 overflow-y-auto pr-2">
          {Object.entries(KEY_VSTS_CATEGORIZED).map(([category, vsts]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-gray-400 mb-2">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {vsts.map(vst => (
                  <ToggleChip
                    key={vst}
                    text={vst}
                    isActive={sunoPromptTags.includes(vst)}
                    onClick={() => handleToggleTag(vst)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      <Accordion title="Advanced Settings">
        <div className="space-y-6 pt-4">
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
          <ToggleSwitch
            label="Advanced Metatag Editor"
            enabled={showMetatagEditor}
            onChange={setShowMetatagEditor}
          />
        </div>
      </Accordion>

      {/* Prompt Generator Section */}
      <div className="pt-6 border-t border-gray-700 space-y-6">
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-purple-300">Suno Style Prompt</h3>
                    <button 
                      onClick={onClearSunoPromptTags} 
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                      disabled={sunoPromptTags.length === 0}
                    >
                      Clear All
                    </button>
                  </div>
                  <div className={`flex items-center gap-2 transition-transform duration-300 ${charCountExceeded ? 'scale-110' : ''}`}>
                    <CharCountCircle count={charCount} limit={1000} color="purple" />
                    <span className={`font-mono text-sm ${charCount > 1000 ? 'text-red-400' : 'text-gray-400'}`}>/ 1000</span>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={onGenerateSunoPrompt} disabled={isPromptLoading || !topic.trim()} variant="secondary" className="flex-grow">
                  <Icon name="regenerate" />
                  {isPromptLoading ? 'Working...' : 'Generate Style Suggestions'}
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
          
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-rose-300">Exclude From Style</h3>
                  <div className={`flex items-center gap-2 transition-transform duration-300 ${excludeCharCountExceeded ? 'scale-110' : ''}`}>
                     <CharCountCircle count={excludeCharCount} limit={1000} color="rose"/>
                     <span className={`font-mono text-sm ${excludeCharCount > 1000 ? 'text-red-400' : 'text-gray-400'}`}>/ 1000</span>
                  </div>
              </div>
              
              <div className="bg-gray-900/70 border border-gray-600 rounded-lg p-3 min-h-[120px]">
                <>
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
                </>
              </div>
              {sunoExcludeTags.length > 0 && (
                 <Button onClick={handleExcludeCopy} variant="secondary" fullWidth>
                    <Icon name="copy" />
                    {excludeCopyText}
                </Button>
              )}
          </div>
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
