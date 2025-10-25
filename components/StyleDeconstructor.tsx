
import React, { useState } from 'react';
import { Button } from './Button';

interface StyleDeconstructorProps {
  onDeconstruct: (tags: string[]) => void;
}

export const StyleDeconstructor: React.FC<StyleDeconstructorProps> = ({ onDeconstruct }) => {
    const [inputValue, setInputValue] = useState('');

    const handleDeconstruct = () => {
        if (!inputValue.trim()) return;
        const tags = inputValue.split(',').map(tag => tag.trim()).filter(Boolean);
        onDeconstruct(tags);
        setInputValue('');
    };

    return (
        <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300">Deconstruct & Load Style</h4>
            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste a comma-separated Suno prompt here..."
                className="w-full bg-gray-900/70 border border-gray-600 rounded-lg px-3 py-1.5 text-white placeholder-gray-500 focus:ring-1 focus:ring-purple-500 text-sm"
                rows={2}
            />
            <Button onClick={handleDeconstruct} fullWidth variant="secondary">
                Deconstruct & Load
            </Button>
        </div>
    );
};
