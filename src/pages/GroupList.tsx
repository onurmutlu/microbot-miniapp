import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import api from '../utils/api'
import { showSuccess, showInfo, handleApiError } from '../utils/toast'

interface TelegramGroup {
  id: string
  title: string
  username?: string
  member_count: number
  is_active: boolean
  joined_at: string
}

const GroupList: React.FC = () => {
  const [groups, setGroups] = useState<TelegramGroup[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'members'>('date')

  const fetchGroups = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/groups')
      setGroups(res.data)
      setLoading(false)
    } catch (error) {
      console.error('Gruplar alınırken hata:', error)
      handleApiError(error, 'Gruplar alınırken hata oluştu')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/api/groups/${id}/toggle`)
      showSuccess('Grup durumu güncellendi')
      fetchGroups()
    } catch (error) {
      handleApiError(error, 'Grup durumu değiştirilirken hata oluştu')
    }
  }

  const handleRemoveGroup = async (id: string) => {
    if (!confirm('Bu grubu listeden çıkarmak istediğinize emin misiniz?')) return
    
    try {
      await api.delete(`/api/groups/${id}`)
      showSuccess('Grup başarıyla kaldırıldı')
      fetchGroups()
    } catch (error) {
      handleApiError(error, 'Grup kaldırılırken hata oluştu')
    }
  }

  const sortedGroups = [...groups].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime()
    } else if (sortBy === 'name') {
      return a.title.localeCompare(b.title)
    } else {
      return b.member_count - a.member_count
    }
  })

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">👥 Telegram Grupları</h1>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('date')}
          >
            Tarih
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            İsim
          </Button>
          <Button
            variant={sortBy === 'members' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('members')}
          >
            Üye Sayısı
          </Button>
        </div>
        
        <Button 
          onClick={() => showInfo('Telegram botunu bir gruba eklemek için:\n1. Gruba girin\n2. Botu @kullanıcı_adı ile ekleyin\n3. Bota admin yetkisi verin')}
        >
          ❓ Nasıl Grup Eklenir
        </Button>
      </div>
      
      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="grid gap-3">
          {groups.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Henüz hiç grup yok. Botunuzu bir Telegram grubuna ekleyin.</p>
          ) : (
            sortedGroups.map(group => (
              <div key={group.id} className="border rounded p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{group.title}</h3>
                    {group.username && (
                      <p className="text-sm text-gray-500">@{group.username}</p>
                    )}
                    <div className="text-xs mt-1 flex gap-3">
                      <span>👥 {group.member_count} üye</span>
                      <span>📅 {new Date(group.joined_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`active-${group.id}`}
                        checked={group.is_active}
                        onChange={() => handleToggleActive(group.id)}
                        className="mr-2"
                      />
                      <label htmlFor={`active-${group.id}`} className="text-sm">
                        Mesaj Gönder
                      </label>
                    </div>
                    <Button 
                      onClick={() => handleRemoveGroup(group.id)} 
                      variant="destructive" 
                      size="sm"
                    >
                      Kaldır
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default GroupList 