import React, { useEffect, useState } from "react";
import { SignalIcon, ExclamationTriangleIcon, SignalSlashIcon, ArrowPathIcon } from "@heroicons/react/24/solid";
import webSocketClient from "../../services/WebSocketClient";
import { Tooltip } from "react-tooltip";

const WebSocketStatusIndicator = ({
  showDetails = false,
  className = "",
  showTooltip = true
}) => {
  const [status, setStatus] = useState(webSocketClient.isConnected ? "connected" : "disconnected");
  const [lastError, setLastError] = useState<Error | null>(null);
  
  useEffect(() => {
    // WebSocket durumunu izle
    const unsubscribe = webSocketClient.onStateChange((newState) => {
      setStatus(newState.isConnected ? "connected" : newState.isConnecting ? "connecting" : "disconnected");
      setLastError(newState.error);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  const getStatusDetails = () => {
    switch (status) {
      case "connected":
        return "WebSocket bağlantısı aktif";
      case "connecting":
        return "WebSocket bağlantısı kuruluyor...";
      case "disconnected":
        return lastError 
          ? `WebSocket bağlantısı kesildi: ${lastError.message}` 
          : "WebSocket bağlantısı kapalı";
      default:
        return "WebSocket durumu bilinmiyor";
    }
  };
  
  const renderIcon = () => {
    switch (status) {
      case "connected":
        return <SignalIcon className="h-5 w-5 text-green-500" />;
      case "connecting":
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case "disconnected":
        return lastError 
          ? <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          : <SignalSlashIcon className="h-5 w-5 text-gray-500" />;
      default:
        return null;
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      <div 
        className="relative cursor-help"
        data-tooltip-id="ws-status-tooltip"
        data-tooltip-content={getStatusDetails()}
      >
        {renderIcon()}
        {showDetails && (
          <span className="ml-2 text-sm hidden sm:inline-block">
            {getStatusDetails()}
          </span>
        )}
      </div>
      
      {showTooltip && (
        <Tooltip id="ws-status-tooltip" place="bottom" className="z-50" />
      )}
    </div>
  );
};

export default WebSocketStatusIndicator; 