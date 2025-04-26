import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormField } from '../ui/FormField';
import { validationRules } from '../../utils/validation';
import { Template } from '../../types/template';

interface TemplateFormProps {
  template?: Template;
  onSubmit: (data: any) => void;
  onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  onSubmit,
  onClose
}) => {
  const methods = useForm({
    defaultValues: {
      name: template?.name || '',
      content: template?.content || '',
      category: template?.category || '',
      sentiment: template?.sentiment || 'neutral',
      variables: template?.variables || [],
      isActive: template?.isActive || true
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {template ? 'Şablonu Düzenle' : 'Yeni Şablon'}
        </h2>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              label="Şablon Adı"
              placeholder="Örn: Karşılama Mesajı, Bilgilendirme"
              options={validationRules.required()}
            />

            <FormField
              name="content"
              label="İçerik"
              type="textarea"
              placeholder="Mesaj şablonunun içeriği"
              options={{
                ...validationRules.required(),
                ...validationRules.minLength(10)
              }}
            />

            <FormField
              name="category"
              label="Kategori"
              type="select"
              options={validationRules.required()}
            >
              <option value="">Kategori seçin</option>
              <option value="bilgi">Bilgi</option>
              <option value="duyuru">Duyuru</option>
              <option value="promosyon">Promosyon</option>
            </FormField>

            <FormField
              name="sentiment"
              label="Duygu Durumu"
              type="select"
              options={validationRules.required()}
            >
              <option value="positive">Pozitif</option>
              <option value="neutral">Nötr</option>
              <option value="negative">Negatif</option>
            </FormField>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                {...methods.register('isActive')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Aktif
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                İptal
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {template ? 'Güncelle' : 'Oluştur'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default TemplateForm; 