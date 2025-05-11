import { useState, useEffect } from 'react';
import { getTestMode, setTestMode } from '../utils/testMode';

/**
 * Test modunu kontrol eden custom hook
 * @returns {Object} Test modu durumu ve işlemleri
 */
export const useTestMode = () => {
  const [isTestMode, setIsTestModeState] = useState<boolean>(getTestMode());

  // Test modunu değiştir
  const toggleTestMode = () => {
    const newState = !isTestMode;
    setTestMode(newState);
    setIsTestModeState(newState);
  };

  // Test modunu aç
  const enableTestMode = () => {
    if (!isTestMode) {
      setTestMode(true);
      setIsTestModeState(true);
    }
  };

  // Test modunu kapat
  const disableTestMode = () => {
    if (isTestMode) {
      setTestMode(false);
      setIsTestModeState(false);
    }
  };

  // localStorage'daki değişiklikleri dinle
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'test_mode') {
        setIsTestModeState(e.newValue === 'true');
      }
    };

    // Özel olayı dinle
    const handleTestModeChange = (e: CustomEvent) => {
      setIsTestModeState(e.detail.enabled);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('testModeChanged', handleTestModeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testModeChanged', handleTestModeChange as EventListener);
    };
  }, []);

  return {
    isTestMode,
    toggleTestMode,
    enableTestMode,
    disableTestMode
  };
};

export default useTestMode; 