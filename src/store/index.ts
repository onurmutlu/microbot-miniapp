import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import logReducer from './slices/logSlice';
import { apiService } from '../services/api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    logs: logReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: { apiService },
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 