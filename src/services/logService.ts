import { toast } from 'react-toastify';

export type LogLevel = 'info' | 'debug' | 'warn' | 'error' | 'success';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  source?: string;
}

// Log verilerini saklayacak array
const logs: LogEntry[] = [];
const MAX_LOGS = 1000; // Maksimum log sayısı

// Log olayları için dinleyiciler
type LogListener = (log: LogEntry) => void;
const listeners: LogListener[] = [];

/**
 * Log servisi - uygulama genelinde loglama işlemleri için
 */
class LogService {
  /**
   * Yeni bir log kaydı oluşturur
   */
  private createLog(level: LogLevel, category: string, message: string, data?: any, showToast = false): LogEntry {
    const timestamp = Date.now();
    const id = `log_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Çağrı kaynağını bulmaya çalış
    let source = 'unknown';
    try {
      const stackLines = new Error().stack?.split('\n');
      if (stackLines && stackLines.length > 3) {
        // Örneğin: "at LogService.debug (http://localhost:5173/src/services/logService.ts:35:15)"
        const callerLine = stackLines[3];
        const match = callerLine.match(/at\s+(.*)\s+\(/);
        source = match ? match[1] : callerLine.trim();
      }
    } catch (e) {
      // Kaynak bilgisini alamadık, sessizce devam et
    }
    
    const log: LogEntry = {
      id,
      timestamp,
      level,
      category,
      message,
      data,
      source
    };
    
    // Log'u sakla
    logs.push(log);
    
    // Maksimum log sayısını aşıyorsa en eski log'u sil
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    // Toast gösterimi
    if (showToast) {
      switch (level) {
        case 'info':
          toast.info(`${category}: ${message}`);
          break;
        case 'warn':
          toast.warning(`${category}: ${message}`);
          break;
        case 'error':
          toast.error(`${category}: ${message}`);
          break;
        case 'success':
          toast.success(`${category}: ${message}`);
          break;
        case 'debug':
          if (process.env.NODE_ENV === 'development') {
            toast.info(`DEBUG | ${category}: ${message}`);
          }
          break;
      }
    }
    
    // Dinleyicilere bildir
    listeners.forEach(listener => listener(log));
    
    // Konsola yazdır
    this.writeToConsole(log);
    
    return log;
  }
  
  /**
   * Konsola log yazar
   */
  private writeToConsole(log: LogEntry): void {
    const formattedTime = new Date(log.timestamp).toLocaleTimeString();
    const logPrefix = `[${formattedTime}] [${log.level.toUpperCase()}] [${log.category}]`;
    
    switch (log.level) {
      case 'info':
        console.info(logPrefix, log.message, log.data || '');
        break;
      case 'warn':
        console.warn(logPrefix, log.message, log.data || '');
        break;
      case 'error':
        console.error(logPrefix, log.message, log.data || '');
        break;
      case 'debug':
        console.debug(logPrefix, log.message, log.data || '');
        break;
      case 'success':
        console.log(`%c${logPrefix} ${log.message}`, 'color: green', log.data || '');
        break;
    }
  }
  
  /**
   * Log dinleyicisi ekler
   */
  addListener(listener: LogListener): () => void {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Tüm logları temizler
   */
  clearLogs(): void {
    logs.length = 0;
  }
  
  /**
   * Tüm logları döndürür
   */
  getLogs(): LogEntry[] {
    return [...logs];
  }
  
  /**
   * Filtreli logları döndürür
   */
  getFilteredLogs(options?: {
    level?: LogLevel[];
    category?: string[];
    search?: string;
    startTime?: number;
    endTime?: number;
  }): LogEntry[] {
    if (!options) return [...logs];
    
    return logs.filter(log => {
      // Seviye filtresi
      if (options.level && options.level.length > 0 && !options.level.includes(log.level)) {
        return false;
      }
      
      // Kategori filtresi
      if (options.category && options.category.length > 0 && !options.category.includes(log.category)) {
        return false;
      }
      
      // Arama filtresi
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        const messageLower = log.message.toLowerCase();
        const categoryLower = log.category.toLowerCase();
        
        if (!messageLower.includes(searchLower) && !categoryLower.includes(searchLower)) {
          return false;
        }
      }
      
      // Zaman aralığı filtresi
      if (options.startTime && log.timestamp < options.startTime) {
        return false;
      }
      
      if (options.endTime && log.timestamp > options.endTime) {
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Bilgi seviyesinde log oluşturur
   */
  info(category: string, message: string, data?: any, showToast = false): LogEntry {
    return this.createLog('info', category, message, data, showToast);
  }
  
  /**
   * Hata seviyesinde log oluşturur
   */
  error(category: string, message: string, data?: any, showToast = true): LogEntry {
    return this.createLog('error', category, message, data, showToast);
  }
  
  /**
   * Uyarı seviyesinde log oluşturur
   */
  warn(category: string, message: string, data?: any, showToast = false): LogEntry {
    return this.createLog('warn', category, message, data, showToast);
  }
  
  /**
   * Debug seviyesinde log oluşturur
   */
  debug(category: string, message: string, data?: any, showToast = false): LogEntry {
    return this.createLog('debug', category, message, data, showToast);
  }
  
  /**
   * Başarı seviyesinde log oluşturur
   */
  success(category: string, message: string, data?: any, showToast = true): LogEntry {
    return this.createLog('success', category, message, data, showToast);
  }
}

// Servis örneği
export const logService = new LogService();

// Orijinal console metodlarını yedekle
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// Console metodlarını override et (opsiyonel)
export const initConsoleOverride = () => {
  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    logService.info('Console', args[0], args.slice(1));
  };
  
  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    logService.info('Console', args[0], args.slice(1));
  };
  
  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    logService.warn('Console', args[0], args.slice(1));
  };
  
  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    logService.error('Console', args[0], args.slice(1));
  };
  
  console.debug = (...args: any[]) => {
    originalConsole.debug(...args);
    logService.debug('Console', args[0], args.slice(1));
  };
};

// Console override'ı geri al
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
};

export default logService; 