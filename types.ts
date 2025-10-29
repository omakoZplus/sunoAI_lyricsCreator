export interface SongSection {
  id: string;
  type: string; // e.g., "Verse 1", "Chorus"
  content: string;
  isLoading?: boolean;
}

export interface AnalyzedLine {
  text: string;
  syllables: number;
  rhymeKey: string | null;
}

export interface SectionAnalysis {
  lines: AnalyzedLine[];
}

export interface SongStarterKit {
    topic: string;
    title: string;
    genre: string;
    mood: string;
    styleTags: string[];
}

export interface LyricalIssue {
  phrase: string;
  type: 'cliche' | 'telling';
  description: string;
}
