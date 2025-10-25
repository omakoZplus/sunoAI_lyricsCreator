
import React, { useState } from 'react';
import { Button } from './Button';
import { Icon } from './Icon';
import { blendStyles } from '../services/geminiService';

interface StyleBlenderProps {
  onTagsGenerated: (tags: string[]) => void;
}

export const StyleBlender: React.FC<StyleBlenderProps> = ({ onTagsGenerated }) => {
  const [style1, setStyle1] = useState('');
  const [style2, setStyle2] = useState('');
  const [isBlending, setIsBlending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBlend = async () => {
    if (!style1.trim() || !style2.trim()) {
      setError('Please enter two styles to blend.');
      return;
    }
    setIsBlending(true);
    setError(null);
    try {
      const blendedTags = await blendStyles(style1, style2);
      onTagsGenerated(blendedTags);
      setStyle1('');
      setStyle2('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Could not blend styles.';
      setError(errorMessage);
    } finally {
      setIsBlending(false);
    }
  };

  return (
    <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg">
      <h4 className="text-sm font-medium text-gray-300">AI Style Blender</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={style1}
          onChange={(e) => setStyle1(e.target.value)}
          placeholder="e.g., Daft Punk"
          className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-3 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 text-sm"
        />
        <input
          type="text"
          value={style2}
          onChange={(e) => setStyle2(e.target.value)}
          placeholder="e.g., Fleetwood Mac"
          className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-3 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 text-sm"
        />
      </div>
      <Button onClick={handleBlend} disabled={isBlending} fullWidth variant="secondary">
        <Icon name="regenerate" className="w-4 h-4" />
        {isBlending ? 'Blending...' : 'Blend Styles'}
      </Button>
      {error && <p className="text-red-400 text-xs text-center pt-1">{error}</p>}
    </div>
  );
};
