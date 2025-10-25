
import React, { useState, useLayoutEffect } from 'react';
import { Button } from './Button';

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
    {
        target: '#song-dna-section',
        title: '1. The Song DNA',
        content: "Start here. Tell the AI what your song is about. Add a genre and mood to set the vibe. The more detail, the better!",
        position: 'right',
    },
    {
        target: '#style-of-music-section',
        title: '2. The Style',
        content: "This is your soundboard. Use 'Generate Suggestions' to get AI-powered style tags, or add your own from the Style Studio below.",
        position: 'right',
    },
    {
        target: '#generate-button',
        title: '3. Create!',
        content: "Once you're ready, hit this button to create your lyrics or instrumental track.",
        position: 'right',
    },
    {
        target: '#lyrics-display-section',
        title: '4. The Lyric Editor',
        content: "Your masterpiece appears here. Edit text directly, regenerate sections, or highlight words to use the WordSmith tools for rhymes and ideas!",
        position: 'left',
    },
];

interface TourProps {
  onComplete: () => void;
}

export const Tour: React.FC<TourProps> = ({ onComplete }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = tourSteps[stepIndex];

  useLayoutEffect(() => {
    const targetElement = document.querySelector(currentStep.target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
  }, [stepIndex, currentStep.target]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };
  
  if (!targetRect) return null;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 10001,
    transition: 'all 0.3s ease-in-out',
    maxWidth: '288px', // 18rem
  };

  const position = currentStep.position || 'bottom';
  
  if (position === 'bottom') {
    tooltipStyle.top = `${targetRect.bottom + 10}px`;
    tooltipStyle.left = `${targetRect.left}px`;
  } else if (position === 'top') {
    tooltipStyle.bottom = `${window.innerHeight - targetRect.top + 10}px`;
    tooltipStyle.left = `${targetRect.left}px`;
  } else if (position === 'right') {
    tooltipStyle.top = `${targetRect.top}px`;
    tooltipStyle.left = `${targetRect.right + 10}px`;
  } else if (position === 'left') {
    tooltipStyle.top = `${targetRect.top}px`;
    tooltipStyle.right = `${window.innerWidth - targetRect.left + 10}px`;
  }

  return (
    <div className="fixed inset-0 z-[10000]">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 transition-all duration-300 ease-in-out"
        style={{
            clipPath: `path('M0,0H${window.innerWidth}V${window.innerHeight}H0V0ZM${targetRect.x - 8},${targetRect.y - 8}H${targetRect.x+targetRect.width + 8}V${targetRect.y+targetRect.height + 8}H${targetRect.x - 8}V${targetRect.y-8}Z')`,
        }}
      />
      
      {/* Tooltip */}
      <div 
        style={tooltipStyle}
        className="bg-gray-800 border border-purple-500 rounded-lg shadow-2xl p-4 animate-fade-in"
      >
        <style>{`
            @keyframes fade-in {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            .animate-fade-in {
                animation: fade-in 0.3s ease-out forwards;
            }
        `}</style>
        <h3 className="text-lg font-bold text-purple-300 mb-2">{currentStep.title}</h3>
        <p className="text-gray-300 text-sm mb-4">{currentStep.content}</p>
        <div className="flex justify-between items-center">
          <button onClick={handleSkip} className="text-xs text-gray-500 hover:text-white">
            Skip Tour
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{stepIndex + 1} / {tourSteps.length}</span>
            <Button onClick={handleNext} className="!py-1 !px-3 text-sm">
                {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
