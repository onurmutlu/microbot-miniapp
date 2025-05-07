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
          
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-600/30 to-blue-600/30 rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2 text-gradient">Yeni Cyberpunk UI Demosu</h3>
            <p className="mb-3 text-gray-700 dark:text-gray-200">
              Modern, neon ve glass efektli yeni kullanıcı arayüzümüzü deneyimleyin!
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/cyberpunk')}
                className="btn bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-6 rounded-full hover:shadow-lg transition-all"
              >
                Cyberpunk Temayı Dene
              </button>
              <button
                onClick={() => navigate('/cyberpunk-dashboard-demo')}
                className="btn bg-gradient-to-r from-cyan-500 to-purple-600 text-white py-2 px-6 rounded-full hover:shadow-lg transition-all"
              >
                Neon Dashboard Demo
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-slate-700/40 to-slate-800/40 rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2">Kurumsal Dark Tema</h3>
            <p className="mb-3 text-gray-700 dark:text-gray-200">
              Profesyonel iş ortamları için tasarlanmış sade ve şık kurumsal temamızı keşfedin.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/corporate-panel-demo')}
                className="btn bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded hover:shadow-lg transition-all"
              >
                Kurumsal Panel Demo
              </button>
              <button
                onClick={() => navigate('/neon-button-demo')}
                className="btn bg-gradient-to-r from-[#ff6ec4] to-[#7873f5] text-white py-2 px-6 rounded-full hover:shadow-lg transition-all"
              >
                Neon Buton Demo
              </button>
              <button
                onClick={() => navigate('/corporate-button-demo')}
                className="btn bg-slate-800 hover:bg-slate-700 text-white py-2 px-6 rounded hover:shadow-lg transition-all"
              >
                Kurumsal Butonlar
              </button>
              <button
                onClick={() => navigate('/corporate-mobile-header-demo')}
                className="btn bg-slate-700 hover:bg-slate-600 text-white py-2 px-6 rounded hover:shadow-lg transition-all"
              >
                Mobil Header Demo
              </button>
              <button
                onClick={() => navigate('/corporate-glass-card-demo')}
                className="btn bg-gradient-to-r from-slate-800 to-slate-700 text-white py-2 px-6 rounded hover:shadow-lg transition-all"
              >
                Glass Kart Demo
              </button>
              <button
                onClick={() => navigate('/theme-switcher-demo')}
                className="btn bg-gradient-to-r from-purple-700 to-blue-700 text-white py-2 px-6 rounded hover:shadow-lg transition-all"
              >
                Tema Seçici Demo
              </button>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-cyan-500/30 to-fuchsia-500/30 rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2">Animasyonlu Bileşenler Demo</h3>
            <p className="mb-3 text-gray-700 dark:text-gray-200">
              UnoCSS ve Framer Motion ile oluşturulmuş saydam ve animasyonlu kartları keşfedin. Sayfa geçişlerinde yumuşak animasyonlar ve sıralı görünüm efektleri.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/animation-demo')}
                className="btn bg-gradient-to-r from-cyan-500 to-fuchsia-500 text-white py-2 px-6 rounded-full hover:shadow-xl transition-all"
              >
                Animasyon Demosunu Aç
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/30 to-green-500/30 rounded-xl text-center">
            <h3 className="text-xl font-bold mb-2">UI Bileşenleri Style Guide</h3>
            <p className="mb-3 text-gray-700 dark:text-gray-200">
              Tüm UI bileşenlerinin gösterildiği, temalar arasında geçiş yapabildiğiniz ve kod örnekleriyle kullanımlarını öğrenebileceğiniz kapsamlı style guide.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigate('/ui-style-guide')}
                className="btn bg-gradient-to-r from-blue-500 to-green-500 text-white py-2 px-6 rounded-full hover:shadow-xl transition-all"
              >
                Style Guide'ı Görüntüle
              </button>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
};

export default HomePage; 