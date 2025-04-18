import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Telegram from '@twa-dev/sdk'
import { Button } from '../components/ui/button'

interface Template {
  id: string
  name: string
  content: string
  message_type: 'broadcast' | 'mention' | 'reply'
  interval_minutes: number
  is_active: boolean
}

const MessageTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([])
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', message_type: 'broadcast', interval_minutes: 60 })
  const [filterType, setFilterType] = useState<'broadcast' | 'mention' | 'reply' | 'all'>('all')
  const [loading, setLoading] = useState<boolean>(true)

  const fetchTemplates = async () => {
    try {
      const res = await axios.get('/api/message-templates')
      setTemplates(res.data)
      setLoading(false)
    } catch (err) {
      console.error('Şablonları alırken hata', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Telegram SDK'sını başlat
    try {
      Telegram.ready()
      console.log('Telegram Web App SDK başarıyla başlatıldı!')
      
      // Telegram kullanıcı bilgilerini al
      const user = Telegram.initDataUnsafe?.user
      if (user) {
        console.log('Telegram kullanıcısı:', user)
      }
    } catch (error) {
      console.error('Telegram SDK başlatılamadı:', error)
    }
    
    fetchTemplates()
  }, [])

  const handleCreate = async () => {
    try {
      await axios.post('/api/message-templates', newTemplate)
      setNewTemplate({ name: '', content: '', message_type: 'broadcast', interval_minutes: 60 })
      fetchTemplates()
    } catch (err) {
      alert('Yeni şablon oluşturulamadı')
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await axios.patch(`/api/message-templates/${id}/toggle`)
      fetchTemplates()
    } catch (err) {
      alert('Durum güncellenemedi')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinize emin misiniz?')) return
    try {
      await axios.delete(`/api/message-templates/${id}`)
      fetchTemplates()
    } catch (err) {
      alert('Silme işlemi başarısız')
    }
  }

  const filteredTemplates = filterType === 'all'
    ? templates
    : templates.filter(t => t.message_type === filterType)

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">📨 Mesaj Şablonları</h1>

      {/* Şablon tipi filtre */}
      <div className="flex gap-2">
        {['all', 'broadcast', 'mention', 'reply'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`px-3 py-1 rounded ${filterType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'}`}
          >
            {type.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Şablon ekleme formu */}
      <div className="border rounded p-4 bg-white dark:bg-black">
        <h2 className="font-semibold mb-2">Yeni Şablon</h2>
        <input
          placeholder="Şablon Adı"
          className="border px-2 py-1 w-full mb-2"
          value={newTemplate.name}
          onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
        />
        <textarea
          placeholder="Mesaj İçeriği"
          className="border px-2 py-1 w-full mb-2"
          value={newTemplate.content}
          onChange={e => setNewTemplate({ ...newTemplate, content: e.target.value })}
        />
        <select
          className="border px-2 py-1 w-full mb-2"
          value={newTemplate.message_type}
          onChange={e => setNewTemplate({ ...newTemplate, message_type: e.target.value as any })}
        >
          <option value="broadcast">Broadcast</option>
          <option value="mention">Mention</option>
          <option value="reply">Reply</option>
        </select>
        <input
          type="number"
          className="border px-2 py-1 w-full mb-2"
          placeholder="Sıklık (dakika)"
          value={newTemplate.interval_minutes}
          onChange={e => setNewTemplate({ ...newTemplate, interval_minutes: parseInt(e.target.value) })}
        />
        <Button onClick={handleCreate}>➕ Şablon Ekle</Button>
      </div>

      {/* Şablon listesi */}
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="grid gap-3">
          {filteredTemplates.map(t => (
            <div key={t.id} className="border rounded p-3 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between items-center">
                <div>
                  <strong>{t.name}</strong> - <em>{t.message_type}</em>
                  <p className="text-sm text-gray-500">{t.content}</p>
                  <p className="text-xs">⏱ {t.interval_minutes} dk | {t.is_active ? '✅ Aktif' : '⛔ Pasif'}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <Button onClick={() => handleToggle(t.id)} variant="outline">
                    {t.is_active ? 'Pasif Yap' : 'Aktif Et'}
                  </Button>
                  <Button onClick={() => handleDelete(t.id)} variant="destructive">Sil</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MessageTemplates
