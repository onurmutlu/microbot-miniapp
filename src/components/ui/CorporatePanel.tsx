import React from 'react';
import '../../styles/corporate-theme.css';

interface PanelSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const PanelSection: React.FC<PanelSectionProps> = ({ title, description, children }) => {
  return (
    <div className="corporate-card mb-6">
      <h2 className="corporate-heading text-xl">{title}</h2>
      {description && <p className="corporate-text-muted mb-4">{description}</p>}
      {children}
    </div>
  );
};

const CorporatePanel: React.FC = () => {
  return (
    <div className="corporate-dark min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="corporate-heading text-2xl md:text-3xl">Sistem Ayarları</h1>
          <p className="corporate-text-muted">Kurumsal uygulama ayarlarınızı bu panelden yönetebilirsiniz.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <PanelSection 
              title="Kullanıcı Tercihleri" 
              description="Kullanıcı arayüzü ve erişim tercihlerinizi özelleştirin."
            >
              <div className="corporate-form-group">
                <label htmlFor="display-name" className="corporate-label">Görünen İsim</label>
                <input 
                  type="text" 
                  id="display-name" 
                  className="corporate-input" 
                  placeholder="İsminizi girin"
                />
              </div>
              
              <div className="corporate-form-group">
                <label htmlFor="email" className="corporate-label">E-posta Adresi</label>
                <input 
                  type="email" 
                  id="email" 
                  className="corporate-input" 
                  placeholder="E-posta adresinizi girin"
                />
              </div>
              
              <div className="corporate-form-group">
                <label htmlFor="language" className="corporate-label">Dil Tercihi</label>
                <select id="language" className="corporate-input">
                  <option value="tr">Türkçe</option>
                  <option value="en">İngilizce</option>
                  <option value="de">Almanca</option>
                </select>
              </div>
              
              <div className="corporate-checkbox">
                <input type="checkbox" id="dark-mode" defaultChecked />
                <label htmlFor="dark-mode">Koyu tema kullan</label>
              </div>
              
              <div className="corporate-checkbox">
                <input type="checkbox" id="notifications" />
                <label htmlFor="notifications">E-posta bildirimleri</label>
              </div>
              
              <div className="mt-6 flex gap-3">
                <button className="corporate-button">Kaydet</button>
                <button className="corporate-button-secondary">Sıfırla</button>
              </div>
            </PanelSection>
            
            <PanelSection 
              title="Güvenlik" 
              description="Hesap güvenliği ve erişim ayarlarınızı yönetin."
            >
              <div className="corporate-form-group">
                <label htmlFor="current-password" className="corporate-label">Mevcut Şifre</label>
                <input 
                  type="password" 
                  id="current-password" 
                  className="corporate-input" 
                  placeholder="Mevcut şifrenizi girin"
                />
              </div>
              
              <div className="corporate-form-group">
                <label htmlFor="new-password" className="corporate-label">Yeni Şifre</label>
                <input 
                  type="password" 
                  id="new-password" 
                  className="corporate-input" 
                  placeholder="Yeni şifrenizi girin"
                />
              </div>
              
              <div className="corporate-form-group">
                <label htmlFor="confirm-password" className="corporate-label">Şifre Onayı</label>
                <input 
                  type="password" 
                  id="confirm-password" 
                  className="corporate-input" 
                  placeholder="Yeni şifrenizi tekrar girin"
                />
              </div>
              
              <div className="mt-6">
                <button className="corporate-button">Şifreyi Güncelle</button>
              </div>
            </PanelSection>
          </div>
          
          <div className="space-y-6">
            <PanelSection 
              title="Bildirim Ayarları" 
              description="Bildirim tercihlerinizi özelleştirin."
            >
              <div className="space-y-3">
                <div className="corporate-checkbox">
                  <input type="checkbox" id="email-notifications" defaultChecked />
                  <label htmlFor="email-notifications">E-posta bildirimleri</label>
                </div>
                
                <div className="corporate-checkbox">
                  <input type="checkbox" id="push-notifications" defaultChecked />
                  <label htmlFor="push-notifications">Anlık bildirimler</label>
                </div>
                
                <div className="corporate-checkbox">
                  <input type="checkbox" id="sms-notifications" />
                  <label htmlFor="sms-notifications">SMS bildirimleri</label>
                </div>
                
                <div className="corporate-checkbox">
                  <input type="checkbox" id="weekly-report" />
                  <label htmlFor="weekly-report">Haftalık rapor</label>
                </div>
              </div>
              
              <div className="corporate-divider"></div>
              
              <div className="corporate-form-group">
                <label htmlFor="quiet-hours" className="corporate-label">Sessiz Saatler</label>
                <div className="grid grid-cols-2 gap-4">
                  <input type="time" id="quiet-hours-start" className="corporate-input" defaultValue="22:00" />
                  <input type="time" id="quiet-hours-end" className="corporate-input" defaultValue="07:00" />
                </div>
                <p className="corporate-text-muted mt-2">Bu saatler arasında bildirim almayacaksınız.</p>
              </div>
              
              <div className="mt-6">
                <button className="corporate-button">Bildirim Ayarlarını Kaydet</button>
              </div>
            </PanelSection>
            
            <PanelSection 
              title="Veri ve Gizlilik" 
              description="Veri kullanımı ve gizlilik ayarlarınızı yönetin."
            >
              <div className="corporate-form-group">
                <label className="corporate-label">Veri Paylaşımı</label>
                <div className="space-y-3">
                  <div className="corporate-checkbox">
                    <input type="checkbox" id="analytics" defaultChecked />
                    <label htmlFor="analytics">Analitik verilerini paylaş</label>
                  </div>
                  
                  <div className="corporate-checkbox">
                    <input type="checkbox" id="personalization" defaultChecked />
                    <label htmlFor="personalization">Kişiselleştirilmiş öneriler</label>
                  </div>
                  
                  <div className="corporate-checkbox">
                    <input type="checkbox" id="third-party" />
                    <label htmlFor="third-party">Üçüncü taraf veri paylaşımı</label>
                  </div>
                </div>
              </div>
              
              <div className="corporate-divider"></div>
              
              <div className="space-y-4">
                <div>
                  <button className="corporate-button-secondary w-full flex justify-between items-center">
                    <span>Veri Yedekleme</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                      <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                    </svg>
                  </button>
                </div>
                
                <div>
                  <button className="corporate-button-secondary w-full flex justify-between items-center">
                    <span>Verilerimi İndir</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </PanelSection>
          </div>
        </div>
        
        <div className="mt-8 corporate-card">
          <h2 className="corporate-heading text-xl">Hesap Durumu</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[var(--corporate-bg-tertiary)] rounded-md">
              <p className="text-sm text-[var(--corporate-text-secondary)]">Hesap Türü</p>
              <p className="text-lg font-semibold">Kurumsal</p>
            </div>
            
            <div className="p-4 bg-[var(--corporate-bg-tertiary)] rounded-md">
              <p className="text-sm text-[var(--corporate-text-secondary)]">Kullanım Süresi</p>
              <p className="text-lg font-semibold">127 gün</p>
            </div>
            
            <div className="p-4 bg-[var(--corporate-bg-tertiary)] rounded-md">
              <p className="text-sm text-[var(--corporate-text-secondary)]">Lisans Bitiş</p>
              <p className="text-lg font-semibold">15.08.2024</p>
            </div>
          </div>
          
          <div className="mt-6">
            <button className="corporate-button-secondary">Detaylı Rapor</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CorporatePanel; 