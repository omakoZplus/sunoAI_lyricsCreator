


import React from 'react';
import { GENRES, MOODS, LYRICAL_STYLES, COUNTRY_VIBES } from '../constants';
import { Select } from './Select';
import { Button } from './Button';
import { Icon } from './Icon';
import { ToggleSwitch } from './ToggleSwitch';

interface SongDNAProps {
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
  onSurpriseMe: () => void;
  isSurprisingMe: boolean;
  onImproveTopic: () => void;
  isImproving: boolean;
  previousTopic: string | null;
  onUndoTopicImprovement: () => void;
}

export const SongDNA: React.FC<SongDNAProps> = ({
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
  lyricalStyle,
  setLyricalStyle,
  countryVibe,
  setCountryVibe,
  onSurpriseMe,
  isSurprisingMe,
  onImproveTopic,
  isImproving,
  previousTopic,
  onUndoTopicImprovement,
}) => {
    const isBusy = isImproving || isSurprisingMe;

    return (
        <div id="song-dna-section" className="space-y-6 bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700 shadow-lg">
            <h2 className="text-xl font-bold text-gray-200">Song DNA</h2>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        {previousTopic !== null && (
                            <Button onClick={onUndoTopicImprovement} disabled={isBusy} variant="secondary" className="!py-1 !px-2.5 text-xs">
                                <Icon name="undo" className="w-4 h-4" />
                                Undo
                            </Button>
                        )}
                        <label htmlFor="topic" className={`block text-sm font-medium text-gray-300 transition-opacity ${isBusy ? 'opacity-50' : ''}`}>
                            Song Topic
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={onImproveTopic} disabled={!topic.trim() || isBusy} variant="secondary" className="!py-1 !px-2.5 text-xs">
                            <Icon name="regenerate" className="w-4 h-4" />
                            {isImproving ? 'Improving...' : 'Improve Topic'}
                        </Button>
                        <Button onClick={onSurpriseMe} disabled={isBusy} variant="secondary" className="!py-1 !px-2.5 text-xs">
                            <Icon name="regenerate" className="w-4 h-4" />
                            {isSurprisingMe ? 'Thinking...' : 'Surprise Me'}
                        </Button>
                    </div>
                </div>
                <textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., a lonely astronaut watching Earth from Mars"
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={3}
                    disabled={isBusy}
                />
            </div>
            <div>
                <label htmlFor="title" className={`block text-sm font-medium text-gray-300 mb-2 transition-opacity ${isBusy ? 'opacity-50' : ''}`}>
                    Song Title (Optional)
                </label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="If blank, AI will generate one"
                    className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isBusy}
                />
            </div>
            <ToggleSwitch 
                label="Make Instrumental"
                enabled={isInstrumental}
                onChange={setIsInstrumental}
                disabled={isBusy}
            />
            <Select label="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} options={GENRES} disabled={isBusy} />
            <Select label="Mood" value={mood} onChange={(e) => setMood(e.target.value)} options={MOODS} disabled={isBusy} />
            <Select label="Country of Influence (Optional)" value={countryVibe} onChange={(e) => setCountryVibe(e.target.value)} options={COUNTRY_VIBES} disabled={isBusy} />
            <Select label="Lyrical Style" value={lyricalStyle} onChange={(e) => setLyricalStyle(e.target.value)} options={LYRICAL_STYLES} disabled={isInstrumental || isBusy}/>
        </div>
    );
};