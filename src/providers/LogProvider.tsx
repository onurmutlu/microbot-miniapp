import React, { useEffect } from 'react';
import LogPanel from '../components/debug/LogPanel';
import LogButton from '../components/debug/LogButton';
import { initConsoleOverride, logService } from '../services/logService';

interface LogProviderProps {
  children: React.ReactNode;
  enableConsoleOverride?: boolean;
  showLogButton?: boolean;
  buttonPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

/**
 * Log sistemini başlatan ve yöneten provider bileşeni
 */
const LogProvider: React.FC<LogProviderProps> = ({
  children,
  enableConsoleOverride = false,
  showLogButton = true,
  buttonPosition = 'bottom-right'
}) => {
  // Provider yüklendiğinde
  useEffect(() => {
    // Console Override
    if (enableConsoleOverride) {
      initConsoleOverride();
    }
    
    // Provider başlangıç logu
    logService.info('System', 'LogProvider initialized', {
      timestamp: new Date().toISOString(),
      consoleOverride: enableConsoleOverride
    });
    
    // Başlangıç zamanını kaydet
    const startTime = performance.now();
    
    // Temizlik
    return () => {
      const endTime = performance.now();
      logService.info('System', 'LogProvider unmounted', { 
        lifetime: `${Math.floor((endTime - startTime) / 1000)}s` 
      });
    };
  }, [enableConsoleOverride]);

  // Uygulama performansı için PerformanceObserver kullan
  useEffect(() => {
    // Tarayıcı destekliyorsa
    if (typeof PerformanceObserver !== 'undefined') {
      // Sayfa yükleme ölçümlerini logla
      const pageLoadMetrics = window.performance.getEntriesByType('navigation');
      if (pageLoadMetrics.length > 0) {
        const pageLoad = pageLoadMetrics[0] as PerformanceNavigationTiming;
        logService.info('Performance', 'Page load metrics', {
          loadTime: `${Math.round(pageLoad.loadEventEnd - pageLoad.startTime)}ms`,
          domReady: `${Math.round(pageLoad.domContentLoadedEventEnd - pageLoad.startTime)}ms`,
          firstPaint: `${Math.round(pageLoad.responseEnd - pageLoad.startTime)}ms`
        });
      }

      // Performans gözlemcisi ekle
      const perfObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'longtask' && entry.duration > 100) {
            logService.warn('Performance', `Long task detected (${Math.round(entry.duration)}ms)`, {
              name: entry.name,
              duration: entry.duration
            });
          }
        });
      });

      // Uzun süren görevleri izle
      try {
        perfObserver.observe({ entryTypes: ['longtask', 'resource'] });
      } catch (e) {
        // Bazı tarayıcılar longtask'ı desteklemeyebilir
      }

      return () => {
        perfObserver.disconnect();
      };
    }
  }, []);

  // Ağ hatalarını yakala
  useEffect(() => {
    const handleOnline = () => {
      logService.success('Network', 'Connection restored', {
        timestamp: new Date().toISOString()
      });
    };

    const handleOffline = () => {
      logService.error('Network', 'Connection lost', {
        timestamp: new Date().toISOString()
      });
    };

    // Event listener'ları ekle
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Mevcut durumu kontrol et
    if (navigator.onLine) {
      logService.info('Network', 'Application started online');
    } else {
      logService.warn('Network', 'Application started offline');
    }

    // Temizlik
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {children}
      <LogPanel />
      {showLogButton && <LogButton position={buttonPosition} />}
    </>
  );
};

export default LogProvider; 