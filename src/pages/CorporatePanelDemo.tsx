import React, { useEffect } from 'react';
import CorporatePanel from '../components/ui/CorporatePanel';

const CorporatePanelDemo: React.FC = () => {
  useEffect(() => {
    // Dark tema için body stilini güncelle
    document.body.classList.add('corporate-dark');
    
    return () => {
      // Sayfa değiştiğinde temayı temizle
      document.body.classList.remove('corporate-dark');
    };
  }, []);

  return <CorporatePanel />;
};

export default CorporatePanelDemo; 