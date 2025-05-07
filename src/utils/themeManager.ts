export type ThemeType = 'corporate' | 'cyberpunk';

// localStorage'da tema tercihi için kullanılacak anahtar
const THEME_STORAGE_KEY = 'app-theme-preference';

/**
 * Kullanıcının tema tercihini localStorage'a kaydeder
 */
export const saveThemePreference = (theme: ThemeType): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.error('Tema tercihi kaydedilemedi:', error);
  }
};

/**
 * Kullanıcının kaydedilmiş tema tercihini getirir
 */
export const getThemePreference = (): ThemeType => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType;
    return savedTheme || 'corporate'; // Varsayılan tema: corporate
  } catch (error) {
    console.error('Tema tercihi alınamadı:', error);
    return 'corporate'; // Hata durumunda varsayılanı döndür
  }
};

/**
 * Verilen temayı HTML body'sine uygular
 */
export const applyTheme = (theme: ThemeType): void => {
  const body = document.body;
  
  // Tüm tema sınıflarını temizle
  body.classList.remove('corporate-theme', 'cyberpunk-theme');
  
  // Seçilen temayı uygula
  body.classList.add(`${theme}-theme`);
  
  // Tema için gerekli meta etiketlerini güncelle
  updateThemeMetaTags(theme);
  
  // Tema tercihini kaydet
  saveThemePreference(theme);
};

/**
 * Temaya özel meta etiketlerini günceller (renk şeması, vb.)
 */
const updateThemeMetaTags = (theme: ThemeType): void => {
  let themeColor: string;
  
  // Tema rengi
  if (theme === 'corporate') {
    themeColor = '#121212';
  } else {
    themeColor = '#1a1a2e';
  }
  
  // Theme-color meta etiketini güncelle
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.setAttribute('name', 'theme-color');
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute('content', themeColor);
};

/**
 * Kaydedilmiş tema tercihini yükler ve uygular
 */
export const loadSavedTheme = (): ThemeType => {
  const savedTheme = getThemePreference();
  applyTheme(savedTheme);
  return savedTheme;
};

/**
 * Temaları değiştirir (toggle)
 */
export const toggleTheme = (): ThemeType => {
  const currentTheme = getThemePreference();
  const newTheme: ThemeType = currentTheme === 'corporate' ? 'cyberpunk' : 'corporate';
  applyTheme(newTheme);
  return newTheme;
}; 