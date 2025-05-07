import React, { useEffect } from 'react';
import CorporateGlassCard from '../components/ui/CorporateGlassCard';
import CorporateButton from '../components/ui/CorporateButton';

const CorporateGlassCardDemo: React.FC = () => {
  useEffect(() => {
    // Arkaplan rengini güncelle
    document.body.style.background = 'linear-gradient(135deg, #121212 0%, #2c3e50 100%)';
    
    return () => {
      // Sayfadan çıkıldığında arkaplan rengini temizle
      document.body.style.background = '';
    };
  }, []);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-white mb-10 text-center">Glass Kart Bileşenleri</h1>

      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <CorporateGlassCard intensity="light" hoverEffect="scale">
            <h2 className="text-xl font-bold text-white mb-4">Hafif Efekt</h2>
            <p className="text-white/80 text-center">
              Daha düşük opasiteli arka plan ve hafif kenarlık ile minimal bir görünüm.
              Hover'da ölçek değişimi efekti.
            </p>
          </CorporateGlassCard>

          <CorporateGlassCard>
            <h2 className="text-xl font-bold text-white mb-4">Standart Efekt</h2>
            <p className="text-white/80 text-center">
              Dengeli opasiteli arka plan ve orta seviye kenarlık.
              Hover'da hem ölçek hem glow efekti.
            </p>
          </CorporateGlassCard>

          <CorporateGlassCard intensity="strong" hoverEffect="glow">
            <h2 className="text-xl font-bold text-white mb-4">Güçlü Efekt</h2>
            <p className="text-white/80 text-center">
              Daha yüksek opasiteli arka plan ve belirgin kenarlık.
              Hover'da parıltı efekti.
            </p>
          </CorporateGlassCard>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <CorporateGlassCard
            className="p-8"
            hoverEffect="both"
            onClick={() => alert('İnteraktif kart tıklandı!')}
          >
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="white" viewBox="0 0 16 16">
                <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">İnteraktif Kart</h2>
            <p className="text-white/80 text-center mb-6">
              Bu karta tıklayabilirsiniz. Hover durumunda hem ölçek değişimi
              hem de parıltı efekti gösterir.
            </p>
            <CorporateButton>Daha Fazla Bilgi</CorporateButton>
          </CorporateGlassCard>

          <div className="grid grid-cols-1 gap-6">
            <CorporateGlassCard
              className="p-4 items-start"
              hoverEffect="scale"
              intensity="light"
            >
              <h2 className="text-xl font-bold text-white mb-2">Özelleştirilmiş İçerik</h2>
              <p className="text-white/80">
                İçerik sol tarafa hizalanmış, padding değeri değiştirilmiş
                ve hafif transparanlık ayarlanmış bir kart örneği.
              </p>
            </CorporateGlassCard>

            <CorporateGlassCard
              className="p-8 flex-row items-center justify-between gap-4"
              hoverEffect="glow"
              intensity="strong"
            >
              <div className="text-left">
                <h2 className="text-xl font-bold text-white">Yatay Düzen</h2>
                <p className="text-white/80">Yatay düzende bir kart örneği</p>
              </div>
              <CorporateButton variant="secondary" size="sm">
                İncele
              </CorporateButton>
            </CorporateGlassCard>
          </div>
        </div>

        <div className="mt-10 text-center">
          <CorporateGlassCard
            className="p-4 inline-block mx-auto"
            hoverEffect="both"
            onClick={() => window.history.back()}
          >
            <CorporateButton>Ana Sayfaya Dön</CorporateButton>
          </CorporateGlassCard>
        </div>
      </div>
    </div>
  );
};

export default CorporateGlassCardDemo; 