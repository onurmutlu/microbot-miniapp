import React from 'react';
import { Template } from '../../types/template';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { iCarbonEdit, iCarbonTrash } from 'unocss/preset-icons';

interface TemplateCardProps {
  template: Template;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}) => {
  return (
    <Card className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
            >
              <i-carbon-edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
            >
              <i-carbon-trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{template.category}</Badge>
            <Badge variant={template.sentiment === 'positive' ? 'success' : template.sentiment === 'negative' ? 'destructive' : 'default'}>
              {template.sentiment}
            </Badge>
            {template.isActive ? (
              <Badge variant="success">Aktif</Badge>
            ) : (
              <Badge variant="destructive">Pasif</Badge>
            )}
          </div>

          <p className="text-sm text-gray-600">{template.content}</p>

          {template.variables.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Değişkenler:</p>
              <div className="flex flex-wrap gap-2">
                {template.variables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Kullanım: {template.usageCount}</span>
            <span>Son güncelleme: {new Date(template.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={onSelect}
      />
    </Card>
  );
};

export default TemplateCard; 