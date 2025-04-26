import { create, StateCreator } from 'zustand';

interface OfflineState {
  isOffline: boolean;
  pendingChanges: Array<{
    type: string;
    data: any;
    timestamp: number;
  }>;
  syncChanges: () => Promise<void>;
  addPendingChange: (change: { type: string; data: any }) => void;
  clearPendingChanges: () => void;
}

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOffline: false,
  pendingChanges: [],
  
  syncChanges: async () => {
    const { pendingChanges } = get();
    try {
      // Bekleyen değişiklikleri senkronize et
      for (const change of pendingChanges) {
        // API çağrısı yap
        console.log('Senkronize ediliyor:', change);
      }
      
      // Başarılı senkronizasyondan sonra bekleyen değişiklikleri temizle
      set({ pendingChanges: [] });
    } catch (error) {
      console.error('Senkronizasyon hatası:', error);
    }
  },
  
  addPendingChange: (change: { type: string; data: any }) => {
    set((state: OfflineState) => ({
      pendingChanges: [...state.pendingChanges, { ...change, timestamp: Date.now() }]
    }));
  },
  
  clearPendingChanges: () => {
    set({ pendingChanges: [] });
  }
})); 