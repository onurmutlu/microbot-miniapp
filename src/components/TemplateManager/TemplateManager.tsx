import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateService } from '../../services/templateService';
import { Template, TemplateFilters } from '../../types/template';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import TemplateCard from './TemplateCard';
import TemplateForm from './TemplateForm';
import { showSuccess, showError } from '../../utils/toast';

const TemplateManager: React.FC = () => {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates', filters],
    queryFn: () => templateService.getTemplates(filters)
  });

  const createMutation = useMutation({
    mutationFn: templateService.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showSuccess('Şablon başarıyla oluşturuldu');
      setIsFormOpen(false);
    },
    onError: (error) => {
      showError('Şablon oluşturulurken hata oluştu');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Template> }) =>
      templateService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showSuccess('Şablon başarıyla güncellendi');
      setIsFormOpen(false);
      setEditingTemplate(null);
    },
    onError: (error) => {
      showError('Şablon güncellenirken hata oluştu');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: templateService.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showSuccess('Şablon başarıyla silindi');
    },
    onError: (error) => {
      showError('Şablon silinirken hata oluştu');
    }
  });

  const handleFilterChange = (key: keyof TemplateFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplates(prev =>
      prev.includes(id)
        ? prev.filter(templateId => templateId !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedTemplates.length === 0) return;
    try {
      await templateService.bulkDelete(selectedTemplates);
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showSuccess('Seçili şablonlar başarıyla silindi');
      setSelectedTemplates([]);
    } catch (error) {
      showError('Şablonlar silinirken hata oluştu');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Şablon Yönetimi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <Input
                placeholder="Şablon ara..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="max-w-sm"
              />
              <Select
                value={filters.category}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="information">Bilgi</SelectItem>
                  <SelectItem value="support">Destek</SelectItem>
                  <SelectItem value="marketing">Pazarlama</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sentiment}
                onValueChange={(value) => handleFilterChange('sentiment', value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Duygu durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Pozitif</SelectItem>
                  <SelectItem value="neutral">Nötr</SelectItem>
                  <SelectItem value="negative">Negatif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setIsFormOpen(true)}>
                Yeni Şablon
              </Button>
              {selectedTemplates.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete}>
                  Seçili Şablonları Sil
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <TemplateForm
          template={editingTemplate}
          onSubmit={(data) => {
            if (editingTemplate) {
              updateMutation.mutate({ id: editingTemplate.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div>Yükleniyor...</div>
        ) : (
          templates?.map((template: Template) => (
            <TemplateCard
              key={template.id}
              template={template}
              isSelected={selectedTemplates.includes(template.id)}
              onSelect={() => handleTemplateSelect(template.id)}
              onEdit={() => {
                setEditingTemplate(template);
                setIsFormOpen(true);
              }}
              onDelete={() => deleteMutation.mutate(template.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TemplateManager; 