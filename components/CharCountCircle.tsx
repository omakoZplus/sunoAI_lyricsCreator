import React from 'react';

interface CharCountCircleProps {
  count: number;
  limit: number;
  size?: number;
  strokeWidth?: number;
}

export const CharCountCircle: React.FC<CharCountCircleProps> = ({
  count,
  limit,
  size = 32,
  strokeWidth = 3,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(count / limit, 1);
  const offset = circumference * (1 - progress);

  let color = 'stroke-purple-400';
  if (count > limit) {
    color = 'stroke-red-500';
  } else if (progress > 0.9) {
    color = 'stroke-yellow-400';
  }
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          className="stroke-gray-700"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`transition-stroke duration-300 ease-in-out ${color}`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span className="absolute text-xs font-mono text-gray-300">
        {count}
      </span>
    </div>
  );
};
