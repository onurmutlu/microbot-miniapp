import React, { useEffect, useState } from 'react';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { ThemeType, loadSavedTheme } from '../utils/themeManager';

const ThemeSwitcherDemo: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<ThemeType>('corporate');
  
  useEffect(() => {
    // Sayfaya girdiğimizde, mevcut temayı alalım
    const savedTheme = loadSavedTheme();
    setCurrentTheme(savedTheme);
    
    // Tema değişikliklerini dinleyelim
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class' &&
          mutation.target === document.body
        ) {
          // Tema değiştiğinde state'i güncelle
          if (document.body.classList.contains('cyberpunk-theme')) {
            setCurrentTheme('cyberpunk');
          } else if (document.body.classList.contains('corporate-theme')) {
            setCurrentTheme('corporate');
          }
        }
      });
    });
    
    // Body element'ini gözlemlemeye başla
    observer.observe(document.body, { attributes: true });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);
  
  return (
    <div className="min-h-screen theme-aware-bg">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-6 theme-aware-heading">
          Tema Değiştirici Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="theme-aware-card p-6">
            <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
              Mevcut Tema: {currentTheme === 'corporate' ? 'Kurumsal' : 'Cyberpunk'}
            </h2>
            <p className="mb-4 theme-aware-text">
              Sağ alt köşedeki tema değiştirici düğmesini kullanarak temalar arasında geçiş yapabilirsiniz.
              Seçtiğiniz tema, tüm sayfalarda ve bileşenlerde uygulanacaktır.
            </p>
            <button className="theme-aware-button">
              Tema Farkını Göster
            </button>
          </div>
          
          <div className="theme-aware-card p-6">
            <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
              Tema Özellikleri
            </h2>
            <ul className="space-y-2 theme-aware-text">
              <li>• Tema tercihiniz otomatik olarak kaydedilir</li>
              <li>• Kurumsal tema: Profesyonel, sade tasarım</li>
              <li>• Cyberpunk tema: Neon ışıklı, futuristik tasarım</li>
              <li>• Responsive tasarım: Mobil ve masaüstünde çalışır</li>
              <li>• CSS değişkenleri: Tüm bileşenlerde tutarlı stiller</li>
            </ul>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="theme-aware-card p-4">
              <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
                Örnek Kart {index + 1}
              </h3>
              <p className="theme-aware-text mb-4">
                Bu kartlar, tema değişikliğine otomatik olarak uyum sağlayan
                bileşenlere örnektir.
              </p>
              <div className="flex justify-end">
                <button className="theme-aware-button">
                  Detaylar
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-6 theme-aware-card text-center">
          <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
            Mobil Dostu Tema Değiştirici
          </h2>
          <p className="theme-aware-text mb-6">
            Tema değiştirici bileşeni, mobil cihazlarda da kolay
            erişilebilir konumdadır. Ekranın sağ alt köşesinde sabit olarak
            bulunur ve dokunmatik kullanım için optimize edilmiştir.
          </p>
          <div className="flex justify-center">
            <div className="max-w-xs">
              <ThemeSwitcher className="static transform-none" />
              <p className="mt-4 text-sm theme-aware-text">
                (Demo amaçlı sabit konumda gösterilen tema değiştirici)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeSwitcherDemo; 