import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import api from '../utils/api'
import { showSuccess, showInfo, handleApiError } from '../utils/toast'
import Spinner from '../components/ui/Spinner'

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
      const res = await api.get('/groups')
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
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="glass-card glass-gradient-primary p-6 rounded-xl shadow-lg backdrop-blur-xl">
        <h1 className="text-2xl font-bold mb-4 glass-text">👥 Telegram Grupları</h1>
      
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'date' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('date')}
              className="glass-btn transition-all duration-300"
              leftIcon={<span>📅</span>}
            >
              Tarih
            </Button>
            <Button
              variant={sortBy === 'name' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('name')}
              className="glass-btn transition-all duration-300"
              leftIcon={<span>📝</span>}
            >
              İsim
            </Button>
            <Button
              variant={sortBy === 'members' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSortBy('members')}
              className="glass-btn transition-all duration-300"
              leftIcon={<span>👥</span>}
            >
              Üye Sayısı
            </Button>
          </div>
          
          <Button 
            onClick={() => showInfo('Telegram botunu bir gruba eklemek için:\n1. Gruba girin\n2. Botu @kullanıcı_adı ile ekleyin\n3. Bota admin yetkisi verin')}
            className="glass-btn glass-gradient-success transition-all duration-300 hover:shadow-lg"
            rightIcon={<span>❓</span>}
          >
            Nasıl Grup Eklenir
          </Button>
        </div>
      </div>
      
      <div className="glass-card p-6 rounded-xl shadow-lg backdrop-blur-xl">
        {loading ? (
          <div className="flex justify-center items-center p-10">
            <Spinner isLoading={loading} size="xl" variant="glassEffect" />
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.length === 0 ? (
              <div className="text-center py-12 glass-card glass-gradient p-8 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Henüz Hiç Grup Yok</h3>
                <p className="text-gray-500 mb-4">Botunuzu bir Telegram grubuna ekleyin.</p>
                <Button 
                  onClick={() => showInfo('Telegram botunu bir gruba eklemek için:\n1. Gruba girin\n2. Botu @kullanıcı_adı ile ekleyin\n3. Bota admin yetkisi verin')}
                  className="glass-btn glass-gradient-primary transition-all duration-300"
                >
                  Nasıl Grup Eklenir
                </Button>
              </div>
            ) : (
              sortedGroups.map(group => (
                <div key={group.id} className="glass-card glass-gradient-secondary p-5 rounded-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex-grow">
                      <h3 className="font-semibold text-xl">{group.title}</h3>
                      {group.username && (
                        <p className="text-sm opacity-75 mt-1">@{group.username}</p>
                      )}
                      <div className="mt-3 flex gap-6">
                        <span className="flex items-center text-sm glass-badge px-2 py-1 rounded-full">
                          <span className="mr-1">👥</span> {group.member_count.toLocaleString('tr-TR')} üye
                        </span>
                        <span className="flex items-center text-sm glass-badge px-2 py-1 rounded-full">
                          <span className="mr-1">📅</span> {new Date(group.joined_at).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.is_active}
                          onChange={() => handleToggleActive(group.id)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        <span className="ml-3 text-sm font-medium">
                          {group.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </label>
                      <Button 
                        onClick={() => handleRemoveGroup(group.id)} 
                        variant="danger" 
                        size="sm"
                        className="glass-btn transition-all duration-300"
                        leftIcon={<span>🗑️</span>}
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
    </div>
  )
}

export default GroupList 