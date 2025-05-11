// Test modu için yardımcı fonksiyonlar

/**
 * Test modunu localStorage'da saklar.
 */
export const getTestMode = (): boolean => {
  const storedValue = localStorage.getItem('test_mode');
  return storedValue === 'true';
};

/**
 * Test modunu ayarlar.
 * @param value Test modunun yeni değeri.
 */
export const setTestMode = (value: boolean): void => {
  localStorage.setItem('test_mode', value.toString());
  
  // Test modu değiştiğinde bir olay tetikle
  window.dispatchEvent(new CustomEvent('testModeChanged', { detail: { enabled: value } }));
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

export default getTestMode; 