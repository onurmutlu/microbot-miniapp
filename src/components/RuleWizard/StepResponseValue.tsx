import React, { useState, useEffect } from 'react';
import { useWizard } from './WizardContext';
import { FormField } from '../../components/ui/FormField';
import { useForm } from 'react-hook-form';
import { VALIDATION_RULES } from '../../utils/validation';
import api from '../../utils/api';

interface FormData {
  responseValue: string;
  templateId?: string;
}

interface Template {
  id: string;
  title: string;
  content: string;
}

const StepResponseValue: React.FC = () => {
  const { data, updateData } = useWizard();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { 
    register, 
    formState: { errors }, 
    setValue, 
    watch
  } = useForm<FormData>({
    defaultValues: {
      responseValue: data.responseValue,
      templateId: ''
    }
  });
  
  const responseValue = watch('responseValue');
  
  // Update wizard data when form changes
  useEffect(() => {
    updateData({ responseValue });
  }, [responseValue, updateData]);
  
  // Şablonları yükle (eğer şablon modu seçiliyse)
  useEffect(() => {
    if (data.responseType === 'template') {
      fetchTemplates();
    }
  }, [data.responseType]);
  
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/message-templates');
      setTemplates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Şablonlar yüklenirken hata:', error);
      setLoading(false);
    }
  };
  
  // Şablon seçildiğinde yanıtı güncelle
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = templates.find(t => t.id === e.target.value);
    if (selected) {
      setValue('responseValue', selected.content);
    }
  };
  
  const insertVariable = (variable: string) => {
    setValue('responseValue', responseValue + variable);
  };
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        {data.responseType === 'simple' ? 'Yanıt Mesajını Yazın' : 'Şablon Seçin'}
      </h2>
      
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        {data.responseType === 'simple' 
          ? 'Bot\'un göndereceği yanıt mesajını yazın. Değişkenler ekleyebilirsiniz.' 
          : 'Önceden kaydettiğiniz şablonlardan birini seçin.'}
      </p>
      
      {data.responseType === 'template' && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Şablon
          </label>
          {loading ? (
            <p>Şablonlar yükleniyor...</p>
          ) : (
            <select
              {...register('templateId')}
              onChange={handleTemplateChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Şablon seçin...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.title}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
      
      <FormField
        name="responseValue"
        label="Yanıt Mesajı"
        type="textarea"
        placeholder="Bot'un vereceği yanıt mesajını yazın..."
        register={register}
        rules={{ 
          required: VALIDATION_RULES.REQUIRED,
          minLength: { value: 5, message: VALIDATION_RULES.MIN_LENGTH(5) }
        }}
        errors={errors}
      />
      
      <div className="mt-4">
        <div className="text-sm font-medium mb-1">Değişkenler</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => insertVariable('${username}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{username}'}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('${groupname}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{groupname}'}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('${date}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{date}'}
          </button>
          <button
            type="button"
            onClick={() => insertVariable('${time}')}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm"
          >
            ${'{time}'}
          </button>
          
          {data.triggerType === 'regex' && (
            <>
              <div className="w-full h-0 border-t my-2"></div>
              <div className="w-full text-sm font-medium">Regex Grupları</div>
              <button
                type="button"
                onClick={() => insertVariable('${1}')}
                className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-sm"
              >
                ${'{1}'}
              </button>
              <button
                type="button"
                onClick={() => insertVariable('${2}')}
                className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded text-sm"
              >
                ${'{2}'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepResponseValue; 