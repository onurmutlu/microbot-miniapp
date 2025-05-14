import React from 'react';
import { useLogManager } from '../../hooks/useLogManager';

interface LogButtonProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const LogButton: React.FC<LogButtonProps> = ({ 
  className = '', 
  position = 'bottom-right' 
}) => {
  const { toggleLogPanel, logs } = useLogManager();
  
  // Pozisyon sınıfları
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4'
  };
  
  // Son 5 dakika içindeki hata sayısını hesapla
  const recentErrorCount = logs.filter(
    log => log.level === 'error' && (Date.now() - log.timestamp) < 5 * 60 * 1000
  ).length;
  
  return (
    <button
      onClick={toggleLogPanel}
      className={`fixed ${positionClasses[position]} p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg flex items-center justify-center z-50 transition-all ${className}`}
      title="Log panelini aç/kapat"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className="w-6 h-6"
      >
        <path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
      </svg>
      
      {/* Hata sayısı göstergesi */}
      {recentErrorCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
          {recentErrorCount}
        </span>
      )}
    </button>
  );
};

export default LogButton; 