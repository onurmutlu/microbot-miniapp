import { setTestMode, getTestMode } from './testMode';
import { toast } from './toast';

/**
 * Test modunu açıp kapatmak için global fonksiyon
 * Bu fonksiyona tarayıcı konsolundan "toggleTestMode()" ile erişilebilir
 * @returns Yeni test modu durumu
 */
export const toggleTestMode = () => {
  const currentMode = getTestMode();
  const newMode = !currentMode;
  
  // Test modunu değiştir
  setTestMode(newMode);
  
  // Kullanıcıya bildiri
  console.log(`Test modu ${newMode ? 'aktif' : 'devre dışı'}`);
  
  // Sayfayı yenile
  setTimeout(() => {
    window.location.reload();
  }, 500);
  
  return newMode;
};

// Global olarak erişilebilir yap
(window as any).toggleTestMode = toggleTestMode;

export default toggleTestMode; 