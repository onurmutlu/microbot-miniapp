import React, { useState, useEffect } from 'react'
import { DocumentTextIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon, ArrowPathIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form'
import api from '../utils/api'
import { showSuccess, handleApiError, showError } from '../utils/toast'
import { VALIDATION_RULES } from '../utils/validation'
import TemplateGallery from '../components/TemplateGallery'
import Telegram from '@twa-dev/sdk'
import GlassCard from '../components/ui/GlassCard'
import { Button } from '../components/ui/FormElements'
import { FormField } from '../components/ui/FormField'

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
  const [isSaving, setIsSaving] = useState<boolean>(false)
  
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
      setIsSaving(true)
      const res = await api.post('/api/message-templates', data)
      methods.reset()
      showSuccess('Şablon başarıyla eklendi')
      fetchTemplates()
      setShowGallery(false)
    } catch (error) {
      handleApiError(error, 'Şablon eklenirken hata oluştu')
    } finally {
      setIsSaving(false)
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

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, { label: string, className: string }> = {
      'bilgi': { label: 'Bilgi', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      'duyuru': { label: 'Duyuru', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
      'promosyon': { label: 'Promosyon', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' }
    };
    
    return categories[category] || { label: category, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="container mx-auto px-4 py-1 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white flex items-center">
        <DocumentTextIcon className="w-6 h-6 mr-2 text-[#3f51b5]" />
        Mesaj Şablonları
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-1">
          <GlassCard className="p-5" variant="primary">
            <h2 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2 text-[#3f51b5]" />
              Yeni Şablon Ekle
            </h2>
            
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
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

                <div className="flex justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGallery(!showGallery)}
                    icon={<BookOpenIcon className="w-4 h-4" />}
                  >
                    Şablon Galerisi
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSaving}
                    isLoading={isSaving}
                    icon={<PlusIcon className="w-4 h-4" />}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </GlassCard>
        </div>

        <div className="lg:col-span-2">
          {showGallery ? (
            <GlassCard className="p-5">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                  <BookOpenIcon className="w-5 h-5 mr-2 text-[#3f51b5]" />
                  Şablon Galerisi
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowGallery(false)}
                  icon={<XMarkIcon className="w-4 h-4" />}
                >
                  Kapat
                </Button>
              </div>
              <TemplateGallery onSelect={handleTemplateSelect} />
            </GlassCard>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
                  Kayıtlı Şablonlar
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchTemplates}
                  icon={<ArrowPathIcon className="w-4 h-4" />}
                >
                  Yenile
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3f51b5]"></div>
                </div>
              ) : templates.length === 0 ? (
                <GlassCard className="p-5 text-center">
                  <p className="text-gray-500 dark:text-gray-400">Henüz şablon eklenmemiş.</p>
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {templates.map((template) => {
                    const category = getCategoryLabel(template.category);
                    
                    return (
                      <GlassCard 
                        key={template.id} 
                        className="p-5 hover:shadow-lg transition-all"
                        variant={template.is_active ? 'primary' : 'default'}
                        hoverable
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-800 dark:text-white">{template.title}</h3>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleToggle(template.id)} 
                              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                              title={template.is_active ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                            >
                              {template.is_active ? (
                                <CheckIcon className="w-5 h-5 text-green-500" />
                              ) : (
                                <XMarkIcon className="w-5 h-5 text-red-500" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleDelete(template.id)} 
                              className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                              title="Sil"
                            >
                              <TrashIcon className="w-5 h-5 text-red-500" />
                            </button>
                          </div>
                        </div>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${category.className}`}>
                          {category.label}
                        </span>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 break-words">
                          {truncateText(template.content)}
                        </p>
                      </GlassCard>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageTemplates
