import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getUserInfo } from '../../utils/telegramSDK';
import { FiMenu, FiX, FiChevronLeft, FiUser } from 'react-icons/fi';
import useTheme from '../../hooks/useTheme';
import { cn } from '../../utils/cn';

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showMenu?: boolean;
  backRoute?: string;
  className?: string;
  onBackClick?: () => void;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
  transparent?: boolean;
  variant?: 'default' | 'cyber' | 'corporate';
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  showMenu = true,
  backRoute = '',
  className = '',
  onBackClick,
  onMenuClick,
  actions,
  transparent = false,
  variant = 'default',
}) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { themeClass } = useTheme();
  
  // Telegram kullanıcı bilgilerini al
  const user = getUserInfo();
  
  // Varyant sınıfları
  const variantStyles = {
    default: 'bg-[#0f0f0f]/60 backdrop-blur-md text-white',
    cyber: 'bg-cyber-bg/70 backdrop-blur-md border-b border-cyber-glass-border text-cyber-text',
    corporate: 'bg-dark-800/70 backdrop-blur-md border-b border-dark-700/30 text-gray-200',
  };
  
  // Geri butonu işleyicisi
  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backRoute) {
      navigate(backRoute);
    } else {
      navigate(-1);
    }
  };

  // Menü butonu işleyicisi
  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      setMenuOpen(!menuOpen);
    }
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full h-14 flex items-center justify-between px-4',
        transparent ? 'bg-transparent' : variantStyles[variant],
        className
      )}
    >
      {/* Sol Bölüm - Geri Butonu veya Menü Butonu */}
      <div className="flex items-center">
        {showBackButton ? (
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            whileTap={{ scale: 0.9 }}
            onClick={handleBackClick}
            aria-label="Geri"
          >
            <FiChevronLeft className="w-6 h-6" />
          </motion.button>
        ) : showMenu ? (
          <motion.button
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
            whileTap={{ scale: 0.9 }}
            onClick={handleMenuClick}
            aria-label="Menü"
          >
            <FiMenu className="w-6 h-6" />
          </motion.button>
        ) : null}
      </div>

      {/* Orta Bölüm - Başlık */}
      <div className="flex-1 text-center truncate">
        <h1 className={themeClass({
          base: 'text-lg font-medium',
          corporate: 'font-sans',
          cyberpunk: 'font-cyber font-bold'
        })}>
          {title || 'MicroBot'}
        </h1>
      </div>

      {/* Sağ Bölüm - Avatar veya Diğer Eylemler */}
      <div className="flex items-center">
        {actions || (
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt={user.first_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiUser className="w-5 h-5 text-gray-300" />
            )}
          </div>
        )}
      </div>

      {/* Açılır Menü */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={cn(
              'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm',
              variantStyles[variant].replace('bg-', 'bg-opacity-90 ')
            )}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col h-full">
              <div className="flex justify-end p-4">
                <motion.button
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMenuOpen(false)}
                  aria-label="Kapat"
                >
                  <FiX className="w-6 h-6" />
                </motion.button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                {/* Menü içeriği buraya gelecek */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700">
                    {user?.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.first_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FiUser className="w-10 h-10 m-5 text-gray-300" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold">{user?.first_name || 'Kullanıcı'}</h2>
                  {user?.username && (
                    <p className="text-gray-400">@{user.username}</p>
                  )}
                </div>
                
                {/* Menü öğeleri burada listelenebilir */}
                <nav className="w-full max-w-xs">
                  {['Ana Sayfa', 'Profil', 'Ayarlar', 'Hakkında'].map((item, index) => (
                    <motion.button
                      key={index}
                      className={themeClass({
                        base: 'w-full py-3 px-4 rounded-lg mb-2 text-left transition-colors',
                        corporate: 'hover:bg-blue-700/20',
                        cyberpunk: 'hover:bg-cyber-neon-purple/20 border border-transparent hover:border-cyber-neon-purple/40'
                      })}
                      whileHover={{ x: 5 }}
                      onClick={() => {
                        setMenuOpen(false);
                        // Sayfa yönlendirmesi burada yapılabilir
                      }}
                    >
                      {item}
                    </motion.button>
                  ))}
                </nav>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default MobileHeader; 