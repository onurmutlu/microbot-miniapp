// Mock Auth API
document.addEventListener('DOMContentLoaded', () => {
  // Telegram endpoint'i
  if (location.pathname.includes('/api/auth/telegram')) {
    fetch('/api/auth/telegram.json')
      .then(response => response.json())
      .then(data => {
        document.write(JSON.stringify(data));
      })
      .catch(error => {
        document.write(JSON.stringify({
          success: false,
          message: 'Kimlik doğrulama hatası',
          error: error.message
        }));
      });
  }
}); 