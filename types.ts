export interface SongSection {
  id: string;
  type: string; // e.g., "Verse 1", "Chorus"
  content: string;
  isLoading?: boolean;
}
