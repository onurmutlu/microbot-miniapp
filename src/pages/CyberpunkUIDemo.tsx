import React, { useEffect } from 'react';
import CyberpunkUI from '../components/ui/CyberpunkUI';

const CyberpunkUIDemo: React.FC = () => {
  useEffect(() => {
    // Telegram MiniApp için tam ekran ayarı
    if (window.Telegram?.WebApp) {
      // Telegram WebApp'in tüm yüksekliği kullanmasını sağla
      window.Telegram.WebApp.expand();
      
      // Arka plan rengini ayarla
      window.Telegram.WebApp.setBackgroundColor('#090d1f');
      
      // Main button'u gizle (varsa)
      if (window.Telegram.WebApp.MainButton.isVisible) {
        window.Telegram.WebApp.MainButton.hide();
      }
    }
    
    // Normal sayfa arka plan sınıflarını temizle
    document.body.classList.remove('bg-gradient');
    document.body.classList.add('bg-cyber-darkBg');
    
    return () => {
      // Sayfa değiştiğinde orijinal arka plan sınıfını geri yükle
      document.body.classList.remove('bg-cyber-darkBg');
      document.body.classList.add('bg-gradient');
    };
  }, []);

  return (
    <div className="cyberpunk-demo-container min-h-screen bg-cyber-darkBg overflow-x-hidden">
      <CyberpunkUI />
    </div>
  );
};

export default CyberpunkUIDemo; 