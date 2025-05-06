import React, { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { Button } from '../components/ui/button'
import { FormField } from '../components/ui/FormField'
import api from '../utils/api'
import { showSuccess, handleApiError, showError } from '../utils/toast'
import { VALIDATION_RULES } from '../utils/validation'

interface DirectMessage {
  id: string
  sender: {
    id: string
    name: string
    username?: string
  }
  content: string
  created_at: string
  is_read: boolean
  is_replied: boolean
  reply?: {
    id: string
    content: string
    created_at: string
  }
}

interface ReplyFormData {
  content: string
}

const DMPanel: React.FC = () => {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [replying, setReplying] = useState<string | null>(null)
  
  const methods = useForm<ReplyFormData>({
    defaultValues: {
      content: ''
    }
  });
  
  const fetchMessages = async () => {
    try {
      setLoading(true)
      const res = await api.get('/direct-messages')
      setMessages(res.data)
      setLoading(false)
      showSuccess('Mesajlar başarıyla yüklendi')
    } catch (error) {
      console.error('DM mesajları alınırken hata:', error)
      handleApiError(error, 'DM mesajları alınırken hata oluştu')
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchMessages()
    
    // Her 60 saniyede bir yeni mesajları kontrol et
    const interval = setInterval(fetchMessages, 60000)
    return () => clearInterval(interval)
  }, [])
  
  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/api/direct-messages/${id}/mark-read`)
      showSuccess('Mesaj okundu olarak işaretlendi')
      fetchMessages()
    } catch (error) {
      handleApiError(error, 'Mesaj durumu güncellenirken hata oluştu')
    }
  }
  
  const onSubmitReply = async (data: ReplyFormData, messageId: string) => {
    try {
      setReplying(messageId)
      await api.post(`/api/direct-messages/${messageId}/reply`, {
        content: data.content
      })
      methods.reset()
      setReplying(null)
      showSuccess('Yanıt başarıyla gönderildi')
      fetchMessages()
    } catch (error) {
      handleApiError(error, 'Yanıt gönderilirken hata oluştu')
      setReplying(null)
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">DM Paneli</h1>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit((data) => onSubmitReply(data, replying || ''))} className="space-y-4 mb-8">
          <FormField
            name="content"
            label="Mesaj"
            type="textarea"
            placeholder="Yanıtınızı yazın..."
            options={{
              ...VALIDATION_RULES.required(),
              ...VALIDATION_RULES.minLength(10)
            }}
          />

          <button
            type="submit"
            disabled={replying !== null}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {replying === null ? 'Yanıtla' : 'Gönderiliyor...'}
          </button>
        </form>
      </FormProvider>

      <div className="space-y-4">
        {loading ? (
          <p>Yükleniyor...</p>
        ) : messages.length === 0 ? (
          <p className="text-center py-4 text-gray-500">Henüz hiç özel mesaj yok.</p>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`border rounded-lg p-4 ${message.is_read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/30'}`}
            >
              <div className="flex justify-between mb-2">
                <div>
                  <span className="font-bold">{message.sender.name}</span>
                  {message.sender.username && (
                    <span className="text-gray-500 ml-1">@{message.sender.username}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(message.created_at)}</span>
              </div>
              
              <p className="mb-3">{message.content}</p>
              
              {message.reply ? (
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">Yanıtınız:</span>
                    <span className="text-xs text-gray-500">{formatDate(message.reply.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{message.reply.content}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {!message.is_read && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      Okundu İşaretle
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default DMPanel 