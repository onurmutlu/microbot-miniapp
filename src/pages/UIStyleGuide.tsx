import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHome, FiSettings, FiUser, FiMail, FiBell, FiSun, FiMoon } from 'react-icons/fi';

import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedCardGroup from '../components/ui/AnimatedCardGroup';
import ThemeSwitcher from '../components/ThemeSwitcher';
import MobileHeader from '../components/ui/MobileHeader';
import Skeleton, { TextSkeleton, CircularSkeleton, ButtonSkeleton, CardSkeleton, SkeletonGroup } from '../components/ui/Skeleton';
import useTheme from '../hooks/useTheme';
import { cn } from '../utils/cn';

const CodeBlock: React.FC<{ children: React.ReactNode; language?: string }> = ({
  children,
  language = 'tsx',
}) => (
  <div className="mb-4 p-4 bg-gray-900/90 rounded-lg overflow-auto">
    <pre className="text-gray-200 text-sm font-mono">
      <code className={`language-${language}`}>{children}</code>
    </pre>
  </div>
);

const ExampleSection: React.FC<{ title: string; children: React.ReactNode; codeExample?: string }> = ({
  title,
  children,
  codeExample,
}) => (
  <section className="mb-10">
    <h2 className="text-xl font-bold mb-4 theme-aware-heading">{title}</h2>
    <div className="bg-gray-800/30 rounded-xl p-6 mb-4">
      {children}
    </div>
    {codeExample && <CodeBlock>{codeExample}</CodeBlock>}
  </section>
);

const UIStyleGuide: React.FC = () => {
  const { theme, toggleTheme, themeClass } = useTheme();
  const [loading, setLoading] = useState(false);

  const toggleLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen">
      <MobileHeader 
        title="UI Style Guide" 
        showBackButton 
        variant={theme === 'cyberpunk' ? 'cyber' : 'corporate'} 
      />
      
      <div className="container mx-auto p-4 pt-8 max-w-5xl">
        <div className="max-w-4xl mx-auto">
          <h1 className={cn(
            "text-4xl font-bold mb-4",
            theme === 'cyberpunk' 
              ? "bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500" 
              : "text-blue-100"
          )}>
            UI Style Guide
          </h1>
          
          <p className="text-gray-300 mb-8">
            Bu sayfa, uygulamada kullanılan UI bileşenlerinin stili ve kullanımı hakkında bir rehber sunmaktadır.
          </p>
          
          {/* Tema ve Renkler */}
          <ExampleSection title="Tema ve Renkler" codeExample={`
// useTheme hook kullanımı
import useTheme from '../hooks/useTheme';

const Component = () => {
  const { theme, toggleTheme, themeClass } = useTheme();
  
  return (
    <div className={themeClass({
      base: 'container',
      corporate: 'bg-dark-800',
      cyberpunk: 'bg-cyber-bg'
    })}>
      <button onClick={toggleTheme}>
        Temayı Değiştir
      </button>
    </div>
  );
};
`}>
            <div className="flex flex-wrap gap-4 mb-6">
              <div 
                className={themeClass({
                  base: 'p-4 rounded-lg text-center flex flex-col items-center',
                  corporate: 'bg-dark-900',
                  cyberpunk: 'bg-cyber-bg'
                })}
              >
                <div className="flex items-center justify-center mb-2">
                  {theme === 'corporate' ? <FiMoon className="w-6 h-6" /> : <FiSun className="w-6 h-6" />}
                </div>
                <p>Mevcut Tema: <strong>{theme === 'corporate' ? 'Kurumsal' : 'Cyberpunk'}</strong></p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={themeClass({
                    base: 'mt-2 px-4 py-2 rounded',
                    corporate: 'bg-blue-700 text-white',
                    cyberpunk: 'bg-gradient-to-r from-cyber-neon-purple to-cyber-neon-blue text-white'
                  })}
                  onClick={toggleTheme}
                >
                  Temayı Değiştir
                </motion.button>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Tema Değiştirici Bileşeni</h3>
                <ThemeSwitcher className="static transform-none" />
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Renk Paleti</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {theme === 'cyberpunk' ? (
                <>
                  <div className="p-4 rounded bg-cyber-neon-purple text-center text-white">Neon Purple</div>
                  <div className="p-4 rounded bg-cyber-neon-blue text-center text-white">Neon Blue</div>
                  <div className="p-4 rounded bg-cyber-neon-cyan text-center text-black">Neon Cyan</div>
                  <div className="p-4 rounded bg-cyber-neon-magenta text-center text-white">Neon Magenta</div>
                  <div className="p-4 rounded bg-cyber-neon-lime text-center text-black">Neon Lime</div>
                  <div className="p-4 rounded bg-cyber-neon-yellow text-center text-black">Neon Yellow</div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded bg-blue-700 text-center text-white">Primary</div>
                  <div className="p-4 rounded bg-gray-700 text-center text-white">Secondary</div>
                  <div className="p-4 rounded bg-green-700 text-center text-white">Success</div>
                  <div className="p-4 rounded bg-red-700 text-center text-white">Danger</div>
                  <div className="p-4 rounded bg-yellow-600 text-center text-white">Warning</div>
                  <div className="p-4 rounded bg-purple-700 text-center text-white">Info</div>
                </>
              )}
            </div>
          </ExampleSection>
          
          {/* Kartlar */}
          <ExampleSection title="Glassmorphism Kartlar ve Animasyonlar" codeExample={`
// AnimatedCard ve AnimatedCardGroup kullanımı
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedCardGroup from '../components/ui/AnimatedCardGroup';

// Tekli kart
<AnimatedCard className="p-6">
  <h3>Başlık</h3>
  <p>İçerik</p>
</AnimatedCard>

// Kart grubu
<AnimatedCardGroup>
  <div>Kart İçeriği 1</div>
  <div>Kart İçeriği 2</div>
  <div>Kart İçeriği 3</div>
</AnimatedCardGroup>

// UnoCSS sınıflarıyla glassmorphism efekti
<div className="bg-white/10 backdrop-blur-md border-white/20 rounded-2xl p-4"></div>
`}>
            <h3 className="text-lg font-semibold mb-4">Tekli Animasyonlu Kart</h3>
            <AnimatedCard className="p-6 mb-8">
              <h3 className="text-lg font-semibold mb-2">Saydam Animasyonlu Kart</h3>
              <p className="mb-4">
                Bu kart saydam arka plana, blur efektine ve hafif parlak kenarlıklara sahiptir.
                Ayrıca scale-up ve fade-in animasyonlarını Framer Motion ile gerçekleştirir.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={themeClass({
                  base: 'py-2 px-4 rounded',
                  corporate: 'bg-blue-700 text-white',
                  cyberpunk: 'bg-gradient-to-r from-cyber-neon-purple to-cyber-neon-blue text-white'
                })}
              >
                Detaylar
              </motion.button>
            </AnimatedCard>
            
            <h3 className="text-lg font-semibold mb-4">Kart Varyantları</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="animated-card p-4">Standart Kart</div>
              <div className="animated-card-cyan p-4">Cyan Kart</div>
              <div className="animated-card-magenta p-4">Magenta Kart</div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Float Animasyonlu Kart</h3>
            <div className="animated-card-float p-4 mb-8">Bu kart sürekli yukarı aşağı hareket eder</div>
            
            <h3 className="text-lg font-semibold mb-4">Kart Grubu (Sıralı Animasyon)</h3>
            <AnimatedCardGroup>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-4">
                  <h4 className="text-lg font-semibold mb-2">Kart {i}</h4>
                  <p>Sıralı olarak görünüme girer</p>
                </div>
              ))}
            </AnimatedCardGroup>
          </ExampleSection>
          
          {/* Butonlar */}
          <ExampleSection title="Neon ve Gradient Butonlar" codeExample={`
// Framer Motion ile animasyonlu butonlar
import { motion } from 'framer-motion';

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="bg-gradient-to-r from-[#ff6ec4] to-[#7873f5] text-white 
  rounded-full py-2 px-6 font-medium shadow-glow-light 
  hover:shadow-glow-multi transition-all duration-300"
>
  Neon Buton
</motion.button>

// UnoCSS kısayol sınıfları
<button className="cyber-btn-primary">Cyber Buton</button>
<button className="cyber-btn-accent">Accent Buton</button>
`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-[#ff6ec4] to-[#7873f5] text-white 
                  rounded-full py-2 px-6 font-medium shadow-glow-light 
                  hover:shadow-glow-multi transition-all duration-300"
                >
                  Neon Buton
                </motion.button>
                <p className="text-sm text-center">Gradient ve Glow Efektli</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cyber-btn-primary"
                >
                  Cyber Buton
                </motion.button>
                <p className="text-sm text-center">Cyber Tema</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="cyber-btn-accent"
                >
                  Accent Buton
                </motion.button>
                <p className="text-sm text-center">Accent Renk</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={themeClass({
                    base: 'py-2 px-6 rounded font-medium',
                    corporate: 'bg-blue-700 text-white hover:bg-blue-600',
                    cyberpunk: 'bg-cyber-neon-purple text-white hover:bg-cyber-neon-purple/90'
                  })}
                >
                  Tema Uyumlu
                </motion.button>
                <p className="text-sm text-center">Tema değişiminde stil değişir</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(0, 255, 255, 0.7)' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white 
                  rounded-full py-2 px-6 font-medium"
                >
                  Hover Glow
                </motion.button>
                <p className="text-sm text-center">Hover durumunda glow</p>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <button className="btn bg-gradient-to-r from-purple-700 to-blue-700 text-white py-2 px-6 rounded hover:shadow-lg transition-all">
                  Kurumsal Buton
                </button>
                <p className="text-sm text-center">Standart kurumsal stil</p>
              </div>
            </div>
          </ExampleSection>
          
          {/* Header Bileşeni */}
          <ExampleSection title="Mobile Header Bileşeni" codeExample={`
import MobileHeader from '../components/ui/MobileHeader';

// Temel kullanım
<MobileHeader 
  title="Sayfa Başlığı" 
  showBackButton={true} 
  variant="default" 
/>

// Özel eylemler ile
<MobileHeader 
  title="Özel Eylemler" 
  showMenu={false}
  actions={<button>Eylem</button>} 
  variant="cyber" 
/>
`}>
            <div className="space-y-6">
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <MobileHeader 
                  title="Normal Header" 
                  showBackButton={false} 
                  variant="default"
                />
              </div>
              
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <MobileHeader 
                  title="Geri Butonlu" 
                  showBackButton={true} 
                  variant={theme === 'cyberpunk' ? 'cyber' : 'corporate'}
                />
              </div>
              
              <div className="border border-gray-700 rounded-lg overflow-hidden">
                <MobileHeader 
                  title="Özel Eylemler" 
                  showMenu={false}
                  actions={
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
                      >
                        <FiMail className="w-5 h-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
                      >
                        <FiBell className="w-5 h-5" />
                      </motion.button>
                    </div>
                  }
                  variant={theme === 'cyberpunk' ? 'cyber' : 'corporate'}
                />
              </div>
            </div>
          </ExampleSection>
          
          {/* Skeleton Bileşeni */}
          <ExampleSection title="Shimmer Loading (Skeleton)" codeExample={`
import Skeleton, { TextSkeleton, CircularSkeleton, CardSkeleton } from '../components/ui/Skeleton';

// Temel kullanım
<Skeleton width={200} height={100} />

// Varyantlar
<TextSkeleton />
<CircularSkeleton width={40} />
<CardSkeleton height={120} className="mb-2" />

// Çoklu skeleton
<SkeletonGroup count={3} gap="gap-2">
  {(index) => <CardSkeleton height={70 + (index * 20)} />}
</SkeletonGroup>
`}>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-center mb-4">
                <button
                  className={themeClass({
                    base: 'py-2 px-4 rounded',
                    corporate: 'bg-blue-700 text-white',
                    cyberpunk: 'bg-cyber-neon-purple text-white'
                  })}
                  onClick={toggleLoading}
                >
                  {loading ? 'Yükleniyor...' : 'Yükleme Efekti Göster'}
                </button>
                <span className="text-sm">
                  {loading ? 'Skeletonlar görünüyor' : 'Yükleme durumunu simüle etmek için tıklayın'}
                </span>
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Temel Skeleton Tipleri</h3>
                
                  {loading ? (
                    <>
                      <CircularSkeleton width={60} />
                      <TextSkeleton width="70%" />
                      <TextSkeleton width="90%" />
                      <TextSkeleton width="60%" />
                      <ButtonSkeleton width={120} />
                    </>
                  ) : (
                    <>
                      <div className="w-[60px] h-[60px] rounded-full bg-gradient-to-r from-blue-700 to-purple-700"></div>
                      <h4 className="text-lg font-semibold">Kullanıcı Bilgileri</h4>
                      <p>Kullanıcı profil bilgileri burada gösterilir.</p>
                      <p>Ek bilgiler ve ayarlar</p>
                      <button className={themeClass({
                        base: 'py-2 px-4 rounded mt-2',
                        corporate: 'bg-blue-700 text-white',
                        cyberpunk: 'bg-cyber-neon-purple text-white'
                      })}>
                        Profili Düzenle
                      </button>
                    </>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Kart Skeleton'lar</h3>
                  
                  {loading ? (
                    <SkeletonGroup count={3} gap="gap-4">
                      {(index) => <CardSkeleton height={80 + (index * 20)} />}
                    </SkeletonGroup>
                  ) : (
                    <div className="space-y-4">
                      <div className={themeClass({
                        base: 'p-4 rounded-xl',
                        corporate: 'bg-dark-800 border border-dark-700/50',
                        cyberpunk: 'bg-cyber-glass-bg border border-cyber-glass-border'
                      })}>
                        <h4 className="font-semibold">Birinci Kart</h4>
                        <p className="text-sm">Kart içeriği burada gösterilir</p>
                      </div>
                      <div className={themeClass({
                        base: 'p-4 rounded-xl',
                        corporate: 'bg-dark-800 border border-dark-700/50',
                        cyberpunk: 'bg-cyber-glass-bg border border-cyber-glass-border'
                      })}>
                        <h4 className="font-semibold">İkinci Kart</h4>
                        <p className="text-sm">Daha uzun kart içeriği buraya gelir ve birden fazla satıra yayılabilir.</p>
                      </div>
                      <div className={themeClass({
                        base: 'p-4 rounded-xl',
                        corporate: 'bg-dark-800 border border-dark-700/50',
                        cyberpunk: 'bg-cyber-glass-bg border border-cyber-glass-border'
                      })}>
                        <h4 className="font-semibold">Üçüncü Kart</h4>
                        <p className="text-sm">En uzun kart içeriği burada bulunur ve çok daha fazla içerik ve bilgi barındırabilir.</p>
                        <div className="mt-2 flex gap-2">
                          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded">Etiket 1</span>
                          <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded">Etiket 2</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ExampleSection>
          
          {/* Mobil Uyumluluk */}
          <ExampleSection title="Responsive Tasarım" codeExample={`
// Mobil uyumlu grid yapısı
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Mobilde tek kolon</div>
  <div>Orta genişlikte iki kolon</div>
  <div>Geniş ekranda üç kolon</div>
</div>

// Sınıf tabanlı responsive davranış
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/3">Sidebar</div>
  <div className="w-full md:w-2/3">İçerik</div>
</div>
`}>
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-2">Responsive Grid</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={themeClass({
                      base: 'p-4 rounded-lg text-center',
                      corporate: 'bg-dark-800 border border-dark-700/50',
                      cyberpunk: 'bg-cyber-glass-bg border border-cyber-glass-border'
                    })}
                  >
                    Kolon {i}
                  </div>
                ))}
              </div>
              
              <h3 className="text-lg font-semibold mb-2 mt-6">Yönün Değişmesi</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <div
                  className={themeClass({
                    base: 'p-4 rounded-lg w-full md:w-1/3',
                    corporate: 'bg-dark-800 border border-dark-700/50',
                    cyberpunk: 'bg-cyber-glass-bg border border-cyber-glass-border'
                  })}
                >
                  <h4 className="font-semibold">Sidebar</h4>
                  <p className="text-sm">Mobilde üstte, desktop'ta solda</p>
                </div>
                <div
                  className={themeClass({
                    base: 'p-4 rounded-lg w-full md:w-2/3',
                    corporate: 'bg-dark-800 border border-dark-700/50',
                    cyberpunk: 'bg-cyber-glass-bg border border-cyber-glass-border'
                  })}
                >
                  <h4 className="font-semibold">Ana İçerik</h4>
                  <p className="text-sm">Mobilde altta, desktop'ta sağda ve daha geniş</p>
                  <p className="mt-2">Bu düzen, ekran genişliğine göre otomatik olarak uyarlanır. Mobil cihazlarda, bileşenler dikey olarak konumlandırılırken, daha geniş ekranlarda yan yana gösterilirler.</p>
                </div>
              </div>
            </div>
          </ExampleSection>
        </div>
      </div>
    </div>
  );
};

export default UIStyleGuide; 