export const checkEnv = () => {
  const required = [
    'VITE_API_URL',
    'VITE_WS_URL',
    'VITE_TELEGRAM_BOT_TOKEN'
  ];

  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.error('Eksik environment değişkenleri:', missing);
    return false;
  }

  return true;
};

export const getEnv = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Environment değişkeni bulunamadı: ${key}`);
  }
  return value;
}; 