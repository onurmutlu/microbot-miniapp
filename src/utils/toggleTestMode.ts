import { setTestMode, getTestMode } from './testMode';
import { toast } from './toast';

/**
 * Test modunu açıp kapatmak için global fonksiyon
 * Bu fonksiyona tarayıcı konsolundan "toggleTestMode()" ile erişilebilir
 * @returns Yeni test modu durumu
 */
export const toggleTestMode = (): boolean => {
  const currentMode = getTestMode();
  const newMode = !currentMode;
  
  setTestMode(newMode);
  
  // Bildirim göster
  if (newMode) {
    toast.success('Test modu etkinleştirildi. Gerçek API bağlantıları kullanılmayacak.');
    console.log('📱 Test modu etkinleştirildi');
  } else {
    toast.info('Test modu devre dışı bırakıldı. Gerçek API bağlantıları kullanılacak.');
    console.log('📱 Test modu devre dışı bırakıldı');
  }
  
  return newMode;
};

// Global olarak erişilebilir yap
(window as any).toggleTestMode = toggleTestMode;

export default toggleTestMode; 