import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setCredentials, setLoading, setError } from '../store/slices/authSlice';
import api from '../config/api';
import { websocketService } from '../services/websocket';
import { getTestMode } from '../utils/testMode';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    const initAuth = async () => {
      try {
        dispatch(setLoading(true));
        
        // Test modunda ise otomatik doğrulanmış olarak işaretle
        if (getTestMode()) {
          const testUser = {
            id: 'test-user',
            username: 'testuser',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            photo_url: 'https://i.pravatar.cc/150?img=3'
          };
          dispatch(setCredentials({ user: testUser, token: 'test-token' }));
          return;
        }

        const token = localStorage.getItem('token');
        
        if (token) {
          const response = await api.get('/auth/me');
          dispatch(setCredentials({ user: response.data, token }));
          websocketService.connect();
        }
      } catch (error) {
        dispatch(setError('Kimlik doğrulama hatası'));
        localStorage.removeItem('token');
      } finally {
        dispatch(setLoading(false));
      }
    };

    initAuth();
  }, [dispatch]);

  const login = async (telegramData: any) => {
    try {
      dispatch(setLoading(true));
      
      // Test modunda ise giriş yap
      if (getTestMode()) {
        const testUser = telegramData.user || {
          id: 'test-user',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          photo_url: 'https://i.pravatar.cc/150?img=3'
        };
        const testToken = telegramData.token || 'test-token';
        dispatch(setCredentials({ user: testUser, token: testToken }));
        return true;
      }
      
      const response = await api.post('/auth/telegram', telegramData);
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      dispatch(setCredentials({ user, token }));
      websocketService.connect();
      
      return true;
    } catch (error) {
      dispatch(setError('Giriş yapılırken hata oluştu'));
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'auth/logout' });
    if (!getTestMode()) {
      websocketService.disconnect();
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}; 