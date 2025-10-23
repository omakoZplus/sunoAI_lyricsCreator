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
