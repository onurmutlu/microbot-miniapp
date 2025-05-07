// Test modu için yardımcı fonksiyonlar

/**
 * Test modunu etkinleştir veya devre dışı bırak
 * @param enabled Test modunun etkin olup olmaması
 */
export const setTestMode = (enabled: boolean): void => {
  try {
    localStorage.setItem('test_mode', enabled ? 'true' : 'false');
    console.log(`Test modu ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
    
    // Test modu göstergesini güncelle
    updateTestModeIndicator();
  } catch (error) {
    console.error('Test modu ayarlanırken hata:', error);
  }
};

/**
 * Test modunun etkin olup olmadığını kontrol et
 * @returns Test modu etkin mi?
 */
export const getTestMode = (): boolean => {
  try {
    // Otomatik geliştirme ortamı tespiti - localhost veya 192.168 ile başlayan IP adresleri
    const isDevEnvironment = window.location.hostname === 'localhost' || 
      window.location.hostname.startsWith('127.0.0.1') || 
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.includes('.local');
    
    // Yerel depolamada test modu ayarı var mı?
    const testModeStorage = localStorage.getItem('test_mode');
    
    // Eğer açıkça ayarlanmışsa, o değeri kullan
    if (testModeStorage !== null) {
      return testModeStorage === 'true';
    }
    
    // Geliştirme ortamında varsayılan olarak test modunu etkinleştir
    return true; // Her zaman true döndür
  } catch (error) {
    console.error('Test modu kontrolü sırasında hata:', error);
    return true; // Hata durumunda da true döndür
  }
};

/**
 * Test modu etiketini göster (geliştirme amaçlı)
 * @returns Test modu HTML etiketi
 */
export const renderTestModeIndicator = (): string => {
  const isTestMode = getTestMode();
  if (!isTestMode) return '';
  
  return `
    <div id="testModeIndicator" style="position: fixed; bottom: 20px; right: 20px; background: rgba(255, 0, 0, 0.8); 
    color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; z-index: 9999; 
    cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.15); transition: all 0.2s ease-in-out;"
    onclick="window.toggleTestMode && window.toggleTestMode()">
      Test Modu
    </div>
  `;
};

/**
 * Test modu dahilinde çalıştır
 * @param callback Test modunda çalıştırılacak fonksiyon
 */
export const runInTestMode = <T>(callback: () => T, fallback?: T): T | undefined => {
  if (getTestMode()) {
    return callback();
  }
  return fallback;
};

/**
 * Test modu göstergesini DOM'a ekler veya günceller
 */
export const updateTestModeIndicator = (): void => {
  try {
    // Mevcut göstergeyi sil
    const existingIndicator = document.getElementById('testModeIndicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    // Test modu etkinse yeni gösterge ekle
    if (getTestMode()) {
      const indicatorHTML = renderTestModeIndicator();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = indicatorHTML;
      document.body.appendChild(tempDiv.firstElementChild as HTMLElement);
      
      // Tıklama efekti ekle
      const indicator = document.getElementById('testModeIndicator');
      if (indicator) {
        indicator.addEventListener('mousedown', () => {
          indicator.style.transform = 'scale(0.95)';
        });
        indicator.addEventListener('mouseup', () => {
          indicator.style.transform = 'scale(1)';
        });
        indicator.addEventListener('mouseleave', () => {
          indicator.style.transform = 'scale(1)';
        });
      }
    }
  } catch (error) {
    console.error('Test modu göstergesi güncellenirken hata:', error);
  }
};

// Sayfa yüklendiğinde test modu göstergesini güncelle
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', updateTestModeIndicator);
}

export default {
  getTestMode,
  setTestMode,
  renderTestModeIndicator,
  runInTestMode,
  updateTestModeIndicator
}; 