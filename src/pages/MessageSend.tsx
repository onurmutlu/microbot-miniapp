import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import api from '../utils/api'
import { showSuccess, showError, handleApiError } from '../utils/toast'

interface Template {
  id: string
  name: string
  content: string
}

interface Group {
  id: string
  title: string
  member_count: number
  is_active: boolean
}

interface SendResult {
  success: boolean
  group_id: string
  group_title: string
  error?: string
}

const MessageSend: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [sending, setSending] = useState<boolean>(false)
  const [results, setResults] = useState<SendResult[]>([])
  const [showResults, setShowResults] = useState<boolean>(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [templatesRes, groupsRes] = await Promise.all([
        api.get('/api/message-templates'),
        api.get('/api/groups')
      ])
      
      setTemplates(templatesRes.data)
      setGroups(groupsRes.data.filter((g: Group) => g.is_active))
      
      if (templatesRes.data.length > 0) {
        setSelectedTemplateId(templatesRes.data[0].id)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Veriler alınırken hata:', error)
      handleApiError(error, 'Veriler alınırken hata oluştu')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSendMessages = async () => {
    if (!selectedTemplateId || groups.length === 0) {
      showError('Lütfen bir şablon ve en az bir aktif grup seçin')
      return
    }

    try {
      setSending(true)
      setShowResults(true)
      
      const response = await api.post('/api/messages/send', {
        template_id: selectedTemplateId,
        group_ids: groups.map(g => g.id)
      })
      
      setResults(response.data.results)
      showSuccess(`Mesajlar ${groups.length} gruba gönderildi`)
      setSending(false)
    } catch (error) {
      handleApiError(error, 'Mesaj gönderiminde hata oluştu')
      setSending(false)
    }
  }

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">📤 Mesaj Gönderimi</h1>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <>
          {/* Şablon seçimi */}
          <div className="border rounded p-4 bg-white dark:bg-black">
            <h2 className="font-semibold mb-2">Şablon Seçimi</h2>
            
            {templates.length === 0 ? (
              <p className="text-red-500">Hiç mesaj şablonu bulunamadı. Lütfen önce bir şablon ekleyin.</p>
            ) : (
              <select
                className="border px-2 py-1 w-full rounded mb-3"
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
              >
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            )}
            
            {selectedTemplate && (
              <div className="border p-3 rounded bg-gray-50 dark:bg-gray-800">
                <h3 className="font-semibold mb-1">{selectedTemplate.name}</h3>
                <p className="text-sm">{selectedTemplate.content}</p>
              </div>
            )}
          </div>

          {/* Grup listesi */}
          <div className="border rounded p-4 bg-white dark:bg-black">
            <h2 className="font-semibold mb-2">Hedef Gruplar</h2>
            
            {groups.length === 0 ? (
              <p className="text-red-500">Hiç aktif grup bulunamadı. Lütfen "Gruplar" sayfasından aktif grup ekleyin.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {groups.map(group => (
                  <div key={group.id} className="flex justify-between items-center p-2 border-b">
                    <div>
                      <p className="font-medium">{group.title}</p>
                      <span className="text-xs text-gray-500">👥 {group.member_count} üye</span>
                    </div>
                    <div className="text-green-600">✓</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gönderim butonu */}
          <div className="text-center">
            <Button 
              onClick={handleSendMessages} 
              disabled={sending || templates.length === 0 || groups.length === 0}
              className="px-8 py-2 text-lg"
            >
              {sending ? 'Gönderiliyor...' : '🚀 Mesajları Gönder'}
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              {groups.length} gruba toplu mesaj gönderilecek ({groups.reduce((acc, g) => acc + g.member_count, 0)} toplam üye)
            </p>
          </div>

          {/* Sonuçlar */}
          {showResults && (
            <div className="border rounded p-4 bg-white dark:bg-black">
              <h2 className="font-semibold mb-2">Gönderim Sonuçları</h2>
              
              {sending ? (
                <p>Mesajlar gönderiliyor, lütfen bekleyin...</p>
              ) : (
                results.length > 0 ? (
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded ${result.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}
                      >
                        <p>
                          <span className="font-medium">{result.group_title}</span>: 
                          {result.success ? ' ✅ Başarılı' : ` ❌ Hata: ${result.error}`}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Henüz sonuç yok.</p>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default MessageSend 