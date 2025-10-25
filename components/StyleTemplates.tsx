
import React from 'react';
import { STYLE_TEMPLATES } from '../constants';

interface StyleTemplatesProps {
  onApplyTemplate: (tags: string[]) => void;
}

export const StyleTemplates: React.FC<StyleTemplatesProps> = ({ onApplyTemplate }) => {
  return (
    <div className="space-y-3 p-3 bg-gray-900/50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300">Style Templates</h4>
        <div className="flex flex-wrap gap-2">
            {STYLE_TEMPLATES.map(template => (
                <button
                    key={template.name}
                    onClick={() => onApplyTemplate(template.tags)}
                    className="px-2.5 py-1 bg-gray-700/50 text-gray-200 text-xs font-semibold rounded-md hover:bg-purple-600/70 transition-colors"
                >
                    {template.name}
                </button>
            ))}
        </div>
    </div>
  );
};
