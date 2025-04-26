import React, { useState, useMemo } from 'react';
import SearchBar from './SearchBar';
import CategoriesFilter from './CategoriesFilter';
import TemplateCard from './TemplateCard';

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
  isFavorite: boolean;
}

interface TemplateGalleryProps {
  templates: Template[];
  onSelectTemplate: (template: Template) => void;
  onToggleFavorite: (templateId: string) => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  templates,
  onSelectTemplate,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const uniqueCategories = new Set(templates.map((t) => t.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <CategoriesFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={onSelectTemplate}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
      {filteredTemplates.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          Arama kriterlerinize uygun şablon bulunamadı.
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;

 