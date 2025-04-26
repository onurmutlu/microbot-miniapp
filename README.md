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