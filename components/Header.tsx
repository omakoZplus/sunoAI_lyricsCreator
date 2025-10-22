
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
        Suno AI Lyrics Creator
      </h1>
      <p className="mt-2 text-lg text-gray-300">
        Craft your next hit song with the power of AI
      </p>
    </header>
  );
};
