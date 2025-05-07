import React, { useState } from 'react';

type DashboardCardProps = {
  title: string;
  icon: string;
  color: 'cyan' | 'magenta' | 'lime' | 'purple' | 'yellow';
  value?: string | number;
  trend?: number;
  children?: React.ReactNode;
};

// Performans metrik kartları
const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  icon, 
  color, 
  value, 
  trend,
  children 
}) => {
  const colorMap = {
    cyan: 'text-cyber-neon-cyan border-cyber-neon-cyan',
    magenta: 'text-cyber-neon-magenta border-cyber-neon-magenta',
    lime: 'text-cyber-neon-lime border-cyber-neon-lime',
    purple: 'text-cyber-neon-purple border-cyber-neon-purple',
    yellow: 'text-cyber-neon-yellow border-cyber-neon-yellow',
  };

  const bgColorMap = {
    cyan: 'bg-cyber-neon-cyan bg-opacity-10',
    magenta: 'bg-cyber-neon-magenta bg-opacity-10',
    lime: 'bg-cyber-neon-lime bg-opacity-10',
    purple: 'bg-cyber-neon-purple bg-opacity-10',
    yellow: 'bg-cyber-neon-yellow bg-opacity-10',
  };

  return (
    <div 
      className={`cyber-card p-4 border border-opacity-30 ${colorMap[color]} 
        transition-all duration-300 hover:scale-102 hover:shadow-[0_0_15px_rgba(var(--color-value),0.5)] 
        hover:border-opacity-70 group backdrop-blur-md bg-cyber-glass-bg relative overflow-hidden`}
      style={{ '--color-value': color === 'cyan' ? '0,255,255' : 
                              color === 'magenta' ? '255,0,255' : 
                              color === 'lime' ? '180,255,0' : 
                              color === 'purple' ? '187,0,255' : '255,223,0' } as any}
    >
      {/* Glow effect overlay */}
      <div className="absolute -top-10 -left-10 w-20 h-20 rounded-full opacity-20 blur-xl 
                    group-hover:opacity-40 group-hover:blur-2xl transition-all duration-500"
           style={{ background: color === 'cyan' ? '#00ffff' : 
                                color === 'magenta' ? '#ff00ff' : 
                                color === 'lime' ? '#b4ff00' : 
                                color === 'purple' ? '#bb00ff' : '#ffdf00' }}></div>
      
      <div className="flex items-start gap-3 mb-3 relative">
        <div className={`rounded-cyber p-2 ${bgColorMap[color]}`}>
          <div className={`${icon} text-xl ${colorMap[color]}`}></div>
        </div>
        <div>
          <h3 className="text-cyber-text text-opacity-80 text-sm font-medium">{title}</h3>
          {value && <p className="text-xl font-bold text-cyber-text">{value}</p>}
          {trend !== undefined && (
            <div className={`text-xs flex items-center mt-1 ${trend >= 0 ? 'text-cyber-neon-lime' : 'text-cyber-neon-magenta'}`}>
              <div className={trend >= 0 ? 'i-carbon-arrow-up' : 'i-carbon-arrow-down'}></div>
              <span className="ml-1">{trend >= 0 ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
      </div>
      
      {children}
    </div>
  );
};

// Ana dashboard bileşeni
const CyberpunkDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  
  return (
    <div className="min-h-screen py-6 relative">
      {/* Abstract neon background */}
      <div className="fixed inset-0 bg-cyber-darkBg z-0">
        <div className="absolute w-full h-full opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCI+CjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0ibm9uZSIgLz4KPHBhdGggZD0iTTAgNDUgTDAgNTAgTDUgNTBNNDUgNTAgTDUwIDUwIEw1MCA0NU0wIDUgTDAgMCBMNSAwTTQ1IDAgTDUwIDAgTDUwIDUiIHN0cm9rZT0iIzIyNDRjNyIgc3Ryb2tlLXdpZHRoPSIwLjUiLz4KPHBhdGggZD0iTTAgMjUgTDUwIDI1IE0yNSAwIEwyNSA1MCIgc3Ryb2tlPSIjMjI0NGM3IiBzdHJva2Utd2lkdGg9IjAuMyIgc3Ryb2tlLWRhc2hhcnJheT0iNSwyIi8+Cjwvc3ZnPg==')]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-neon-purple/5 to-cyber-neon-blue/5"></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 cyber-title">Performans Dashboard</h1>
            <p className="text-cyber-text text-opacity-60 mb-4 md:mb-0">Sistem kaynaklarını ve kullanım metriklerini izleyin</p>
          </div>
          
          <div className="flex gap-2 border border-cyber-glass-border rounded-cyber py-1 px-1 bg-cyber-glass-bg backdrop-blur-sm">
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-cyber text-sm font-medium transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-cyber-neon-purple bg-opacity-20 text-cyber-neon-purple' 
                  : 'text-cyber-text text-opacity-70 hover:bg-white hover:bg-opacity-5'
              }`}
            >
              Analytics
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-1.5 rounded-cyber text-sm font-medium transition-all ${
                activeTab === 'performance' 
                  ? 'bg-cyber-neon-cyan bg-opacity-20 text-cyber-neon-cyan' 
                  : 'text-cyber-text text-opacity-70 hover:bg-white hover:bg-opacity-5'
              }`}
            >
              Performans
            </button>
            <button 
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-1.5 rounded-cyber text-sm font-medium transition-all ${
                activeTab === 'resources' 
                  ? 'bg-cyber-neon-lime bg-opacity-20 text-cyber-neon-lime' 
                  : 'text-cyber-text text-opacity-70 hover:bg-white hover:bg-opacity-5'
              }`}
            >
              Kaynaklar
            </button>
          </div>
        </header>
        
        {/* Ana dashboard grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <DashboardCard 
            title="CPU Kullanımı" 
            icon="i-carbon-cpu" 
            color="cyan"
            value="42%" 
            trend={-3.2}
          >
            <div className="h-1.5 w-full bg-white bg-opacity-10 rounded-full mt-2">
              <div className="h-full rounded-full bg-cyber-neon-cyan w-[42%]"></div>
            </div>
          </DashboardCard>
          
          <DashboardCard 
            title="Memory Kullanımı" 
            icon="i-carbon-chip" 
            color="magenta"
            value="6.8GB / 16GB" 
            trend={2.4}
          >
            <div className="h-1.5 w-full bg-white bg-opacity-10 rounded-full mt-2">
              <div className="h-full rounded-full bg-cyber-neon-magenta w-[42%]"></div>
            </div>
          </DashboardCard>
          
          <DashboardCard 
            title="Disk I/O" 
            icon="i-carbon-data-storage" 
            color="lime"
            value="256MB/s" 
            trend={-8.3}
          >
            <div className="text-[10px] text-cyber-text text-opacity-50 mt-2 grid grid-cols-5 gap-1">
              <div className="text-center">Mon</div>
              <div className="text-center">Tue</div>
              <div className="text-center">Wed</div>
              <div className="text-center">Thu</div>
              <div className="text-center">Fri</div>
            </div>
            <div className="flex justify-between items-end h-10 mt-1">
              <div className="w-4 bg-cyber-neon-lime bg-opacity-20 h-[40%] rounded-t-sm"></div>
              <div className="w-4 bg-cyber-neon-lime bg-opacity-20 h-[60%] rounded-t-sm"></div>
              <div className="w-4 bg-cyber-neon-lime bg-opacity-20 h-[35%] rounded-t-sm"></div>
              <div className="w-4 bg-cyber-neon-lime bg-opacity-20 h-[80%] rounded-t-sm"></div>
              <div className="w-4 bg-cyber-neon-lime bg-opacity-20 h-[30%] rounded-t-sm"></div>
            </div>
          </DashboardCard>
          
          <DashboardCard 
            title="Network" 
            icon="i-carbon-network" 
            color="purple"
            value="24.2 MB/s" 
            trend={5.7}
          >
            <div className="text-[10px] text-cyber-text text-opacity-50 mt-2 grid grid-cols-2 gap-1">
              <div className="text-center">İndir</div>
              <div className="text-center">Yükle</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-1">
              <div className="flex items-center">
                <div className="i-carbon-arrow-down text-cyber-neon-cyan mr-1"></div>
                <span className="text-sm">18.5 MB/s</span>
              </div>
              <div className="flex items-center">
                <div className="i-carbon-arrow-up text-cyber-neon-magenta mr-1"></div>
                <span className="text-sm">5.7 MB/s</span>
              </div>
            </div>
          </DashboardCard>
        </div>
        
        {/* Aktivite grafiği */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="cyber-card-lg lg:col-span-2 p-4 border border-opacity-30 border-cyber-neon-blue">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-cyber-text text-opacity-80 font-medium">Sistem Aktivitesi</h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-cyan">
                  <div className="i-carbon-time"></div>
                </button>
                <button className="p-1.5 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-magenta">
                  <div className="i-carbon-download"></div>
                </button>
                <button className="p-1.5 rounded-cyber hover:bg-white hover:bg-opacity-5 text-cyber-neon-yellow">
                  <div className="i-carbon-filter"></div>
                </button>
              </div>
            </div>
            
            {/* Simüle edilmiş grafik */}
            <div className="h-60 w-full relative">
              {/* Grafik arkaplanı */}
              <div className="absolute inset-0 grid grid-cols-6 gap-0">
                {[...Array(7)].map((_, i) => (
                  <div key={`vl-${i}`} className="h-full border-l border-white border-opacity-5"></div>
                ))}
                {[...Array(6)].map((_, i) => (
                  <div key={`hl-${i}`} className="w-full border-t border-white border-opacity-5"></div>
                ))}
              </div>
              
              {/* Çizgi grafiği (CPU kullanımı) */}
              <svg className="absolute w-full h-full" viewBox="0 0 600 240" preserveAspectRatio="none">
                <path d="M0,180 C50,160 100,190 150,140 C200,90 250,120 300,100 C350,80 400,30 450,60 C500,90 550,120 600,80" 
                      stroke="#00FFFF" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M0,180 C50,160 100,190 150,140 C200,90 250,120 300,100 C350,80 400,30 450,60 C500,90 550,120 600,80" 
                      stroke="#00FFFF" strokeWidth="1" fill="url(#gradient-cyan)" strokeLinecap="round" fillOpacity="0.2" />
                
                <path d="M0,200 C50,190 100,210 150,180 C200,150 250,170 300,160 C350,150 400,100 450,140 C500,180 550,170 600,150" 
                      stroke="#FF00FF" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M0,200 C50,190 100,210 150,180 C200,150 250,170 300,160 C350,150 400,100 450,140 C500,180 550,170 600,150" 
                      stroke="#FF00FF" strokeWidth="1" fill="url(#gradient-magenta)" strokeLinecap="round" fillOpacity="0.2" />
                
                <defs>
                  <linearGradient id="gradient-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00FFFF" />
                    <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gradient-magenta" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FF00FF" />
                    <stop offset="100%" stopColor="#FF00FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Grafiğin etiketleri */}
              <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-cyber-text text-opacity-40 px-2">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span>24:00</span>
              </div>
              
              <div className="absolute top-0 right-0 flex flex-col gap-1">
                <div className="flex items-center mr-2">
                  <div className="w-3 h-1 bg-cyber-neon-cyan mr-1"></div>
                  <span className="text-[10px] text-cyber-text text-opacity-70">CPU</span>
                </div>
                <div className="flex items-center mr-2">
                  <div className="w-3 h-1 bg-cyber-neon-magenta mr-1"></div>
                  <span className="text-[10px] text-cyber-text text-opacity-70">RAM</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* En aktif işlemler */}
          <div className="cyber-card-lg p-4 border border-opacity-30 border-cyber-neon-lime">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-cyber-text text-opacity-80 font-medium">Aktif İşlemler</h2>
              <button className="p-1 text-xs bg-cyber-neon-lime bg-opacity-10 rounded-cyber px-2 text-cyber-neon-lime">
                Yenile
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'node', cpu: 12.4, mem: 420, icon: 'i-carbon-logo-nodejs', color: 'lime' },
                { name: 'chrome', cpu: 8.7, mem: 860, icon: 'i-carbon-logo-chrome', color: 'cyan' },
                { name: 'vscode', cpu: 4.2, mem: 540, icon: 'i-carbon-application', color: 'magenta' },
                { name: 'figma', cpu: 3.8, mem: 380, icon: 'i-carbon-pen', color: 'yellow' },
                { name: 'terminal', cpu: 1.2, mem: 120, icon: 'i-carbon-terminal', color: 'purple' }
              ].map((process, idx) => (
                <div key={idx} className="flex items-center py-2 border-b border-white border-opacity-5 last:border-0">
                  <div className={`p-1.5 rounded-cyber ${
                    process.color === 'cyan' ? 'text-cyber-neon-cyan bg-cyber-neon-cyan' :
                    process.color === 'magenta' ? 'text-cyber-neon-magenta bg-cyber-neon-magenta' :
                    process.color === 'lime' ? 'text-cyber-neon-lime bg-cyber-neon-lime' : 
                    process.color === 'yellow' ? 'text-cyber-neon-yellow bg-cyber-neon-yellow' :
                    'text-cyber-neon-purple bg-cyber-neon-purple'
                  } bg-opacity-10 mr-3`}>
                    <div className={process.icon}></div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-mono text-sm">{process.name}</span>
                      <span className="text-xs text-cyber-text text-opacity-60">{process.cpu}%</span>
                    </div>
                    <div className="mt-1 h-1 bg-white bg-opacity-10 rounded-full">
                      <div 
                        className={`h-full rounded-full ${
                          process.color === 'cyan' ? 'bg-cyber-neon-cyan' :
                          process.color === 'magenta' ? 'bg-cyber-neon-magenta' :
                          process.color === 'lime' ? 'bg-cyber-neon-lime' : 
                          process.color === 'yellow' ? 'bg-cyber-neon-yellow' :
                          'bg-cyber-neon-purple'
                        }`} 
                        style={{width: `${process.cpu * 3}%`}}
                      ></div>
                    </div>
                  </div>
                  <div className="ml-4 text-xs text-cyber-text text-opacity-60">
                    {process.mem} MB
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Son kısım */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Bildirimler paneli */}
          <div className="cyber-card p-4 border border-opacity-30 border-cyber-neon-yellow">
            <h2 className="text-cyber-text text-opacity-80 font-medium mb-3 flex items-center">
              <div className="i-carbon-notification mr-2 text-cyber-neon-yellow"></div>
              Bildirimler
            </h2>
            
            <div className="space-y-2 mt-2">
              {[
                { title: 'Sistem güncellemesi mevcut', time: '10 dk önce', type: 'info' },
                { title: 'Disk alanı %90 dolu', time: '25 dk önce', type: 'warning' },
                { title: 'Yedekleme tamamlandı', time: '1 saat önce', type: 'success' },
                { title: 'Güvenlik duvarı uyarısı', time: '3 saat önce', type: 'error' }
              ].map((notification, idx) => (
                <div key={idx} className={`p-2 text-sm border-l-2 rounded-r-cyber ${
                  notification.type === 'info' ? 'border-cyber-neon-cyan bg-cyber-neon-cyan bg-opacity-5' : 
                  notification.type === 'warning' ? 'border-cyber-neon-yellow bg-cyber-neon-yellow bg-opacity-5' :
                  notification.type === 'success' ? 'border-cyber-neon-lime bg-cyber-neon-lime bg-opacity-5' :
                  'border-cyber-neon-magenta bg-cyber-neon-magenta bg-opacity-5'
                }`}>
                  <div className="font-medium">{notification.title}</div>
                  <div className="text-xs text-cyber-text text-opacity-60">{notification.time}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Disk paneli */}
          <div className="cyber-card p-4 border border-opacity-30 border-cyber-neon-cyan">
            <h2 className="text-cyber-text text-opacity-80 font-medium mb-3 flex items-center">
              <div className="i-carbon-data-storage mr-2 text-cyber-neon-cyan"></div>
              Disk Durumu
            </h2>
            
            <div className="space-y-4 mt-4">
              {[
                { name: 'Ana Disk', total: '512GB', used: 210, color: 'cyan' },
                { name: 'Harici Depolama', total: '2TB', used: 650, color: 'magenta' },
              ].map((disk, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{disk.name}</span>
                    <span className="text-cyber-text text-opacity-60">{disk.used}GB / {disk.total}</span>
                  </div>
                  <div className="h-3 bg-white bg-opacity-10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        disk.color === 'cyan' ? 'bg-cyber-neon-cyan' : 'bg-cyber-neon-magenta'
                      }`}
                      style={{width: `${disk.name === 'Ana Disk' ? '41%' : '32.5%'}`}}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="text-center p-2 border border-white border-opacity-10 rounded-cyber">
                <div className="text-xs text-cyber-text text-opacity-60">Boş Alan</div>
                <div className="text-lg font-bold">1.65 TB</div>
              </div>
              <div className="text-center p-2 border border-white border-opacity-10 rounded-cyber">
                <div className="text-xs text-cyber-text text-opacity-60">Kullanılan</div>
                <div className="text-lg font-bold">860 GB</div>
              </div>
            </div>
          </div>
          
          {/* Hızlı ayarlar paneli */}
          <div className="cyber-card p-4 border border-opacity-30 border-cyber-neon-magenta">
            <h2 className="text-cyber-text text-opacity-80 font-medium mb-3 flex items-center">
              <div className="i-carbon-settings mr-2 text-cyber-neon-magenta"></div>
              Hızlı Ayarlar
            </h2>
            
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button className="p-3 rounded-cyber bg-cyber-neon-magenta bg-opacity-10 border border-cyber-neon-magenta border-opacity-20 hover:border-opacity-50 transition-all flex flex-col items-center">
                <div className="i-carbon-security text-cyber-neon-magenta mb-1"></div>
                <span className="text-xs">Güvenlik</span>
              </button>
              <button className="p-3 rounded-cyber bg-cyber-neon-cyan bg-opacity-10 border border-cyber-neon-cyan border-opacity-20 hover:border-opacity-50 transition-all flex flex-col items-center">
                <div className="i-carbon-wifi text-cyber-neon-cyan mb-1"></div>
                <span className="text-xs">Ağ</span>
              </button>
              <button className="p-3 rounded-cyber bg-cyber-neon-lime bg-opacity-10 border border-cyber-neon-lime border-opacity-20 hover:border-opacity-50 transition-all flex flex-col items-center">
                <div className="i-carbon-battery-full text-cyber-neon-lime mb-1"></div>
                <span className="text-xs">Güç</span>
              </button>
              <button className="p-3 rounded-cyber bg-cyber-neon-yellow bg-opacity-10 border border-cyber-neon-yellow border-opacity-20 hover:border-opacity-50 transition-all flex flex-col items-center">
                <div className="i-carbon-screen text-cyber-neon-yellow mb-1"></div>
                <span className="text-xs">Ekran</span>
              </button>
              <button className="p-3 rounded-cyber bg-cyber-neon-purple bg-opacity-10 border border-cyber-neon-purple border-opacity-20 hover:border-opacity-50 transition-all flex flex-col items-center">
                <div className="i-carbon-volume-up text-cyber-neon-purple mb-1"></div>
                <span className="text-xs">Ses</span>
              </button>
              <button className="p-3 rounded-cyber bg-cyber-neon-blue bg-opacity-10 border border-cyber-neon-blue border-opacity-20 hover:border-opacity-50 transition-all flex flex-col items-center">
                <div className="i-carbon-user-profile text-cyber-neon-blue mb-1"></div>
                <span className="text-xs">Profil</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberpunkDashboard; 