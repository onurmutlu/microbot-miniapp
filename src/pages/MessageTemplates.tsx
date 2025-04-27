import React, { useState, useEffect } from 'react'
import { DocumentTextIcon, PlusIcon, TrashIcon, CheckIcon, XMarkIcon, ArrowPathIcon, BookOpenIcon, PencilSquareIcon, ArrowDownTrayIcon, BeakerIcon, BellIcon, TagIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { useForm, SubmitHandler, FormProvider } from 'react-hook-form'
import api from '../utils/api'
import { showSuccess, handleApiError, showError } from '../utils/toast'
import { validationRules } from '../utils/validation'
import TemplateGallery from '../components/TemplateGallery'
import Telegram from '@twa-dev/sdk'
import Spinner from '../components/ui/Spinner'
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
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null)
  
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

  useEffect(() => {
    if (editingTemplate) {
      methods.setValue('title', editingTemplate.title);
      methods.setValue('content', editingTemplate.content);
      methods.setValue('category', editingTemplate.category);
    }
  }, [editingTemplate, methods]);

  const onSubmit: SubmitHandler<TemplateFormData> = async (data) => {
    try {
      setIsSaving(true)
      
      if (editingTemplate) {
        await api.put(`/api/message-templates/${editingTemplate.id}`, data)
        showSuccess('Şablon başarıyla güncellendi')
        setEditingTemplate(null)
      } else {
        await api.post('/api/message-templates', data)
        showSuccess('Şablon başarıyla eklendi')
      }
      
      methods.reset()
      fetchTemplates()
      setShowGallery(false)
    } catch (error) {
      handleApiError(error, editingTemplate ? 'Şablon güncellenirken hata oluştu' : 'Şablon eklenirken hata oluştu')
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
    methods.setValue('content', template.content);
    methods.setValue('category', template.category);
    setShowGallery(false);
  }

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
  }

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    methods.reset();
  }

  const toggleExpand = (id: string) => {
    setExpandedTemplate(expandedTemplate === id ? null : id);
  }

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, { label: string, className: string, icon: JSX.Element }> = {
      'bilgi': { 
        label: 'Bilgi', 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        icon: <BeakerIcon className="w-3 h-3 mr-1" />
      },
      'duyuru': { 
        label: 'Duyuru', 
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        icon: <BellIcon className="w-3 h-3 mr-1" />
      },
      'promosyon': { 
        label: 'Promosyon', 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        icon: <TagIcon className="w-3 h-3 mr-1" />
      }
    };
    
    return categories[category] || { 
      label: category || 'Diğer', 
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      icon: <DocumentDuplicateIcon className="w-3 h-3 mr-1" />
    };
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className="container mx-auto px-4 py-1 animate-fade-in">
      <div className="glass-card glass-gradient-primary p-6 mb-6 rounded-xl">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
          <DocumentTextIcon className="w-7 h-7 mr-3 text-green-500" />
          Mesaj Şablonları
        </h1>
        <p className="text-gray-600 dark:text-gray-300 ml-10 text-sm">
          Sık kullandığınız mesajları şablon olarak kaydedin ve hızlıca gönderme işlemlerinde kullanın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-1">
          <div className="glass-card glass-gradient-secondary p-6 rounded-xl">
            <h2 className="text-lg font-semibold mb-5 text-gray-800 dark:text-gray-100 flex items-center">
              {editingTemplate ? (
                <>
                  <PencilSquareIcon className="w-5 h-5 mr-2 text-amber-500" />
                  Şablonu Düzenle
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5 mr-2 text-green-500" />
                  Yeni Şablon Ekle
                </>
              )}
            </h2>
            
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  name="title"
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
                  rows={6}
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

                <div className="flex justify-between pt-2">
                  {editingTemplate ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      icon={<XMarkIcon className="w-4 h-4" />}
                    >
                      İptal
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowGallery(!showGallery)}
                      icon={<BookOpenIcon className="w-4 h-4" />}
                      className="glass-btn"
                    >
                      Şablon Galerisi
                    </Button>
                  )}
                  
                  <Button
                    type="submit"
                    variant="primary"
                    className="glass-btn"
                    disabled={isSaving}
                    isLoading={isSaving}
                    icon={editingTemplate ? <PencilSquareIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                  >
                    {editingTemplate ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </div>

        <div className="lg:col-span-2">
          {showGallery ? (
            <div className="glass-card glass-gradient-primary p-6 rounded-xl">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                  <BookOpenIcon className="w-5 h-5 mr-2 text-green-500" />
                  Şablon Galerisi
                </h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowGallery(false)}
                  icon={<XMarkIcon className="w-4 h-4" />}
                  className="glass-btn"
                >
                  Kapat
                </Button>
              </div>
              <TemplateGallery 
                templates={[]}
                onSelectTemplate={handleTemplateSelect}
                onToggleFavorite={() => {}}
              />
            </div>
          ) : (
            <>
              <div className="glass-card glass-gradient-success p-6 rounded-xl mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-green-500" />
                    Kayıtlı Şablonlar
                  </h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchTemplates}
                    icon={<ArrowPathIcon className="w-4 h-4" />}
                    className="glass-btn"
                  >
                    Yenile
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Spinner size="lg" color="success" />
                  </div>
                ) : templates.length === 0 ? (
                  <div className="glass-card p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">Henüz şablon eklenmemiş.</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 glass-btn"
                      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                      icon={<PlusIcon className="w-4 h-4" />}
                    >
                      Yeni Şablon Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {templates.map((template) => {
                      const category = getCategoryLabel(template.category);
                      const isExpanded = expandedTemplate === template.id;
                      
                      return (
                        <div
                          key={template.id}
                          className={`glass-card p-5 transition-all duration-300 ${
                            template.is_active 
                              ? 'glass-gradient-primary border-blue-200 dark:border-blue-900/30' 
                              : 'bg-opacity-40 border-gray-200 dark:border-gray-700'
                          } rounded-xl border-2 hover:shadow-lg`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-bold text-gray-800 dark:text-white text-lg">{template.title}</h3>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 text-xs rounded-full ${category.className}`}>
                                  {category.icon}
                                  {category.label}
                                </span>
                                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                                  template.is_active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                }`}>
                                  {template.is_active ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <button 
                                onClick={() => handleEdit(template)} 
                                className="p-1.5 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Düzenle"
                              >
                                <PencilSquareIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </button>
                              <button 
                                onClick={() => handleToggle(template.id)} 
                                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
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
                                className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Sil"
                              >
                                <TrashIcon className="w-5 h-5 text-red-500" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <div 
                              className={`text-gray-600 dark:text-gray-300 text-sm break-words bg-white/20 dark:bg-black/10 p-3 rounded-lg transition-all duration-300 ${
                                isExpanded ? 'max-h-96 overflow-y-auto' : 'max-h-24 overflow-hidden'
                              }`}
                            >
                              {template.content}
                            </div>
                            
                            {template.content.length > 100 && (
                              <button 
                                onClick={() => toggleExpand(template.id)}
                                className="text-xs text-green-600 dark:text-green-400 mt-2 hover:underline focus:outline-none"
                              >
                                {isExpanded ? 'Daha az göster' : 'Devamını göster'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageTemplates
