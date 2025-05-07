# Değişiklik Kaydı

Bu projede yapılan tüm önemli değişiklikler bu dosyada belgelenecektir.

# CHANGELOG.md güncellemesi

## [0.7.5] - 2024-07-12

### Eklenenler
- API ve WebSocket bağlantı testleri iyileştirildi
- SSE endpoint bağlantı testleri eklendi
- Test modu varsayılan olarak aktif hale getirildi

### Değişiklikler
- API URL yapılandırması düzeltildi
- WebSocket URL düzeltmeleri yapıldı
- SSE URL düzeltmeleri yapıldı
- API endpoint'lerindeki çift "/api" sorunu giderildi
- Test modu göstergesi sağ alt köşeye eklendi

### Düzeltmeler
- "Yükleniyor" ekranında takılma sorunu giderildi
- API bağlantı hatalarına karşı daha etkili hata yönetimi eklendi
- Bağlantı testlerinde oluşan 404 hataları giderildi

## [0.7.0] - 2024-07-01

### Eklenenler
- WebSocket tabanlı gerçek zamanlı veri senkronizasyonu
- Bağlantı durumu göstergesi
- Otomatik yeniden bağlanma mekanizması
- Global hata yönetimi (Error Boundary)
- Zustand tabanlı state management
- Performans optimizasyonları

### Değişiklikler
- WebSocket entegrasyonu ile gerçek zamanlı veri güncellemeleri
- Bağlantı durumu izleme ve kullanıcı bildirimleri
- Hata yönetimi merkezileştirildi
- State management çözümü eklendi


## [0.6.0] - 2024-06-30 (Planlanan)

### Eklenenler
- WebSocket tabanlı gerçek zamanlı veri senkronizasyonu
- Bağlantı durumu göstergesi
- Otomatik yeniden bağlanma mekanizması
- Gerçek zamanlı güncelleme bildirimleri
  - Mesaj şablonu değişiklikleri
  - Otomatik yanıt kuralı güncellemeleri
  - Grup listesi değişiklikleri
  - Zamanlayıcı durumu güncellemeleri

### Değişiklikler
- API iletişimi WebSocket desteği ile genişletildi
- Kullanıcı arayüzüne bağlantı durumu göstergesi eklendi
- Veri güncellemeleri için polling yerine WebSocket kullanılmaya başlandı 


## [0.5.0] - 2024-06-15

### Eklenenler
- Zamanlanmış mesaj gönderimi özelliği
- Zamanlayıcı kontrol paneli (başlatma/durdurma)
- Şablon zamanlama ayarları (her şablon için benzersiz ayarlar)
- Zamanlama geçmişi tablosu
- React Router DOM entegrasyonu
- `services` ve `hooks` klasörleri ile düzenli servis mimarisi

### Değişiklikler
- Mesaj şablonları sayfasına zamanlama seçenekleri eklendi
- Sidebar menüsüne Zamanlayıcı seçeneği eklendi
- Toast bildirimleri için yeni mesaj türleri
- API servislerinde merkezi yapı oluşturuldu

## [0.4.0] - 2024-06-01

### Eklenenler
- Görsel Kural Oluşturucu (VisualRuleBuilder) bileşeni eklendi
- Adım Adım Kural Oluşturma Sihirbazı (RuleWizard) eklendi
- Hazır Şablonlar Galerisi (TemplateGallery) eklendi
- AutoReplyRules sayfasına farklı kural ekleme modları eklendi (Temel, Görsel, Sihirbaz)
- RegexBuilder bileşeni: Görsel olarak regex oluşturmak için kullanıcı dostu arayüz
- Yanıt editörüne değişken ekleme özellikleri getirildi

### Değişiklikler
- Mesaj Şablonları sayfasına hazır şablonlar seçebilme özelliği eklendi
- AutoReplyRules sayfası yeniden tasarlandı, çoklu mod desteği eklendi
- Regex paterni oluşturma ve test etme imkanı geliştirildi

## [0.3.0] - 2024-05-24

### Eklenenler
- Form validasyonları için `react-hook-form` entegrasyonu
- Merkezi validasyon kuralları (`src/utils/validation.ts`)
- Reusable FormField bileşeni güncellendi, validasyon desteği eklendi
- Tüm formlara validasyon kuralları eklendi
- Hata mesajları ve validasyon geri bildirimleri eklendi

### Değişiklikler
- Tüm sayfalardaki formlar react-hook-form ile yeniden düzenlendi
- Form alanları için merkezi validasyon kuralları oluşturuldu
- Kullanıcı deneyimini iyileştirmek için hata mesajları ve geri bildirimler eklendi

## [0.2.0] - 2024-05-17

### Eklenenler
- Toast bildirim sistemi - `react-toastify` entegrasyonu
- API iletişimi için merkezi hata yönetimi
- Kullanıcı dostu hata mesajları
- Başarı, hata, bilgi ve uyarı toast'ları

### Değişiklikler
- Axios kullanımı iyileştirildi, merkezi bir error handling mekanizması eklendi
- Tüm sayfalardaki alert kullanımı toast bildirimleriyle değiştirildi
- `src/utils/toast.tsx` dosyası ile sık kullanılan toast fonksiyonları merkezi hale getirildi
- API hatalarını kullanıcı dostu mesajlara dönüştüren handleApiError fonksiyonu eklendi

## [0.1.0] - 2024-05-10

### Eklenenler
- Proje temel yapısı oluşturuldu (Vite + React + TypeScript)
- Tailwind CSS entegrasyonu
- Telegram Web App SDK entegrasyonu
- Temel sayfa yapısı: MessageTemplates, AutoReplyRules, GroupList, MessageSend, DMPanel
- Temel bileşenler: Button, FormField
- API servisi ve entegrasyonu
- Telegram kimlik doğrulama akışı
- Form validasyonları entegrasyonu
  - React Hook Form kütüphanesi eklendi
  - Form alanları için yeniden kullanılabilir bileşenler oluşturuldu
  - Validasyon kuralları ve hata mesajları merkezi hale getirildi
  - Tüm formlar validasyon kuralları ile güncellendi

### Değişiklikler
- İlk sürüm, temel sayfa yapısı ve ana özellikler 

## [0.8.0] - 2024-07-15 (Planlanan)

### Eklenenler
- Gelişmiş WebSocket bağlantı yönetimi
  - Kalp atışı kontrolü
  - Bağlantı zaman aşımı yönetimi
  - Yeniden bağlanma stratejileri
  - Mesaj kuyruğu desteği
- Çevrimdışı mod desteği
- Performans izleme ve optimizasyon
- Bağlantı kalitesi göstergesi
- WebSocket Event Bus
- Gelişmiş hata izleme ve raporlama
- Bağlantı testi ve doğrulama

### Değişiklikler
- WebSocket bağlantı yönetimi iyileştirildi
- Performans metrikleri eklendi
- Hata yönetimi geliştirildi
- Kullanıcı deneyimi iyileştirildi

