import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LogEntry, LogLevel } from '../../services/logService';

export interface LogState {
  entries: LogEntry[];
  filter: {
    levels: LogLevel[];
    categories: string[];
    search: string;
    startTime?: number;
    endTime?: number;
  };
  showPanel: boolean;
  maxEntries: number;
}

const initialState: LogState = {
  entries: [],
  filter: {
    levels: ['info', 'debug', 'warn', 'error', 'success'],
    categories: [],
    search: '',
    startTime: undefined,
    endTime: undefined
  },
  showPanel: false,
  maxEntries: 1000
};

const logSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    addLog: (state, action: PayloadAction<LogEntry>) => {
      state.entries.push(action.payload);
      // Maksimum log sayısını aşıyorsa en eski logları sil
      if (state.entries.length > state.maxEntries) {
        state.entries = state.entries.slice(-state.maxEntries);
      }
    },
    
    clearLogs: (state) => {
      state.entries = [];
    },
    
    setLevelsFilter: (state, action: PayloadAction<LogLevel[]>) => {
      state.filter.levels = action.payload;
    },
    
    setCategoriesFilter: (state, action: PayloadAction<string[]>) => {
      state.filter.categories = action.payload;
    },
    
    setSearchFilter: (state, action: PayloadAction<string>) => {
      state.filter.search = action.payload;
    },
    
    setTimeFilter: (state, action: PayloadAction<{ startTime?: number; endTime?: number }>) => {
      state.filter.startTime = action.payload.startTime;
      state.filter.endTime = action.payload.endTime;
    },
    
    togglePanel: (state) => {
      state.showPanel = !state.showPanel;
    },
    
    showPanel: (state) => {
      state.showPanel = true;
    },
    
    hidePanel: (state) => {
      state.showPanel = false;
    },
    
    setMaxEntries: (state, action: PayloadAction<number>) => {
      state.maxEntries = action.payload;
      // Yeni maksimum değere göre logları kes
      if (state.entries.length > state.maxEntries) {
        state.entries = state.entries.slice(-state.maxEntries);
      }
    },
    
    setAllLogs: (state, action: PayloadAction<LogEntry[]>) => {
      state.entries = action.payload.slice(-state.maxEntries);
    }
  }
});

export const { 
  addLog, 
  clearLogs, 
  setLevelsFilter,
  setCategoriesFilter,
  setSearchFilter,
  setTimeFilter,
  togglePanel,
  showPanel,
  hidePanel,
  setMaxEntries,
  setAllLogs
} = logSlice.actions;

export default logSlice.reducer; 