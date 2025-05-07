import React, { useEffect, useState } from 'react';
import CorporateMobileHeader from '../components/ui/CorporateMobileHeader';
import CorporateButton from '../components/ui/CorporateButton';

const CorporateMobileHeaderDemo: React.FC = () => {
  // Dark tema için body stilini güncelle
  useEffect(() => {
    document.body.classList.add('corporate-dark');
    
    return () => {
      document.body.classList.remove('corporate-dark');
    };
  }, []);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  
  // Örnek kullanıcı
  const user = {
    name: 'Ahmet Yılmaz',
    email: 'ahmet@firma.com',
    avatarUrl: 'https://i.pravatar.cc/300?img=8'
  };
  
  const toggleMenu = () => {
    setMenuOpen(prevState => !prevState);
    setShowUserInfo(false);
  };
  
  const toggleUserInfo = () => {
    setShowUserInfo(prevState => !prevState);
    setMenuOpen(false);
  };

  return (
    <div className="corporate-dark min-h-screen">
      <CorporateMobileHeader 
        title="MicroBot Mini App" 
        avatarUrl={user.avatarUrl}
        onMenuClick={toggleMenu}
        onAvatarClick={toggleUserInfo}
      />
      
      {/* Menü paneli */}
      <div className={`fixed top-[57px] left-0 w-64 h-screen bg-[var(--corporate-bg-secondary)] border-r border-[var(--corporate-border)] p-4 transform transition-transform duration-300 ease-in-out z-40 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <h2 className="corporate-heading text-lg">Ana Menü</h2>
        <nav className="mt-4">
          <ul className="space-y-2">
            {['Ana Sayfa', 'Mesajlar', 'Gruplar', 'Ayarlar', 'Yardım'].map((item, index) => (
              <li key={index}>
                <a 
                  href="#" 
                  className="block py-2 px-3 text-[var(--corporate-text-primary)] hover:bg-[var(--corporate-bg-tertiary)] rounded"
                  onClick={(e) => e.preventDefault()}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Kullanıcı bilgi kartı */}
      <div className={`fixed top-[57px] right-4 w-64 bg-[var(--corporate-bg-secondary)] border border-[var(--corporate-border)] rounded-lg p-4 transform transition-all duration-300 ease-in-out z-40 ${showUserInfo ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center mb-3">
          <img 
            src={user.avatarUrl} 
            alt={user.name} 
            className="w-12 h-12 rounded-full mr-3"
          />
          <div>
            <h3 className="font-medium text-[var(--corporate-text-primary)]">{user.name}</h3>
            <p className="corporate-text-muted text-sm">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <CorporateButton size="sm" fullWidth>Profil</CorporateButton>
          <CorporateButton size="sm" fullWidth variant="outline">Çıkış Yap</CorporateButton>
        </div>
      </div>
      
      {/* Sayfa içeriği */}
      <main className="p-4 mt-2">
        <div className="corporate-card mb-4">
          <h2 className="corporate-heading text-xl">iOS Benzeri Mobil Header</h2>
          <p className="corporate-text-muted mb-4">
            Telegram MiniApp uyumlu, transparan ve blur efektli mobil header örneği. Sol üstteki menü ikonuna veya sağdaki avatara tıklayarak etkileşimli panelleri görebilirsiniz.
          </p>
          
          <div className="corporate-divider"></div>
          
          <h3 className="corporate-subheading mt-4">Özellikler</h3>
          <ul className="list-disc list-inside space-y-2 text-[var(--corporate-text-secondary)]">
            <li>Sticky pozisyonlama (üstte sabit kalır)</li>
            <li>Yarı-transparan arkaplan (bg-[#0f0f0f]/60)</li>
            <li>Backdrop blur efekti (backdrop-blur-md)</li>
            <li>Hamburger menü (solda)</li>
            <li>Başlık (ortada, text-xl)</li>
            <li>Kullanıcı avatarı (sağda)</li>
            <li>iOS benzeri dokunma geri bildirimi</li>
          </ul>
        </div>
        
        <div className="corporate-card">
          <h3 className="corporate-heading">Demo İçeriği</h3>
          <p className="corporate-text-muted mb-4">
            Bu demo sayfası Telegram MiniApp'lerde kullanılabilecek bir mobil header tasarımını göstermektedir. Header, kullanıcı arayüzünün en önemli parçalarından biridir ve kullanıcının uygulamada gezinmesini sağlar.
          </p>
          <p className="corporate-text-muted">
            Bu tasarım, minimalist ve modern bir hisse sahip olup, iOS native uygulamalarına benzer bir kullanıcı deneyimi sunar. Transparan arka plan ve bulanıklaştırma efekti, içeriğin üzerinde zarif bir görünüm sağlar.
          </p>
          
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-3 bg-[var(--corporate-bg-tertiary)] rounded-md">
                <p className="text-[var(--corporate-text-secondary)]">Demo İçerik Öğesi {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      {/* Arkaplan overlay (menü açıkken) */}
      {(menuOpen || showUserInfo) && (
        <div 
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => {
            setMenuOpen(false);
            setShowUserInfo(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default CorporateMobileHeaderDemo; 