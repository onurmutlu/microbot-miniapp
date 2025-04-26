import React, { useState, useEffect } from 'react';
import { getTestMode, setTestMode } from '../../utils/testMode';

const TestModeIndicator: React.FC = () => {
  const [isTestMode, setIsTestMode] = useState(getTestMode());

  useEffect(() => {
    // Durumu her saniye güncelle
    const interval = setInterval(() => {
      setIsTestMode(getTestMode());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleTestMode = () => {
    setTestMode(!isTestMode);
  };

  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs shadow-lg cursor-pointer z-50 flex items-center gap-2"
      onClick={toggleTestMode}
    >
      <div className={`w-2 h-2 rounded-full ${isTestMode ? 'bg-green-300 animate-pulse' : 'bg-gray-300'}`} />
      {isTestMode ? 'Test Modu Aktif' : 'Test Modu Devre Dışı'}
    </div>
  );
};

export default TestModeIndicator; 