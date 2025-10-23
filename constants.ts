
export const GENRES: string[] = [
  'None',
  ...[
    'Ambient',
    'Chiptune',
    'Country',
    'Electronic',
    'Folk',
    'Hip-Hop',
    'Indie',
    'J-Pop',
    'J-Rock',
    'JRPG BGM',
    'Jazz',
    'K-Pop',
    'Lo-fi',
    'Metal',
    'Pop',
    'R&B',
    'Rock',
    'Soundtrack',
    'Synthwave',
    'Video Game BGM',
  ].sort()
];

export const MOODS: string[] = [
  'None',
  ...[
    'Aggressive',
    'Chill',
    'Creepy',
    'Dark',
    'Dreamy',
    'Energetic',
    'Epic',
    'Happy',
    'Hopeful',
    'Melancholic',
    'Mysterious',
    'Romantic',
    'Sad',
    'Uplifting',
  ].sort()
];

export const LANGUAGES: string[] = [
  'No Language',
  'English',
  'Japanese',
  'Spanish',
  'French',
  'German',
  'Korean',
  'Italian',
  'Portuguese',
];

export const SONG_STRUCTURES = [
    { name: 'Select a template...', template: '' },
    { name: 'Verse-Chorus-Verse-Chorus', template: '[Verse 1]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]' },
    { name: 'Verse-Chorus-Bridge-Chorus', template: '[Verse 1]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]' },
    { name: 'AABA', template: '[Part A]\n\n[Part A]\n\n[Part B (Bridge)]\n\n[Part A]' },
    { name: 'Anime Opening (TV Size)', template: '[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Outro]' },
    { name: 'Anime Opening (Full Size)', template: '[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Bridge]\n\n[Guitar Solo]\n\n[Chorus]\n\n[Outro]' },
    { name: 'Anime Ending (TV Size)', template: '[Verse]\n\n[Chorus]\n\n[Bridge]\n\n[Outro]' },
    { name: 'Anime Ending (Full Size)', template: '[Intro]\n\n[Verse 1]\n\n[Chorus]\n\n[Verse 2]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]' },
    { name: 'J-Pop / J-Rock Structure', template: '[Intro]\n\n[Verse A]\n\n[Verse B / Pre-Chorus]\n\n[Chorus]\n\n[Interlude / Guitar Solo]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]' },
    { name: 'Custom Full Song', template: '[Intro]\n\n[Verse 1]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Verse 2]\n\n[Pre-Chorus]\n\n[Chorus]\n\n[Bridge]\n\n[Chorus]\n\n[Outro]' }
];

export const KEY_INSTRUMENTS: Record<string, string[]> = {
    'Keyboards & Synths': [
        'Accordion', 'Choir Synthesizer', 'Electric Piano', 'Hammond B3 Organ',
        'Keyboard', 'Modular Synth', 'Organ', 'Piano', 'Rhodes Piano', 'Synthesizer',
        'Theremin', 'Vocoder', 'Wurlitzer'
    ].sort(),
    'Guitars & Bass': [
        'Acoustic Guitar', 'Bass', 'Bass Guitar', 'Electric Guitar', 'Symphonic Guitar'
    ].sort(),
    'Strings': [
        'Cello', 'Harp', 'Strings', 'Violin'
    ].sort(),
    'Brass': [
        'Horns', 'Trombone', 'Trumpet'
    ].sort(),
    'Woodwinds': [
        'Bagpipes', 'Clarinet', 'Flute', 'Harmonica', 'Oboe', 'Saxophone', 'Shakuhachi'
    ].sort(),
    'Percussion': [
        '808 Drum Machine', '909 Drum Machine', 'Cajon', 'Congas', 'Djembe', 'Drums',
        'Glockenspiel', 'Handpan', 'Kalimba', 'Marimba', 'Percussion', 'Tabla',
        'Taiko Drums', 'Xylophone'
    ].sort(),
    'Folk & World': [
        'Banjo', 'Koto', 'Mandolin', 'Oud', 'Shamisen', 'Sitar', 'Ukulele'
    ].sort(),
    'Electronic & DJ': [
        'Turntables'
    ].sort()
};

export const PRODUCTION_TECHNIQUES_CATEGORIZED: Record<string, string[]> = {
    'Rhythm & Tempo': [
        'Driving Rhythm', 'Intricate Drum Fills', 'Polyrhythmic', 'Slow Tempo', 'Upbeat Tempo'
    ].sort(),
    'Mixing & Effects': [
        '80s Gated Reverb', 'Atmospheric', 'Crisp Mix', 'Ethereal Pads', 'Gritty Distortion',
        'Heavy Reverb', 'Sidechain Compression', 'Vintage Tape Saturation'
    ].sort(),
    'Harmony & Melody': [
        'Arpeggiated', 'Catchy Melodies', 'Dissonant Chords', 'Lush Harmonies', 'Melodic Bassline',
        'Slick Bassline', 'Soaring Anime Vocals'
    ].sort(),
    'Arrangement & Dynamics': [
        'Dynamic Builds', 'Epic Orchestral Mix', 'Intricate Arrangements', 'Minimalist Repetition',
        'Orchestral Stabs'
    ].sort(),
    'Genre & Vibe': [
        'City Pop Groove', 'J-Rock Energy', 'Kawaii Future Bass', 'Lo-fi Aesthetic', 'Modern Pop Sheen',
        'Shibuya-kei Influence', 'Technical Guitar Riff', 'Twangy Guitar', 'Warm Analog Synths'
    ].sort()
};

export const KEY_VSTS_CATEGORIZED: Record<string, string[]> = {
    'Synthesizers': [
        'Arp Sequence', 'Diva', 'FM Synthesis Pad', 'Massive X', 'Moog Subsequent',
        'Nexus 4', 'Omnisphere', 'Serum', 'Spire', 'Supersaw Lead', 'Vocaloid Synth'
    ].sort(),
    'Bass': [
        '808 Sub Bass', 'Wobbly Bass'
    ].sort(),
    'Sample Libraries': [
        'Arturia Piano', 'EastWest Hollywood Strings', 'Kontakt Noire Piano', 'Spitfire Albion One'
    ].sort(),
    'Effects & Processing': [
        'Bitcrushed', 'Glitch Effects', 'Granular Texture', 'Professional Mastering',
        'Risers/Sweeps', 'Trance Gate', 'Warped Vocal Sample'
    ].sort()
};
