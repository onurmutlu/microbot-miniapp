import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import { websocketService } from '../../services/websocket';

// Kullanıcı tipi
export interface User {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  [key: string]: any; // Ekstra alanlar için
}

// Kimlik doğrulama state'i
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  lastRefresh: number | null;
}

// Başlangıç durumu
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  lastRefresh: null
};

// Backend'den kimlik doğrulama (klasik giriş için)
export const login = createAsyncThunk<
  { user: User; token: string },
  { username: string; password: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await apiService.post<{ user: User; token: string }>(
      '/auth/login', 
      credentials
    );
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Giriş işlemi başarısız oldu'
    );
  }
});

// Telegram kimlik doğrulama
export const telegramLogin = createAsyncThunk<
  { user: User; token: string },
  { user?: any; initData?: string }
>('auth/telegramLogin', async (telegramData, { rejectWithValue }) => {
  try {
    const response = await apiService.post<{ user: User; token: string }>(
      '/auth/telegram', 
      telegramData
    );
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Telegram ile giriş başarısız oldu'
    );
  }
});

// Kullanıcı bilgilerini al
export const fetchUserProfile = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>('auth/fetchProfile', async (_, { rejectWithValue, getState }) => {
  try {
    const response = await apiService.get<User>('/auth/me');
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Kullanıcı bilgileri alınamadı'
    );
  }
});

// Çıkış yap
export const logout = createAsyncThunk(
  'auth/logout', 
  async (_, { rejectWithValue }) => {
    try {
      // Backend'e çıkış isteği gönder (opsiyonel)
      await apiService.post('/auth/logout');
      
      // WebSocket bağlantısını kapat
      websocketService.disconnect();
      
      // LocalStorage'deki verileri temizle
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('telegram_user');
      
      return true;
    } catch (error) {
      // Hata olsa bile çıkış yapılmış sayılır
      console.error('Çıkış yaparken hata:', error);
      return true;
    }
  }
);

// Auth Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Kimlik bilgilerini ayarla
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
      state.lastRefresh = Date.now();
      
      // API servisi için token ayarla
      apiService.setToken(action.payload.token);
    },
    
    // Yükleme durumunu değiştir
    setLoading: (state, action: PayloadAction<boolean>) => { 
      state.isLoading = action.payload; 
    },
    
    // Hata mesajını ayarla
    setError: (state, action: PayloadAction<string>) => { 
      state.error = action.payload; 
    },
    
    // Hata mesajını temizle
    clearError: (state) => { 
      state.error = null; 
    },
    
    // Kullanıcı bilgilerini güncelle
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    // Token'ı yenile
    refreshToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.lastRefresh = Date.now();
      
      // API servisi için token güncelle
      apiService.setToken(action.payload);
    }
  },
  extraReducers: (builder) => {
    // Klasik giriş işlemi
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.lastRefresh = Date.now();
        
        // API servisi için token ayarla
        apiService.setToken(action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Giriş başarısız';
      })
    
    // Telegram Giriş işlemi  
    builder
      .addCase(telegramLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(telegramLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.lastRefresh = Date.now();
        
        // API servisi için token ayarla
        apiService.setToken(action.payload.token);
      })
      .addCase(telegramLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Telegram ile giriş başarısız';
      })
    
    // Kullanıcı bilgilerini al
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    
    // Çıkış işlemi
    builder
      .addCase(logout.fulfilled, (state) => {
        // State'i sıfırla
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.lastRefresh = null;
        state.error = null;
        
        // API servisi token'ı temizle
        apiService.clearToken();
      });
  },
});

// Actions
export const { 
  setCredentials, 
  setLoading, 
  setError, 
  clearError, 
  updateUser, 
  refreshToken 
} = authSlice.actions;

// Reducer
export default authSlice.reducer; 