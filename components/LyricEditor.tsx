import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SongSection, SectionAnalysis, LyricalIssue, AnalyzedLine } from '../types';
import { analyzeSection, identifyLyricalIssues, getAlternativeForCliché, generateImageryForLine } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';
import { SuggestionTooltip } from './SuggestionTooltip';
import { Icon } from './Icon';

interface LyricEditorProps {
  section: SongSection;
  onContentChange: (newContent: string) => void;
  onShowPopup: (
    event: React.MouseEvent,
    section: SongSection,
    selection: string,
    selectionStart: number,
    selectionEnd: number
  ) => void;
}

type TooltipState = {
  visible: boolean;
  target: HTMLElement | null;
  phrase: string;
  issueType: 'cliche' | 'telling';
  description: string;
  suggestions: string[];
  isLoading: boolean;
  error?: string | null;
};

const RHYME_COLORS = [
  '#F472B6', // pink-400
  '#60A5FA', // blue-400
  '#34D399', // green-400
  '#FBBF24', // amber-400
  '#A78BFA', // violet-400
  '#2DD4BF', // teal-400
  '#F87171', // red-400
];

const MeterBar: React.FC<{ analysis: SectionAnalysis | null }> = ({ analysis }) => {
  if (!analysis || analysis.lines.length < 2) return null;

  const syllables = analysis.lines.map(l => l.syllables).filter(s => s > 0);
  if (syllables.length < 2) return null;

  const mean = syllables.reduce((a, b) => a + b, 0) / syllables.length;
  const stdDev = Math.sqrt(
    syllables.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / syllables.length
  );

  let meterClass = '';
  let title = '';
  if (stdDev <= 1.2) {
    meterClass = 'meter-bar-stable';
    title = `Syllable Consistency: Stable (Std Dev: ${stdDev.toFixed(2)})`;
  } else if (stdDev <= 2.5) {
    meterClass = 'meter-bar-variable';
     title = `Syllable Consistency: Variable (Std Dev: ${stdDev.toFixed(2)})`;
  } else {
    meterClass = 'meter-bar-unstable';
     title = `Syllable Consistency: Unstable (Std Dev: ${stdDev.toFixed(2)})`;
  }

  return <div className={`meter-bar ${meterClass}`} title={title}></div>;
};

export const LyricEditor: React.FC<LyricEditorProps> = ({ section, onContentChange, onShowPopup }) => {
  const [analysis, setAnalysis] = useState<SectionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lyricalIssues, setLyricalIssues] = useState<LyricalIssue[]>([]);
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, target: null, phrase: '', issueType: 'cliche', description: '', suggestions: [], isLoading: false });
  const [activeRhymeKey, setActiveRhymeKey] = useState<string | null>(null);

  const debouncedContentForSyllables = useDebounce(section.content, 1000);
  const debouncedContentForIssues = useDebounce(section.content, 2500);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSyllableAnalysis = async () => {
      if (!debouncedContentForSyllables || debouncedContentForSyllables.trim() === '') {
        setAnalysis(null);
        return;
      }
      setIsAnalyzing(true);
      try {
        const result = await analyzeSection(debouncedContentForSyllables);
        setAnalysis(result);
      } catch (error) {
        console.error('Failed to analyze section:', error);
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    };
    handleSyllableAnalysis();
  }, [debouncedContentForSyllables]);

  useEffect(() => {
    const handleIssueAnalysis = async () => {
      if (!debouncedContentForIssues || debouncedContentForIssues.trim().length < 10) {
        setLyricalIssues([]);
        return;
      }
      try {
        const issues = await identifyLyricalIssues(debouncedContentForIssues);
        setLyricalIssues(issues);
      } catch (error) {
        console.error('Failed to identify lyrical issues:', error);
        setLyricalIssues([]);
      }
    };
    handleIssueAnalysis();
  }, [debouncedContentForIssues]);

  const rhymeKeyColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!analysis) return map;
    const rhymeKeys = Array.from(new Set(analysis.lines.map(l => l.rhymeKey)))
      .filter((key): key is string => !!key);
    rhymeKeys.forEach((key, index) => {
      map[key] = RHYME_COLORS[index % RHYME_COLORS.length];
    });
    return map;
  }, [analysis]);
  
  const handleSuggestionHover = async (event: React.MouseEvent, issue: LyricalIssue) => {
    setTooltip({
        visible: true,
        target: event.currentTarget as HTMLElement,
        phrase: issue.phrase,
        issueType: issue.type,
        description: issue.description,
        suggestions: [],
        isLoading: true,
        error: null,
    });

    try {
        let results: string[];
        if (issue.type === 'cliche') {
            results = await getAlternativeForCliché(issue.phrase);
        } else { // 'telling'
            results = await generateImageryForLine(issue.phrase);
        }
        setTooltip(current => ({...current, suggestions: results, isLoading: false }));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Could not fetch suggestions.';
        setTooltip(current => ({...current, error: errorMessage, isLoading: false }));
    }
  };

  const handleSuggestionLeave = () => {
    setTooltip(current => ({ ...current, visible: false }));
  };

  const handleSelectSuggestion = (suggestion: string) => {
    const newContent = section.content.replace(tooltip.phrase, suggestion);
    onContentChange(newContent);
    handleSuggestionLeave();
  };


  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (textarea && textarea.selectionStart !== textarea.selectionEnd) {
      const selection = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      onShowPopup(e, section, selection, textarea.selectionStart, textarea.selectionEnd);
    }
  };

  const renderHighlightedText = () => {
    const issuePhrases = lyricalIssues.map(issue => issue.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const issueRegex = issuePhrases.length > 0 ? new RegExp(`(${issuePhrases.join('|')})`, 'g') : null;

    const linesToRender: AnalyzedLine[] = analysis ? analysis.lines : section.content.split('\n').map(line => ({ text: line, syllables: 0, rhymeKey: null }));
    const avgSyllables = analysis ? analysis.lines.reduce((sum, line) => sum + line.syllables, 0) / (analysis.lines.length || 1) : 0;

    return linesToRender.map((line, index) => {
        const lineHasRhyme = !!line.rhymeKey;
        const isRhymeActive = activeRhymeKey === line.rhymeKey && activeRhymeKey !== null;
        const deviation = Math.abs(line.syllables - avgSyllables);
        const isOutlier = analysis ? deviation > 2 && analysis.lines.length > 2 : false;
        const lineHasIssue = lyricalIssues.some(issue => line.text.includes(issue.phrase));

        const renderLinePart = (part: string, key: number | string) => {
            const issue = lyricalIssues.find(iss => iss.phrase === part);
            if (issue) {
                return (
                    <span
                        key={key}
                        onMouseEnter={(e) => handleSuggestionHover(e, issue)}
                        onMouseLeave={handleSuggestionLeave}
                        className={`suggestion-underline ${issue.type === 'cliche' ? 'suggestion-underline-cliche' : 'suggestion-underline-telling'}`}
                    >
                        {part}
                    </span>
                );
            }
            return <span key={key}>{part}</span>;
        };

        const renderRhymeWord = (word: string) => (
            <span
                className={`rhyme-word ${isRhymeActive ? 'rhyme-word-active' : ''}`}
                style={{
                    '--rhyme-glow-color': rhymeKeyColorMap[line.rhymeKey!],
                    '--rhyme-bg-color': `${rhymeKeyColorMap[line.rhymeKey!]}33`,
                    textDecoration: 'underline',
                    textDecorationColor: rhymeKeyColorMap[line.rhymeKey!],
                    textDecorationStyle: 'wavy',
                    textUnderlineOffset: '3px'
                } as React.CSSProperties}
                onClick={() => setActiveRhymeKey(k => k === line.rhymeKey ? null : line.rhymeKey)}
            >
                {issueRegex ? word.split(issueRegex).filter(Boolean).map(renderLinePart) : word}
            </span>
        );

        let lineContent;
        const parts = line.text.match(/(.*?\s)?(\b[\w'-]+\b)(.*)$/);

        if (lineHasRhyme && parts) {
            const [, start, word, end] = parts;
            lineContent = (
                <>
                    {issueRegex ? (start || '').split(issueRegex).filter(Boolean).map(renderLinePart) : start}
                    {renderRhymeWord(word)}
                    {issueRegex ? (end || '').split(issueRegex).filter(Boolean).map(renderLinePart) : end}
                </>
            );
        } else if (issueRegex) {
            lineContent = line.text.split(issueRegex).filter(Boolean).map(renderLinePart);
        } else {
            lineContent = line.text;
        }

        return (
            <div key={index} className="relative group/line">
                <span>
                    {line.text === '' ? <br /> : lineContent}
                </span>

                {lineHasIssue && (
                    <Icon name="info" className="w-4 h-4 text-purple-400 absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 ml-[-4px] opacity-0 group-hover/line:opacity-100 transition-opacity" />
                )}

                {line.syllables > 0 && (
                    <span
                    className={`absolute right-0 top-1/2 -translate-y-1/2 text-xs font-mono flex-shrink-0 ${isOutlier ? 'text-yellow-400' : 'text-gray-500'}`}
                    style={{ paddingLeft: '1ch' }}
                    >
                    {line.syllables}
                    </span>
                )}
            </div>
        );
    });
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!tooltip.visible || !tooltip.target) return { display: 'none' };
    const targetRect = tooltip.target.getBoundingClientRect();
    const editorRect = textareaRef.current?.getBoundingClientRect();
    if (!editorRect) return { display: 'none' };
    return {
      position: 'absolute',
      top: `${targetRect.top - editorRect.top - 10}px`,
      left: `${targetRect.left - editorRect.left + targetRect.width / 2}px`,
      transform: 'translateX(-50%) translateY(-100%)',
      zIndex: 20,
    };
  };

  const editorStyles: React.CSSProperties = {
    margin: 0,
    border: '1px solid transparent',
    padding: '0 2.5em 0 0',
    fontFamily: 'inherit',
    fontSize: '1rem',
    lineHeight: '1.625',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    background: 'transparent',
    width: '100%',
    minHeight: '40px',
    resize: 'none',
    overflow: 'hidden'
  };

  return (
    <div className="relative pl-6" onMouseLeave={() => setActiveRhymeKey(null)}>
       <MeterBar analysis={analysis} />
      {tooltip.visible && (
        <div style={getTooltipStyle()}>
          <SuggestionTooltip 
            isLoading={tooltip.isLoading}
            suggestions={tooltip.suggestions}
            description={tooltip.description}
            onSelectSuggestion={handleSelectSuggestion}
            error={tooltip.error}
          />
        </div>
      )}
      <div
        ref={backdropRef}
        className="text-gray-200 pointer-events-none"
        style={{ ...editorStyles }}
      >
        {renderHighlightedText()}
      </div>
      <textarea
        ref={textareaRef}
        value={section.content}
        onChange={(e) => onContentChange(e.target.value)}
        onScroll={handleScroll}
        onMouseUp={handleMouseUp}
        placeholder={`Lyrics for ${section.type}...`}
        className="absolute top-0 left-0 placeholder-gray-500 focus:outline-none caret-white"
        style={{ ...editorStyles, color: 'transparent' }}
      />
    </div>
  );
};