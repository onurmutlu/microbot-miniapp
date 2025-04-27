import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import { FiArrowRight, FiBarChart2, FiMessageSquare, FiSettings, FiUsers } from 'react-icons/fi';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Animasyon için sayfa yüklemesini simüle et
    const timer = setTimeout(() => setIsLoaded(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // Ana sayfa içinde gösterilen özellikler
  const features = [
    {
      id: 'dashboard',
      title: 'Kontrol Paneli',
      description: 'İstatistikler ve genel bakış ile etkinliğinizi görüntüleyin',
      icon: <FiBarChart2 className="w-8 h-8 text-blue-500" />,
      path: '/dashboard'
    },
    {
      id: 'messages',
      title: 'Mesaj Şablonları',
      description: 'Hızlı yanıtlar için mesaj şablonları oluşturun ve yönetin',
      icon: <FiMessageSquare className="w-8 h-8 text-pink-500" />,
      path: '/message-templates'
    },
    {
      id: 'groups',
      title: 'Grup Yönetimi',
      description: 'Gruplarınızı ve kanallarınızı kolayca yönetin',
      icon: <FiUsers className="w-8 h-8 text-green-500" />,
      path: '/group-list'
    },
    {
      id: 'settings',
      title: 'Kullanıcı Ayarları',
      description: 'Hesap ayarlarınızı yapılandırın ve kontrol edin',
      icon: <FiSettings className="w-8 h-8 text-purple-500" />,
      path: '/user-settings'
    },
  ];

  const navigateToFeature = (path: string) => {
    navigate(path);
  };

  return (
    <div className={`container mx-auto px-4 py-8 min-h-screen ${isLoaded ? 'animate-fade-in' : 'opacity-0'}`}>
      <section className="mb-12 text-center">
        <GlassCard 
          className="py-10 max-w-4xl mx-auto" 
          variant="primary" 
          elevated
          withAnimation
        >
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
            MicroBot - Mikro Bot Mini Uygulaması
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Bu uygulama, Telegram botlarını yönetmenizi, mesaj şablonları oluşturmanızı ve botunuzun performansını izlemenizi sağlar.
          </p>
        </GlassCard>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {features.map((feature) => (
          <GlassCard 
            key={feature.id}
            className="p-6 flex flex-col h-full"
            variant={
              feature.id === 'dashboard' ? 'info' :
              feature.id === 'messages' ? 'secondary' :
              feature.id === 'groups' ? 'success' : 'primary'
            }
            hoverable
            onClick={() => navigateToFeature(feature.path)}
          >
            <div className="flex items-start mb-4">
              <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm mr-4">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            </div>
            <div className="mt-auto flex justify-end">
              <button
                className="glass-btn flex items-center text-sm font-medium"
                onClick={() => navigateToFeature(feature.path)}
              >
                Keşfet <FiArrowRight className="ml-2" />
              </button>
            </div>
          </GlassCard>
        ))}
      </section>

      <section className="mb-8">
        <GlassCard className="text-center p-8" elevated withAnimation>
          <h2 className="text-2xl font-bold mb-4">
            Uygulamayı keşfetmeye başlayın
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Tüm özellikleri keşfetmek için yan menüyü kullanabilir veya yukarıdaki kartlardan birini seçebilirsiniz.
          </p>
        </GlassCard>
      </section>
    </div>
  );
};

export default HomePage; 