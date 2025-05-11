/**
 * Mesaj optimizasyonu için mock veri
 */
export default {
  original_message: 'Merhaba, bugün Bitcoin fiyatı yükseldi.',
  optimized_message: 'Merhaba topluluğumuz! 📈 Bugün Bitcoin\'in fiyatında önemli bir yükseliş gördük. Sizce bu trend devam eder mi? Yorumlarınızı bekliyorum! #bitcoin #kripto',
  confidence_score: 0.92,
  recommendations: [
    { type: 'length', message: 'Mesaj uzunluğu hedef kitle için ideal boyuta getirildi' },
    { type: 'language', message: 'Dil daha açık ve anlaşılır hale getirildi' },
    { type: 'engagement', message: 'Etkileşimi artırmak için soru eklenmiştir' }
  ],
  performance_predictions: {
    engagement_rate: 0.78,
    visibility_score: 0.82,
    quality_rating: 'Çok İyi'
  }
}; 