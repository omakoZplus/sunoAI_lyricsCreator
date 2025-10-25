
export const GENRES: string[] = [
  'None',
  ...[
    'Afrobeats',
    'Alternative Rock',
    'Ambient',
    'Blues',
    'Chiptune',
    'Classical',
    'Country',
    'Dance',
    'Death Metal',
    'Disco',
    'Drum and Bass',
    'Dubstep',
    'EDM',
    'Electronic',
    'Emo',
    'Folk',
    'Funk',
    'Gospel',
    'Grunge',
    'Hip-Hop',
    'House',
    'Indie',
    'Industrial',
    'J-Pop',
    'J-Rock',
    'JRPG BGM',
    'Jazz',
    'K-Pop',
    'Latin',
    'Lo-fi',
    'Metal',
    'New Wave',
    'Opera',
    'Pop',
    'Pop Punk',
    'Psychedelic Rock',
    'Punk Rock',
    'R&B',
    'Reggae',
    'Reggaeton',
    'Rock',
    'Ska',
    'Soul',
    'Soundtrack',
    'Synthwave',
    'Techno',
    'Trance',
    'Trap',
    'Video Game BGM',
  ].sort()
];

export const MOODS: string[] = [
  'None',
  ...[
    'Aggressive',
    'Anxious',
    'Calm',
    'Chill',
    'Comedic',
    'Confident',
    'Confused',
    'Creepy',
    'Dark',
    'Dramatic',
    'Dreamy',
    'Energetic',
    'Epic',
    'Euphoric',
    'Fierce',
    'Funky',
    'Glorious',
    'Goofy',
    'Groovy',
    'Happy',
    'Heartbreak',
    'Hopeful',
    'Introspective',
    'Lonely',
    'Melancholic',
    'Mysterious',
    'Nostalgic',
    'Peaceful',
    'Playful',
    'Powerful',
    'Quirky',
    'Rebellious',
    'Reflective',
    'Romantic',
    'Sad',
    'Sensual',
    'Serene',
    'Silly',
    'Somber',
    'Tense',
    'Triumphant',
    'Uplifting',
    'Whimsical',
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

export const STYLE_TEMPLATES = [
  {
    name: '80s Power Ballad',
    tags: ['80s rock ballad', 'powerful male vocals', 'emotional piano melody', 'epic guitar solo', 'gated reverb on drums', 'lush synthesizers', 'slow tempo', 'dynamic builds', 'anthem chorus']
  },
  {
    name: 'Modern Lo-fi Beat',
    tags: ['lo-fi hip hop', 'chillhop', 'jazzy chords', 'boom bap drum pattern', 'vinyl crackle', 'tape hiss', 'relaxed tempo', 'mellow rhodes piano', 'nostalgic mood', 'instrumental']
  },
  {
    name: 'Epic Movie Trailer Score',
    tags: ['cinematic orchestral music', 'epic score', 'hybrid orchestra', 'dramatic choir', 'braaam sound effects', 'huge percussion hits', 'building tension', 'triumphant theme', 'sound design elements', 'instrumental']
  },
  {
    name: 'Synthwave Racer',
    tags: ['synthwave', 'retrowave', '80s aesthetic', 'driving beat', 'arpeggiated synth bass', 'neon grid visuals', 'fast tempo', 'sawtooth synth leads', 'vintage drum machine']
  },
  {
    name: 'Acoustic Folk',
    tags: ['singer-songwriter', 'acoustic folk', 'intimate male vocals', 'fingerpicked acoustic guitar', 'gentle harmonica', 'warm and organic production', 'heartfelt storytelling']
  },
  {
    name: 'JRPG Battle Theme',
    tags: ['JRPG battle music', '16-bit soundfont', 'chiptune elements', 'fast-paced orchestral rock', 'electric guitar riffs', 'upbeat and intense', 'memorable melody', 'SNES-style reverb', 'video game OST']
  }
];

export const KEY_INSTRUMENTS: Record<string, string[]> = {
    'Keyboards & Synths': [
        '8-bit Synth', 'Accordion', 'Acid Bassline', 'Choir Synthesizer', 'Chiptune Synth', 'Electric Piano',
        'FM Synth Bass', 'Hammond B3 Organ', 'Harpsichord', 'Keyboard', 'Modular Synth', 'Organ',
        'Overdriven Organ', 'Piano', 'Pluck Synth', 'Reese Bass', 'Rhodes Piano', 'Sawtooth Synth Lead', 'Square Wave Synth',
        'Sub Bass', 'Supersaw', 'Synth Pad', 'Synthesizer', 'Theremin', 'Vocoder', 'Wavetable Synth', 'Wobble Bass', 'Wurlitzer'
    ].sort(),
    'Guitars & Bass': [
        '12-string Acoustic Guitar', 'Acoustic Guitar', 'Bass', 'Bass Guitar', 'Electric Guitar',
        'Overdriven Guitar', 'Steel-string Acoustic Guitar', 'Symphonic Guitar'
    ].sort(),
    'Strings': [
        'Cello', 'Contrabasses', 'Harp', 'Strings', 'Violin'
    ].sort(),
    'Brass': [
        'Horns', 'Trombone', 'Trumpet'
    ].sort(),
    'Woodwinds': [
        'Bagpipes', 'Basson', 'Clarinet', 'Flute', 'Harmonica', 'Oboe', 'Pan Flute', 'Recorder', 'Saxophone', 'Shakuhachi'
    ].sort(),
    'Percussion': [
        '8-bit Drums', '808 Drum Machine', '808 Kick', '909 Drum Machine', '909 Snare', 'Cajon', 'Chimes', 'Clap', 'Classic Percussion', 'Congas',
        'Djembe', 'Drums', 'Glockenspiel', 'Handpan', 'Hi-hats', 'Kalimba', 'Kick Drum', 'Latin Percussion', 'Marimba', 'Percussion',
        'Retro Drum Machine', 'Tabla', 'Taiko Drums', 'Tubular Bells', 'Xylophone'
    ].sort(),
    'Folk & World': [
        'Banjo', 'Bouzouki', 'Koto', 'Mandolin', 'Oud', 'Shamisen', 'Sitar', 'Ukulele'
    ].sort(),
    'Electronic & DJ': [
        'Turntables',
        'DJ Mixer',
        'Drum Machine',
        'FX Samples',
        'Groovebox',
        'Sampler',
        'Vocal Samples',
    ].sort()
};

export const PRODUCTION_TECHNIQUES_CATEGORIZED: Record<string, string[]> = {
    'Rhythm & Tempo': [
        'Driving Rhythm', 'Four-on-the-floor', 'Intense Boss Battle Rhythm', 'Intricate Drum Fills', 'Polyrhythmic', 'Slow Tempo', 'Upbeat Tempo'
    ].sort(),
    'Mixing & Effects': [
        '80s Gated Reverb', 'Atmospheric', 'Big Room Reverb', 'Bitcrushing', 'Crisp Mix', 'Ethereal Pads', 'Filter Sweep', 'Gritty Distortion',
        'Heavy Reverb', 'Lo-fi Filtering', 'Sidechain Compression', 'Vintage Tape Saturation'
    ].sort(),
    'Harmony & Melody': [
        'Arpeggiated', 'Catchy Melodies', 'Dissonant Chords', 'Lush Harmonies', 'Melodic Bassline',
        'Slick Bassline', 'Soaring Anime Vocals'
    ].sort(),
    'Arrangement & Dynamics': [
        'Buildup', 'Drop', 'Dynamic Builds', 'Epic Orchestral Mix', 'Intricate Arrangements', 'Minimalist Repetition',
        'Orchestral Stabs', 'Riser'
    ].sort(),
    'Genre & Vibe': [
        'City Pop Groove', 'J-Rock Energy', 'Kawaii Future Bass', 'Lo-fi Aesthetic', 'Modern Pop Sheen',
        'Shibuya-kei Influence', 'Technical Guitar Riff', 'Twangy Guitar', 'Warm Analog Synths'
    ].sort(),
    'Retro & Chiptune': [
        '8-bit Sound Design', 'Bitcrushed Drums', 'Catchy 8-bit Melody', 'Chiptune Harmonies',
        'Earthbound-inspired Sample Chops', 'Fast Arpeggios', 'Quirky Sound Effects (SFX)',
        'SNES-style Reverb', 'Video Game OST Feel'
    ].sort()
};

export const KEY_VSTS_CATEGORIZED: Record<string, string[]> = {
    'Synthesizers': [
        '3xOsc',
        'Arp Sequence',
        'Diva',
        'FM Synthesis Pad',
        'Magical 8bit Plug',
        'Massive',
        'Massive X',
        'Moog Subsequent',
        'NES Synth',
        'Nexus 4',
        'Omnisphere',
        'SID Chip Emulation',
        'Spire',
        'Supersaw Lead',
        'Sylenth1',
        'Vocaloid Synth',
        'Xfer Serum',
        'Yamaha DX7-style FM Pad'
    ].sort(),
    'Bass': [
        '808 Sub Bass', 'Wobbly Bass'
    ].sort(),
    'Sample Libraries': [
        'Arturia Piano',
        'EastWest Hollywood Strings',
        'Kontakt',
        'Kontakt Noire Piano',
        'Shreddage X',
        'Spitfire Albion One',
        'Spitfire Audio LABS Soft Piano'
    ].sort(),
    'Samples & Soundfonts': [
      'Classic JRPG Soundfont',
      'GBA-style Soundfont',
      'Japanese Indie Game Soundfont',
      'Orchestral Hit Stab',
      'Retro Game Samples',
      'SGM Soundfont',
      'SNES Soundfont'
    ].sort(),
    'Effects & Processing': [
        'Bitcrushed', 'CamelCrusher', 'Glitch Effects', 'Granular Texture', 'OTT Compression', 'Professional Mastering',
        'Risers/Sweeps', 'Trance Gate', 'Warped Vocal Sample'
    ].sort()
};

export const MOOD_COLORS: Record<string, { from: string; via: string; to: string }> = {
  'None': { from: '#111827', via: 'rgba(76, 29, 149, 0.4)', to: '#111827' },
  'Happy': { from: '#f59e0b', via: 'rgba(234, 179, 8, 0.3)', to: '#111827' },
  'Sad': { from: '#1e3a8a', via: 'rgba(55, 65, 81, 0.4)', to: '#111827' },
  'Melancholic': { from: '#312e81', via: 'rgba(88, 28, 135, 0.3)', to: '#111827' },
  'Energetic': { from: '#9f1239', via: 'rgba(236, 72, 153, 0.4)', to: '#111827' },
  'Aggressive': { from: '#991b1b', via: 'rgba(239, 68, 68, 0.4)', to: '#111827' },
  'Chill': { from: '#0d9488', via: 'rgba(6, 182, 212, 0.3)', to: '#111827' },
  'Creepy': { from: '#171717', via: 'rgba(131, 24, 67, 0.4)', to: '#111827' },
  'Dark': { from: '#171717', via: 'rgba(23, 37, 84, 0.4)', to: '#111827' },
  'Dreamy': { from: '#86198f', via: 'rgba(217, 70, 239, 0.3)', to: '#111827' },
  'Epic': { from: '#581c87', via: 'rgba(212, 175, 55, 0.3)', to: '#111827' },
  'Hopeful': { from: '#065f46', via: 'rgba(16, 185, 129, 0.3)', to: '#111827' },
  'Mysterious': { from: '#4a044e', via: 'rgba(17, 24, 39, 0.5)', to: '#111827' },
  'Romantic': { from: '#be185d', via: 'rgba(251, 146, 60, 0.3)', to: '#111827' },
  'Uplifting': { from: '#0ea5e9', via: 'rgba(250, 204, 21, 0.4)', to: '#111827' }
};
