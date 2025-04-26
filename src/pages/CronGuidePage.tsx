import React from 'react';

const CronGuidePage: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">🕒 Cron İfadeleri Rehberi</h1>
      
      <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
        <p className="mb-4">
          MicroBot'ta zamanlanmış mesajlarınızı daha karmaşık kurallara göre göndermek için
          cron ifadelerini kullanabilirsiniz.
        </p>
        
        <h2 className="text-lg font-semibold mt-6 mb-3">Cron Formatı</h2>
        <p className="mb-4">
          Cron ifadeleri, belirli görevlerin ne zaman çalıştırılacağını tanımlamak için 
          kullanılan bir zaman planlama sistemidir. Format 5 alandan oluşur:
        </p>
        
        <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg font-mono text-sm whitespace-pre overflow-x-auto mb-4">
{`* * * * *
│ │ │ │ │
│ │ │ │ └── Haftanın günü (0-6) (Pazar=0, Cumartesi=6)
│ │ │ └──── Ay (1-12)
│ │ └────── Ayın günü (1-31)
│ └──────── Saat (0-23)
└────────── Dakika (0-59)`}
        </pre>
        
        <h2 className="text-lg font-semibold mt-6 mb-3">Özel Karakterler</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Karakter</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Tanım</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Örnek</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">*</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">Her değer</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm"><code>* * * * *</code> - Her dakika</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">,</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">Değer listesi</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm"><code>1,15,30 * * * *</code> - Her saatin 1., 15. ve 30. dakikalarında</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">-</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">Değer aralığı</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm"><code>0 9-17 * * *</code> - 9:00'dan 17:00'a kadar her saat başında</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">/</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm">Adım değerleri</td>
                <td className="px-4 py-2 whitespace-nowrap text-sm"><code>*/15 * * * *</code> - Her 15 dakikada bir</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h2 className="text-lg font-semibold mt-6 mb-3">Sık Kullanılan Örnekler</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 border rounded-lg">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Cron İfadesi</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">*/5 * * * *</td>
                <td className="px-4 py-2 text-sm">Her 5 dakikada bir</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 * * * *</td>
                <td className="px-4 py-2 text-sm">Her saatin başında (00 dakika)</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 9 * * *</td>
                <td className="px-4 py-2 text-sm">Her gün saat 09:00'da</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 9 * * 1-5</td>
                <td className="px-4 py-2 text-sm">Hafta içi (Pazartesi-Cuma) saat 09:00'da</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 9 * * 1</td>
                <td className="px-4 py-2 text-sm">Her Pazartesi saat 09:00'da</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 9-17 * * 1-5</td>
                <td className="px-4 py-2 text-sm">Hafta içi, 09:00-17:00 arasında her saat başında</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 9,17 * * *</td>
                <td className="px-4 py-2 text-sm">Her gün saat 09:00 ve 17:00'da</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 0 1 * *</td>
                <td className="px-4 py-2 text-sm">Her ayın ilk günü, gece yarısı</td>
              </tr>
              <tr>
                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono">0 0 * * 0</td>
                <td className="px-4 py-2 text-sm">Her Pazar gece yarısı</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <h2 className="text-lg font-semibold mt-6 mb-3">İpuçları</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Cron ifadelerinde zaman dilimi her zaman sunucunun zaman dilimidir.</li>
          <li>Karmaşık zamanlamalarda test etmek için doğrulama aracını kullanın.</li>
          <li>Haftanın günleri için hem 0-6 hem de kısaltmalar (SUN, MON vb.) kullanılabilir.</li>
          <li>Zamanlayıcının yoğun saatlerde çalışmasını önlemek için gece veya hafta sonu zamanlamaları tercih edin.</li>
        </ul>
        
        <h2 className="text-lg font-semibold mt-6 mb-3">Daha Fazla Kaynak</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <a 
              href="https://crontab.guru/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Crontab Guru
            </a> - Cron ifadelerini görsel olarak test etme aracı
          </li>
          <li>
            <a 
              href="https://en.wikipedia.org/wiki/Cron" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Wikipedia: Cron
            </a> - Cron hakkında daha fazla bilgi
          </li>
        </ul>
      </div>
    </div>
  );
};

export default CronGuidePage; 