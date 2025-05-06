import React from 'react';
import SSEExample from '../components/SSEExample';

/**
 * SSE Client rehberi için demo sayfası
 */
const SSEClientDemo: React.FC = () => {
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-2">SSE Client Rehberi Demo</h1>
      <p className="text-gray-600 mb-4">
        Bu sayfa, SSE Client rehberinde belirtilen API'yi kullanma örneğini göstermektedir.
      </p>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <h2 className="font-bold">SSE (Server-Sent Events) Nedir?</h2>
        <p className="mt-1">
          SSE, WebSocket'e alternatif olarak, sunucudan istemciye tek yönlü veri akışı sağlayan bir protokoldür.
          Gerçek zamanlı bildirimler, durum güncellemeleri ve canlı veri akışı için kullanılır.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SSEExample />
        </div>
        
        <div>
          <div className="p-4 border rounded-lg shadow-md bg-white">
            <h2 className="text-xl font-bold mb-4">Kod Örneği</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
{`// SSE istemcisini import et
import { sseClient } from './services/SSEClient';

// Bağlantıyı başlat
sseClient.connect()
  .then(() => console.log("Bağlantı başarılı"))
  .catch(err => console.error("Bağlantı hatası:", err));

// Genel mesajları dinle
sseClient.on('message', (data) => {
  console.log('Mesaj alındı:', data);
});

// Broadcast mesajlarını dinle
sseClient.on('broadcast', (data) => {
  console.log('Broadcast:', data);
});

// Bağlantı durumu değişikliklerini dinle
sseClient.onConnectionState('open', () => {
  console.log('Bağlantı açıldı');
});

// Konuya abone ol
sseClient.subscribeTopic('notifications')
  .then(result => console.log('Abone olundu'));

// Konuya özgü mesajları dinle
sseClient.onTopic('notifications', (data) => {
  console.log('Bildirim:', data);
});

// Broadcast mesajı gönder
sseClient.broadcast({ text: "Merhaba dünya!" });

// Konuya mesaj gönder
sseClient.publishToTopic('notifications', {
  text: "Yeni bildirim!",
  priority: "high"
});`}
            </pre>
          </div>
          
          <div className="p-4 border rounded-lg shadow-md bg-white mt-4">
            <h2 className="text-xl font-bold mb-4">API</h2>
            <ul className="space-y-2 text-sm">
              <li><code className="bg-gray-200 px-1">connect()</code> - Bağlantıyı başlatır</li>
              <li><code className="bg-gray-200 px-1">disconnect()</code> - Bağlantıyı kapatır</li>
              <li><code className="bg-gray-200 px-1">on(type, handler)</code> - Mesaj dinler</li>
              <li><code className="bg-gray-200 px-1">onTopic(topic, handler)</code> - Konu dinler</li>
              <li><code className="bg-gray-200 px-1">onConnectionState(state, handler)</code> - Durum değişikliği dinler</li>
              <li><code className="bg-gray-200 px-1">subscribeTopic(topic)</code> - Konuya abone olur</li>
              <li><code className="bg-gray-200 px-1">unsubscribeTopic(topic)</code> - Aboneliği kaldırır</li>
              <li><code className="bg-gray-200 px-1">broadcast(data, options)</code> - Tüm istemcilere mesaj gönderir</li>
              <li><code className="bg-gray-200 px-1">publishToTopic(topic, data, options)</code> - Konuya mesaj gönderir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSEClientDemo; 