import React, { useState, useEffect, useRef } from 'react';
import { useLogManager } from '../../hooks/useLogManager';
import { LogEntry, LogLevel } from '../../services/logService';

// Log panel bileşeni
const LogPanel: React.FC = () => {
  const {
    logs,
    filter,
    isPanelVisible,
    clearAllLogs,
    closeLogPanel,
    setLevels,
    setCategories,
    setSearch,
    getAvailableCategories
  } = useLogManager();

  const [searchInput, setSearchInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const availableCategories = getAvailableCategories();

  // Log seviyeleri ve renkleri
  const logLevelColors: Record<LogLevel, string> = {
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    debug: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  // Otomatik kaydırma
  useEffect(() => {
    if (autoScroll && logContainerRef.current && isPanelVisible) {
      const { scrollHeight, clientHeight } = logContainerRef.current;
      logContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [logs, isPanelVisible, autoScroll]);

  // Arama filtresini uygula
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Log seviyesi filtresini değiştir
  const handleLevelFilterChange = (level: LogLevel) => {
    const updatedLevels = filter.levels.includes(level)
      ? filter.levels.filter(l => l !== level)
      : [...filter.levels, level];
    setLevels(updatedLevels);
  };

  // Kategori filtresini değiştir
  const handleCategoryFilterChange = (category: string) => {
    const updatedCategories = filter.categories.includes(category)
      ? filter.categories.filter(c => c !== category)
      : [...filter.categories, category];
    setCategories(updatedCategories);
  };

  // JSON olarak indir
  const handleDownloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileName = `logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  // Panel görünmüyorsa null döndür
  if (!isPanelVisible) {
    return null;
  }

  // Log girişini formatlayan yardımcı fonksiyon
  const renderLogEntry = (log: LogEntry) => {
    const time = new Date(log.timestamp).toLocaleTimeString();
    const levelClass = logLevelColors[log.level] || '';
    
    return (
      <div 
        key={log.id}
        className="py-2 px-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">{time}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${levelClass} mr-2`}>
            {log.level.toUpperCase()}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{log.category}</span>
        </div>
        <div className="text-sm text-gray-800 dark:text-gray-200">{log.message}</div>
        {log.data && (
          <div 
            className="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32"
          >
            <pre>{typeof log.data === 'object' ? JSON.stringify(log.data, null, 2) : String(log.data)}</pre>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 transition-transform duration-300 ease-in-out h-[70vh] flex flex-col">
      {/* Panel başlığı */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <div className="flex items-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Log Paneli</h3>
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{logs.length} kayıt</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={clearAllLogs}
            className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded-md"
          >
            Temizle
          </button>
          <button
            onClick={handleDownloadLogs}
            className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            JSON İndir
          </button>
          <button
            onClick={closeLogPanel}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Arama filtresi */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Ara..."
                value={searchInput}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Log seviyesi filtreleri */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(logLevelColors).map((level) => (
              <button
                key={level}
                onClick={() => handleLevelFilterChange(level as LogLevel)}
                className={`px-2 py-1 text-xs rounded-md ${
                  filter.levels.includes(level as LogLevel)
                    ? logLevelColors[level as LogLevel]
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {level.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Otomatik kaydırma */}
          <div className="flex items-center">
            <input
              id="auto-scroll"
              type="checkbox"
              checked={autoScroll}
              onChange={() => setAutoScroll(!autoScroll)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor="auto-scroll"
              className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Otomatik Kaydırma
            </label>
          </div>
        </div>

        {/* Kategori filtreleri - çok kategori varsa sarmalı olarak göster */}
        {availableCategories.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1 max-h-20 overflow-y-auto">
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Kategoriler:</span>
            {availableCategories.map(category => (
              <button
                key={category}
                onClick={() => handleCategoryFilterChange(category)}
                className={`px-2 py-0.5 text-xs rounded-md ${
                  filter.categories.length === 0 || filter.categories.includes(category)
                    ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Log listesi */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-900"
      >
        {logs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Henüz log kaydı yok
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map(renderLogEntry)}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPanel; 