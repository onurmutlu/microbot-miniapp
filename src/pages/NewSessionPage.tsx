import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { showError } from '../utils/toast';
import NewSessionForm from '../components/session/NewSessionForm';
import Spinner from '../components/ui/Spinner';

const NewSessionPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/user/profile');
      setUserProfile(response.data);
    } catch (error) {
      console.error('Kullanıcı profili alınırken hata:', error);
      showError('Kullanıcı bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      // Hata durumunda kullanıcıyı sessions sayfasına yönlendir
      navigate('/sessions');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold glass-gradient mb-6">Yeni Telegram Hesabı Ekle</h1>
      
      {userProfile && (
        <div className="mb-6">
          <div className="glass-card p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
            <h2 className="text-lg font-medium mb-2">Hesap Bilgileriniz</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paket</p>
                <p className="font-medium">{userProfile.packageName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Maksimum Hesap</p>
                <p className="font-medium">{userProfile.maxSessions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mevcut Hesap</p>
                <p className="font-medium">{userProfile.currentSessions}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Kalan Hak</p>
                <p className="font-medium">{userProfile.remainingSessionRights}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <NewSessionForm 
        remainingSessions={userProfile ? userProfile.remainingSessionRights : 0} 
      />
    </div>
  );
};

export default NewSessionPage; 