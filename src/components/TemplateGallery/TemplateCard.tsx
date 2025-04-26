import React from 'react';
import { Copy, Star } from 'lucide-react';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
}

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  onToggleFavorite: (templateId: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onToggleFavorite,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">{template.title}</h3>
        <button
          onClick={() => onToggleFavorite(template.id)}
          className="text-gray-400 hover:text-yellow-400 transition-colors"
        >
          <Star
            className={`h-5 w-5 ${template.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
          />
        </button>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{template.content}</p>
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {template.category}
        </span>
        <button
          onClick={() => onSelect(template)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Copy className="h-4 w-4" />
          <span>Kullan</span>
        </button>
      </div>
    </div>
  );
};

export default TemplateCard; 