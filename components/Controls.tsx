
import React, { useState, useMemo, useEffect } from 'react';
import { Accordion } from './Accordion';
import { Button } from './Button';
import { CharCountCircle } from './CharCountCircle';
import { Chip } from './Chip';
import { Icon } from './Icon';
import { Select } from './Select';
import { StyleBlender } from './StyleBlender';
import { StyleDeconstructor } from './StyleDeconstructor';
import { StyleTemplates } from './StyleTemplates';
import { TagInput } from './TagInput';
import { ToggleChip } from './ToggleChip';
import { ToggleSwitch } from './ToggleSwitch';
import { BpmTapper } from './BpmTapper';
import { GENRES, MOODS, LYRICAL_STYLES, COUNTRY_VIBES, LANGUAGES, STYLE_STUDIO_TAGS } from '../constants';

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
  onStartNewSong: () => void;
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

const STUDIO_TABS: { key: string; name: string }[] = Object.keys(STYLE_STUDIO_TAGS).map(key => ({ key, name: key }));

export const Controls: React.FC<ControlsProps> = (props) => {
    const {
        topic, setTopic, title, setTitle, isInstrumental, setIsInstrumental, genre, setGenre, mood, setMood, lyricalStyle, setLyricalStyle, countryVibe, setCountryVibe, onSurpriseMe, isSurprisingMe, onImproveTopic, isImproving, previousTopic, onUndoTopicImprovement,
        language, setLanguage, voiceStyle, setVoiceStyle, bpm, setBpm, onGenerate, isLoading, artists, setArtists, onGenerateSunoPrompt, isPromptLoading, sunoPromptTags, setSunoPromptTags, sunoExcludeTags, setSunoExcludeTags, promptError, onStartNewSong, showMetatagEditor, setShowMetatagEditor, previousSunoPromptTags, onUndoStyleSuggestion, onClearSunoPromptTags
    } = props;

    const [promptCopyText, setPromptCopyText] = useState('Copy');
    const [charCountExceeded, setCharCountExceeded] = useState(false);
    const [excludeCopyText, setExcludeCopyText] = useState('Copy');
    const [excludeCharCountExceeded, setExcludeCharCountExceeded] = useState(false);
    const [activeStudioTab, setActiveStudioTab] = useState<string>(STUDIO_TABS[0].key);
    const [draggedTag, setDraggedTag] = useState<string | null>(null);
    const [activeStudioCategory, setActiveStudioCategory] = useState<string>(Object.keys(STYLE_STUDIO_TAGS[activeStudioTab])[0]);

    useEffect(() => {
        setActiveStudioCategory(Object.keys(STYLE_STUDIO_TAGS[activeStudioTab])[0]);
    }, [activeStudioTab]);

    const sunoPromptString = useMemo(() => sunoPromptTags.join(', '), [sunoPromptTags]);
    const sunoExcludeString = useMemo(() => sunoExcludeTags.join(', '), [sunoExcludeTags]);

    useEffect(() => { setCharCountExceeded(sunoPromptString.length > 1000); }, [sunoPromptString]);
    useEffect(() => { setExcludeCharCountExceeded(sunoExcludeString.length > 1000); }, [sunoExcludeString]);

    const handleCopy = (textToCopy: string, setText: (text: string) => void, originalText: string) => {
        navigator.clipboard.writeText(textToCopy);
        setText('Copied!');
        setTimeout(() => setText(originalText), 2000);
    };

    const addTag = (tag: string): boolean => {
        if (!sunoPromptTags.find(t => t.toLowerCase() === tag.toLowerCase())) {
            const newTags = [...sunoPromptTags, tag];
            setSunoPromptTags(newTags);
            return true;
        }
        return false;
    };
    const removeTag = (tagToRemove: string) => setSunoPromptTags(sunoPromptTags.filter(tag => tag !== tagToRemove));

    const addExcludeTag = (tag: string): boolean => {
        if (!sunoExcludeTags.find(t => t.toLowerCase() === tag.toLowerCase())) {
            setSunoExcludeTags([...sunoExcludeTags, tag]);
            return true;
        }
        return false;
    };
    const removeExcludeTag = (tagToRemove: string) => setSunoExcludeTags(sunoExcludeTags.filter(tag => tag !== tagToRemove));

    const allTagSuggestions = useMemo(() => {
        return Object.values(STYLE_STUDIO_TAGS).flatMap(categoryData => Object.values(categoryData).flat());
    }, []);
    
    const handleDragStart = (tag: string) => setDraggedTag(tag);
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (draggedTag) {
            addTag(draggedTag);
            setDraggedTag(null);
        }
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const isBusy = isImproving || isSurprisingMe;

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-lg h-full flex flex-col">
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="flex flex-col gap-0">
                    <h2 className="text-xl font-bold text-gray-200 px-1 pb-2">Song Settings</h2>
                    
                    <Accordion id="song-dna-section" title="Core Concept" defaultOpen={true} storageKey="accordion-core-concept-v1">
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        {previousTopic !== null && (
                                            <Button onClick={onUndoTopicImprovement} disabled={isBusy} variant="secondary" className="!py-1 !px-2.5 text-xs">
                                                <Icon name="undo" className="w-4 h-4" />
                                                Undo
                                            </Button>
                                        )}
                                        <label htmlFor="topic" className={`block text-sm font-medium text-gray-300 transition-opacity ${isBusy ? 'opacity-50' : ''}`}>Song Topic</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button onClick={onImproveTopic} disabled={!topic.trim() || isBusy} variant="secondary" className="!py-1 !px-2.5 text-xs">
                                            <Icon name="regenerate" className="w-4 h-4" />
                                            {isImproving ? 'Improving...' : 'Improve'}
                                        </Button>
                                        <Button onClick={onSurpriseMe} disabled={isBusy} variant="secondary" className="!py-1 !px-2.5 text-xs">
                                            <Icon name="regenerate" className="w-4 h-4" />
                                            {isSurprisingMe ? 'Thinking...' : 'Surprise Me'}
                                        </Button>
                                    </div>
                                </div>
                                <textarea id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., a lonely astronaut watching Earth from Mars" className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed" rows={3} disabled={isBusy}/>
                            </div>
                            <div>
                                <label htmlFor="title" className={`block text-sm font-medium text-gray-300 mb-2 transition-opacity ${isBusy ? 'opacity-50' : ''}`}>Song Title (Optional)</label>
                                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="If blank, AI will generate one" className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed" disabled={isBusy}/>
                            </div>
                            <ToggleSwitch label="Make Instrumental" enabled={isInstrumental} onChange={setIsInstrumental} disabled={isBusy}/>
                        </div>
                    </Accordion>

                    <Accordion title="Musical Vibe" defaultOpen={true} storageKey="accordion-musical-vibe-v1">
                        <div className="space-y-4">
                            <Select label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={GENRES} disabled={isBusy} />
                            <Select label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={MOODS} disabled={isBusy} />
                            <Select label="Country of Influence (Optional)" value={countryVibe} onChange={(e) => setCountryVibe(e.target.value)} options={COUNTRY_VIBES} disabled={isBusy} />
                        </div>
                    </Accordion>

                    <Accordion title="Lyrical & Vocal Style" storageKey="accordion-lyrical-vocal-v1">
                        <div className="space-y-4">
                            <Select label="Lyrical Style" value={lyricalStyle} onChange={(e) => setLyricalStyle(e.target.value)} options={LYRICAL_STYLES} disabled={isInstrumental || isBusy}/>
                            <Select label="Language" value={language} onChange={(e) => setLanguage(e.target.value)} options={LANGUAGES} disabled={isInstrumental} />
                            <div>
                                <label htmlFor="voiceStyle" className="block text-sm font-medium text-gray-300 mb-2">Voice Style / Vocalist Description</label>
                                <input type="text" id="voiceStyle" value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)} placeholder="e.g., soulful female vocals, raw male baritone" className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:bg-gray-800/50 disabled:cursor-not-allowed" disabled={isInstrumental}/>
                            </div>
                        </div>
                    </Accordion>
                    
                    <Accordion id="style-of-music-section" title="AI Style Prompt" defaultOpen={true} storageKey="accordion-ai-style-prompt-v1">
                        <div className="space-y-3">
                            <div onDrop={handleDrop} onDragOver={handleDragOver} className={`min-h-[120px] bg-gray-900/70 border ${charCountExceeded ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3 flex flex-col`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        {previousSunoPromptTags !== null && (
                                            <Button onClick={onUndoStyleSuggestion} variant="secondary" className="!py-1 !px-2.5 text-xs"><Icon name="undo" className="w-4 h-4" /> Undo</Button>
                                        )}
                                        <label htmlFor="suno-prompt" className="block text-sm font-medium text-gray-300">Style Prompt</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CharCountCircle count={sunoPromptString.length} limit={1000} />
                                        <Button onClick={() => handleCopy(sunoPromptString, setPromptCopyText, 'Copy')} variant="secondary" className="!py-1 !px-2.5 text-xs">{promptCopyText}</Button>
                                    </div>
                                </div>
                                <div className="flex-grow flex flex-wrap gap-2 content-start pt-2">
                                    {sunoPromptTags.length === 0 ? (
                                        <p className="text-gray-500 text-sm p-1">Use "Generate Suggestions" or add tags from the Studio & Tools below.</p>
                                    ) : (
                                        sunoPromptTags.map(tag => <Chip key={tag} text={tag} onRemove={() => removeTag(tag)} />)
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button onClick={onClearSunoPromptTags} variant="secondary">Clear All Tags</Button>
                                <Button onClick={onGenerateSunoPrompt} disabled={isPromptLoading}><Icon name="regenerate" className={isPromptLoading ? 'animate-spin' : ''} />{isPromptLoading ? 'Generating...' : 'Generate Suggestions'}</Button>
                            </div>
                            {promptError && <p className="text-red-400 text-xs text-center">{promptError}</p>}
                        </div>
                    </Accordion>

                    <Accordion title="Studio & Tools" storageKey="accordion-studio-tools-v1">
                        <div className="space-y-4">
                            <StyleTemplates onApplyTemplate={(tags) => setSunoPromptTags(Array.from(new Set([...sunoPromptTags, ...tags])))} />
                            <Accordion title="AI Style Tools" defaultOpen={false} storageKey="accordion-ai-tools-v1">
                                <div className="space-y-4">
                                    <StyleBlender onTagsGenerated={(tags) => setSunoPromptTags(Array.from(new Set([...sunoPromptTags, ...tags])))} />
                                    <StyleDeconstructor onDeconstruct={(tags) => setSunoPromptTags(Array.from(new Set([...sunoPromptTags, ...tags])))} />
                                </div>
                            </Accordion>
                            <Accordion title="Style Studio" defaultOpen={false} storageKey="accordion-style-studio-v1">
                              <div className="space-y-4">
                                <div className="border-b border-gray-700">
                                    <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
                                        {STUDIO_TABS.map((tab) => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveStudioTab(tab.key)}
                                                className={`${ tab.key === activeStudioTab ? 'border-purple-400 text-purple-300' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
                                                    whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
                                            >
                                                {tab.name}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                                <TagInput onAddTag={addTag} allSuggestions={allTagSuggestions} existingTags={sunoPromptTags} />
                                <div className="flex gap-4" style={{ height: '350px' }}>
                                    <div className="w-1/3 flex-shrink-0 bg-gray-900/50 rounded-lg p-2 overflow-y-auto">
                                        <ul className="space-y-1">
                                            {Object.keys(STYLE_STUDIO_TAGS[activeStudioTab]).map(category => (
                                                <li key={category}>
                                                    <button onClick={() => setActiveStudioCategory(category)} className={`w-full text-left text-sm p-2 rounded-md transition-colors ${activeStudioCategory === category ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700/50'}`}>
                                                        {category}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="w-2/3 flex-grow bg-gray-900/50 rounded-lg p-3 overflow-y-auto">
                                        {activeStudioCategory && STYLE_STUDIO_TAGS[activeStudioTab][activeStudioCategory] && (
                                            <div className="flex flex-wrap gap-2">
                                                {STYLE_STUDIO_TAGS[activeStudioTab][activeStudioCategory].map(tag => (
                                                    <div key={tag} draggable onDragStart={() => handleDragStart(tag)} className="cursor-grab">
                                                        <ToggleChip text={tag} isActive={sunoPromptTags.includes(tag)} onClick={() => sunoPromptTags.includes(tag) ? removeTag(tag) : addTag(tag)} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 text-center italic">Tip: Click a tag to add it to your prompt, or drag it into the box above!</p>
                              </div>
                            </Accordion>
                            <Accordion title="Advanced Editor" defaultOpen={false} storageKey="accordion-advanced-style-v1">
                               <div className="space-y-4">
                                    <div>
                                        <label htmlFor="artists" className="block text-sm font-medium text-gray-300 mb-2">Inspirational Artists / Keywords</label>
                                        <input type="text" id="artists" value={artists} onChange={(e) => setArtists(e.target.value)} placeholder="e.g., Daft Punk, Chrono Trigger OST, Queen" className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"/>
                                        <p className="mt-1 text-xs text-gray-400">The AI will analyze their style, not use their names.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label htmlFor="bpm" className="block text-sm font-medium text-gray-300 mb-2">BPM</label>
                                          <input type="text" id="bpm" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="e.g., 120" className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"/>
                                      </div>
                                      <div className="pt-7"><BpmTapper onBpmChange={setBpm} /></div>
                                    </div>

                                    <div className="pt-2"><ToggleSwitch label="Metatag Inspector in Editor" enabled={showMetatagEditor} onChange={setShowMetatagEditor} /></div>

                                    <div>
                                        <div className={`bg-gray-900/70 border ${excludeCharCountExceeded ? 'border-red-500' : 'border-gray-600'} rounded-lg p-3 flex flex-col`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <label htmlFor="suno-exclude" className="block text-sm font-medium text-gray-300">Negative Prompt</label>
                                                <div className="flex items-center gap-2">
                                                    <CharCountCircle count={sunoExcludeString.length} limit={1000} color="rose" />
                                                    <Button onClick={() => handleCopy(sunoExcludeString, setExcludeCopyText, 'Copy')} variant="secondary" className="!py-1 !px-2.5 text-xs">{excludeCopyText}</Button>
                                                </div>
                                            </div>
                                            <div className="flex-grow flex flex-wrap gap-2 content-start pt-2">
                                                {sunoExcludeTags.map(tag => <Chip key={tag} text={tag} onRemove={() => removeExcludeTag(tag)} color="rose" />)}
                                            </div>
                                        </div>
                                        <TagInput onAddTag={addExcludeTag} allSuggestions={[]} existingTags={sunoExcludeTags} />
                                    </div>
                                </div>
                            </Accordion>
                        </div>
                    </Accordion>
                </div>
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-900/30 rounded-b-2xl flex-shrink-0">
                <div className="flex items-center gap-4">
                    <Button onClick={onStartNewSong} variant="secondary"><Icon name="plus" className="w-5 h-5"/> New Song</Button>
                    <Button id="generate-button" onClick={onGenerate} disabled={isLoading || !topic.trim()} fullWidth>{isLoading ? (isInstrumental ? 'Generating Instrumental...' : 'Generating Lyrics...') : (isInstrumental ? 'Generate Instrumental' : 'Generate Lyrics')}</Button>
                </div>
            </div>
        </div>
    );
};
