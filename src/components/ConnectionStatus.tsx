import React from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { iCarbonConnection, iCarbonDisconnect } from 'unocss/preset-icons';

const ConnectionStatus: React.FC = () => {
  const { isConnected, error } = useWebSocketContext();

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 p-2 bg-dark-800 rounded-lg">
      {isConnected ? (
        <>
          <i-carbon-connection className="text-green-500" />
          <span className="text-green-500">Bağlı</span>
        </>
      ) : (
        <>
          <i-carbon-disconnect className="text-red-500" />
          <span className="text-red-500">
            {error ? 'Bağlantı Hatası' : 'Bağlantı Kesildi'}
          </span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus; 