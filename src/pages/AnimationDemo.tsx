import React, { useState } from 'react';
import AnimatedCard from '../components/ui/AnimatedCard';
import AnimatedCardGroup from '../components/ui/AnimatedCardGroup';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { motion } from 'framer-motion';

const AnimationDemo: React.FC = () => {
  const [showCards, setShowCards] = useState(true);

  const toggleCards = () => {
    setShowCards(false);
    setTimeout(() => setShowCards(true), 300);
  };

  return (
    <div className="min-h-screen p-6 relative">
      {/* Demo Sayfası Başlık */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h1 className="text-3xl font-bold mb-2 theme-aware-heading">
          Animasyonlu Bileşenler Demo
        </h1>
        <p className="text-lg theme-aware-text">
          UnoCSS + Framer Motion ile oluşturulmuş animasyonlu bileşenler
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 theme-aware-button"
          onClick={toggleCards}
        >
          Animasyonları Tekrar Oynat
        </motion.button>
      </motion.div>

      {/* Tekli Animasyonlu Kart */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
          Tekli Animasyonlu Kart
        </h2>
        
        {showCards && (
          <AnimatedCard className="p-6">
            <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
              Saydam Fade-In Kart
            </h3>
            <p className="theme-aware-text mb-4">
              Bu kart, sayfa yüklendiğinde yumuşak bir fade-in ve scale-up animasyonu 
              ile görünür. Ayrıca hover durumunda hafif bir büyüme ve parlama efekti gösterir.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="theme-aware-button"
            >
              Detaylar
            </motion.button>
          </AnimatedCard>
        )}
      </div>

      {/* Sıralı Animasyonlu Kartlar */}
      <div className="max-w-6xl mx-auto mb-12">
        <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
          Sıralı Animasyonlu Kartlar
        </h2>
        
        {showCards && (
          <AnimatedCardGroup>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="p-6">
                <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
                  Kart {item}
                </h3>
                <p className="theme-aware-text mb-4">
                  Bu kartlar sırayla ve kademeli olarak görünür. Her biri bir öncekinden 
                  kısa bir süre sonra animasyona başlar.
                </p>
              </div>
            ))}
          </AnimatedCardGroup>
        )}
      </div>

      {/* Farklı Stil Varyantları */}
      <div className="max-w-6xl mx-auto mb-12">
        <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
          Farklı Stil Varyantları
        </h2>
        
        {showCards && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard className="p-6 animated-card" delay={0.1}>
              <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
                Standart Kart
              </h3>
              <p className="theme-aware-text mb-4">
                Temel saydam kart stili
              </p>
            </AnimatedCard>
            
            <AnimatedCard className="p-6 animated-card-cyan" delay={0.2}>
              <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
                Cyan Kart
              </h3>
              <p className="theme-aware-text mb-4">
                Cyan vurgulu saydam kart
              </p>
            </AnimatedCard>
            
            <AnimatedCard className="p-6 animated-card-magenta" delay={0.3}>
              <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
                Magenta Kart
              </h3>
              <p className="theme-aware-text mb-4">
                Magenta vurgulu saydam kart
              </p>
            </AnimatedCard>
            
            <AnimatedCard className="p-6 animated-card-float col-span-1 md:col-span-3" delay={0.4}>
              <h3 className="text-lg font-semibold mb-2 theme-aware-heading">
                Float Animasyonlu Kart
              </h3>
              <p className="theme-aware-text mb-4">
                Sürekli olarak yukarı aşağı hafifçe hareket eden kart
              </p>
            </AnimatedCard>
          </div>
        )}
      </div>

      {/* Özel Animasyonlu UI Öğeleri */}
      <div className="max-w-4xl mx-auto mb-12">
        <h2 className="text-xl font-semibold mb-4 theme-aware-heading">
          Özel Animasyonlu UI Öğeleri
        </h2>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(255, 110, 196, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="cyber-btn-primary"
          >
            Cyber Buton
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
            whileTap={{ scale: 0.95 }}
            className="cyber-btn-accent"
          >
            Neon Buton
          </motion.button>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-block"
          >
            <ThemeSwitcher className="static transform-none" />
          </motion.div>
        </div>
      </div>
      
      {/* Ana sayfaya dönüş */}
      <div className="text-center mt-12">
        <motion.a
          href="/"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="theme-aware-button inline-block"
        >
          Ana Sayfaya Dön
        </motion.a>
      </div>
    </div>
  );
};

export default AnimationDemo; 