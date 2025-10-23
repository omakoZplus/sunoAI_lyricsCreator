
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generateContentStreamWithRetry = async (prompt: string) => {
  try {
    return await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
    });
  } catch (error) {
    console.error("Error generating content with Gemini API:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
};

export async function* generateLyricsStream(
  topic: string, 
  userInputTitle: string, 
  genre: string, 
  mood: string, 
  language: string, 
  voiceStyle: string, 
  isInstrumental: boolean,
  existingLyrics: string,
  artists: string,
  styleTags: string[],
  bpm: string
): AsyncGenerator<string> {
  const prompt = `
    You are an expert songwriter and a master of the Suno AI music generator (v5). Your task is to write lyrics that are not only creative but also perfectly formatted with detailed metatags to guide the AI's music generation.

    **CRITICAL FORMATTING RULES:**
    1.  **Title and Lyrics Separation:**
        - The very first line of your response MUST be the song title ONLY.
        - ${userInputTitle ? `The user has provided a title: "${userInputTitle}". Use this exact title.` : (language !== 'English' ? `Generate a creative title in ${language}, followed by its English translation in parentheses. Example: \`Neko no Yume (Cat's Dream)\`.` : `Generate a creative title in English.`)}
        - The content starting from the second line MUST be the lyrics, including all structural and descriptive tags. DO NOT repeat the title in the lyric body.
    2.  **Structural Tags:** Every distinct section of the song (verse, chorus, bridge, etc.) MUST begin with a standard structural tag, e.g., \`[Verse 1]\`, \`[Chorus]\`.
    3.  **Descriptive Metatags (The Core Task):**
        - You MUST embed descriptive metatags in square brackets throughout the lyrics to control the music generation.
        - These tags should describe instrumentation, mood, energy, vocal style, and production effects.
        - Place these tags strategically before or within lyrical sections to influence the music at that specific point.
        - **Do not just list tags at the top.** Integrate them naturally with the song's flow.
    4.  **No Explanations:** Do NOT add any extra explanations, artist names, or text outside of the title and the tagged lyrics.
    5.  **Spacing:** Do NOT add extra blank lines between metatags or between a metatag and a structural tag. A single newline character should separate these elements.
        - **Correct Example:**
          [Genre: Pop]
          [Intro]
          [Instrument: Synth]
          A line of lyrics...
        - **Incorrect Example:**
          [Genre: Pop]

          [Intro]

          [Instrument: Synth]
          A line of lyrics...

    **TRACK TYPE:**
    ${isInstrumental
      ? `
      - This is an INSTRUMENTAL track.
      - **IMPORTANT GOAL:** The output should be a structure for a concise instrumental piece, typically resulting in a 2-3 minute long song. Avoid overly long, complex, or repetitive song structures that mimic vocal pop songs.
      - **STRUCTURE GUIDANCE:** Instead of a verse-chorus structure, think in terms of musical movements: [Intro], [Theme A], [Development/Section B], [Solo], [Theme A Reprise], [Outro]. The structure should tell a musical story.
      - Focus heavily on describing the instrumental performance, dynamics, and emotional arc.
      - Use tags like [Guitar Solo], [Instrumental Break], [Synth Lead Melody], [Orchestral Swell].
      - OMIT any vocal parts, vocal style tags, or lyrical lines for singing. The output must be a structure of instrumental cues ONLY.`
      : `
      - This is a VOCAL track.
      - Write lyrics for a vocal performance.
      ${voiceStyle ? `- Voice Perspective: "${voiceStyle}" (Use this to inform both the lyrical content and the vocal style metatags).` : '- Voice Perspective: Not specified. Infer a suitable voice style from the genre and mood.'}`
    }

    **METATAG CATEGORIES TO USE:**
    *   **Overall Style (at the start):** \`[Genre: <Specific Genre>]\`, \`[Mood: <Primary Mood>, <Secondary Mood>]\`, \`[Tempo: <BPM or description>]\`
    *   **Instrumentation:** \`[Instrument: <instrument> (<description>)]\`, e.g., \`[Instrument: Electric Guitar (distorted riff)]\`, \`[Instrument: 808 Bass (heavy sub)]\`, \`[Instrument: Strings (Lush, cinematic)]\`.
    *   **Vocal Style (for vocal tracks only):** \`[Vocal Style: <description>)]\`, e.g., \`[Vocal Style: Ethereal female soprano]\`, \`[Vocal Style: Rapping with aggressive delivery]\`, \`[Vocal Effect: Reverb]\`.
    *   **Energy Level:** \`[Energy: Low/Medium/High/Intense]\`. Use this to guide the song's dynamics.
    *   **Production/FX:** \`[FX: Reverb Heavy]\`, \`[FX: Drum Machine]\`, \`[FX: Filter Sweep]\`.

    **Conciseness & Length (VERY IMPORTANT):**
    *   **TARGET LENGTH:** Aim for a total output (title + lyrics + tags) under 3000 characters. This is crucial for compatibility with music generation platforms.
    *   **STRUCTURE:** Create a standard, concise song structure (e.g., Verse-Chorus-Verse-Chorus-Bridge-Chorus-Outro). Avoid excessive repetition or overly complex structures.
    *   **LYRICS:** Keep verses to 4-8 lines and choruses to 4-6 lines. Be impactful with your words.
    *   **METATAGS:** Be strategic. Place tags where they create the most impact. Group tags at the start of a section where appropriate, rather than placing a tag on every single line.

    **TASK:**
    - **Topic:** "${topic}"
    - **Language:** ${language}
    ${genre !== 'None' ? `- **Genre:** "${genre}"` : `- **Genre:** Not specified. You can infer an appropriate genre.`}
    ${mood !== 'None' ? `- **Mood:** "${mood}"` : `- **Mood:** Not specified. You can infer an appropriate mood.`}
    ${bpm ? `- **BPM:** "${bpm}"` : ''}
    - **Inspirational Artists (for structure & style):** ${artists || 'None'}
    - **Detailed Style Tags:** ${styleTags.length > 0 ? styleTags.join(', ') : 'None provided. Generate appropriate tags based on genre and mood.'}
    - Your generated metatags like [Instrument: ...] and [FX: ...] MUST be heavily influenced by these Detailed Style Tags.
    - **STRUCTURE TO CREATE:**
    -   Create a complete and logical song structure, respecting the conciseness rules.
    -   ${artists ? `**ARTIST INFLUENCE ON STRUCTURE:** The user has listed "${artists}" as inspiration. Analyze their typical song structures (e.g., complex arrangements like Queen, or simple verse-chorus like Ramones) and let this analysis guide the structure you create.` : 'Create a standard song structure (e.g., Intro, Verse, Chorus, Bridge, Outro).'}
    -   Write complete lyrics/instrumental cues and embed detailed descriptive metatags throughout.
    
    Begin Output:
  `;

  const response = await generateContentStreamWithRetry(prompt);
  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
};

export async function* regenerateSectionStream(
  topic: string, 
  title: string,
  genre: string, 
  mood: string, 
  language: string, 
  voiceStyle: string, 
  isInstrumental: boolean,
  artists: string,
  styleTags: string[],
  bpm: string,
  lyricsContext: string,
  sectionToRegenerate: string
): AsyncGenerator<string> {
    const prompt = `
    You are an expert songwriter, continuing a song that is in progress.
    Your task is to write lyrics for a specific section of a song, using the provided context of the song's theme and preceding lyrics.

    **CRITICAL INSTRUCTIONS:**
    1.  **FOCUS ON ONE SECTION:** Your output must ONLY be the lyrical or descriptive content for the requested section: [${sectionToRegenerate}].
    2.  **NO EXTRA TEXT:** Do NOT include the section tag itself (e.g., \`[${sectionToRegenerate}]\`) in your response. Do not repeat the title, previous lyrics, or add any explanations.
    3.  **MAINTAIN CONTEXT:** The new lyrics must flow logically and thematically from the "LYRICS SO FAR" provided below.
    4.  **USE METATAGS:** Embed descriptive metatags (e.g., [Instrument: ...], [Vocal Style: ...], [Energy: ...]) within the lyrics for this section, consistent with the overall song style.

    **OVERALL SONG CONTEXT:**
    - **Topic:** "${topic}"
    - **Title:** "${title}"
    - **Language:** ${language}
    ${genre !== 'None' ? `- **Genre:** "${genre}"` : ''}
    ${mood !== 'None' ? `- **Mood:** "${mood}"` : ''}
    ${bpm ? `- **BPM:** "${bpm}"` : ''}
    ${isInstrumental ? `- **Track Type:** Instrumental` : `- **Track Type:** Vocal`}
    ${!isInstrumental && voiceStyle ? `- **Vocal Identity:** "${voiceStyle}"` : ''}
    - **Inspirational Artists:** ${artists || 'None'}
    - **Detailed Style Tags:** ${styleTags.length > 0 ? styleTags.join(', ') : 'None'}

    **LYRICS SO FAR (for context):**
    ${lyricsContext || '(This is the first section of the song.)'}

    **YOUR TASK:**
    Write concise content (typically 4-8 lines) for the **[${sectionToRegenerate}]** section now.

    Begin Output (content for [${sectionToRegenerate}] only):
    `;
    const response = await generateContentStreamWithRetry(prompt);
    for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
    }
}

export async function* continueSongStream(
  topic: string, 
  title: string,
  genre: string, 
  mood: string, 
  language: string, 
  voiceStyle: string, 
  isInstrumental: boolean,
  artists: string,
  styleTags: string[],
  bpm: string,
  lyricsContext: string,
): AsyncGenerator<string> {
    const prompt = `
    You are an expert songwriter, tasked with continuing a song that is already in progress.
    Your goal is to write the next logical section that follows the provided lyrics, maintaining the song's established style, theme, and structure.

    **CRITICAL INSTRUCTIONS:**
    1.  **ANALYZE & CONTINUE:** Analyze the provided "EXISTING SONG" to understand its structure (e.g., Verse 1 -> Chorus -> Verse 2). Determine what section should come next (e.g., a second Chorus, a Bridge, a Guitar Solo, or an Outro).
    2.  **SINGLE SECTION OUTPUT:** Your entire output must be for this single, new section.
    3.  **FORMATTING:**
        - Your response MUST start with the structural tag for the new section (e.g., \`[Bridge]\`, \`[Chorus 2]\`, \`[Outro]\`).
        - Follow the tag with the lyrics and descriptive metatags for that section. Do not add extra blank lines after the section tag.
        - Do NOT repeat any of the existing song. Do not add any explanations or text outside the new section.
    4.  **MAINTAIN STYLE:** The new lyrics and metatags must be consistent with the established genre, mood, and instrumentation.

    **OVERALL SONG CONTEXT:**
    - **Topic:** "${topic}"
    - **Title:** "${title}"
    - **Language:** ${language}
    ${genre !== 'None' ? `- **Genre:** "${genre}"` : ''}
    ${mood !== 'None' ? `- **Mood:** "${mood}"` : ''}
    ${bpm ? `- **BPM:** "${bpm}"` : ''}
    ${isInstrumental ? `- **Track Type:** Instrumental` : `- **Track Type:** Vocal`}
    ${!isInstrumental && voiceStyle ? `- **Vocal Identity:** "${voiceStyle}"` : ''}
    - **Inspirational Artists:** ${artists || 'None'}
    - **Detailed Style Tags:** ${styleTags.length > 0 ? styleTags.join(', ') : 'None'}

    **EXISTING SONG (for context):**
    ---
    ${lyricsContext}
    ---

    **YOUR TASK:**
    Write the very next section of the song. It should be concise and advance the song's structure logically.

    Begin Output (new section only):
    `;
    const response = await generateContentStreamWithRetry(prompt);
    for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
    }
}

export const generateSunoPrompt = async (topic: string, genre: string, mood: string, artists: string, voiceStyle: string, isInstrumental: boolean, bpm: string): Promise<string[]> => {
    const prompt = `
    You are a prompt engineering expert specializing in the Suno AI music generator (v5). Your task is to create a list of highly-detailed, effective "Style of Music" descriptors based on user-provided details. The goal is to generate a rich set of tags that will guide the AI to create a specific sound.

    **CRITICAL INSTRUCTIONS:**
    1.  **ABSOLUTELY NO ARTIST NAMES:** You must never mention any artist names in the final output. Analyze the style of the inspirational artists and translate it into descriptive terms (e.g., instead of "like Queen", describe it as "epic 70s stadium rock", "multi-tracked vocal harmonies", "flamboyant piano", "soaring guitar solos").
    2.  **DETAILED & SPECIFIC:** Each tag in the list should be a descriptive phrase. Go beyond simple genre tags.
    3.  **COVER MULTIPLE FACETS:** Your tags should touch on several of the following aspects:
        *   **Genre/Subgenre:** Be specific (e.g., "Dream Pop", "Melodic Death Metal", "UK Garage").
        *   **Instrumentation:** Name specific instruments and their sound (e.g., "punchy 808 bass", "distorted, fuzzy guitar riff", "warm Rhodes piano", "lush string orchestra").
        *   **Tempo & Rhythm:** (e.g., "120 BPM driving house beat", "slow, melancholic tempo", "complex syncopated rhythms"). If a specific BPM is provided, use it.
        *   **Production & Atmosphere:** Describe the overall feel and a production quality (e.g., "polished modern production", "lo-fi vintage aesthetic with tape hiss", "cavernous reverb", "epic cinematic soundscape", "intimate and acoustic").
    4.  **FORMAT:** The output must be a JSON array of strings.
    
    ${isInstrumental
      ? `
    **INSTRUMENTAL PROMPT:**
    - The user wants an instrumental track.
    - Your prompt MUST NOT contain any descriptors for vocals (e.g., "male vocals", "female singer", "choir", "rapping").
    - Focus exclusively on genre, instrumentation, mood, tempo, and production quality.`
      : `
    **VOCAL PROMPT:**
    - **Vocal Style:** Describe the singer's voice and delivery. This is crucial. If the user provides a description, use it as the primary guide. If it's not specified, infer a suitable voice that fits the genre and mood (e.g., for 'Pop' and 'Happy', you might suggest 'bright, clean female pop vocal').`
    }

    **User's Request:**
    -   **Topic:** ${topic}
    -   **Genre:** ${genre === 'None' ? 'Not specified by user, you can infer one.' : genre}
    -   **Mood:** ${mood === 'None' ? 'Not specified by user, you can infer one.' : mood}
    -   **BPM:** ${bpm || 'Not specified by user'}
    -   **Track Type:** ${isInstrumental ? 'Instrumental' : 'Vocal'}
    -   **Artists for Inspiration (translate their style, do not name them):** ${artists || 'None'}
    -   **Voice Style:** ${isInstrumental ? 'N/A' : (voiceStyle || 'Not specified by user, you can infer one.')}

    Based on this, generate the JSON array of "Style of Music" tags.

    **High-Quality Example:**
    *   **User Input:** Genre: "Rock", Mood: "Energetic", Artists: "AC/DC, Guns N' Roses", Voice Style: "Male"
    *   **Your Output (as JSON):** ["high-energy 80s hard rock", "anthemic stadium rock", "driving 4/4 drum beat", "powerful distorted electric guitar riff", "gritty high-pitched male rock vocals", "blistering guitar solo", "gang backing vocals", "raw and powerful production"]
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: 'A descriptive tag for the music style.'
            }
          }
        }
    });

    return JSON.parse(response.text.trim());

  } catch (error) {
    console.error("Error generating Suno prompt with Gemini API:", error);
    throw new Error("Failed to communicate with the AI model for prompt generation.");
  }
};

export const findRhymes = async (word: string): Promise<string[]> => {
  const prompt = `
    You are a rhyming dictionary expert.
    Your task is to provide a list of words that rhyme with the given word.
    Provide only a JSON array of strings in your response.
    Word: "${word}"
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error finding rhymes:", error);
    throw new Error("Failed to find rhymes.");
  }
};

export const findSynonyms = async (word: string): Promise<string[]> => {
  const prompt = `
    You are a thesaurus expert.
    Your task is to provide a list of synonyms for the given word.
    Provide only a JSON array of strings in your response.
    Word: "${word}"
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemiservices/geminiService.tsni-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Error finding synonyms:", error);
    throw new Error("Failed to find synonyms.");
  }
};

export const rephraseLine = async (line: string): Promise<string> => {
  const prompt = `
    You are an expert lyricist.
    Your task is to rephrase the given line to improve its flow, imagery, or emotional impact, while keeping the original meaning.
    Return only the rephrased line as a single string, with no extra text or quotes.
    Original line: "${line}"
  `;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error rephrasing line:", error);
    throw new Error("Failed to rephrase line.");
  }
};
