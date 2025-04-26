import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';

interface RegexBlock {
  id: string;
  type: 'text' | 'any' | 'digit' | 'word' | 'space' | 'group' | 'or' | 'repeat';
  value: string;
  settings?: {
    min?: number;
    max?: string;
  };
}

interface RegexBuilderProps {
  pattern: string;
  onChange: (value: string) => void;
}

const RegexBuilder: React.FC<RegexBuilderProps> = ({ pattern, onChange }) => {
  const [manualEdit, setManualEdit] = useState(false);
  const [blocks, setBlocks] = useState<RegexBlock[]>([]);
  
  // Pattern değiştiğinde blokları güncelle (manuel yazma durumu için)
  useEffect(() => {
    if (manualEdit) return;
    
    // Basit bir parse işlemi, gerçek uygulamada daha karmaşık bir parser gerekebilir
    try {
      // Eğer pattern boşsa veya geçerli değilse, blokları temizle
      if (!pattern) {
        setBlocks([]);
      }
    } catch (e) {
      // Parse hatası olursa, blokları temizle
      setBlocks([]);
    }
  }, [pattern, manualEdit]);
  
  // Bloklar değiştiğinde pattern'i güncelle
  const updatePattern = (newBlocks: RegexBlock[]) => {
    setBlocks(newBlocks);
    
    let newPattern = '';
    newBlocks.forEach(block => {
      switch (block.type) {
        case 'text':
          // Özel karakterleri escape et
          newPattern += block.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          break;
        case 'any':
          newPattern += '.';
          break;
        case 'digit':
          newPattern += '\\d';
          break;
        case 'word':
          newPattern += '\\w';
          break;
        case 'space':
          newPattern += '\\s';
          break;
        case 'group':
          newPattern += `(${block.value})`;
          break;
        case 'or':
          newPattern += '|';
          break;
        case 'repeat':
          if (block.settings?.min !== undefined) {
            if (block.settings.max) {
              newPattern += `{${block.settings.min},${block.settings.max}}`;
            } else {
              newPattern += `{${block.settings.min},}`;
            }
          } else {
            newPattern += '+';
          }
          break;
      }
    });
    
    onChange(newPattern);
  };
  
  // Yeni blok ekle
  const addBlock = (type: RegexBlock['type']) => {
    const newBlock: RegexBlock = {
      id: Date.now().toString(),
      type,
      value: type === 'text' ? '' : type === 'group' ? '.*' : ''
    };
    
    if (type === 'repeat') {
      newBlock.settings = { min: 1, max: '' };
    }
    
    const newBlocks = [...blocks, newBlock];
    updatePattern(newBlocks);
  };
  
  // Remove a block
  const removeBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    updatePattern(newBlocks);
  };
  
  // Update a block's value
  const updateBlockValue = (id: string, value: string) => {
    const newBlocks = blocks.map(b => 
      b.id === id ? { ...b, value } : b
    );
    updatePattern(newBlocks);
  };
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
      <div className="flex justify-between items-center mb-3">
        <label className="block text-sm font-medium">
          Regex Pattern Oluşturucu
        </label>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setManualEdit(!manualEdit)}
        >
          {manualEdit ? 'Görsel Editör' : 'Manuel Düzenle'}
        </Button>
      </div>
      
      {manualEdit ? (
        <div>
          <input
            type="text"
            value={pattern}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Regex pattern..."
            className="w-full p-2 border rounded font-mono"
          />
          <p className="text-xs text-gray-500 mt-1">
            Regex syntax kullanarak direkt olarak pattern yazabilirsiniz.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 mb-3 min-h-[60px] p-2 border border-dashed rounded">
            {blocks.map((block) => (
              <div 
                key={block.id}
                className="flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded group"
              >
                <span className="mr-1">{block.type === 'text' ? '"' : ''}</span>
                
                {block.type === 'text' ? (
                  <input
                    type="text"
                    value={block.value}
                    onChange={(e) => updateBlockValue(block.id, e.target.value)}
                    className="w-20 bg-transparent border-none focus:outline-none px-0"
                  />
                ) : (
                  <span>{block.value}</span>
                )}
                
                <span className="ml-1">{block.type === 'text' ? '"' : ''}</span>
                
                <button
                  onClick={() => removeBlock(block.id)}
                  className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            
            {blocks.length === 0 && (
              <span className="text-gray-400 dark:text-gray-500 text-sm">
                Aşağıdan blok ekleyerek başlayın...
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button variant="outline" size="sm" onClick={() => addBlock('text')}>
              Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('any')}>
              Herhangi (.)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('digit')}>
              Rakam (\d)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('word')}>
              Kelime (\w)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('space')}>
              Boşluk (\s)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('group')}>
              Grup ( () )
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('or')}>
              VEYA (|)
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock('repeat')}>
              Tekrar (+)
            </Button>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t">
        <div className="font-mono text-sm break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
          {pattern || '<pattern>'}
        </div>
      </div>
    </div>
  );
};

export default RegexBuilder; 