import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { SongDNA } from './components/SongDNA';
import { StyleEditor } from './components/StyleEditor';
import { LyricsDisplay } from './components/LyricsDisplay';
import { generateLyricsStream, regenerateSectionStream, generateSunoPrompt, continueSongStream, generateSongStarterKit, improveTopic } from './services/geminiService';
import { GENRES, MOODS, LYRICAL_STYLES, MOOD_COLORS } from './constants';
import { SongSection, Project } from './types';
import { parseLyrics, stringifyLyrics, getNextSectionName } from './utils/lyricsParser';
import { Tour } from './components/Tour';
import { Icon } from './components/Icon';
import { ProjectsModal } from './components/ProjectsModal';


const defaultExcludeTags = [
  'bad quality', 'out of tune', 'noisy', 'low fidelity', 'amateur', 'abrupt ending', 'static', 'distortion', 'mumbling', 'gibberish vocals', 'excessive reverb', 'clashing elements', 'generic', 'uninspired', 'robotic', 'artificial sound', 'metallic', 'harsh', 'shrill', 'muddy mix', 'undefined', 'chaotic', 'disjointed', 'monotone', 'repetitive', 'boring', 'flat', 'lifeless', 'thin', 'hollow', 'overproduced', 'under-produced'
];

type MobileTab = 'dna' | 'style' | 'lyrics';

const App: React.FC = () => {
  // Project Management State
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);

  // Transient UI/loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPromptLoading, setIsPromptLoading] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [isContinuing, setIsContinuing] = useState<boolean>(false);
  const [isSurprisingMe, setIsSurprisingMe] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<boolean>(false);
  const [bgStyle, setBgStyle] = useState({});
  const [isPulsing, setIsPulsing] = useState(false);
  const [ariaLiveStatus, setAriaLiveStatus] = useState('');
  
  const TOUR_COMPLETED_KEY = 'sunoLyricsCreatorTourCompleted_v1';
  const [isTourActive, setIsTourActive] = useState(false);
  
  const PROJECTS_KEY = 'sunoLyricsCreatorProjects_v2';
  const OLD_STATE_KEY = 'sunoLyricsCreatorState_v2';
  const ACTIVE_TAB_KEY = 'sunoLyricsCreatorActiveTab_v1';
  const PANEL_WIDTH_KEY = 'sunoLyricsCreatorPanelWidth_v2';

  const [activeTab, setActiveTab] = useState<MobileTab>(() => (localStorage.getItem(ACTIVE_TAB_KEY) as MobileTab) || 'dna');

  const createNewProject = useCallback((): Project => ({
    id: crypto.randomUUID(),
    lastModified: Date.now(),
    title: '',
    topic: '',
    isInstrumental: false,
    genre: GENRES[0],
    mood: MOODS[0],
    lyricalStyle: 'None',
    countryVibe: 'None',
    language: 'English',
    voiceStyle: '',
    bpm: '',
    lyrics: [],
    artists: '',
    sunoPromptTags: [],
    sunoExcludeTags: defaultExcludeTags,
    showMetatagEditor: false,
    previousTopic: null,
    previousSunoPromptTags: null,
  }), []);

  // Load projects on initial render
  useEffect(() => {
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
        setIsTourActive(true);
    }

    try {
        const savedProjectsRaw = localStorage.getItem(PROJECTS_KEY);
        if (savedProjectsRaw) {
            const savedProjects = JSON.parse(savedProjectsRaw);
            if (Array.isArray(savedProjects) && savedProjects.length > 0) {
                setProjects(savedProjects);
                const mostRecentProject = savedProjects.sort((a, b) => b.lastModified - a.lastModified)[0];
                setActiveProjectId(mostRecentProject.id);
                return;
            }
        }

        const oldStateRaw = localStorage.getItem(OLD_STATE_KEY);
        if (oldStateRaw) {
            const oldState = JSON.parse(oldStateRaw);
            const migratedProject: Project = {
                ...createNewProject(),
                ...oldState,
                id: crypto.randomUUID(),
                lastModified: Date.now(),
            };
            setProjects([migratedProject]);
            setActiveProjectId(migratedProject.id);
            localStorage.removeItem(OLD_STATE_KEY);
            return;
        }

        const newProject = createNewProject();
        setProjects([newProject]);
        setActiveProjectId(newProject.id);

    } catch (e) {
        console.error("Failed to load or migrate projects:", e);
        const newProject = createNewProject();
        setProjects([newProject]);
        setActiveProjectId(newProject.id);
    }
  }, [createNewProject]);
  
  const handleTourComplete = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setIsTourActive(false);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0 && activeProjectId) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  }, [projects, activeProjectId]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);
  
  // Update handler for the active project
  const updateActiveProject = useCallback((updates: Partial<Omit<Project, 'id'>>) => {
      if (!activeProjectId) return;
      setProjects(prevProjects =>
          prevProjects.map(p =>
              p.id === activeProjectId
                  ? { ...p, ...updates, lastModified: Date.now() }
                  : p
          )
      );
  }, [activeProjectId]);

  // Memoized state setters
  const setTopic = useCallback((topic: string) => updateActiveProject({ topic }), [updateActiveProject]);
  const setTitle = useCallback((title: string) => updateActiveProject({ title }), [updateActiveProject]);
  const setIsInstrumental = useCallback((isInstrumental: boolean) => updateActiveProject({ isInstrumental }), [updateActiveProject]);
  const setGenre = useCallback((genre: string) => updateActiveProject({ genre }), [updateActiveProject]);
  const setMood = useCallback((mood: string) => updateActiveProject({ mood }), [updateActiveProject]);
  const setLyricalStyle = useCallback((lyricalStyle: string) => updateActiveProject({ lyricalStyle }), [updateActiveProject]);
  const setCountryVibe = useCallback((countryVibe: string) => updateActiveProject({ countryVibe }), [updateActiveProject]);
  const setLanguage = useCallback((language: string) => updateActiveProject({ language }), [updateActiveProject]);
  const setVoiceStyle = useCallback((voiceStyle: string) => updateActiveProject({ voiceStyle }), [updateActiveProject]);
  const setBpm = useCallback((bpm: string) => updateActiveProject({ bpm }), [updateActiveProject]);
  const setLyrics = useCallback((updater: React.SetStateAction<SongSection[]>) => {
    if (!activeProjectId) return;
    setProjects(prevProjects =>
        prevProjects.map(p => {
            if (p.id === activeProjectId) {
                const newLyrics = typeof updater === 'function' ? updater(p.lyrics) : updater;
                return { ...p, lyrics: newLyrics, lastModified: Date.now() };
            }
            return p;
        })
    );
  }, [activeProjectId]);
  const setArtists = useCallback((artists: string) => updateActiveProject({ artists }), [updateActiveProject]);
  const setSunoPromptTags = useCallback((sunoPromptTags: string[]) => updateActiveProject({ sunoPromptTags }), [updateActiveProject]);
  const setSunoExcludeTags = useCallback((sunoExcludeTags: string[]) => updateActiveProject({ sunoExcludeTags }), [updateActiveProject]);
  const setShowMetatagEditor = useCallback((showMetatagEditor: boolean) => updateActiveProject({ showMetatagEditor }), [updateActiveProject]);
  const setPreviousTopic = useCallback((previousTopic: string | null) => updateActiveProject({ previousTopic }), [updateActiveProject]);
  const setPreviousSunoPromptTags = useCallback((previousSunoPromptTags: string[] | null) => updateActiveProject({ previousSunoPromptTags }), [updateActiveProject]);


  // Resizable panel state and logic
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    const savedWidth = localStorage.getItem(PANEL_WIDTH_KEY);
    return savedWidth ? Math.max(25, Math.min(60, parseFloat(savedWidth))) : 30;
  });
  const isResizing = useRef(false);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
      localStorage.setItem(PANEL_WIDTH_KEY, leftPanelWidth.toString());
  }, [leftPanelWidth]);
  
  const handleMouseDownOnResizer = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      document.body.classList.add('resizing');
  }, []);

  const handleMouseUp = useCallback(() => {
      isResizing.current = false;
      document.body.classList.remove('resizing');
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
      if (!isResizing.current || !mainContainerRef.current) return;

      const containerRect = mainContainerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const newWidthPercent = (newWidth / containerRect.width) * 100;

      // Clamp values to keep layout usable
      const clampedWidth = Math.max(25, Math.min(60, newWidthPercent));
      
      setLeftPanelWidth(clampedWidth);
  }, []);

  useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
          // Failsafe for component unmount
          document.body.classList.remove('resizing');
      };
  }, [handleMouseMove, handleMouseUp]);


  // Effect for dynamic background based on mood
  useEffect(() => {
    const currentMood = activeProject?.mood || 'None';
    const colors = MOOD_COLORS[currentMood] || MOOD_COLORS['None'];
    setBgStyle({
        backgroundImage: `linear-gradient(to bottom right, ${colors.from}, ${colors.via}, ${colors.to})`,
    });
    setIsPulsing(currentMood === 'Energetic');
  }, [activeProject?.mood]);

  // Effect for ARIA live region status updates
  useEffect(() => {
    let status = '';
    if (isLoading) {
      status = activeProject?.isInstrumental ? 'Generating instrumental track, please wait.' : 'Generating lyrics, please wait.';
    } else if (isContinuing) {
      status = 'Continuing song, please wait.';
    } else if (isPromptLoading) {
      status = 'Generating style suggestions, please wait.';
    } else if (isSurprisingMe) {
      status = 'Generating a surprise song starter kit, please wait.';
    } else if (isImproving) {
      status = 'Improving your song topic, please wait.';
    }
    setAriaLiveStatus(status);
  }, [isLoading, isContinuing, isPromptLoading, isSurprisingMe, isImproving, activeProject?.isInstrumental]);

  const handleInstrumentalChange = useCallback((enabled: boolean) => {
    if (!activeProject) return;
    const newTags = enabled 
        ? ['instrumental', ...activeProject.sunoPromptTags.filter(t => t.toLowerCase() !== 'instrumental')]
        : activeProject.sunoPromptTags.filter(tag => tag.toLowerCase() !== 'instrumental');
    
    updateActiveProject({
        isInstrumental: enabled,
        language: enabled ? 'No Language' : (activeProject.language === 'No Language' ? 'English' : activeProject.language),
        sunoPromptTags: newTags
    });
  }, [activeProject, updateActiveProject]);

  // Effect to handle the [Instrumental] tag in the artist input
  useEffect(() => {
    if (!activeProject) return;
    const instrumentalTagRegex = /\[instrumental\]/i;
    if (instrumentalTagRegex.test(activeProject.artists)) {
      updateActiveProject({ artists: activeProject.artists.replace(instrumentalTagRegex, '').trim() });
      if (!activeProject.isInstrumental) {
        handleInstrumentalChange(true);
      }
    }
  }, [activeProject, handleInstrumentalChange, updateActiveProject]);

  const handleStartNewSong = useCallback(() => {
    const newProject = createNewProject();
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setIsProjectsModalOpen(false);
    setError(null);
    setPromptError(null);
  }, [createNewProject]);

  const handleSurpriseMe = useCallback(async () => {
    setIsSurprisingMe(true);
    setError(null);
    setPreviousTopic(null);
    try {
      const starterKit = await generateSongStarterKit();
      updateActiveProject({
        topic: starterKit.topic,
        title: starterKit.title,
        genre: starterKit.genre,
        mood: starterKit.mood,
        sunoPromptTags: starterKit.styleTags,
        previousSunoPromptTags: null,
      });
      if (window.innerWidth < 768) {
          setActiveTab('dna');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not generate a surprise song starter. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSurprisingMe(false);
    }
  }, [updateActiveProject, setPreviousTopic]);

  const handleImproveTopic = useCallback(async () => {
    if (!activeProject || !activeProject.topic.trim()) return;
    setIsImproving(true);
    setPreviousTopic(activeProject.topic);
    setError(null);
    try {
        const improved = await improveTopic(activeProject.topic);
        setTopic(improved);
    } catch (err) {
        // FIX: The error object `err` is of type `unknown`. Explicitly check if it's an instance of `Error` before accessing `err.message` to prevent type errors.
        const errorMessage = err instanceof Error ? err.message : "Could not improve topic.";
        setError(errorMessage);
        setPreviousTopic(null);
    } finally {
        setIsImproving(false);
    }
  }, [activeProject, setPreviousTopic, setTopic]);

  const handleUndoTopicImprovement = useCallback(() => {
    if (activeProject?.previousTopic !== null) {
        setTopic(activeProject.previousTopic);
        setPreviousTopic(null);
    }
  }, [activeProject, setTopic, setPreviousTopic]);

  const handleGenerate = useCallback(async () => {
    if (!activeProject || !activeProject.topic.trim()) {
      setError('Please enter a topic for your song.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setLyrics([]);
    setTitle('');
    setPreviousTopic(null);
    
    if (window.innerWidth < 768) {
        setActiveTab('lyrics');
    }

    try {
      let finalStyleTags = activeProject.sunoPromptTags;
      if (finalStyleTags.length === 0) {
        setAriaLiveStatus('Generating style suggestions...');
        const generatedTags = await generateSunoPrompt(activeProject.topic, activeProject.genre, activeProject.mood, activeProject.artists, activeProject.voiceStyle, activeProject.isInstrumental, activeProject.bpm, []);
        
        const combinedTags = Array.from(new Set(generatedTags));
        let currentPrompt = '';
        const tagsWithinLimit: string[] = [];
        for (const tag of combinedTags) {
            const tempPrompt = currentPrompt ? `${currentPrompt}, ${tag}` : tag;
            if (tempPrompt.length <= 1000) {
                currentPrompt = tempPrompt;
                tagsWithinLimit.push(tag);
            } else {
                break;
            }
        }
        setSunoPromptTags(tagsWithinLimit);
        finalStyleTags = tagsWithinLimit;
      }

      setAriaLiveStatus(activeProject.isInstrumental ? 'Generating instrumental track...' : 'Generating lyrics...');
      const stream = generateLyricsStream(activeProject.topic, activeProject.title, activeProject.genre, activeProject.mood, activeProject.lyricalStyle, activeProject.countryVibe, activeProject.language, activeProject.voiceStyle, activeProject.isInstrumental, '', activeProject.artists, finalStyleTags, activeProject.bpm);
      
      let buffer = '';
      let titleSet = false;

      for await (const chunk of stream) {
        buffer += chunk;
        if (!titleSet && buffer.includes('\n')) {
          const titleEndIndex = buffer.indexOf('\n');
          setTitle(buffer.substring(0, titleEndIndex));
          buffer = buffer.substring(titleEndIndex + 1);
          titleSet = true;
        }
        if (titleSet) {
          const parsedSections = parseLyrics(buffer);
          if (parsedSections.length > 0) {
            setLyrics(currentLyrics => {
              const reconciledLyrics = parsedSections.map((parsed, index) => {
                const existing = currentLyrics[index];
                return { ...parsed, id: existing ? existing.id : parsed.id, isLoading: index === parsedSections.length - 1, };
              });
              return reconciledLyrics;
            });
          }
        }
      }

      setLyrics(currentLyrics => {
        if (currentLyrics.length > 0) {
          const lastSection = currentLyrics[currentLyrics.length - 1];
          if (lastSection.isLoading) {
            const finalLyrics = [...currentLyrics];
            finalLyrics[finalLyrics.length - 1] = { ...lastSection, isLoading: false };
            return finalLyrics;
          }
        }
        return currentLyrics;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while generating lyrics.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, setLyrics, setTitle, setPreviousTopic, setSunoPromptTags]);

  const handleRegenerateSection = useCallback(async (sectionId: string) => {
    if (!activeProject) return;
    const sectionIndex = activeProject.lyrics.findIndex(s => s.id === sectionId);
    if (sectionIndex === -1) return;

    const contextSections = activeProject.lyrics.slice(0, sectionIndex);
    const lyricsContext = stringifyLyrics(contextSections);
    const sectionToRegenerate = activeProject.lyrics[sectionIndex];
    
    setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, content: '', isLoading: true } : s));
    setError(null);

    try {
        const stream = regenerateSectionStream(activeProject.topic, activeProject.title, activeProject.genre, activeProject.mood, activeProject.lyricalStyle, activeProject.countryVibe, activeProject.language, activeProject.voiceStyle, activeProject.isInstrumental, activeProject.artists, activeProject.sunoPromptTags, activeProject.bpm, lyricsContext, sectionToRegenerate.type);
        let newContent = '';
        for await (const chunk of stream) {
            newContent += chunk;
            setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, content: newContent } : s));
        }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Failed to regenerate ${sectionToRegenerate.type}.`;
        setError(errorMessage);
    } finally {
        setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, isLoading: false } : s));
    }
  }, [activeProject, setLyrics]);

  const handleContinueSong = useCallback(async () => {
    if (!activeProject) return;
    setIsContinuing(true);
    setError(null);
    try {
        const lyricsContext = stringifyLyrics(activeProject.lyrics);
        const stream = continueSongStream(activeProject.topic, activeProject.title, activeProject.genre, activeProject.mood, activeProject.lyricalStyle, activeProject.countryVibe, activeProject.language, activeProject.voiceStyle, activeProject.isInstrumental, activeProject.artists, activeProject.sunoPromptTags, activeProject.bpm, lyricsContext);

        let newSectionRaw = '';
        let sectionAdded = false;

        for await (const chunk of stream) {
            newSectionRaw += chunk;
            const newSectionParsed = parseLyrics(newSectionRaw);
            
            if (newSectionParsed.length > 0 && !sectionAdded) {
                const newSection = { ...newSectionParsed[0], isLoading: true };
                setLyrics(currentLyrics => [...currentLyrics, newSection]);
                sectionAdded = true;
            } else if (sectionAdded && newSectionParsed.length > 0) {
                setLyrics(currentLyrics => {
                    const updatedLyrics = [...currentLyrics];
                    updatedLyrics[updatedLyrics.length - 1].content = newSectionParsed[0].content;
                    return updatedLyrics;
                });
            }
        }
    } catch (err) {
        // FIX: The error object `err` is of type `unknown`. Explicitly check if it's an instance of `Error` before accessing `err.message` to prevent type errors.
        const errorMessage = err instanceof Error ? err.message : 'Failed to continue song.';
        setError(errorMessage);
    } finally {
        setLyrics(currentLyrics => {
            if (currentLyrics.length === 0) return [];
            const updatedLyrics = [...currentLyrics];
            if (updatedLyrics[updatedLyrics.length - 1]) {
              updatedLyrics[updatedLyrics.length - 1].isLoading = false;
            }
            return updatedLyrics;
        });
        setIsContinuing(false);
    }
  }, [activeProject, setLyrics]);

  const handleGenerateSunoPrompt = useCallback(async () => {
    if (!activeProject) return;
    setIsPromptLoading(true);
    setPromptError(null);
    try {
      setPreviousSunoPromptTags(activeProject.sunoPromptTags);
      const generatedTags = await generateSunoPrompt(activeProject.topic, activeProject.genre, activeProject.mood, activeProject.artists, activeProject.voiceStyle, activeProject.isInstrumental, activeProject.bpm, activeProject.sunoPromptTags);
      const combinedTags = Array.from(new Set(generatedTags));

      let currentPrompt = '';
      const finalTags: string[] = [];

      for (const tag of combinedTags) {
        const tempPrompt = currentPrompt ? `${currentPrompt}, ${tag}` : tag;
        if (tempPrompt.length <= 1000) {
          currentPrompt = tempPrompt;
          finalTags.push(tag);
        } else {
          break;
        }
      }
      setSunoPromptTags(finalTags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate Suno prompt.';
      setPromptError(errorMessage);
    } finally {
      setIsPromptLoading(false);
    }
  }, [activeProject, setPreviousSunoPromptTags, setSunoPromptTags]);

  const handleUndoStyleSuggestion = useCallback(() => {
    if (activeProject?.previousSunoPromptTags !== null) {
      setSunoPromptTags(activeProject.previousSunoPromptTags);
      setPreviousSunoPromptTags(null);
    }
  }, [activeProject, setSunoPromptTags, setPreviousSunoPromptTags]);

  const handleClearSunoPromptTags = useCallback(() => setSunoPromptTags([]), [setSunoPromptTags]);
  const handleUpdateSectionContent = useCallback((sectionId: string, content: string) => setLyrics(currentLyrics => currentLyrics.map(s => s.id === sectionId ? { ...s, content } : s)), [setLyrics]);
  const handleDeleteSection = useCallback((sectionId: string) => setLyrics(currentLyrics => currentLyrics.filter(s => s.id !== sectionId)), [setLyrics]);
  
  const handleAddSection = useCallback((type: string, atIndex?: number) => {
    if (!activeProject) return;
    const newSection: SongSection = {
      id: crypto.randomUUID(),
      type: getNextSectionName(type, activeProject.lyrics),
      content: '',
    };
    setLyrics(currentLyrics => {
      const result = Array.from(currentLyrics);
      if (atIndex !== undefined) result.splice(atIndex, 0, newSection);
      else result.push(newSection);
      return result;
    });
  }, [activeProject, setLyrics]);
  
  const handleApplyTemplate = useCallback((template: string) => { if (template) setLyrics(parseLyrics(template)); }, [setLyrics]);
  const handleReorderSections = useCallback((startIndex: number, endIndex: number) => setLyrics(currentLyrics => { const result = Array.from(currentLyrics); const [removed] = result.splice(startIndex, 1); result.splice(endIndex, 0, removed); return result; }), [setLyrics]);
  const handleClearLyricsAndTitle = useCallback(() => { setTitle(''); setLyrics([]); }, [setTitle, setLyrics]);
  
  // Project Management Handlers
  const handleLoadProject = useCallback((projectId: string) => { setActiveProjectId(projectId); setIsProjectsModalOpen(false); }, []);
  const handleDeleteProject = useCallback((projectId: string) => {
      setProjects(prev => {
          const newProjects = prev.filter(p => p.id !== projectId);
          if (projectId === activeProjectId) {
              if (newProjects.length > 0) {
                  const mostRecent = newProjects.sort((a,b) => b.lastModified - a.lastModified)[0];
                  setActiveProjectId(mostRecent.id);
              } else {
                  const newProject = createNewProject();
                  setActiveProjectId(newProject.id);
                  return [newProject];
              }
          }
          return newProjects.length > 0 ? newProjects : [createNewProject()];
      });
      setIsProjectsModalOpen(projects.length > 1);
  }, [activeProjectId, createNewProject, projects.length]);
  const handleRenameProject = useCallback((projectId: string, newTitle: string) => setProjects(prev => prev.map(p => p.id === projectId ? { ...p, title: newTitle, lastModified: Date.now() } : p)), []);

  const MobileTabButton: React.FC<{tab: MobileTab, label: string, icon: React.ReactNode}> = ({tab, label, icon}) => (
      <button onClick={() => setActiveTab(tab)} className={`w-full flex flex-col items-center justify-center gap-1 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'text-purple-300' : 'text-gray-400 hover:text-white'}`}>
        {icon}
        <span>{label}</span>
        {activeTab === tab && <div className="w-12 h-0.5 bg-purple-400 rounded-full mt-1"></div>}
      </button>
  );

  if (!activeProject) {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <p>Loading projects...</p>
        </div>
    );
  }

  return (
    <div className={`min-h-screen text-white flex flex-col items-center p-4 sm:p-6 lg:p-8 transition-colors duration-[2000ms] ${isPulsing ? 'pulse-bg' : ''}`} style={bgStyle}>
      {isTourActive && <Tour onComplete={handleTourComplete} />}
      <ProjectsModal 
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onNewProject={handleStartNewSong}
      />
      <span role="status" aria-live="polite" className="sr-only">{ariaLiveStatus}</span>
      <div className="w-full max-w-6xl mx-auto flex flex-col flex-grow">
        <Header onOpenProjects={() => setIsProjectsModalOpen(true)} />
        
        <div className="md:hidden sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm -mx-4 sm:-mx-6 mt-4">
            <div className="flex justify-around border-b border-gray-700">
                <MobileTabButton tab="dna" label="Song DNA" icon={<Icon name="info" className="w-5 h-5"/>} />
                <MobileTabButton tab="style" label="Style" icon={<Icon name="regenerate" className="w-5 h-5"/>} />
                <MobileTabButton tab="lyrics" label="Lyrics" icon={<Icon name="copy" className="w-5 h-5"/>} />
            </div>
        </div>

        <main ref={mainContainerRef} className="mt-8 flex-grow">
            <div className="hidden md:flex h-full">
                <div style={{ flexBasis: `${leftPanelWidth}%`, flexShrink: 0, flexGrow: 0 }} className="pr-2">
                    <Controls
                        topic={activeProject.topic} setTopic={setTopic}
                        title={activeProject.title} setTitle={setTitle}
                        isInstrumental={activeProject.isInstrumental} setIsInstrumental={handleInstrumentalChange}
                        genre={activeProject.genre} setGenre={setGenre}
                        mood={activeProject.mood} setMood={setMood}
                        lyricalStyle={activeProject.lyricalStyle} setLyricalStyle={setLyricalStyle}
                        countryVibe={activeProject.countryVibe} setCountryVibe={setCountryVibe}
                        language={activeProject.language} setLanguage={setLanguage}
                        voiceStyle={activeProject.voiceStyle} setVoiceStyle={setVoiceStyle}
                        bpm={activeProject.bpm} setBpm={setBpm}
                        onGenerate={handleGenerate} isLoading={isLoading}
                        artists={activeProject.artists} setArtists={setArtists}
                        onGenerateSunoPrompt={handleGenerateSunoPrompt} isPromptLoading={isPromptLoading}
                        sunoPromptTags={activeProject.sunoPromptTags} setSunoPromptTags={setSunoPromptTags}
                        sunoExcludeTags={activeProject.sunoExcludeTags} setSunoExcludeTags={setSunoExcludeTags}
                        promptError={promptError} onStartNewSong={handleStartNewSong}
                        showMetatagEditor={activeProject.showMetatagEditor} setShowMetatagEditor={setShowMetatagEditor}
                        previousSunoPromptTags={activeProject.previousSunoPromptTags} onUndoStyleSuggestion={handleUndoStyleSuggestion}
                        onSurpriseMe={handleSurpriseMe} isSurprisingMe={isSurprisingMe}
                        onClearSunoPromptTags={handleClearSunoPromptTags} onImproveTopic={handleImproveTopic}
                        isImproving={isImproving} previousTopic={activeProject.previousTopic} onUndoTopicImprovement={handleUndoTopicImprovement}
                    />
                </div>
                <div 
                    className="w-4 flex-shrink-0 cursor-col-resize group flex items-center justify-center"
                    onMouseDown={handleMouseDownOnResizer}
                >
                    <div className="w-1 h-20 bg-gray-700 rounded-full group-hover:bg-purple-500 transition-colors" />
                </div>
                <div className="flex-grow pl-2 min-w-0">
                    <LyricsDisplay
                        topic={activeProject.topic} genre={activeProject.genre} mood={activeProject.mood}
                        title={activeProject.title} lyrics={activeProject.lyrics}
                        sunoPromptTags={activeProject.sunoPromptTags} bpm={activeProject.bpm}
                        setLyrics={setLyrics} isLoading={isLoading} error={error}
                        onUpdateSectionContent={handleUpdateSectionContent} onRegenerateSection={handleRegenerateSection}
                        onDeleteSection={handleDeleteSection} onAddSection={handleAddSection}
                        onApplyTemplate={handleApplyTemplate} onReorderSections={handleReorderSections}
                        onContinueSong={handleContinueSong} isContinuing={isContinuing}
                        showMetatagEditor={activeProject.showMetatagEditor} onClearLyricsAndTitle={handleClearLyricsAndTitle}
                    />
                </div>
            </div>

            <div className="md:hidden">
                {activeTab === 'dna' && <SongDNA
                    topic={activeProject.topic} setTopic={setTopic}
                    title={activeProject.title} setTitle={setTitle}
                    isInstrumental={activeProject.isInstrumental} setIsInstrumental={handleInstrumentalChange}
                    genre={activeProject.genre} setGenre={setGenre}
                    mood={activeProject.mood} setMood={setMood}
                    lyricalStyle={activeProject.lyricalStyle} setLyricalStyle={setLyricalStyle}
                    countryVibe={activeProject.countryVibe} setCountryVibe={setCountryVibe}
                    onSurpriseMe={handleSurpriseMe} isSurprisingMe={isSurprisingMe}
                    onImproveTopic={handleImproveTopic} isImproving={isImproving}
                    previousTopic={activeProject.previousTopic} onUndoTopicImprovement={handleUndoTopicImprovement}
                />}
                {activeTab === 'style' && <StyleEditor
                    topic={activeProject.topic} isInstrumental={activeProject.isInstrumental}
                    language={activeProject.language} setLanguage={setLanguage}
                    voiceStyle={activeProject.voiceStyle} setVoiceStyle={setVoiceStyle}
                    bpm={activeProject.bpm} setBpm={setBpm} onGenerate={handleGenerate} isLoading={isLoading}
                    artists={activeProject.artists} setArtists={setArtists}
                    onGenerateSunoPrompt={handleGenerateSunoPrompt} isPromptLoading={isPromptLoading}
                    sunoPromptTags={activeProject.sunoPromptTags} setSunoPromptTags={setSunoPromptTags}
                    sunoExcludeTags={activeProject.sunoExcludeTags} setSunoExcludeTags={setSunoExcludeTags}
                    promptError={promptError} onStartNewSong={handleStartNewSong}
                    showMetatagEditor={activeProject.showMetatagEditor} setShowMetatagEditor={setShowMetatagEditor}
                    previousSunoPromptTags={activeProject.previousSunoPromptTags} onUndoStyleSuggestion={handleUndoStyleSuggestion}
                    onClearSunoPromptTags={handleClearSunoPromptTags}
                />}
                {activeTab === 'lyrics' && <LyricsDisplay
                    topic={activeProject.topic} genre={activeProject.genre} mood={activeProject.mood}
                    title={activeProject.title} lyrics={activeProject.lyrics}
                    sunoPromptTags={activeProject.sunoPromptTags} bpm={activeProject.bpm}
                    setLyrics={setLyrics} isLoading={isLoading} error={error}
                    onUpdateSectionContent={handleUpdateSectionContent} onRegenerateSection={handleRegenerateSection}
                    onDeleteSection={handleDeleteSection} onAddSection={handleAddSection}
                    onApplyTemplate={handleApplyTemplate} onReorderSections={handleReorderSections}
                    onContinueSong={handleContinueSong} isContinuing={isContinuing}
                    showMetatagEditor={activeProject.showMetatagEditor} onClearLyricsAndTitle={handleClearLyricsAndTitle}
                />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;