import React, { useEffect } from 'react';
import useTestMode from '../../hooks/useTestMode';

/**
 * Test modu göstergesi
 * Sağ altta test modunu gösteren ve değiştirmeye izin veren bir etiket
 */
const TestModeIndicator: React.FC = () => {
  const { isTestMode, toggleTestMode } = useTestMode();

  // Test modu kapalı ise hiçbir şey gösterme
  if (!isTestMode) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-2 rounded-lg 
                shadow-lg cursor-pointer z-50 text-sm flex items-center gap-2 hover:bg-red-700 
                transition-all transform hover:scale-105 active:scale-95"
      onClick={toggleTestMode}
    >
      <span className="h-2 w-2 rounded-full bg-red-300 animate-pulse"></span>
      <span>Test Modu</span>
    </div>
  );
};

export default TestModeIndicator; 