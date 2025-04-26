// Test modunu kontrol eden değişken
let isTestMode = false;

/**
 * Test modunu etkinleştirir veya devre dışı bırakır
 * @param mode Test modunun durumu
 */
export const setTestMode = (mode: boolean) => {
  isTestMode = mode;
  console.log(`Test modu ${mode ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`);
};

/**
 * Test modunun durumunu döndürür
 * @returns Test modunun durumu
 */
export const getTestMode = (): boolean => {
  return isTestMode;
};

/**
 * Test modunu konsol aracılığıyla değiştirmek için global bir fonksiyon oluşturur
 */
export const setupTestModeToggle = () => {
  // @ts-ignore
  window.__toggleTestMode = (mode: boolean = !isTestMode) => {
    setTestMode(mode);
    return `Test modu ${mode ? 'etkinleştirildi' : 'devre dışı bırakıldı'}`;
  };
  
  console.log('Test modu değiştirme fonksiyonu konsola eklendi. Kullanım: __toggleTestMode()');
}; 