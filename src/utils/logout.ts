// Kolay kullanım için logout fonksiyonu
export const logoutUser = () => {
  try {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('telegram_user');
    console.log('Kullanıcı çıkış yaptı');
    // Login sayfasına yönlendirme
    window.location.href = '/login';
    return true;
  } catch (error) {
    console.error('Logout hatası:', error);
    return false;
  }
};

export default logoutUser; 