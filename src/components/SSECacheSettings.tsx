import React, { useState, useEffect } from 'react';
import sseService from '../services/sseService';
import { toast } from 'react-toastify';
import { SSECacheSettings as CacheSettings } from '../services/sseLocalCache';

interface SSECacheSettingsProps {
  onClose?: () => void;
}

const SSECacheSettings: React.FC<SSECacheSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<CacheSettings>(sseService.getCacheSettings());
  const [isModified, setIsModified] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Checkbox veya sayı değerlerini farklı şekilde al
    let newValue: any = value;
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      newValue = parseInt(value, 10);
    }
    
    setSettings(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    setIsModified(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedSettings = sseService.updateCacheSettings(settings);
      setSettings(updatedSettings);
      setIsModified(false);
      toast.success('Önbellek ayarları güncellendi');
    } catch (error) {
      console.error('Ayarları güncellerken hata:', error);
      toast.error('Ayarlar güncellenirken bir hata oluştu');
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Tüm önbelleği temizlemek istediğinizden emin misiniz?')) {
      sseService.clearLocalData();
      toast.success('Önbellek temizlendi');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Önbellek boyutunu hesapla
  const [cacheSize, setCacheSize] = useState<number>(0);

  // Önbellek boyutunu güncelle
  useEffect(() => {
    try {
      // Tüm cache itemlerini topla
      const allItems = Object.keys(localStorage)
        .filter(key => key.startsWith('sse_cache_'))
        .map(key => ({ key, size: localStorage.getItem(key)?.length || 0 }));
      
      // Toplam boyutu hesapla
      const totalSize = allItems.reduce((sum, item) => sum + item.size, 0);
      setCacheSize(totalSize);
    } catch (error) {
      console.error('Önbellek boyutu hesaplanırken hata:', error);
    }
  }, []);

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">SSE Önbellek Ayarları</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 text-sm rounded border border-blue-100">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Toplam Kullanılan Alan:</span>
          <span>{formatSize(cacheSize)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-medium">Önbellekteki Mesaj Sayısı:</span>
          <span>{sseService.getStats().cachedMessages || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Son Temizlik:</span>
          <span>{formatDate(settings.lastCleanup)}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Önbellek Aktif/Pasif */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              name="enabled"
              checked={settings.enabled}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="enabled" className="ml-2 block text-sm font-medium text-gray-700">
              Önbelleği Etkinleştir
            </label>
          </div>
          
          {/* Mesaj Kaydı */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="persistMessages"
              name="persistMessages"
              checked={settings.persistMessages}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="persistMessages" className="ml-2 block text-sm font-medium text-gray-700">
              Mesajları Yerel Olarak Sakla
            </label>
          </div>
          
          {/* Abonelik Kaydı */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="persistSubscriptions"
              name="persistSubscriptions"
              checked={settings.persistSubscriptions}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="persistSubscriptions" className="ml-2 block text-sm font-medium text-gray-700">
              Abonelikleri Yerel Olarak Sakla
            </label>
          </div>
          
          {/* Maksimum Mesaj Sayısı */}
          <div>
            <label htmlFor="maxCachedMessages" className="block text-sm font-medium text-gray-700">
              Maksimum Önbelleklenecek Mesaj Sayısı
            </label>
            <input
              type="number"
              id="maxCachedMessages"
              name="maxCachedMessages"
              value={settings.maxCachedMessages}
              onChange={handleChange}
              min="10"
              max="10000"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* TTL (Yaşam Süresi) */}
          <div>
            <label htmlFor="ttl" className="block text-sm font-medium text-gray-700">
              Mesaj Önbellek Süresi (saniye, 0 = süresiz)
            </label>
            <input
              type="number"
              id="ttl"
              name="ttl"
              value={settings.ttl}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {settings.ttl ? `Mesajlar ${settings.ttl} saniye sonra önbellekten silinecek` : 'Mesajlar süresiz olarak saklanacak'}
            </p>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleClearCache}
              className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 text-sm"
            >
              Önbelleği Temizle
            </button>
            
            <button
              type="submit"
              disabled={!isModified}
              className={`py-2 px-4 rounded text-sm ${
                isModified 
                  ? 'bg-blue-500 text-white hover:bg-blue-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Ayarları Kaydet
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SSECacheSettings; 