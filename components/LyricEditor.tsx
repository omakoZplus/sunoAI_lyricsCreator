import React, { useState, useEffect, useRef, useMemo } from 'react';
import { SongSection, SectionAnalysis } from '../types';
import { analyzeSection } from '../services/geminiService';
import { useDebounce } from '../hooks/useDebounce';

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

const RHYME_COLORS = [
  '#F472B6', // pink-400
  '#60A5FA', // blue-400
  '#34D399', // green-400
  '#FBBF24', // amber-400
  '#A78BFA', // violet-400
  '#2DD4BF', // teal-400
  '#F87171', // red-400
];

export const LyricEditor: React.FC<LyricEditorProps> = ({ section, onContentChange, onShowPopup }) => {
  const [analysis, setAnalysis] = useState<SectionAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debouncedContent = useDebounce(section.content, 1000);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAnalysis = async () => {
      if (!debouncedContent || debouncedContent.trim() === '') {
        setAnalysis(null);
        return;
      }
      setIsAnalyzing(true);
      try {
        const result = await analyzeSection(debouncedContent);
        setAnalysis(result);
      } catch (error) {
        console.error('Failed to analyze section:', error);
        setAnalysis(null);
      } finally {
        setIsAnalyzing(false);
      }
    };
    handleAnalysis();
  }, [debouncedContent]);

  const rhymeKeyColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (!analysis) return map;

    const rhymeKeys = Array.from(new Set(analysis.lines.map(l => l.rhymeKey).filter(Boolean)));
    rhymeKeys.forEach((key, index) => {
      map[key!] = RHYME_COLORS[index % RHYME_COLORS.length];
    });
    return map;
  }, [analysis]);

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
    if (!analysis) {
        return section.content.split('\n').map((line, i) => <div key={i}>{line || <br/>}</div>);
    }

    const avgSyllables = analysis.lines.reduce((sum, line) => sum + line.syllables, 0) / (analysis.lines.length || 1);

    return analysis.lines.map((line, index) => {
      const deviation = Math.abs(line.syllables - avgSyllables);
      const isOutlier = deviation > 2 && analysis.lines.length > 2;

      return (
        <div key={index} className="relative">
          <span style={{ 
            textDecoration: line.rhymeKey ? 'underline' : 'none', 
            textDecorationColor: rhymeKeyColorMap[line.rhymeKey!] || 'transparent', 
            textDecorationStyle: 'wavy',
            textUnderlineOffset: '3px'
          }}>
            {line.text || <br/>}
          </span>
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
    <div className="relative">
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