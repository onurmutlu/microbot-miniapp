import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { FormField } from '../components/ui/FormField'
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form'
import api from '../utils/api'
import { showSuccess, handleApiError, showError } from '../utils/toast'
import { VALIDATION_RULES } from '../utils/validation'
import TemplateGallery from '../components/TemplateGallery'
import Telegram from '@twa-dev/sdk'

interface MessageTemplate {
  id: string
  title: string
  content: string
  is_active: boolean
  category: string
}

interface TemplateFormData {
  title: string
  content: string
  category: string
}

const MessageTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [showGallery, setShowGallery] = useState<boolean>(false)
  
  const methods = useForm<TemplateFormData>({
    defaultValues: {
      title: '',
      content: '',
      category: ''
    }
  })

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/message-templates')
      setTemplates(res.data)
      showSuccess('Şablonlar başarıyla yüklendi')
      setLoading(false)
    } catch (error) {
      console.error('Mesaj şablonları alınırken hata:', error)
      showError('Mesaj şablonları alınırken hata oluştu')
      setLoading(false)
    }
  }

  useEffect(() => {
    // Telegram Web App'i başlat
    try {
      Telegram.ready();
      console.log('Telegram SDK başarıyla başlatıldı');
      
      // Telegram kullanıcı bilgilerini al
      const user = Telegram.initDataUnsafe?.user;
      if (user) {
        console.log('Telegram kullanıcısı:', user);
      }
    } catch (error) {
      console.error('Telegram SDK başlatılırken hata oluştu:', error);
    }
    
    fetchTemplates()
  }, [])

  const onSubmit: SubmitHandler<TemplateFormData> = async (data) => {
    try {
      setLoading(true)
      const res = await api.post('/api/message-templates', data)
      methods.reset()
      showSuccess('Şablon başarıyla eklendi')
      fetchTemplates()
      setShowGallery(false)
    } catch (error) {
      handleApiError(error, 'Şablon eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/api/message-templates/${id}/toggle`)
      showSuccess('Şablon durumu değiştirildi')
      fetchTemplates()
    } catch (error) {
      handleApiError(error, 'Şablon durumu değiştirilirken hata oluştu')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return
    
    try {
      await api.delete(`/api/message-templates/${id}`)
      showSuccess('Şablon başarıyla silindi')
      fetchTemplates()
    } catch (error) {
      handleApiError(error, 'Şablon silinirken hata oluştu')
    }
  }

  const handleTemplateSelect = (template: any) => {
    methods.setValue('title', template.title);
    methods.setValue('content', template.response);
    methods.setValue('category', template.category);
    setShowGallery(false);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mesaj Şablonları</h1>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 mb-8">
          <FormField
            name="title"
            label="Şablon Adı"
            placeholder="Örn: Karşılama Mesajı, Bilgilendirme"
            options={VALIDATION_RULES.REQUIRED}
          />
          <FormField
            name="content"
            label="İçerik"
            type="textarea"
            placeholder="Mesaj şablonunun içeriği"
            options={{
              ...VALIDATION_RULES.REQUIRED,
              ...VALIDATION_RULES.minLength(10)
            }}
          />
          <FormField
            name="category"
            label="Kategori"
            type="select"
            options={VALIDATION_RULES.REQUIRED}
          >
            <option value="">Kategori seçin</option>
            <option value="bilgi">Bilgi</option>
            <option value="duyuru">Duyuru</option>
            <option value="promosyon">Promosyon</option>
          </FormField>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </form>
      </FormProvider>

      {showGallery ? (
        <div>
          <div className="mb-2 flex justify-between">
            <h2 className="font-semibold">Şablon Galerisi</h2>
            <Button variant="outline" size="sm" onClick={() => setShowGallery(false)}>
              Kapat
            </Button>
          </div>
          <TemplateGallery onSelect={handleTemplateSelect} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border p-4 rounded">
              <h3 className="font-bold">{template.title}</h3>
              <p className="text-gray-600">{template.content}</p>
              <span className="text-sm text-gray-500">{template.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MessageTemplates
