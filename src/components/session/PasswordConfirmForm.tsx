import React, { useState } from 'react';
import { FiArrowLeft, FiLock } from 'react-icons/fi';
import { Button } from '../ui/FormElements';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';
import GlassCard from '../ui/GlassCard';

interface PasswordConfirmFormProps {
  phone: string;
  api_id?: string;
  api_hash?: string;
  phone_code_hash?: string;
  onBackClick: () => void;
  onSessionStarted: () => void;
}

const PasswordConfirmForm: React.FC<PasswordConfirmFormProps> = ({ 
  phone,
  api_id = '',
  api_hash = '',
  phone_code_hash = '',
  onBackClick, 
  onSessionStarted 
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // API hatalarını işleyen fonksiyon
  const handleApiError = (error: any, fallbackMessage: string = 'Bir hata oluştu') => {
    console.error('API Hatası:', error);
    
    // Hata yanıtını çıkart
    const errorMessage = error?.response?.data?.detail || 
                        error?.response?.data?.message ||
                        error?.message ||
                        fallbackMessage;
    
    showError(errorMessage);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await api.post('/telegram/password-confirm', {
        api_id,
        api_hash,
        phone,
        phone_code_hash,
        password
      });
      
      if (response.data?.status === 'success') {
        showSuccess('Şifre doğrulandı');
        onSessionStarted();
      }
    } catch (error) {
      handleApiError(error, 'Şifre doğrulanamadı');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <GlassCard className="p-6" variant="primary">
        <div className="flex items-center mb-4">
          <FiLock className="w-6 h-6 mr-2 text-[#3f51b5]" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">İki Faktörlü Doğrulama</h2>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Hesabınızın güvenliği için iki faktörlü doğrulama şifrenizi girin.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              2FA Şifresi
            </label>
            <input
              id="password"
              type="password"
              placeholder="İki faktörlü doğrulama şifreniz"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md 
                         bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 
                         focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Telegram hesabınızda ayarladığınız iki faktörlü doğrulama şifresini girin
            </p>
          </div>
          
          <div className="flex space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onBackClick}
              icon={<FiArrowLeft className="w-4 h-4" />}
              className="flex-1"
            >
              Geri
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              isLoading={isLoading}
              icon={<FiLock className="w-4 h-4" />}
              className="flex-1"
            >
              {isLoading ? 'Doğrulanıyor...' : 'Şifreyi Doğrula'}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default PasswordConfirmForm; 