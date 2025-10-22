
import React from 'react';

const Bar: React.FC<{ height: string; delay: string }> = ({ height, delay }) => (
  <div
    className="w-2 bg-purple-400 rounded-full"
    style={{
      height,
      animation: `waveform 1.2s ease-in-out infinite ${delay}`,
    }}
  >
    <style>{`
      @keyframes waveform {
        0%, 100% { transform: scaleY(0.2); }
        50% { transform: scaleY(1.0); }
      }
    `}</style>
  </div>
);

export const Waveform: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2 h-12">
      <Bar height="100%" delay="0s" />
      <Bar height="100%" delay="0.2s" />
      <Bar height="100%" delay="0.4s" />
      <Bar height="100%" delay="0.6s" />
      <Bar height="100%" delay="0.8s" />
    </div>
  );
};
