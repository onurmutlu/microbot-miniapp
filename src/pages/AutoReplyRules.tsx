import React, { useState, useEffect } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { Button } from '../components/ui/button'
import { FormField } from '../components/ui/FormField'
import api from '../utils/api'
import { showSuccess, handleApiError, showError } from '../utils/toast'
import { VALIDATION_RULES } from '../utils/validation'
import VisualRuleBuilder from '../components/VisualRuleBuilder'
import RuleWizard from '../components/RuleWizard'

interface AutoReply {
  id: string
  keyword: string
  response: string
  is_active: boolean
  match_type: 'exact' | 'contains' | 'regex'
}

interface AutoReplyFormData {
  keyword: string
  response: string
  match_type: 'exact' | 'contains' | 'regex'
}

type EditorMode = 'basic' | 'visual' | 'wizard' | 'none';

const AutoReplyRules: React.FC = () => {
  const [rules, setRules] = useState<AutoReply[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [editorMode, setEditorMode] = useState<EditorMode>('none')
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<AutoReplyFormData>({
    defaultValues: {
      keyword: '',
      response: '',
      match_type: 'contains'
    }
  })

  const fetchRules = async () => {
    try {
      setLoading(true)
      const res = await api.get('/auto-replies')
      setRules(res.data)
      showSuccess('Kurallar başarıyla yüklendi')
      setLoading(false)
    } catch (error) {
      console.error('Otomatik yanıt kuralları alınırken hata:', error)
      showError('Kurallar yüklenirken hata oluştu')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const onSubmit: SubmitHandler<AutoReplyFormData> = async (data) => {
    try {
      setLoading(true)
      const res = await api.post('/auto-replies', data)
      reset()
      showSuccess('Kural başarıyla eklendi')
      fetchRules()
      setEditorMode('none')
    } catch (error) {
      handleApiError(error, 'Kural eklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/auto-replies/${id}/toggle`)
      showSuccess('Kural durumu değiştirildi')
      fetchRules()
    } catch (error) {
      handleApiError(error, 'Kural durumu değiştirilirken hata oluştu')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return
    
    try {
      await api.delete(`/auto-replies/${id}`)
      showSuccess('Kural başarıyla silindi')
      fetchRules()
    } catch (error) {
      handleApiError(error, 'Kural silinirken hata oluştu')
    }
  }

  const handleVisualRuleSave = async (rule: any) => {
    try {
      await api.post('/auto-replies', {
        keyword: rule.trigger,
        response: rule.response,
        match_type: rule.triggerType === 'text' ? 'contains' : 'regex'
      })
      showSuccess('Kural başarıyla eklendi')
      fetchRules()
      setEditorMode('none')
    } catch (error) {
      handleApiError(error, 'Kural eklenirken hata oluştu')
    }
  }

  const handleModeChange = (mode: EditorMode) => {
    setEditorMode(mode);
  }

  const renderEditor = () => {
    switch (editorMode) {
      case 'basic':
        return (
          <div className="border rounded p-4 bg-white dark:bg-black">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Temel Kural Ekle</h2>
              <Button variant="outline" size="sm" onClick={() => setEditorMode('none')}>
                Kapat
              </Button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormField
                name="match_type"
                label="Eşleşme Tipi"
                type="select"
                register={register}
                rules={{ required: VALIDATION_RULES.REQUIRED }}
                errors={errors}
              >
                <option value="exact">Tam Eşleşme</option>
                <option value="contains">İçeriyor</option>
                <option value="regex">Regex</option>
              </FormField>
              
              <FormField
                name="keyword"
                label="Anahtar Kelime / Pattern"
                placeholder="Örn: merhaba, nasılsın, yardım"
                register={register}
                rules={{ 
                  required: VALIDATION_RULES.REQUIRED,
                  minLength: { value: 2, message: VALIDATION_RULES.MIN_LENGTH(2) }
                }}
                errors={errors}
              />
              
              <FormField
                name="response"
                label="Yanıt Mesajı"
                type="textarea"
                placeholder="Bot'un vereceği yanıt"
                register={register}
                rules={{ 
                  required: VALIDATION_RULES.REQUIRED,
                  minLength: { value: 5, message: VALIDATION_RULES.MIN_LENGTH(5) }
                }}
                errors={errors}
              />
              
              <Button type="submit">➕ Kural Ekle</Button>
            </form>
          </div>
        );
      
      case 'visual':
        return (
          <div className="border rounded p-4 bg-white dark:bg-black">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Görsel Kural Oluşturucu</h2>
              <Button variant="outline" size="sm" onClick={() => setEditorMode('none')}>
                Kapat
              </Button>
            </div>
            <VisualRuleBuilder onSave={handleVisualRuleSave} onCancel={() => setEditorMode('none')} />
          </div>
        );
        
      case 'wizard':
        return (
          <div className="border rounded p-4 bg-white dark:bg-black">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold">Adım Adım Kural Oluşturucu</h2>
              <Button variant="outline" size="sm" onClick={() => setEditorMode('none')}>
                Kapat
              </Button>
            </div>
            <RuleWizard onComplete={() => { fetchRules(); setEditorMode('none'); }} />
          </div>
        );
        
      default:
        return null;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Otomatik Yanıt Kuralları</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <Button onClick={() => handleModeChange('basic')}>
          ➕ Temel Kural Ekle
        </Button>
        <Button onClick={() => handleModeChange('visual')} variant="outline">
          🎨 Görsel Oluşturucu
        </Button>
        <Button onClick={() => handleModeChange('wizard')} variant="outline">
          🧙‍♂️ Adım Adım Rehber
        </Button>
      </div>
      
      {editorMode === 'none' ? (
        renderEditor()
      ) : (
        <div className="space-y-4">
          {loading ? (
            <p>Yükleniyor...</p>
          ) : (
            <div className="grid gap-3">
              {rules.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Henüz hiç otomatik yanıt kuralı yok.</p>
              ) : (
                rules.map(rule => (
                  <div key={rule.id} className="border rounded p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex justify-between">
                      <div>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 dark:bg-blue-900 dark:text-blue-100">
                          {rule.match_type === 'exact' ? 'Tam' : rule.match_type === 'contains' ? 'İçerir' : 'Regex'}
                        </span>
                        <strong>{rule.keyword}</strong>
                        <p className="text-sm text-gray-500 mt-1">{rule.response}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button onClick={() => handleToggle(rule.id)} variant="outline" size="sm">
                          {rule.is_active ? '⏸️ Durdur' : '▶️ Etkinleştir'}
                        </Button>
                        <Button onClick={() => handleDelete(rule.id)} variant="destructive" size="sm">
                          🗑️ Sil
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AutoReplyRules 