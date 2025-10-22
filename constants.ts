
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

export const KEY_INSTRUMENTS = [
    '808 Drum Machine', '909 Drum Machine', 'Accordion', 'Acoustic Guitar', 'Bagpipes', 'Banjo', 'Bass', 'Bass Guitar', 'Cajon', 'Cello', 'Choir Synthesizer', 'Clarinet', 'Congas', 'Djembe', 'Drums', 'Electric Guitar', 'Electric Piano', 'Flute', 'Glockenspiel', 'Hammond B3 Organ', 'Handpan', 'Harmonica', 'Harp', 'Keyboard', 'Koto', 'Mandolin', 'Marimba', 'Modular Synth', 'Oboe', 'Organ', 'Oud', 'Percussion', 'Piano', 'Rhodes Piano', 'Saxophone', 'Shakuhachi', 'Shamisen', 'Sitar', 'Strings', 'Symphonic Guitar', 'Synthesizer', 'Tabla', 'Taiko Drums', 'Theremin', 'Trombone', 'Trumpet', 'Turntables', 'Ukulele', 'Violin', 'Vocoder', 'Wurlitzer', 'Xylophone'
].sort();

export const PRODUCTION_TECHNIQUES = [
    '80s Gated Reverb', 'Arpeggiated', 'Atmospheric', 'Catchy Melodies', 'City Pop Groove', 'Crisp Mix', 'Dissonant Chords', 'Driving Rhythm', 'Dynamic Builds', 'Epic Orchestral Mix', 'Ethereal Pads', 'Gritty Distortion', 'Heavy Reverb', 'Intricate Arrangements', 'Intricate Drum Fills', 'J-Rock Energy', 'Kawaii Future Bass', 'Lo-fi Aesthetic', 'Lush Harmonies', 'Melodic Bassline', 'Minimalist Repetition', 'Modern Pop Sheen', 'Orchestral Stabs', 'Polyrhythmic', 'Punchy Drums', 'Shibuya-kei Influence', 'Sidechain Compression', 'Slick Bassline', 'Slow Tempo', 'Soaring Anime Vocals', 'Technical Guitar Riff', 'Twangy Guitar', 'Upbeat Tempo', 'Vintage Tape Saturation', 'Warm Analog Synths'
].sort();

export const KEY_VSTS = [
    '808 Sub Bass', 'Arp Sequence', 'Arturia Piano', 'Bitcrushed', 'Diva', 'EastWest Hollywood Strings', 'FM Synthesis Pad', 'Glitch Effects', 'Granular Texture', 'Kontakt Noire Piano', 'Massive X', 'Moog Subsequent', 'Nexus 4', 'Omnisphere', 'Professional Mastering', 'Risers/Sweeps', 'Serum', 'Spire', 'Spitfire Albion One', 'Supersaw Lead', 'Trance Gate', 'Vocaloid Synth', 'Warped Vocal Sample', 'Wobbly Bass'
].sort();
