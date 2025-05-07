import React, { useState } from 'react';

const CyberpunkUI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [messages, setMessages] = useState<{ id: number; text: string; sender: 'user' | 'bot' }[]>([
    { id: 1, text: 'Merhaba, ben bir yapay zeka asistanıyım', sender: 'bot' },
    { id: 2, text: 'Size nasıl yardımcı olabilirim?', sender: 'bot' },
  ]);
  const [inputValue, setInputValue] = useState<string>('');

  const handleSend = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { id: Date.now(), text: inputValue, sender: 'user' }]);
      setInputValue('');
      
      // Bot cevabını simüle et
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          text: 'Bu bir yapay zeka cevabıdır. Gerçek bir AI bağlantısı mevcut değil.', 
          sender: 'bot' 
        }]);
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="cyber-container min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-cyber bg-gradient-to-r from-cyber-neon-purple to-cyber-neon-blue flex items-center justify-center animate-cyber-breath">
            <div className="i-carbon-bot text-white" />
          </div>
          <h1 className="cyber-title text-xl md:text-2xl">MicroBot</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="cyber-btn-primary text-sm py-1.5 px-3">
            <div className="i-carbon-user-avatar mr-1" /> Profil
          </button>
          <button className="cyber-btn-accent text-sm py-1.5 px-3">
            <div className="i-carbon-settings mr-1" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="cyber-card p-4">
            <div className="flex flex-col gap-2">
              <button 
                className={`text-left p-3 rounded-cyber transition-all ${activeTab === 'dashboard' 
                  ? 'bg-cyber-neon-purple bg-opacity-20 neon-border-purple' 
                  : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <div className="flex items-center">
                  <div className="i-carbon-dashboard mr-2 text-cyber-neon-cyan" />
                  <span>Gösterge Paneli</span>
                </div>
              </button>
              <button 
                className={`text-left p-3 rounded-cyber transition-all ${activeTab === 'chat' 
                  ? 'bg-cyber-neon-purple bg-opacity-20 neon-border-purple' 
                  : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setActiveTab('chat')}
              >
                <div className="flex items-center">
                  <div className="i-carbon-chat mr-2 text-cyber-neon-magenta" />
                  <span>Sohbet</span>
                </div>
              </button>
              <button 
                className={`text-left p-3 rounded-cyber transition-all ${activeTab === 'connections' 
                  ? 'bg-cyber-neon-purple bg-opacity-20 neon-border-purple' 
                  : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setActiveTab('connections')}
              >
                <div className="flex items-center">
                  <div className="i-carbon-network-4 mr-2 text-cyber-neon-lime" />
                  <span>Bağlantılar</span>
                </div>
              </button>
            </div>

            <div className="cyber-divider my-4"></div>

            <div className="p-3 rounded-cyber bg-cyber-glass-bgLight">
              <h3 className="cyber-subtitle text-sm text-cyber-neon-yellow mb-2">Sistem Durumu</h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">CPU</span>
                <div className="w-2/3 h-1.5 bg-white bg-opacity-10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-neon-cyan w-3/4 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">RAM</span>
                <div className="w-2/3 h-1.5 bg-white bg-opacity-10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyber-neon-magenta w-1/2 rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bağlantı</span>
                <span className="text-cyber-neon-lime">
                  <div className="i-carbon-checkmark-filled mr-1"></div>
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-9">
          <div className="cyber-card-lg h-[70vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="cyber-subtitle">Asistan Sohbeti</h2>
              <div className="flex gap-2">
                <button className="p-1.5 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-cyan">
                  <div className="i-carbon-restart"></div>
                </button>
                <button className="p-1.5 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-magenta">
                  <div className="i-carbon-star"></div>
                </button>
                <button className="p-1.5 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-yellow">
                  <div className="i-carbon-export"></div>
                </button>
              </div>
            </div>
            
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-4">
              {messages.map(message => (
                <div 
                  key={message.id} 
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-cyber ${message.sender === 'user' 
                      ? 'bg-cyber-neon-purple bg-opacity-20 ml-10'
                      : 'bg-cyber-glass-bgLight mr-10'}`}
                  >
                    <div className="text-sm">{message.text}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Input area */}
            <div className="mt-auto border-t border-cyber-glass-border pt-4">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <textarea 
                    className="cyber-input h-12 resize-none pr-10"
                    placeholder="Mesajınızı yazın..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <button 
                    className="absolute right-2 top-2 p-2 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-purple"
                    onClick={handleSend}
                  >
                    <div className="i-carbon-send-filled"></div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Stats Cards */}
      <div className="cyber-grid-3 mt-6 mb-6">
        <div className="cyber-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-cyber bg-cyber-neon-cyan bg-opacity-20 flex items-center justify-center">
              <div className="i-carbon-machine-learning-model text-cyber-neon-cyan text-2xl" />
            </div>
            <div>
              <h3 className="text-sm text-cyber-text text-opacity-70">Aktif Modeller</h3>
              <p className="text-xl font-bold">3 / 5</p>
            </div>
          </div>
        </div>
        <div className="cyber-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-cyber bg-cyber-neon-magenta bg-opacity-20 flex items-center justify-center">
              <div className="i-carbon-data-table text-cyber-neon-magenta text-2xl" />
            </div>
            <div>
              <h3 className="text-sm text-cyber-text text-opacity-70">Veri Noktaları</h3>
              <p className="text-xl font-bold">1.2M</p>
            </div>
          </div>
        </div>
        <div className="cyber-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-cyber bg-cyber-neon-lime bg-opacity-20 flex items-center justify-center">
              <div className="i-carbon-api text-cyber-neon-lime text-2xl" />
            </div>
            <div>
              <h3 className="text-sm text-cyber-text text-opacity-70">API Çağrıları</h3>
              <p className="text-xl font-bold">892</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-6 pb-4 text-center text-sm text-cyber-text text-opacity-60">
        <div className="cyber-divider"></div>
        <p className="mt-4">MicroBot Mini App &copy; {new Date().getFullYear()} | Cyberpunk UI</p>
      </footer>
    </div>
  );
};

export default CyberpunkUI; 