
import React from 'react';
import { Button } from './Button';

interface HeaderProps {
    onOpenProjects: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProjects }) => {
  return (
    <header className="text-center relative py-4">
      <div className="absolute top-1/2 -translate-y-1/2 right-0">
          <Button onClick={onOpenProjects} variant="secondary">
              My Songs
          </Button>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        Suno AI Lyrics Creator
      </h1>
      <p className="mt-2 text-lg text-gray-300">
        Craft your next hit song with the power of AI
      </p>
    </header>
  );
};
