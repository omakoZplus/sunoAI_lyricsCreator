
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SectionAnalysis } from "../types";

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("API_KEY environment variable is not set. Please configure it in your environment.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

const handleGeminiError = (error: unknown, context: string): Error => {
  console.error(`Error in Gemini API call (${context}):`, error);
  let message = `Failed during "${context}". Please try again.`;

  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('safety')) {
      message = 'Request blocked for safety reasons. Please adjust your prompt.';
    } else if (errorMessage.includes('400')) {
      message = 'The AI model couldn\'t process the request. Try rephrasing your input.';
    } else if (errorMessage.includes('api_key') || errorMessage.includes('permission denied')) {
        message = 'API key is invalid or missing permissions.';
    } else if (errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('unavailable')) {
        message = 'The AI service is currently unavailable. Please try again later.';
    } else if (errorMessage.includes('deadline_exceeded') || errorMessage.includes('timeout')) {
        message = 'The request timed out. Please try again.';
    }
  }
  
  return new Error(message);
};

const generateContentStreamWithRetry = async (prompt: string) => {
  try {
    const ai = getAiClient();
    return await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{googleSearch: {}}],
        },
    });
  } catch (error) {
    throw handleGeminiError(error, "content stream generation");
  }
};

const generateContentWithRetry = async (prompt: string) => {
    try {
      const ai = getAiClient();
      return await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
      });
    } catch (error) {
      throw handleGeminiError(error, "content generation");
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
    6. **Content for Every Section:** For every structural tag you generate (e.g., \`[Intro]\`, \`[Theme A]\`), you MUST write at least 2-4 lines of descriptive metatags or lyrics immediately following it. DO NOT generate empty sections.

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

export const generateSunoPrompt = async (
    topic: string, 
    genre: string, 
    mood: string, 
    artists: string, 
    voiceStyle: string, 
    isInstrumental: boolean, 
    bpm: string,
    existingTags: string[]
): Promise<string[]> => {
    const prompt = `
    You are a prompt engineering expert specializing in the Suno AI music generator (v5). Your task is to create a list of highly-detailed, effective "Style of Music" descriptors based on user-provided details. The goal is to generate a rich, complete set of tags that will guide the AI to create a specific sound.

    **CRITICAL INSTRUCTIONS:**
    1.  **ABSOLUTELY NO COPYRIGHTED NAMES:** You must not mention specific artist names, band names, or video game titles in the final output tags. This is critical to avoid copyright issues. Instead, analyze the requested style and translate it into descriptive, generic terms.
        - **Artist Example:** Instead of "like Daft Punk", generate tags like "funky filtered disco house", "vocoder vocals", "robotic voice effects", "punchy French house bassline".
        - **Game Example:** Instead of "like the soundtrack from Chrono Trigger", generate tags like "nostalgic 16-bit JRPG soundtrack", "chiptune melodies with orchestral elements", "SNES-style reverb".
    2.  **DETAILED & SPECIFIC:** Each tag in the list should be a descriptive phrase. Go beyond simple genre tags.
    3.  **COVER MULTIPLE FACETS:** Your tags should touch on several of the following aspects:
        *   Genre/Subgenre: Be specific (e.g., "Dream Pop", "Melodic Death Metal", "UK Garage").
        *   Instrumentation: Name specific instruments and their sound (e.g., "punchy 808 bass", "distorted, fuzzy guitar riff", "warm Rhodes piano", "lush string orchestra").
        *   Tempo & Rhythm: (e.g., "120 BPM driving house beat", "slow, melancholic tempo", "complex syncopated rhythms"). If a specific BPM is provided, use it.
        *   Production & Atmosphere: Describe the overall feel and a production quality (e.g., "polished modern production", "lo-fi vintage aesthetic with tape hiss", "cavernous reverb", "epic cinematic soundscape", "intimate and acoustic").
    4.  **FORMAT:** The output must be a JSON array of strings.
    5.  **GENERATE A COMPLETE SET:** Your task is to generate a comprehensive list of tags that defines the entire sound, based on the user's request. If the user has provided base tags, you should incorporate their ideas into the final list, ensuring a cohesive style. For example, if the user wants a "Sad" mood and provides a "Ukulele" tag, generate a style for a sad ukulele song.
    
    ${isInstrumental
      ? `
    **INSTRUMENTAL PROMPT:**
    - The user wants an instrumental track.
    - Your prompt MUST NOT contain any descriptors for vocals (e.g., "male vocals", "female singer", "choir", "rapping").
    - Focus exclusively on genre, instrumentation, mood, tempo, and production quality.
    - **Even if the inspirational artists are known for their vocals, you must ONLY describe their instrumental style.**`
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
    -   **User-Selected Base Tags (to incorporate into the style):** ${existingTags.length > 0 ? existingTags.join(', ') : 'None'}

    Based on all this, generate the complete JSON array of "Style of Music" tags.

    **High-Quality Example:**
    *   **User Input:** Genre: "Rock", Mood: "Energetic", Artists: "AC/DC, Guns N' Roses", Voice Style: "Male", Base Tags: ["Electric Guitar"]
    *   **Your Output (as JSON):** ["high-energy 80s hard rock", "anthemic stadium rock", "driving 4/4 drum beat", "powerful distorted electric guitar riff", "gritty high-pitched male rock vocals", "blistering guitar solo", "gang backing vocals", "raw and powerful production", "Electric Guitar"]
  `;

  try {
    const ai = getAiClient();
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
    throw handleGeminiError(error, "Suno prompt generation");
  }
};

export const generateRandomTopic = async (genre: string, mood: string): Promise<string> => {
    const prompt = `
    You are a creative muse for songwriters.
    Your task is to generate a single, creative, and detailed song topic based on a given genre and mood.
    The topic should be a short paragraph that tells a miniature story or presents a compelling scenario, perfect for sparking lyrical ideas.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **BE DETAILED:** Don't just give a title. Describe a scene, a feeling, a conflict, or a character.
    2.  **MATCH THE VIBE:** The topic must perfectly align with the provided genre and mood.
    3.  **OUTPUT FORMAT:** Return ONLY the topic text. Do not include any titles, headings, or extra explanations.
    
    **Genre:** "${genre}"
    **Mood:** "${mood}"

    **High-Quality Example:**
    *   **Input:** Genre: "Synthwave", Mood: "Melancholic"
    *   **Your Output:** The last working android in a neon-drenched, rain-slicked metropolis searches for a memory chip containing the consciousness of its creator, all while being hunted by corporate agents who see it as obsolete technology. It's a story of love, loss, and identity under the perpetual twilight of a dystopian future.
    
    Now, generate a topic for the request above.
    `;
    const response = await generateContentWithRetry(prompt);
    return response.text.trim();
};

export const findRhymes = async (word: string): Promise<string[]> => {
  const prompt = `
    You are a rhyming dictionary expert.
    Your task is to provide a list of words that rhyme with the given word.
    Provide only a JSON array of strings in your response.
    Word: "${word}"
  `;
  try {
    const ai = getAiClient();
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
    throw handleGeminiError(error, "finding rhymes");
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
    const ai = getAiClient();
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
    throw handleGeminiError(error, "finding synonyms");
  }
};

export const getThematicIdeas = async (word: string): Promise<string[]> => {
    const prompt = `
      You are a creative muse for songwriters.
      Your task is to provide a list of thematic ideas, concepts, and evocative imagery related to the given word. Go beyond simple synonyms.
      Provide only a JSON array of strings in your response.
      Word: "${word}"
    `;
    try {
      const ai = getAiClient();
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
      throw handleGeminiError(error, "getting thematic ideas");
    }
  };
  
  export const generateImageryForLine = async (line: string): Promise<string[]> => {
    const prompt = `
      You are an expert lyricist with a mastery of "show, don't tell".
      Your task is to take a simple, "telling" line of lyric and transform it into several more evocative, "showing" alternatives.
      Provide a JSON array of 3-5 rephrased lines that use strong imagery and sensory details.
      Original line: "${line}"
    `;
    try {
      const ai = getAiClient();
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
      throw handleGeminiError(error, "generating imagery");
    }
  };

export const analyzeSection = async (sectionText: string): Promise<SectionAnalysis> => {
    const prompt = `
      You are a linguistic analysis tool for songwriters. Your task is to analyze a block of lyrics for its syllable count and rhyme scheme.
      
      **CRITICAL INSTRUCTIONS:**
      1.  **Analyze Line-by-Line:** Process each line of the provided text. If the text is empty, return an empty "lines" array.
      2.  **Count Syllables:** For each line, count the total number of syllables.
      3.  **Identify Rhyme Scheme:** Identify rhyming words at the end of lines. Assign a rhyme key (A, B, C, etc.) to each group of rhyming lines. If a line does not rhyme with any other line, its rhyme key should be null. Use a standard AABB, ABAB, etc., format.
      4.  **JSON OUTPUT:** Your entire response must be a single JSON object with a single key "lines". The value should be an array of objects, where each object represents a line and has three keys:
          *   \`text\`: The original line of text (string).
          *   \`syllables\`: The calculated syllable count (number).
          *   \`rhymeKey\`: The rhyme group identifier (e.g., "A", "B") or \`null\` if it doesn't rhyme.
      
      **EXAMPLE:**
      *   **Input Text:**
          Roses are red
          Violets are blue
          Sugar is sweet
          And so are you
      *   **Your Output (as JSON):**
          {
            "lines": [
              { "text": "Roses are red", "syllables": 4, "rhymeKey": null },
              { "text": "Violets are blue", "syllables": 5, "rhymeKey": "A" },
              { "text": "Sugar is sweet", "syllables": 4, "rhymeKey": null },
              { "text": "And so are you", "syllables": 4, "rhymeKey": "A" }
            ]
          }
  
      **LYRICS TO ANALYZE:**
      ---
      ${sectionText}
      ---
  
      Begin JSON Output:
    `;
  
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    syllables: { type: Type.INTEGER },
                    rhymeKey: { type: Type.STRING, nullable: true },
                  },
                  required: ["text", "syllables", "rhymeKey"]
                }
              }
            },
            required: ["lines"]
          }
        }
      });
      return JSON.parse(response.text.trim());
    } catch (error) {
      throw handleGeminiError(error, "section analysis");
    }
  };


export const generateSpeech = async (text: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say with standard pacing: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        throw handleGeminiError(error, "speech generation");
    }
};
