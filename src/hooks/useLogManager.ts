import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logService, LogEntry, LogLevel } from '../services/logService';
import { 
  addLog, 
  clearLogs, 
  setLevelsFilter, 
  setCategoriesFilter,
  setSearchFilter,
  setTimeFilter,
  togglePanel,
  showPanel,
  hidePanel
} from '../store/slices/logSlice';
import { RootState } from '../store';

export const useLogManager = () => {
  const dispatch = useDispatch();
  const unsubRef = useRef<(() => void) | null>(null);
  const { entries, filter, showPanel: isPanelVisible } = useSelector((state: RootState) => state.logs);

  // Log servisi ile Redux store'u senkronize etmek için listener
  useEffect(() => {
    if (!unsubRef.current) {
      // Log servisinden gelen her log'u Redux'a ekle
      unsubRef.current = logService.addListener((log) => {
        dispatch(addLog(log));
      });
    }

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [dispatch]);

  // Filtreler uygulanarak logları al
  const getFilteredLogs = (): LogEntry[] => {
    return entries.filter(log => {
      // Seviye filtresi
      if (filter.levels.length > 0 && !filter.levels.includes(log.level)) {
        return false;
      }
      
      // Kategori filtresi
      if (filter.categories.length > 0 && !filter.categories.includes(log.category)) {
        return false;
      }
      
      // Arama filtresi
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const messageLower = log.message.toLowerCase();
        const categoryLower = log.category.toLowerCase();
        
        if (!messageLower.includes(searchLower) && !categoryLower.includes(searchLower)) {
          return false;
        }
      }
      
      // Zaman aralığı filtresi
      if (filter.startTime && log.timestamp < filter.startTime) {
        return false;
      }
      
      if (filter.endTime && log.timestamp > filter.endTime) {
        return false;
      }
      
      return true;
    });
  };

  // Log oluşturma fonksiyonları
  const info = (category: string, message: string, data?: any, showToast = false): void => {
    logService.info(category, message, data, showToast);
  };

  const debug = (category: string, message: string, data?: any, showToast = false): void => {
    logService.debug(category, message, data, showToast);
  };

  const warn = (category: string, message: string, data?: any, showToast = false): void => {
    logService.warn(category, message, data, showToast);
  };

  const error = (category: string, message: string, data?: any, showToast = true): void => {
    logService.error(category, message, data, showToast);
  };

  const success = (category: string, message: string, data?: any, showToast = true): void => {
    logService.success(category, message, data, showToast);
  };

  // Log filtreleme ve panel kontrolleri
  const setLevels = (levels: LogLevel[]): void => {
    dispatch(setLevelsFilter(levels));
  };

  const setCategories = (categories: string[]): void => {
    dispatch(setCategoriesFilter(categories));
  };

  const setSearch = (search: string): void => {
    dispatch(setSearchFilter(search));
  };

  const setTimeRange = (startTime?: number, endTime?: number): void => {
    dispatch(setTimeFilter({ startTime, endTime }));
  };

  // Tüm logları temizle
  const clearAllLogs = (): void => {
    logService.clearLogs();
    dispatch(clearLogs());
  };

  // Panel görünürlüğünü kontrol et
  const toggleLogPanel = (): void => {
    dispatch(togglePanel());
  };

  const openLogPanel = (): void => {
    dispatch(showPanel());
  };

  const closeLogPanel = (): void => {
    dispatch(hidePanel());
  };

  // Tüm kategori ve seviyelerin listesi
  const getAvailableCategories = (): string[] => {
    const categoriesSet = new Set<string>();
    entries.forEach(log => categoriesSet.add(log.category));
    return Array.from(categoriesSet);
  };

  return {
    logs: getFilteredLogs(),
    allLogs: entries,
    isPanelVisible,
    filter,
    info,
    debug,
    warn,
    error,
    success,
    clearAllLogs,
    toggleLogPanel,
    openLogPanel,
    closeLogPanel,
    setLevels,
    setCategories,
    setSearch,
    setTimeRange,
    getAvailableCategories
  };
}; 