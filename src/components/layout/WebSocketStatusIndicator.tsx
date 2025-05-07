import React, { useState, useEffect } from 'react';
import { SignalIcon, ExclamationTriangleIcon, SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import webSocketClient from '../../services/WebSocketClient';
import { Tooltip } from 'react-tooltip';
import { Link } from 'react-router-dom';

interface WebSocketStatusIndicatorProps {
  showDetails?: boolean;
  showTooltip?: boolean;
}

const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({ 
  showDetails = false,
  showTooltip = true 
}) => {
  const [state, setState] = useState(webSocketClient.state);
  
  useEffect(() => {
    // WebSocket state değişikliklerini dinle
    const unsubscribe = webSocketClient.onStateChange(newState => {
      setState(newState);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Bağlantı durumu için renk
  const getStatusColor = () => {
    if (state.isConnected) return 'text-green-500 dark:text-green-400';
    if (state.isConnecting) return 'text-amber-500 dark:text-amber-400';
    if (state.error) return 'text-red-500 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };
  
  // Bağlantı durumu için ikon
  const getStatusIcon = () => {
    if (state.isConnected) {
      return <SignalIcon className={`h-5 w-5 ${getStatusColor()}`} />;
    }
    
    if (state.isConnecting) {
      return <ArrowPathIcon className={`h-5 w-5 ${getStatusColor()} animate-spin`} />;
    }
    
    if (state.error) {
      return <ExclamationTriangleIcon className={`h-5 w-5 ${getStatusColor()}`} />;
    }
    
    return <SignalSlashIcon className={`h-5 w-5 ${getStatusColor()}`} />;
  };
  
  // Bağlantı durumu mesajı
  const getStatusMessage = () => {
    if (state.isConnected) return 'Bağlı';
    if (state.isConnecting) return 'Bağlanıyor...';
    if (state.error) return 'Bağlantı Hatası';
    return 'Bağlantı Kesildi';
  };
  
  // Bağlantı durumu açıklaması
  const getStatusDescription = () => {
    if (state.isConnected) {
      if (state.connectionStats.connectedSince) {
        const connectedSince = new Date(state.connectionStats.connectedSince);
        const now = new Date();
        const diffMs = now.getTime() - connectedSince.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        return `${diffMins} dakikadır bağlı`;
      }
      return 'WebSocket bağlantısı aktif';
    }
    
    if (state.isConnecting) {
      return `Yeniden bağlanıyor (${state.reconnectAttempt}. deneme)`;
    }
    
    if (state.error) {
      return `Hata: ${state.error.message}`;
    }
    
    return 'WebSocket bağlantısı kesildi';
  };
  
  // Gecikme bilgisi için renk
  const getLatencyColor = () => {
    const latency = state.connectionStats.lastLatency;
    if (!latency) return 'text-gray-500 dark:text-gray-400';
    
    if (latency < 100) return 'text-green-500 dark:text-green-400';
    if (latency < 300) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };
  
  return (
    <>
      <div 
        className={`flex items-center ${showDetails ? 'space-x-2' : ''}`}
        data-tooltip-id="ws-status-tooltip"
        data-tooltip-content={getStatusDescription()}
      >
        {getStatusIcon()}
        
        {showDetails && (
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
            
            {state.isConnected && state.connectionStats.lastLatency && (
              <span className={`text-xs ${getLatencyColor()}`}>
                {state.connectionStats.lastLatency}ms
              </span>
            )}
          </div>
        )}
      </div>
      
      {showTooltip && (
        <Tooltip id="ws-status-tooltip" place="bottom" className="z-50" />
      )}
    </>
  );
};

export default WebSocketStatusIndicator; 