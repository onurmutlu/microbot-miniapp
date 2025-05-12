import { useContext } from 'react';
import { UserContext, TelegramUser } from '../context/UserContext';

// UserContext'ten veri ve işlevleri alır
export const useUser = () => {
  const context = useContext(UserContext);
  
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  
  // Ek işlevsellikler
  const getUserInfo = () => {
    return {
      ...context.user,
      displayName: context.user ? (context.user.username || `${context.user.first_name} ${context.user.last_name || ''}`).trim() : 'Misafir',
      photoUrl: context.user?.photo_url || '/assets/default-avatar.png',
      isLoggedIn: !!context.user
    };
  };
  
  // Kullanıcı ayarlarını kaydet/getir
  const saveUserSetting = (key: string, value: any) => {
    if (!context.user) return false;
    
    try {
      const settingsKey = `user_settings_${context.user.id}`;
      const currentSettings = localStorage.getItem(settingsKey);
      const settings = currentSettings ? JSON.parse(currentSettings) : {};
      
      settings[key] = value;
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Kullanıcı ayarları kaydedilirken hata oluştu:', error);
      return false;
    }
  };
  
  const getUserSetting = (key: string, defaultValue: any = null) => {
    if (!context.user) return defaultValue;
    
    try {
      const settingsKey = `user_settings_${context.user.id}`;
      const currentSettings = localStorage.getItem(settingsKey);
      
      if (!currentSettings) return defaultValue;
      
      const settings = JSON.parse(currentSettings);
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      console.error('Kullanıcı ayarları alınırken hata oluştu:', error);
      return defaultValue;
    }
  };
  
  return {
    ...context,
    getUserInfo,
    saveUserSetting,
    getUserSetting
  };
}; 