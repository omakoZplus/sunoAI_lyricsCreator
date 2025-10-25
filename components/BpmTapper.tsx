
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './Button';

interface BpmTapperProps {
  onBpmChange: (bpm: string) => void;
}

export const BpmTapper: React.FC<BpmTapperProps> = ({ onBpmChange }) => {
  const [taps, setTaps] = useState<number[]>([]);
  const [bpm, setBpm] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const handleReset = useCallback(() => {
    setTaps([]);
    setBpm(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleTap = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const now = Date.now();
    const newTaps = [...taps, now].slice(-10); // Keep last 10 taps for accuracy

    if (newTaps.length > 1) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgInterval > 0) {
        const calculatedBpm = Math.round(60000 / avgInterval);
        setBpm(calculatedBpm);
        onBpmChange(calculatedBpm.toString());
      }
    }
    setTaps(newTaps);
    
    timeoutRef.current = window.setTimeout(() => {
      handleReset();
    }, 3000); // Reset after 3 seconds of inactivity
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleTap} variant="secondary" fullWidth>
        Tap for BPM
      </Button>
      <div className="text-center text-xs text-gray-400 min-h-[16px]">
        {bpm ? `~${bpm} BPM (${taps.length} taps)` : 'Tap button to the beat'}
        {taps.length > 0 && (
          <button onClick={handleReset} className="ml-2 text-red-400 hover:text-red-300">
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
