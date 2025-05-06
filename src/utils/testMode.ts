// Test modu için yardımcı fonksiyonlar

/**
 * Test modunu etkinleştir veya devre dışı bırak
 * @param enabled Test modunun etkin olup olmaması
 */
export const setTestMode = (enabled: boolean): void => {
  try {
    localStorage.setItem('test_mode', enabled ? 'true' : 'false');
    console.log(`Test modu ${enabled ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
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
    <div style="position: fixed; bottom: 10px; left: 10px; background: rgba(255, 0, 0, 0.7); 
    color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; z-index: 9999;">
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

export default {
  getTestMode,
  setTestMode,
  renderTestModeIndicator,
  runInTestMode
}; 