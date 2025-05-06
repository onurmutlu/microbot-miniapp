import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PlusIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { showSuccess, showError } from '../utils/toast';
import Spinner from '../components/ui/Spinner';
import { useActiveSession } from '../hooks/useActiveSession';

interface Session {
  id: string;
  phone: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
}

interface UserProfile {
  package: {
    name: string;
    maxSessions: number;
  };
  currentSessions: number;
  remainingSessionRights: number;
}

const SessionListPage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const { activeSession, setActiveSession, refreshActiveSession } = useActiveSession();

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const [sessionsResponse, profileResponse] = await Promise.all([
        api.get('/telegram/sessions'),
        api.get('/telegram/user/profile')
      ]);
      setSessions(sessionsResponse.data);
      setProfile(profileResponse.data);
    } catch (error) {
      console.error('Oturumlar yüklenemedi:', error);
      showError('Oturumlar yüklenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('Bu Telegram hesabını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setIsDeleting(sessionId);
      await api.delete(`/telegram/delete-session/${sessionId}`);
      showSuccess('Telegram hesabı başarıyla silindi.');
      
      // Aktif oturum silinirse, aktif oturumu null yap
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
      
      // Listeyi güncelle
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      // Profil verilerini güncelle
      if (profile) {
        setProfile({
          ...profile,
          currentSessions: profile.currentSessions - 1,
          remainingSessionRights: profile.remainingSessionRights + 1
        });
      }
    } catch (error) {
      console.error('Oturum silinemedi:', error);
      showError('Oturum silinirken bir hata oluştu.');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetActiveSession = async (session: Session) => {
    try {
      await api.post(`/telegram/set-active-session/${session.id}`);
      setActiveSession(session);
      showSuccess(`${session.phone} numaralı hesap aktif olarak ayarlandı.`);
    } catch (error) {
      console.error('Aktif oturum ayarlanamadı:', error);
      showError('Aktif oturum ayarlanırken bir hata oluştu.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatPhoneNumber = (phone: string) => {
    // Telefon numarasını düzenli formatta göster
    return phone.startsWith('+') ? phone : `+${phone}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Telegram Hesaplarım</h1>
        <Link 
          to="/new-session" 
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Yeni Hesap Ekle</span>
        </Link>
      </div>
      
      {profile && (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">Paket Bilgilerim</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Paket</p>
              <p className="font-semibold text-gray-800 dark:text-white">{profile.package.name}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Mevcut Hesaplar</p>
              <p className="font-semibold text-gray-800 dark:text-white">
                {profile.currentSessions}/{profile.package.maxSessions}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Kalan Hesap Hakkı</p>
              <p className="font-semibold text-gray-800 dark:text-white">{profile.remainingSessionRights}</p>
            </div>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Henüz hiç Telegram hesabı eklenmemiş.</p>
          <Link 
            to="/new-session" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            <span>İlk Hesabını Ekle</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Telefon Numarası
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Eklenme Tarihi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatPhoneNumber(session.phone)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${session.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                          session.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' : 
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {session.status === 'active' ? 'Aktif' : 
                          session.status === 'inactive' ? 'Pasif' : 'Süresi Dolmuş'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {formatDate(session.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleSetActiveSession(session)}
                          disabled={activeSession?.id === session.id}
                          className={`inline-flex items-center px-3 py-1.5 border rounded-md text-xs font-medium
                            ${activeSession?.id === session.id 
                              ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700 cursor-default' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'}`}
                        >
                          {activeSession?.id === session.id ? (
                            <>
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Aktif
                            </>
                          ) : (
                            'Kullan'
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          disabled={isDeleting === session.id}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-red-400 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                          {isDeleting === session.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <TrashIcon className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionListPage; 