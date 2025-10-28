import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';

interface MetronomeProps {
  bpm: string;
}

export const Metronome: React.FC<MetronomeProps> = ({ bpm }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualBeat, setVisualBeat] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<number | null>(null);
  const beatTimeoutRef = useRef<number | null>(null);

  const parsedBpm = parseInt(bpm, 10);

  const stopMetronome = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (beatTimeoutRef.current) {
      clearTimeout(beatTimeoutRef.current);
      beatTimeoutRef.current = null;
    }
    setIsPlaying(false);
    setVisualBeat(false);
  }, []);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopMetronome();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stopMetronome]);
  
  const playTick = useCallback(() => {
    if (!audioCtxRef.current) return;
    const oscillator = audioCtxRef.current.createOscillator();
    const gainNode = audioCtxRef.current.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
    gainNode.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.05);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtxRef.current.destination);

    oscillator.start(audioCtxRef.current.currentTime);
    oscillator.stop(audioCtxRef.current.currentTime + 0.05);

    setVisualBeat(true);
    if (beatTimeoutRef.current) clearTimeout(beatTimeoutRef.current);
    beatTimeoutRef.current = window.setTimeout(() => setVisualBeat(false), 100);
  }, []);

  const startMetronome = useCallback(() => {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        alert("Sorry, the metronome feature is not supported in your browser.");
        return;
      }
    }
    // Resume context if it was suspended
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    const interval = (60 / parsedBpm) * 1000;
    playTick(); // Play first tick immediately
    intervalRef.current = window.setInterval(playTick, interval);
    setIsPlaying(true);
  }, [parsedBpm, playTick]);

  useEffect(() => {
    if (isPlaying && parsedBpm > 0 && parsedBpm <= 300) {
      startMetronome();
    } else {
      stopMetronome();
    }
  }, [isPlaying, parsedBpm, startMetronome, stopMetronome]);


  const handleTogglePlay = () => {
    if (!parsedBpm || parsedBpm <= 0 || parsedBpm > 300) {
      alert('Please set a valid BPM (1-300) in the Advanced Style Editor.');
      return;
    }
    setIsPlaying(prev => !prev);
  };
  
  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleTogglePlay} variant="secondary" className="!py-1.5 !px-3">
        <Icon name={isPlaying ? 'stop' : 'play'} className="w-4 h-4" />
        <span className="text-sm">{isPlaying ? 'Stop' : 'Metronome'}</span>
      </Button>
      <div className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-full bg-purple-400 transition-all duration-100 ${visualBeat ? 'scale-125 opacity-100' : 'scale-100 opacity-30'}`} />
          <span className="text-sm font-mono text-gray-400 w-12">{parsedBpm > 0 ? `${parsedBpm} BPM` : '-'}</span>
      </div>
    </div>
  );
};
