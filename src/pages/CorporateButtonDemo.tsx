import React, { useEffect } from 'react';
import CorporateButton from '../components/ui/CorporateButton';

const CorporateButtonDemo: React.FC = () => {
  useEffect(() => {
    // Dark tema için body stilini güncelle
    document.body.classList.add('corporate-dark');
    
    return () => {
      // Sayfa değiştiğinde temayı temizle
      document.body.classList.remove('corporate-dark');
    };
  }, []);

  // Örnek simgeler
  const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
    </svg>
  );
  
  const ArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z"/>
    </svg>
  );

  return (
    <div className="corporate-dark min-h-screen p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="corporate-heading text-2xl md:text-3xl">Kurumsal Buton Bileşenleri</h1>
          <p className="corporate-text-muted">
            Kurumsal dark tema tasarım dili ile uyumlu buton bileşenleri koleksiyonu
          </p>
        </div>

        <div className="corporate-card mb-8">
          <h2 className="corporate-heading text-xl">Buton Varyantları</h2>
          <div className="flex flex-wrap gap-4 mt-4">
            <CorporateButton>Primary</CorporateButton>
            <CorporateButton variant="secondary">Secondary</CorporateButton>
            <CorporateButton variant="outline">Outline</CorporateButton>
            <CorporateButton variant="danger">Danger</CorporateButton>
            <CorporateButton variant="success">Success</CorporateButton>
          </div>
        </div>

        <div className="corporate-card mb-8">
          <h2 className="corporate-heading text-xl">Buton Boyutları</h2>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <CorporateButton size="sm">Küçük</CorporateButton>
            <CorporateButton size="md">Orta</CorporateButton>
            <CorporateButton size="lg">Büyük</CorporateButton>
          </div>
        </div>

        <div className="corporate-card mb-8">
          <h2 className="corporate-heading text-xl">İkon ile Butonlar</h2>
          <div className="flex flex-wrap gap-4 mt-4">
            <CorporateButton icon={<PlusIcon />}>Yeni Ekle</CorporateButton>
            <CorporateButton icon={<ArrowIcon />} iconPosition="right" variant="secondary">
              İlerle
            </CorporateButton>
            <CorporateButton icon={<PlusIcon />} variant="outline">
              Daha Fazla
            </CorporateButton>
          </div>
        </div>

        <div className="corporate-card mb-8">
          <h2 className="corporate-heading text-xl">Tam Genişlikte Butonlar</h2>
          <div className="space-y-4 mt-4">
            <CorporateButton fullWidth>Tam Genişlikte Primary</CorporateButton>
            <CorporateButton fullWidth variant="secondary">
              Tam Genişlikte Secondary
            </CorporateButton>
            <CorporateButton fullWidth variant="outline">
              Tam Genişlikte Outline
            </CorporateButton>
          </div>
        </div>

        <div className="corporate-card">
          <h2 className="corporate-heading text-xl">Buton Grupları</h2>
          <div className="mt-4">
            <div className="inline-flex border border-[var(--corporate-border)] rounded overflow-hidden">
              <CorporateButton className="rounded-none border-0">Sol</CorporateButton>
              <CorporateButton className="rounded-none border-0 border-l border-r border-[var(--corporate-border)]">
                Orta
              </CorporateButton>
              <CorporateButton className="rounded-none border-0">Sağ</CorporateButton>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex gap-3">
              <CorporateButton variant="secondary" onClick={() => window.history.back()}>
                Geri Dön
              </CorporateButton>
              <CorporateButton variant="primary">Tüm Temaları Keşfet</CorporateButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporateButtonDemo; 