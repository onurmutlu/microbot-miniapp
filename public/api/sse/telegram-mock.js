// Telegram SSE Test API'si
// Bu script, Telegram Mini App SSE hizmetini simüle eder

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  
  // Ana başlık ve açıklama
  const header = document.createElement('div');
  header.innerHTML = `
    <h1 style="font-size: 24px; margin-bottom: 10px;">Telegram SSE Test API</h1>
    <p style="margin-bottom: 20px;">Bu sayfa, SSE bağlantılarını test etmek için basit bir API sağlar.</p>
  `;
  root.appendChild(header);

  // SSE durumu ve kontroller
  const controlPanel = document.createElement('div');
  controlPanel.innerHTML = `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
      <h2 style="font-size: 18px; margin-bottom: 10px;">SSE Kontrol Paneli</h2>
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <div id="status-indicator" style="width: 12px; height: 12px; border-radius: 50%; background-color: #dc3545; margin-right: 10px;"></div>
        <span id="status-text">Kapalı</span>
      </div>
      <div style="margin-bottom: 10px;">
        <button id="start-sse" style="padding: 8px 12px; background-color: #28a745; color: white; border: none; border-radius: 4px; margin-right: 10px;">SSE Başlat</button>
        <button id="stop-sse" style="padding: 8px 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; margin-right: 10px;" disabled>SSE Durdur</button>
        <button id="simulate-error" style="padding: 8px 12px; background-color: #fd7e14; color: white; border: none; border-radius: 4px;" disabled>Hata Simüle Et</button>
      </div>
    </div>
  `;
  root.appendChild(controlPanel);

  // Mesaj gönderme formu
  const messageForm = document.createElement('div');
  messageForm.innerHTML = `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
      <h2 style="font-size: 18px; margin-bottom: 10px;">Mesaj Gönder</h2>
      
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px;">Mesaj Türü:</label>
        <select id="message-type" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
          <option value="broadcast">Broadcast (tümüne)</option>
          <option value="message">Genel Mesaj</option>
          <option value="notification">Bildirim</option>
          <option value="alert">Uyarı</option>
          <option value="ping">Ping</option>
        </select>
      </div>
      
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px;">Mesaj İçeriği:</label>
        <textarea id="message-content" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; min-height: 100px;">{
  "text": "Test mesajı",
  "timestamp": "2023-08-15T12:00:00Z",
  "priority": "normal"
}</textarea>
      </div>
      
      <div>
        <button id="send-message" style="padding: 8px 12px; background-color: #007bff; color: white; border: none; border-radius: 4px;" disabled>Mesaj Gönder</button>
      </div>
    </div>
  `;
  root.appendChild(messageForm);

  // Bağlantı günlüğü
  const logSection = document.createElement('div');
  logSection.innerHTML = `
    <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f8f9fa;">
      <h2 style="font-size: 18px; margin-bottom: 10px;">SSE Günlüğü</h2>
      <div id="log-container" style="max-height: 300px; overflow-y: auto; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; background-color: #f1f1f1; font-family: monospace;">
        <!-- Günlük kayıtları buraya eklenecek -->
      </div>
    </div>
  `;
  root.appendChild(logSection);

  // Durum göstergesi ve düğmeler
  const statusIndicator = document.getElementById('status-indicator');
  const statusText = document.getElementById('status-text');
  const startButton = document.getElementById('start-sse');
  const stopButton = document.getElementById('stop-sse');
  const simulateErrorButton = document.getElementById('simulate-error');
  const sendMessageButton = document.getElementById('send-message');
  const messageType = document.getElementById('message-type');
  const messageContent = document.getElementById('message-content');
  const logContainer = document.getElementById('log-container');

  // SSE sunucusu
  let sseServer = null;
  let clients = [];
  let messageId = 1;
  let isServerRunning = false;

  // Günlük ekleme fonksiyonu
  function addLogEntry(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.style.marginBottom = '5px';
    logEntry.style.padding = '5px';
    logEntry.style.borderRadius = '3px';
    
    switch (type) {
      case 'error':
        logEntry.style.backgroundColor = '#f8d7da';
        logEntry.style.color = '#721c24';
        break;
      case 'success':
        logEntry.style.backgroundColor = '#d4edda';
        logEntry.style.color = '#155724';
        break;
      case 'warning':
        logEntry.style.backgroundColor = '#fff3cd';
        logEntry.style.color = '#856404';
        break;
      default:
        logEntry.style.backgroundColor = '#f8f9fa';
        logEntry.style.color = '#1b1e21';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `<strong>[${timestamp}]</strong> ${message}`;
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
  }

  // SSE başlatma
  function startSSE() {
    if (isServerRunning) return;
    
    try {
      // EventSource sunucusunu başlat
      const eventSource = new EventSource('/api/sse/events');
      
      eventSource.onopen = () => {
        isServerRunning = true;
        
        // UI güncellemesi
        statusIndicator.style.backgroundColor = '#28a745';
        statusText.innerText = 'Bağlı';
        startButton.disabled = true;
        stopButton.disabled = false;
        simulateErrorButton.disabled = false;
        sendMessageButton.disabled = false;
        
        addLogEntry('SSE bağlantısı başlatıldı', 'success');
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          addLogEntry(`Mesaj alındı: ${JSON.stringify(data)}`, 'info');
        } catch (error) {
          addLogEntry(`Mesaj alındı: ${event.data}`, 'info');
        }
      };
      
      eventSource.onerror = (error) => {
        addLogEntry(`SSE bağlantı hatası: ${error.type}`, 'error');
        
        if (isServerRunning) {
          isServerRunning = false;
          
          // UI güncellemesi
          statusIndicator.style.backgroundColor = '#ffc107';
          statusText.innerText = 'Bağlantı Hatası';
          
          // Yeniden bağlanmayı dene
          setTimeout(() => {
            if (!isServerRunning) {
              addLogEntry('Yeniden bağlanmaya çalışılıyor...', 'warning');
              startSSE();
            }
          }, 2000);
        }
      };
      
      // EventSource'u sakla
      sseServer = eventSource;
      
    } catch (error) {
      addLogEntry(`SSE başlatma hatası: ${error.message}`, 'error');
    }
  }

  // SSE durdurma
  function stopSSE() {
    if (!isServerRunning || !sseServer) return;
    
    try {
      sseServer.close();
      isServerRunning = false;
      
      // UI güncellemesi
      statusIndicator.style.backgroundColor = '#dc3545';
      statusText.innerText = 'Kapalı';
      startButton.disabled = false;
      stopButton.disabled = true;
      simulateErrorButton.disabled = true;
      sendMessageButton.disabled = true;
      
      addLogEntry('SSE bağlantısı kapatıldı', 'warning');
    } catch (error) {
      addLogEntry(`SSE kapatma hatası: ${error.message}`, 'error');
    }
  }

  // Hata simülasyonu
  function simulateError() {
    if (!isServerRunning) return;
    
    addLogEntry('Bağlantı hatası simüle ediliyor...', 'warning');
    
    // Sunucuya hata simülasyonu isteği gönder
    fetch('/api/sse/simulate-error', {
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Hata simülasyonu başarısız');
      }
      return response.json();
    })
    .then(data => {
      addLogEntry(`Hata simülasyonu başarılı: ${data.message}`, 'success');
    })
    .catch(error => {
      addLogEntry(`Hata simülasyonu hatası: ${error.message}`, 'error');
    });
  }

  // Mesaj gönderme
  function sendMessage() {
    if (!isServerRunning) return;
    
    const type = messageType.value;
    let content;
    
    try {
      content = JSON.parse(messageContent.value);
    } catch (error) {
      addLogEntry('Geçersiz JSON formatı', 'error');
      return;
    }
    
    // Sunucuya mesaj gönderme isteği
    fetch('/api/sse/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type,
        data: content
      })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Mesaj gönderme başarısız');
      }
      return response.json();
    })
    .then(data => {
      addLogEntry(`Mesaj gönderildi [${type}]: ${JSON.stringify(content)}`, 'success');
    })
    .catch(error => {
      addLogEntry(`Mesaj gönderme hatası: ${error.message}`, 'error');
    });
  }

  // Event listener'lar
  startButton.addEventListener('click', startSSE);
  stopButton.addEventListener('click', stopSSE);
  simulateErrorButton.addEventListener('click', simulateError);
  sendMessageButton.addEventListener('click', sendMessage);

  // İlk günlük kaydı
  addLogEntry('SSE Test API hazır. Başlatmak için "SSE Başlat" düğmesini tıklayın.', 'info');
}); 