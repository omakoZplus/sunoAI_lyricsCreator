import { SongSection } from '../types';

const SECTION_TAG_REGEX = /^( *)\[(.*?)\]( *)/;
const METATAG_REGEX = /\[([^\]]+)\]/g;

export interface Metatag {
    content: string; // e.g. "Energy: High"
    startIndex: number;
    endIndex: number;
}

export const extractMetatags = (text: string): Metatag[] => {
    const tags: Metatag[] = [];
    let match;
    // We only care about tags that are NOT section headers.
    // A simple heuristic: section headers are usually on their own line.
    const lines = text.split('\n');
    let currentIndex = 0;

    for (const line of lines) {
        // Reset regex state for each line
        METATAG_REGEX.lastIndex = 0;
        const isSectionHeader = SECTION_TAG_REGEX.test(line.trim());
        
        if (!isSectionHeader) {
            while ((match = METATAG_REGEX.exec(line)) !== null) {
                tags.push({
                    content: match[1],
                    startIndex: currentIndex + match.index,
                    endIndex: currentIndex + match.index + match[0].length,
                });
            }
        }
        currentIndex += line.length + 1; // +1 for the newline character
    }
    return tags;
};


export const parseLyrics = (rawText: string): SongSection[] => {
    if (!rawText.trim()) return [];
    
    const lines = rawText.split('\n');
    const sections: SongSection[] = [];
    let currentSection: SongSection | null = null;

    for (const line of lines) {
        const match = line.match(SECTION_TAG_REGEX);
        // A structural tag is a bracketed line that does NOT contain a colon.
        const isStructuralTag = match && !match[2].trim().includes(':');

        if (isStructuralTag && match) {
            // It's a real section tag like [Verse 1] or [Intro]
            if (currentSection) {
                currentSection.content = currentSection.content.trim();
                sections.push(currentSection);
            }
            currentSection = {
                id: crypto.randomUUID(),
                type: match[2].trim(),
                content: ''
            };
        } else {
             // It's a metatag, lyrics, or a blank line.
             if (!currentSection && line.trim()) {
                // Content (likely metatags) exists before the first structural tag.
                // Create a default "Intro" section to hold it. This is a common case.
                currentSection = {
                    id: crypto.randomUUID(),
                    type: 'Intro',
                    content: ''
                };
            }
            
            if (currentSection) {
                currentSection.content += line + '\n';
            }
        }
    }

    if (currentSection) {
        currentSection.content = currentSection.content.trim();
        sections.push(currentSection);
    }

    // Merge fix: If we defaulted to Intro because of leading metatags, 
    // and the AI *also* provided an Intro section, merge them.
    if (sections.length > 1 && sections[0].type === 'Intro' && sections[1].type === 'Intro') {
        const firstSectionContent = sections[0].content.replace(`[${sections[1].type}]`, '').trim();
        sections[1].content = `${firstSectionContent}\n${sections[1].content}`.trim();
        sections.shift();
    }
    
    return sections;
};

export const stringifyLyrics = (sections: SongSection[]): string => {
    return sections.map(section => `[${section.type}]\n${section.content.trim()}`).join('\n\n');
};

export const getNextSectionName = (type: string, existingSections: SongSection[]): string => {
    const baseType = type.replace(/ \d+$/, ''); // Remove trailing numbers for counting
    const relevantSections = existingSections.filter(s => s.type.startsWith(baseType));
    
    // Check if the type is a non-numbered type
    const nonNumericTypes = ["Intro", "Outro", "Bridge", "Guitar Solo", "Instrumental Break", "Pre-Chorus", "Chorus"];
    if (nonNumericTypes.includes(baseType) && relevantSections.length > 0) {
      // For types that can be repeated but might be numbered, like Chorus
      if(baseType === "Chorus" || baseType === "Pre-Chorus") {
         return `${baseType} ${relevantSections.length + 1}`;
      }
      return baseType; // Allow multiple non-numbered bridges, solos etc.
    }

    return `${baseType} ${relevantSections.length + 1}`;
};

export const stripMetatags = (text: string): string => {
    // This regex removes bracketed tags, e.g., [Instrument: Guitar], and any trailing newline
    return text.replace(/\[.*?\]\n?/g, '').trim();
};
