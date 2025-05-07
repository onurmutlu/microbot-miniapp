import React from 'react';
import NeonButton from '../components/ui/NeonButton';

const NeonButtonDemo: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-900 p-4">
      <h1 className="text-2xl font-bold text-white mb-8">Neon Buton Demosi</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <div className="flex flex-col gap-4 items-center">
          <h2 className="text-lg text-white mb-2">Temel Butonlar</h2>
          
          <NeonButton onClick={() => alert('Standart butona tıklandı!')}>
            Standart Neon
          </NeonButton>
          
          <NeonButton 
            className="from-[#7873f5] to-[#ff6ec4]"
            onClick={() => alert('Ters renkli butona tıklandı!')}
          >
            Ters Gradyan
          </NeonButton>
          
          <NeonButton
            className="text-lg font-bold"
            onClick={() => alert('Büyük yazılı butona tıklandı!')}
          >
            Büyük Yazı
          </NeonButton>
        </div>
        
        <div className="flex flex-col gap-4 items-center">
          <h2 className="text-lg text-white mb-2">Özel Varyantlar</h2>
          
          <NeonButton 
            variant="pulsing"
            onClick={() => alert('Nabız efektli butona tıklandı!')}
          >
            Nabız Efekti
          </NeonButton>
          
          <NeonButton 
            variant="cyan-pink"
            onClick={() => alert('Camgöbeği-Pembe butona tıklandı!')}
          >
            Camgöbeği-Pembe
          </NeonButton>
          
          <NeonButton 
            variant="blue-purple"
            onClick={() => alert('Mavi-Mor butona tıklandı!')}
          >
            Mavi-Mor
          </NeonButton>
          
          <NeonButton 
            variant="green-yellow"
            onClick={() => alert('Yeşil-Sarı butona tıklandı!')}
          >
            Yeşil-Sarı
          </NeonButton>
        </div>
      </div>
      
      <div className="mt-12">
        <NeonButton 
          variant="pulsing" 
          className="text-xl px-8 py-3"
          onClick={() => window.history.back()}
        >
          Geri Dön
        </NeonButton>
      </div>
      
      <p className="text-gray-400 text-center mt-8 max-w-lg">
        Bu butonlar hover durumunda büyüyüp parlar. Ayrıca dokunmatik ekranlara 
        optimize edilmiş, mobil cihazlar için touch-manipulation özelliği eklenmiştir.
      </p>
    </div>
  );
};

export default NeonButtonDemo; 