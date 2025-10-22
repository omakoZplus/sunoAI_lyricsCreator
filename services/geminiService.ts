
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
  const hasStructure = existingLyrics.includes('[') && existingLyrics.includes(']');

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

    **TRACK TYPE:**
    ${isInstrumental
      ? `
      - This is an INSTRUMENTAL track.
      - Focus heavily on describing instrumental sections and solos.
      - Use tags like [Guitar Solo], [Instrumental Break], [Synth Lead Melody], [Orchestral Swell].
      - OMIT any vocal parts, vocal style tags, or lyrical lines for singing. The output should be a structure of instrumental cues.`
      : `
      - This is a VOCAL track.
      - Write lyrics for a vocal performance.
      ${voiceStyle ? `- Voice Perspective: "${voiceStyle}" (Use this to inform both the lyrical content and the vocal style metatags).` : '- Voice Perspective: Not specified. Infer a suitable voice style from the genre and mood.'}`
    }

    **METATAG CATEGORIES TO USE:**
    *   **Overall Style (at the start):** \`[Genre: <Specific Genre>]\`, \`[Mood: <Primary Mood>, <Secondary Mood>]\`, \`[Tempo: <BPM or description>]\`
    *   **Instrumentation:** \`[Instrument: <instrument> (<description>)]\`, e.g., \`[Instrument: Electric Guitar (distorted riff)]\`, \`[Instrument: 808 Bass (heavy sub)]\`, \`[Instrument: Strings (Lush, cinematic)]\`.
    *   **Vocal Style (for vocal tracks only):** \`[Vocal Style: <description>]\`, e.g., \`[Vocal Style: Ethereal female soprano]\`, \`[Vocal Style: Rapping with aggressive delivery]\`, \`[Vocal Effect: Reverb]\`.
    *   **Energy Level:** \`[Energy: Low/Medium/High/Intense]\`. Use this to guide the song's dynamics.
    *   **Production/FX:** \`[FX: Reverb Heavy]\`, \`[FX: Drum Machine]\`, \`[FX: Filter Sweep]\`.

    **TASK:**
    - **Topic:** "${topic}"
    - **Language:** ${language}
    ${genre !== 'None' ? `- **Genre:** "${genre}"` : `- **Genre:** Not specified. You can infer an appropriate genre.`}
    ${mood !== 'None' ? `- **Mood:** "${mood}"` : `- **Mood:** Not specified. You can infer an appropriate mood.`}
    ${bpm ? `- **BPM:** "${bpm}"` : ''}
    - **Inspirational Artists (for structure & style):** ${artists || 'None'}
    - **Detailed Style Tags:** ${styleTags.length > 0 ? styleTags.join(', ') : 'None provided. Generate appropriate tags based on genre and mood.'}
    - Your generated metatags like [Instrument: ...] and [FX: ...] MUST be heavily influenced by these Detailed Style Tags.

    ${hasStructure
        ? `**STRUCTURE TO FILL:**
    -   You have been given a song structure. Fill in the lyrics and add descriptive metatags for each section based on the rules above.
    -   **ARTIST INFLUENCE ON STYLE:** The user has listed "${artists}" as inspiration. Let their style influence the lyrical themes, vocabulary, and the type of descriptive metatags you use within the provided structure.
    -   The final output must retain these exact structural tags.

    ${existingLyrics}`
        : `**STRUCTURE TO CREATE:**
    -   Create a complete and logical song structure.
    -   ${artists ? `**ARTIST INFLUENCE ON STRUCTURE:** The user has listed "${artists}" as inspiration. Analyze their typical song structures (e.g., complex arrangements like Queen, or simple verse-chorus like Ramones) and let this analysis guide the structure you create.` : 'Create a standard song structure (e.g., Intro, Verse, Chorus, Bridge, Outro).'}
    -   Write complete lyrics/instrumental cues and embed detailed descriptive metatags throughout.`
    }

    Begin Output:
  `;

  try {
    const response = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
    });
    
    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Error generating content with Gemini API:", error);
    throw new Error("Failed to communicate with the AI model.");
  }
};


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
