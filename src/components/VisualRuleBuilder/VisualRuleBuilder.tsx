import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../ui/button';
import { FormField } from '../ui/FormField';
import { showSuccess, showError } from '../../utils/toast';

interface VisualRuleBuilderProps {
  onSave: (rule: any) => void;
  initialData?: any;
}

interface RuleFormData {
  trigger: string;
  pattern: string;
  response: string;
}

export const VisualRuleBuilder: React.FC<VisualRuleBuilderProps> = ({ onSave, initialData }) => {
  const [isPatternValid, setIsPatternValid] = useState(true);
  const [patternError, setPatternError] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm<RuleFormData>({
    defaultValues: initialData || {
      trigger: '',
      pattern: '',
      response: ''
    }
  });

  const pattern = watch('pattern');

  const validatePattern = (pattern: string) => {
    try {
      new RegExp(pattern);
      setIsPatternValid(true);
      setPatternError('');
    } catch (error) {
      setIsPatternValid(false);
      setPatternError('Geçersiz regex deseni');
    }
  };

  const onSubmit = (data: RuleFormData) => {
    if (!isPatternValid) {
      showError('Lütfen geçerli bir regex deseni girin');
      return;
    }

    try {
      onSave(data);
      showSuccess('Kural başarıyla kaydedildi');
    } catch (error) {
      showError('Kural kaydedilirken bir hata oluştu');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          label="Tetikleyici"
          error={errors.trigger?.message}
        >
          <input
            type="text"
            className="w-full p-2 border rounded"
            {...register('trigger', {
              required: 'Tetikleyici alanı zorunludur',
              minLength: {
                value: 3,
                message: 'Tetikleyici en az 3 karakter olmalıdır'
              }
            })}
          />
        </FormField>

        <FormField
          label="Regex Deseni"
          error={patternError || errors.pattern?.message}
        >
          <input
            type="text"
            className={`w-full p-2 border rounded ${!isPatternValid ? 'border-red-500' : ''}`}
            {...register('pattern', {
              required: 'Regex deseni zorunludur',
              onChange: (e) => validatePattern(e.target.value)
            })}
          />
        </FormField>

        <FormField
          label="Yanıt"
          error={errors.response?.message}
        >
          <textarea
            className="w-full p-2 border rounded"
            rows={4}
            {...register('response', {
              required: 'Yanıt alanı zorunludur',
              minLength: {
                value: 5,
                message: 'Yanıt en az 5 karakter olmalıdır'
              }
            })}
          />
        </FormField>

        <Button type="submit">
          {initialData ? 'Güncelle' : 'Kaydet'}
        </Button>
      </form>

      {pattern && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">Regex Test</h3>
          <p className="text-sm text-gray-600">
            Desen: <code className="bg-gray-200 px-1">{pattern}</code>
          </p>
          {isPatternValid ? (
            <p className="text-green-600 text-sm mt-2">✓ Geçerli regex deseni</p>
          ) : (
            <p className="text-red-600 text-sm mt-2">✗ Geçersiz regex deseni</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualRuleBuilder; 