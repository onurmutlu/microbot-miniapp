import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import GlassCard from './ui/GlassCard';
import Spinner from './ui/Spinner';
import { useSession } from '../context/SessionContext';
import { FiUsers, FiTrash2, FiToggleLeft, FiToggleRight, FiRefreshCw, FiUserPlus } from 'react-icons/fi';
import { listJoinedGroups, fetchJoinedGroups, fetchGroupMembers, toggleGroup, removeGroup } from '../utils/api';

interface TelegramGroup {
  id: string;
  name: string;
  memberCount: number;
  isActive: boolean;
  joinedAt: string;
  fetchedMembersCount?: number;
}

const GroupsList: React.FC = () => {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [fetchingMembersForGroup, setFetchingMembersForGroup] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'members'>('date');
  const { sessionId } = useSession();

  useEffect(() => {
    if (sessionId) {
      fetchGroups();
    }
  }, [sessionId]);

  const fetchGroups = async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    try {
      const response = await listJoinedGroups(sessionId);
      setGroups(response.data);
    } catch (error) {
      toast.error('Gruplar yüklenirken bir hata oluştu');
      console.error('Grupları getirme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllGroups = async () => {
    if (!sessionId) return;
    
    setIsFetchingAll(true);
    try {
      await fetchJoinedGroups(sessionId);
      toast.success('Tüm gruplar başarıyla getirildi');
      await fetchGroups();
    } catch (error) {
      toast.error('Gruplar getirilirken bir hata oluştu');
      console.error('Tüm grupları getirme hatası:', error);
    } finally {
      setIsFetchingAll(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    if (!sessionId) return;
    
    setFetchingMembersForGroup(groupId);
    try {
      const response = await fetchGroupMembers(sessionId, groupId);
      toast.success('Grup üyeleri başarıyla getirildi');
      
      const fetchedMembersCount = response.data?.members_count || 0;
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId 
            ? { ...group, fetchedMembersCount } 
            : group
        )
      );
    } catch (error) {
      toast.error('Grup üyeleri getirilirken bir hata oluştu');
      console.error('Grup üyeleri getirme hatası:', error);
    } finally {
      setFetchingMembersForGroup(null);
    }
  };

  const toggleGroupActive = async (groupId: string, currentStatus: boolean) => {
    if (!sessionId) return;
    
    try {
      await toggleGroup(sessionId, groupId, !currentStatus);

      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === groupId ? { ...group, isActive: !currentStatus } : group
        )
      );

      toast.success(`Grup ${!currentStatus ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`);
    } catch (error) {
      toast.error('Grup durumu değiştirilirken bir hata oluştu');
      console.error('Grup durumu değiştirme hatası:', error);
    }
  };

  const removeGroup = async (groupId: string) => {
    if (!sessionId) return;
    
    if (!window.confirm('Bu grubu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await removeGroup(sessionId, groupId);
      setGroups(prevGroups => prevGroups.filter(group => group.id !== groupId));
      toast.success('Grup başarıyla silindi');
    } catch (error) {
      toast.error('Grup silinirken bir hata oluştu');
      console.error('Grup silme hatası:', error);
    }
  };

  const getSortedGroups = () => {
    return [...groups].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.memberCount - a.memberCount;
      }
    });
  };

  if (!sessionId) {
    return (
      <GlassCard className="p-6 text-center">
        <div className="text-yellow-500 py-8">
          Lütfen önce bir Telegram hesabı seçin.
        </div>
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Telegram Grupları</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAllGroups}
            disabled={isFetchingAll || !sessionId}
            className="px-3 py-1.5 rounded-lg glass-btn flex items-center"
            title={!sessionId ? 'Lütfen önce bir Telegram hesabı seçin' : 'Tüm grupları getir'}
          >
            {isFetchingAll ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Getiriliyor...
              </>
            ) : (
              <>
                <FiRefreshCw className="mr-2" />
                Tüm Grupları Getir
              </>
            )}
          </button>
          <div className="flex items-center ml-2">
            <span className="mr-2">Sırala:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'members')}
              className="border rounded px-3 py-1 bg-transparent"
            >
              <option value="date">Katılma Tarihi</option>
              <option value="name">İsim</option>
              <option value="members">Üye Sayısı</option>
            </select>
            <button
              onClick={fetchGroups}
              className="ml-2 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Yenile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Henüz hiç gruba katılmadınız
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grup Adı</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Üyeler</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {getSortedGroups().map((group) => (
                <tr key={group.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {group.id}</div>
                        <div className="text-xs mt-1">
                          {group.fetchedMembersCount !== undefined ? (
                            <span className="text-green-600 dark:text-green-400">
                              Getirilen üye sayısı: {group.fetchedMembersCount}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">
                              Üyeler henüz getirilmedi
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => fetchGroupMembers(group.id)}
                        disabled={fetchingMembersForGroup === group.id || !sessionId}
                        className="ml-3 p-1.5 rounded-full text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/20"
                        title="Üyeleri Getir"
                      >
                        {fetchingMembersForGroup === group.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <FiUserPlus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <FiUsers className="mr-1" />
                      <span>{group.memberCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span 
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        group.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {group.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => toggleGroupActive(group.id, group.isActive)}
                      className={`mr-2 p-1.5 rounded-full ${
                        group.isActive
                          ? 'text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                          : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20'
                      }`}
                      title={group.isActive ? 'Devre Dışı Bırak' : 'Aktifleştir'}
                    >
                      {group.isActive ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => removeGroup(group.id)}
                      className="p-1.5 rounded-full text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Sil"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </GlassCard>
  );
};

export default GroupsList; 