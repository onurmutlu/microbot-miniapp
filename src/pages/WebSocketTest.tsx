import React, { useState } from 'react';
import { useWebSocketContext } from '../contexts/WebSocketContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const WebSocketTest: React.FC = () => {
  const { isConnected, sendMessage } = useWebSocketContext();
  const [message, setMessage] = useState('');
  const [receivedMessages, setReceivedMessages] = useState<string[]>([]);

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessage('test', { content: message });
      setMessage('');
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>WebSocket Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 p-2 border rounded"
            placeholder="Test mesajı girin"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!isConnected}
          >
            Gönder
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Alınan Mesajlar:</h3>
          <div className="h-48 overflow-y-auto p-2 bg-gray-100 rounded">
            {receivedMessages.map((msg, index) => (
              <div key={index} className="p-2 border-b">
                {msg}
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Bağlantı Durumu: {isConnected ? 'Bağlı' : 'Bağlantı Kesik'}
        </div>
      </CardContent>
    </Card>
  );
};

export default WebSocketTest; 