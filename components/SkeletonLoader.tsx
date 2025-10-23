import React from 'react';

interface SkeletonLoaderProps {
  lines: number;
  className?: string;
}

const SkeletonLine: React.FC = () => {
    const randomWidth = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
    return (
        <div 
            className="h-4 bg-gray-700/50 rounded"
            style={{ width: `${randomWidth}%` }}
        ></div>
    );
};


export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ lines, className = '' }) => {
  return (
    <div role="status" className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};
