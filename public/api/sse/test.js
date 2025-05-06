// SSE Test Betiği
// Bu betik SSE servisinin uzun süreli testleri için kullanılabilir
// Konsola kopyalayıp çalıştırılabilir

const runSSEStressTest = () => {
  const clientId = Math.random().toString(36).substring(2, 15);
  const sseUrl = `${window.location.origin}/api/sse/${clientId}`;
  console.log(`SSE Stress Test başlatılıyor: ${sseUrl}`);
  
  // Test istatistikleri
  const stats = {
    connections: 0,
    disconnections: 0,
    errors: 0,
    messages: 0,
    startTime: Date.now()
  };
  
  // EventSource bağlantısı
  let eventSource = null;
  let reconnectInterval = null;
  
  const connect = () => {
    if (eventSource) {
      eventSource.close();
    }
    
    try {
      console.log('SSE bağlantısı deneniyor...');
      eventSource = new EventSource(sseUrl);
      
      eventSource.onopen = () => {
        stats.connections++;
        console.log(`SSE bağlantısı başarılı (Toplam: ${stats.connections})`);
      };
      
      eventSource.onmessage = (event) => {
        stats.messages++;
        if (stats.messages % 100 === 0) {
          console.log(`${stats.messages} mesaj alındı`);
        }
      };
      
      eventSource.onerror = (error) => {
        stats.errors++;
        console.error(`SSE bağlantı hatası (Toplam: ${stats.errors})`, error);
        eventSource.close();
        eventSource = null;
        
        // Yeniden bağlanma
        if (!reconnectInterval) {
          reconnectInterval = setTimeout(() => {
            reconnectInterval = null;
            connect();
          }, 5000);
        }
      };
      
      // Özel mesaj türlerini dinleme
      ['broadcast', 'topic_message', 'ping', 'system', 'notification'].forEach(messageType => {
        eventSource.addEventListener(messageType, (event) => {
          stats.messages++;
        });
      });
    } catch (error) {
      stats.errors++;
      console.error('SSE bağlantı oluşturma hatası:', error);
    }
  };
  
  // Bağlantıyı kapat
  const disconnect = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      stats.disconnections++;
      console.log(`SSE bağlantısı kapatıldı (Toplam: ${stats.disconnections})`);
    }
    
    if (reconnectInterval) {
      clearTimeout(reconnectInterval);
      reconnectInterval = null;
    }
  };
  
  // Rastgele bağlantı kesintileri oluştur
  const simulateRandomDisconnections = () => {
    const intervalId = setInterval(() => {
      // %20 olasılıkla bağlantıyı kes
      if (Math.random() < 0.2 && eventSource) {
        console.log('Rastgele bağlantı kesintisi simüle ediliyor...');
        disconnect();
        
        // 2-5 saniye sonra yeniden bağlan
        setTimeout(() => {
          connect();
        }, 2000 + Math.random() * 3000);
      }
    }, 10000); // Her 10 saniyede bir kontrol et
    
    return intervalId;
  };
  
  // İstatistikleri raporla
  const reportStats = () => {
    const intervalId = setInterval(() => {
      const uptime = (Date.now() - stats.startTime) / 1000;
      console.log(`
=== SSE Test İstatistikleri ===
Çalışma süresi: ${uptime.toFixed(0)} saniye
Toplam bağlantı: ${stats.connections}
Toplam kopma: ${stats.disconnections}
Toplam hata: ${stats.errors}
Toplam mesaj: ${stats.messages}
Mesaj/saniye: ${(stats.messages / uptime).toFixed(2)}
=============================
      `);
    }, 30000); // Her 30 saniyede bir rapor
    
    return intervalId;
  };
  
  // İlk bağlantıyı kur
  connect();
  
  // Rastgele kesintileri başlat
  const disconnectionSimulatorId = simulateRandomDisconnections();
  
  // İstatistik raporlarını başlat
  const statsReporterId = reportStats();
  
  // Test kontrolcüsünü döndür
  return {
    stop: () => {
      disconnect();
      clearInterval(disconnectionSimulatorId);
      clearInterval(statsReporterId);
      console.log('SSE stress testi durduruldu');
      
      // Final istatistikleri
      const uptime = (Date.now() - stats.startTime) / 1000;
      console.log(`
=== SSE Test Sonuçları ===
Toplam test süresi: ${uptime.toFixed(0)} saniye
Toplam bağlantı: ${stats.connections}
Toplam kopma: ${stats.disconnections}
Toplam hata: ${stats.errors}
Toplam mesaj: ${stats.messages}
Mesaj/saniye: ${(stats.messages / uptime).toFixed(2)}
=======================
      `);
    },
    stats: () => ({ ...stats, uptime: (Date.now() - stats.startTime) / 1000 })
  };
};

// Bunu konsola kopyalayın:
// const sseTest = runSSEStressTest();
// 
// Testi durdurmak için:
// sseTest.stop();
//
// İstatistikleri görmek için:
// sseTest.stats(); 

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  
  // SSE testi için form oluştur
  const form = document.createElement('div');
  form.innerHTML = `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Client ID:</label>
        <input id="client-id" type="text" value="client_${Math.random().toString(36).substring(2, 8)}" 
               style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">SSE URL:</label>
        <input id="sse-url" type="text" value="/api/sse/" 
               style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div id="connection-status" style="width: 12px; height: 12px; border-radius: 50%; background-color: #dc3545; margin-right: 10px;"></div>
        <span id="status-text">Bağlantı yok</span>
      </div>
      
      <div>
        <button id="connect-btn" style="padding: 8px 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; margin-right: 10px;">Bağlan</button>
        <button id="disconnect-btn" style="padding: 8px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px;" disabled>Bağlantıyı Kes</button>
      </div>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
      <h3 style="font-size: 16px; margin-bottom: 10px;">Abonelikler</h3>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Konu:</label>
        <div style="display: flex;">
          <input id="topic-input" type="text" value="notifications" 
                 style="flex-grow: 1; padding: 8px; border: 1px solid #ced4da; border-radius: 4px 0 0 4px;">
          <button id="subscribe-btn" style="padding: 8px 12px; background-color: #007bff; color: white; border: none; border-radius: 0 4px 4px 0;" disabled>Abone Ol</button>
        </div>
      </div>
      
      <div id="subscriptions-list" style="margin-top: 10px;">
        <!-- Abonelikler buraya eklenecek -->
      </div>
    </div>
    
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
      <h3 style="font-size: 16px; margin-bottom: 10px;">Alınan Mesajlar</h3>
      <div id="messages-container" style="max-height: 300px; overflow-y: auto; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; background-color: #f1f1f1; font-family: monospace;">
        <!-- Mesajlar buraya eklenecek -->
      </div>
    </div>
  `;
  root.appendChild(form);
  
  // UI elementleri
  const clientIdInput = document.getElementById('client-id');
  const sseUrlInput = document.getElementById('sse-url');
  const connectBtn = document.getElementById('connect-btn');
  const disconnectBtn = document.getElementById('disconnect-btn');
  const connectionStatus = document.getElementById('connection-status');
  const statusText = document.getElementById('status-text');
  const topicInput = document.getElementById('topic-input');
  const subscribeBtn = document.getElementById('subscribe-btn');
  const subscriptionsList = document.getElementById('subscriptions-list');
  const messagesContainer = document.getElementById('messages-container');
  
  // Durum değişkenleri
  let eventSource = null;
  let connected = false;
  let subscriptions = [];
  
  // Bağlantı kurma
  connectBtn.addEventListener('click', () => {
    const clientId = clientIdInput.value.trim();
    const sseBaseUrl = sseUrlInput.value.trim();
    
    if (!clientId) {
      addMessage('Hata: Client ID boş olamaz!', 'error');
      return;
    }
    
    try {
      // EventSource URL'i oluştur
      const url = sseBaseUrl.endsWith('/') 
        ? sseBaseUrl + clientId 
        : sseBaseUrl + '/' + clientId;
      
      // Mevcut bağlantıyı kapat
      if (eventSource) {
        eventSource.close();
      }
      
      // EventSource oluştur
      eventSource = new EventSource(url);
      
      // Bağlantı açıldığında
      eventSource.onopen = () => {
        connected = true;
        updateUIState();
        addMessage(`SSE bağlantısı başarıyla kuruldu: ${url}`, 'success');
      };
      
      // Mesaj alındığında
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(`Genel mesaj alındı: ${JSON.stringify(data)}`, 'message');
        } catch (error) {
          addMessage(`Genel mesaj alındı: ${event.data}`, 'message');
        }
      };
      
      // Özel olaylar için dinleyiciler
      eventSource.addEventListener('broadcast', (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(`Broadcast mesajı alındı: ${JSON.stringify(data)}`, 'broadcast');
        } catch (error) {
          addMessage(`Broadcast mesajı alındı: ${event.data}`, 'broadcast');
        }
      });
      
      eventSource.addEventListener('ping', (event) => {
        try {
          const data = JSON.parse(event.data);
          addMessage(`Ping alındı: ${JSON.stringify(data)}`, 'ping');
        } catch (error) {
          addMessage(`Ping alındı: ${event.data}`, 'ping');
        }
      });
      
      eventSource.addEventListener('error', (event) => {
        addMessage(`SSE bağlantı hatası: ${JSON.stringify(event)}`, 'error');
        
        if (eventSource.readyState === EventSource.CLOSED) {
          connected = false;
          updateUIState();
          addMessage('Bağlantı kapandı', 'error');
        }
      });
      
      // Abonelik dinleyicilerini ekle
      subscriptions.forEach(topic => addTopicListener(topic));
      
      // Durum güncellemesi
      connected = true;
      updateUIState();
    } catch (error) {
      addMessage(`Bağlantı hatası: ${error.message}`, 'error');
    }
  });
  
  // Bağlantıyı kesme
  disconnectBtn.addEventListener('click', () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
      connected = false;
      updateUIState();
      addMessage('SSE bağlantısı kapatıldı', 'warning');
    }
  });
  
  // Abone olma
  subscribeBtn.addEventListener('click', () => {
    const topic = topicInput.value.trim();
    
    if (!topic) {
      addMessage('Hata: Konu adı boş olamaz!', 'error');
      return;
    }
    
    if (subscriptions.includes(topic)) {
      addMessage(`Zaten "${topic}" konusuna abonesiniz!`, 'warning');
      return;
    }
    
    // Simüle edilmiş abonelik
    subscriptions.push(topic);
    
    // Abone olunan konu için dinleyici ekle
    addTopicListener(topic);
    
    // UI güncelle
    updateSubscriptionsList();
    
    addMessage(`"${topic}" konusuna abone olundu`, 'success');
  });
  
  // Konu dinleyicisi ekleme
  function addTopicListener(topic) {
    if (!eventSource) return;
    
    eventSource.addEventListener(topic, (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(`"${topic}" konusundan mesaj alındı: ${JSON.stringify(data)}`, 'topic');
      } catch (error) {
        addMessage(`"${topic}" konusundan mesaj alındı: ${event.data}`, 'topic');
      }
    });
  }
  
  // Abonelik listesini güncelleme
  function updateSubscriptionsList() {
    subscriptionsList.innerHTML = '';
    
    if (subscriptions.length === 0) {
      subscriptionsList.innerHTML = '<div style="color: #6c757d;">Henüz hiç abonelik yok</div>';
      return;
    }
    
    subscriptions.forEach(topic => {
      const topicElement = document.createElement('div');
      topicElement.style.display = 'inline-block';
      topicElement.style.backgroundColor = '#e2e3e5';
      topicElement.style.borderRadius = '4px';
      topicElement.style.padding = '5px 10px';
      topicElement.style.margin = '0 5px 5px 0';
      
      topicElement.innerHTML = `
        ${topic}
        <button class="unsubscribe-btn" data-topic="${topic}" style="background: none; border: none; color: #dc3545; cursor: pointer; margin-left: 5px;">&times;</button>
      `;
      
      subscriptionsList.appendChild(topicElement);
    });
    
    // Abonelikten çıkma butonları için olay dinleyicileri
    document.querySelectorAll('.unsubscribe-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const topic = e.target.getAttribute('data-topic');
        subscriptions = subscriptions.filter(t => t !== topic);
        updateSubscriptionsList();
        addMessage(`"${topic}" konusundan abonelik kaldırıldı`, 'warning');
      });
    });
  }
  
  // UI durumunu güncelleme
  function updateUIState() {
    if (connected) {
      connectionStatus.style.backgroundColor = '#28a745';
      statusText.textContent = 'Bağlı';
      connectBtn.disabled = true;
      disconnectBtn.disabled = false;
      subscribeBtn.disabled = false;
    } else {
      connectionStatus.style.backgroundColor = '#dc3545';
      statusText.textContent = 'Bağlantı yok';
      connectBtn.disabled = false;
      disconnectBtn.disabled = true;
      subscribeBtn.disabled = true;
    }
  }
  
  // Mesaj ekleme
  function addMessage(message, type = 'info') {
    const messageElement = document.createElement('div');
    messageElement.style.marginBottom = '5px';
    messageElement.style.padding = '5px';
    messageElement.style.borderRadius = '3px';
    
    switch (type) {
      case 'error':
        messageElement.style.backgroundColor = '#f8d7da';
        messageElement.style.color = '#721c24';
        break;
      case 'success':
        messageElement.style.backgroundColor = '#d4edda';
        messageElement.style.color = '#155724';
        break;
      case 'warning':
        messageElement.style.backgroundColor = '#fff3cd';
        messageElement.style.color = '#856404';
        break;
      case 'broadcast':
        messageElement.style.backgroundColor = '#cce5ff';
        messageElement.style.color = '#004085';
        break;
      case 'topic':
        messageElement.style.backgroundColor = '#d1ecf1';
        messageElement.style.color = '#0c5460';
        break;
      case 'ping':
        messageElement.style.backgroundColor = '#e2e3e5';
        messageElement.style.color = '#383d41';
        break;
      default:
        messageElement.style.backgroundColor = '#f8f9fa';
        messageElement.style.color = '#1b1e21';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // İlk durum güncellemesi
  updateUIState();
  updateSubscriptionsList();
  addMessage('SSE test istemcisi hazır. Bağlanmak için "Bağlan" düğmesini tıklayın.', 'info');
}); 