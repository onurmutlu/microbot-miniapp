# microbot-miniapp

microbot-miniapp, Telegram botlarını yönetmek için geliştirilmiş bir Telegram Mini Uygulamasıdır. Bu uygulama ile kullanıcılar Telegram botlarını direkt olarak Telegram içerisinden yönetebilirler.

## Özellikler

- **Mesaj Şablonları Yönetimi**: Otomatik mesajları düzenleme, ekleme ve silme
- **Otomatik Yanıt Kuralları**: Anahtar kelime bazlı yanıt kuralları oluşturma
- **Grup Yönetimi**: Telegram gruplarını listeleme ve yönetme
- **Mesaj Gönderimi**: Şablonlardan seçilen mesajları gruplara toplu gönderme
- **DM Panel**: Kullanıcılara gelen özel mesajları yönetme (opsiyonel)
- **JWT Tabanlı Güvenlik**: Kullanıcı kimlik doğrulama ve API istekleri için güvenli erişim

## Teknolojiler

- **Frontend**: React, TypeScript, Vite, UnoCSS, Tailwind CSS
- **Telegram Entegrasyonu**: @twa-dev/sdk
- **API İletişimi**: Axios
- **Authentication**: JWT Token

## Kurulum

Projeyi kurmak için aşağıdaki komutları çalıştırın:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

## Sayfalar

1. **MessageTemplates**: Mesaj şablonlarını yönetme
2. **AutoReplyRules**: Otomatik yanıt kurallarını yönetme
3. **GroupList**: Telegram gruplarını yönetme
4. **MessageSend**: Toplu mesaj gönderimi yapma
5. **DMPanel**: Özel mesajları yönetme (opsiyonel)

## API Entegrasyonu

Backend API'si ile iletişim için Axios kullanılmaktadır. API endpoint'leri:

- `/api/message-templates` - Mesaj şablonları için
- `/api/auto-replies` - Otomatik yanıtlar için
- `/api/groups` - Grup yönetimi için
- `/api/messages/send` - Mesaj gönderimi için

## Katkıda Bulunma

Projeye katkıda bulunmak isterseniz, lütfen bir issue açın veya pull request gönderin.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için LICENSE dosyasına bakın.

# MicroBot WebSocket ve SSE İstemcileri

Bu proje, MicroBot backend API'sine bağlanmak için kullanılan WebSocket ve SSE (Server-Sent Events) istemcilerini içerir. Bu istemciler, gerçek zamanlı mesajlaşma, durum güncellemeleri ve bildirimler gibi özellikleri destekler.

## Kurulum

WebSocket ve SSE istemcileri proje içerisinde hazır olarak gelmektedir. Ek bir kurulum gerekmez.

## Konfigürasyon

İstemciler, aşağıdaki ortam değişkenlerini kullanır:

```
VITE_API_URL=http://localhost:8000
```

Bu değişken `.env` veya `.env.local` dosyasında tanımlanabilir.

## WebSocket Kullanımı

WebSocket istemcisi, gerçek zamanlı çift yönlü iletişim sağlar. Aşağıda temel kullanım örnekleri bulunmaktadır:

### React Hook ile Kullanım

```typescript
import { useWebSocket } from '../hooks/useWebSocket';
import { WebSocketMessageType } from '../services/WebSocketClient';

function MyComponent() {
  // WebSocket hook'unu başlat
  const ws = useWebSocket({
    autoConnect: true,
    topics: ['notifications'],
    onMessage: (message) => {
      console.log('Yeni mesaj:', message);
    },
    onConnect: () => {
      console.log('WebSocket bağlantısı kuruldu');
    },
    onDisconnect: () => {
      console.log('WebSocket bağlantısı kesildi');
    },
    onError: (error) => {
      console.error('WebSocket hatası:', error);
    }
  });

  // Mesaj gönder
  const sendMessage = () => {
    ws.sendToTopic('notifications', { text: 'Merhaba dünya!' });
  };
  
  // Broadcast mesaj gönder (tüm istemcilere)
  const sendBroadcast = () => {
    ws.broadcast({ text: 'Herkese merhaba!' });
  };
  
  // Konuya abone ol
  const subscribeToTopic = () => {
    ws.subscribe('new-topic', (data) => {
      console.log('Yeni konu mesajı:', data);
    });
  };
  
  // Bağlantıyı yönet
  const manageConnection = () => {
    if (ws.isConnected) {
      ws.disconnect();
    } else {
      ws.connect();
    }
  };

  return (
    <div>
      <div>Bağlantı durumu: {ws.isConnected ? 'Bağlı' : 'Bağlı değil'}</div>
      <button onClick={sendMessage}>Mesaj Gönder</button>
      <button onClick={sendBroadcast}>Broadcast</button>
      <button onClick={subscribeToTopic}>Konuya Abone Ol</button>
      <button onClick={manageConnection}>
        {ws.isConnected ? 'Bağlantıyı Kes' : 'Bağlan'}
      </button>
    </div>
  );
}
```

### Doğrudan İstemci Kullanımı

```typescript
import webSocketClient, { WebSocketMessageType } from '../services/WebSocketClient';

// Bağlantıyı başlat
webSocketClient.connect();

// Konuya abone ol
const unsubscribe = webSocketClient.subscribe('notifications', (data) => {
  console.log('Bildirim:', data);
});

// Mesaj gönder
webSocketClient.sendToTopic('notifications', { text: 'Merhaba' });

// Broadcast mesaj gönder
webSocketClient.broadcast({ text: 'Herkese merhaba!' });

// Durum değişikliklerini dinle
const stateListener = webSocketClient.onStateChange((state) => {
  console.log('WebSocket durumu:', state);
});

// Abonelikten çık
unsubscribe();

// Durum dinleyicisini kaldır
stateListener();

// Bağlantıyı kapat
webSocketClient.disconnect();
```

## SSE (Server-Sent Events) Kullanımı

SSE istemcisi, sunucudan istemciye tek yönlü gerçek zamanlı veri akışı sağlar.

### React Hook ile Kullanım

```typescript
import { useSSE } from '../hooks/useSSE';
import { SSEMessageType } from '../services/SSEClient';

function MyComponent() {
  // SSE hook'unu başlat
  const sse = useSSE({
    autoConnect: true,
    topics: ['notifications'],
    onMessage: (message) => {
      console.log('Yeni SSE mesajı:', message);
    },
    onConnect: (clientId) => {
      console.log('SSE bağlantısı kuruldu:', clientId);
    },
    onDisconnect: () => {
      console.log('SSE bağlantısı kesildi');
    },
    onError: (error) => {
      console.error('SSE hatası:', error);
    }
  });

  // Konuya mesaj yayınla
  const publishMessage = async () => {
    await sse.publishToTopic('notifications', { text: 'Merhaba dünya!' });
  };
  
  // Broadcast mesaj gönder
  const sendBroadcast = async () => {
    await sse.broadcast({ text: 'Herkese merhaba!' });
  };
  
  // Konuya abone ol
  const subscribeToTopic = () => {
    sse.subscribe('new-topic', (data) => {
      console.log('Yeni konu mesajı:', data);
    });
  };
  
  // Bağlantıyı yönet
  const manageConnection = () => {
    if (sse.isConnected) {
      sse.disconnect();
    } else {
      sse.connect();
    }
  };

  return (
    <div>
      <div>SSE Bağlantı durumu: {sse.isConnected ? 'Bağlı' : 'Bağlı değil'}</div>
      <div>SSE ClientID: {sse.clientId}</div>
      <button onClick={publishMessage}>Mesaj Yayınla</button>
      <button onClick={sendBroadcast}>Broadcast</button>
      <button onClick={subscribeToTopic}>Konuya Abone Ol</button>
      <button onClick={manageConnection}>
        {sse.isConnected ? 'Bağlantıyı Kes' : 'Bağlan'}
      </button>
    </div>
  );
}
```

### Doğrudan İstemci Kullanımı

```typescript
import sseClient, { SSEMessageType } from '../services/SSEClient';

// Bağlantıyı başlat
sseClient.connect();

// Konuya abone ol
const unsubscribe = sseClient.subscribe('notifications', (data) => {
  console.log('SSE bildirimi:', data);
});

// Konuya mesaj yayınla
await sseClient.publishToTopic('notifications', { text: 'Merhaba' });

// Broadcast mesaj gönder
await sseClient.broadcast({ text: 'Herkese merhaba!' });

// Durum değişikliklerini dinle
const stateListener = sseClient.onStateChange((state) => {
  console.log('SSE durumu:', state);
});

// Abonelikten çık
unsubscribe();

// Durum dinleyicisini kaldır
stateListener();

// Bağlantıyı kapat
sseClient.disconnect();
```

## Test Modu

Test modu, gerçek API bağlantısı olmadan geliştirme yapmayı sağlar. Test modunu etkinleştirmek için:

```typescript
import { setTestMode } from '../utils/testMode';

// Test modunu etkinleştir
setTestMode(true);

// veya devre dışı bırak
setTestMode(false);
```

Test modu aktifken, tüm bağlantılar ve mesajlar simüle edilir.

## En İyi Uygulamalar

1. **Abonelik Yönetimi**:
   - Component unmount olduğunda abonelikleri temizleyin
   - `useEffect` içinde abonelik oluşturun ve cleanup fonksiyonunda kaldırın

2. **Hata Yönetimi**:
   - `onError` callback'lerini her zaman tanımlayın
   - Mesaj gönderme işlemlerini try/catch bloğu içinde yapın

3. **Bağlantı Yönetimi**:
   - Mümkünse tek bir WebSocket/SSE bağlantısı kullanın
   - Uygulama genelinde istemci örneklerini paylaşın

4. **Performans**:
   - Çok sayıda konuya abone olmaktan kaçının
   - Mesaj boyutlarını küçük tutun
   - Gereksiz broadcast mesajlarından kaçının

5. **Güvenlik**:
   - Hassas bilgileri mesajlarla göndermekten kaçının
   - Kullanıcı girişlerini doğrulayın

## API Referansı

### WebSocketClient API

| Metod | Açıklama |
|------|-----------|
| `connect()` | WebSocket bağlantısını başlatır |
| `disconnect(force?)` | Bağlantıyı kapatır |
| `reconnect()` | Bağlantıyı yeniden başlatır |
| `send(type, data?, topic?)` | Mesaj gönderir |
| `sendToTopic(topic, data)` | Belirli bir konuya mesaj gönderir |
| `broadcast(data)` | Tüm bağlı istemcilere mesaj gönderir |
| `subscribe(topic, callback)` | Konuya abone olur |
| `unsubscribeAll(topic?)` | Tüm abonelikleri veya belirli bir konudaki abonelikleri iptal eder |
| `onStateChange(callback)` | Durum değişikliklerini dinler |

### SSEClient API

| Metod | Açıklama |
|------|-----------|
| `connect()` | SSE bağlantısını başlatır |
| `disconnect(force?)` | Bağlantıyı kapatır |
| `reconnect()` | Bağlantıyı yeniden başlatır |
| `subscribe(topic, callback)` | Konuya abone olur |
| `publishToTopic(topic, data)` | Konuya mesaj yayınlar |
| `broadcast(data)` | Tüm bağlı istemcilere mesaj gönderir |
| `unsubscribeAll(topic?)` | Tüm abonelikleri veya belirli bir konudaki abonelikleri iptal eder |
| `onStateChange(callback)` | Durum değişikliklerini dinler |

## Örnek Komponent

`RealtimeExample` bileşeni, hem WebSocket hem de SSE kullanımını gösteren bir örnektir. Bu bileşen, mesaj gönderme, alım, abone olma ve bağlantı yönetimi gibi temel özellikleri gösterir.

```tsx
import RealtimeExample from '../components/RealtimeExample';

function MyPage() {
  return (
    <div>
      <h1>Gerçek Zamanlı İletişim</h1>
      <RealtimeExample />
    </div>
  );
}
```

## Sorun Giderme

### Test Modu

Eğer API veya WebSocket bağlantılarında sorun yaşıyorsanız, uygulamayı test modunda çalıştırabilirsiniz. Test modu, gerçek bağlantıları kullanmadan uygulamanın çalışmasını sağlar.

Test modunu etkinleştirmek için:

1. Tarayıcı konsolunda `toggleTestMode()` komutunu çalıştırın
2. Veya ekranın sağ alt köşesindeki "Test Modu" göstergesine tıklayın

Test modu varsayılan olarak geliştirme ortamında (localhost) etkindir.

### Bağlantı Sorunları

Eğer "Yükleniyor" ekranında takılıyorsanız, şu adımları deneyin:

1. API sunucusunun çalıştığından emin olun (`http://localhost:8000`)
2. Tarayıcı konsolunda hata mesajlarını kontrol edin
3. Test modunu etkinleştirin
4. Bağlantı testlerini çalıştırın: `runConnectionTests()`

### URL Yapılandırması

API URL'ini ayarlamak için `.env` veya `.env.local` dosyasında şu değişkeni tanımlayın:

```
VITE_API_URL=http://localhost:8000
```

Backend ve frontend URL yapılandırmalarının aynı olduğundan emin olun.

## Yayına Hazırlık Durumu

### Versiyon 0.7.5 - 12 Temmuz 2024

MicroBot MiniApp şu anda **Beta** aşamasındadır. Aşağıdaki temel özellikler tamamlanmış ve kullanıma hazırdır:

✅ Telegram Mini App entegrasyonu  
✅ Mesaj şablonları yönetimi  
✅ Otomatik yanıt kuralları  
✅ Grup listesi yönetimi  
✅ Zamanlanmış mesaj gönderimi  
✅ Görsel kural oluşturucu  
✅ Gerçek zamanlı veri senkronizasyonu  
✅ Karanlık/Aydınlık tema desteği  
✅ Bağlantı durumu göstergesi  
✅ Bağlantı test mekanizmaları  
✅ Test modu desteği  

### Tamamlanması Gereken Özellikler

Production sürümüne geçmeden önce tamamlanması gereken işlemler:

⬜ Çevrimdışı mod desteği  
⬜ Performans optimizasyonları  
⬜ Çoklu dil desteği  
⬜ Production build yapılandırması  
⬜ Kapsamlı kullanıcı testleri  
⬜ Kullanıcı dokümantasyonu  

Uygulamanın güncel durumu, test ortamında kullanıma hazır ancak büyük ölçekli production kullanımı için yukarıdaki geliştirmelerin tamamlanması önerilir.