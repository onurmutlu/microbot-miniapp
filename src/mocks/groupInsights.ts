/**
 * Grup içgörüleri için mock veri
 */
export default {
  status: 'success',
  content_analysis: {
    avg_message_length: 142,
    media_rate: 0.32,
    interaction_rate: 0.65,
    top_keywords: ['kripto', 'bitcoin', 'ethereum', 'yatırım', 'token']
  },
  recommendations: [
    { 
      type: 'content', 
      message: 'Mesajlara görsel eklemek etkileşimi %30 artırabilir'
    },
    { 
      type: 'timing', 
      message: 'Mesajları 18:00-20:00 arası göndermek daha yüksek görüntülenme sağlayabilir'
    },
    {
      type: 'engagement',
      message: 'Sorular sormak grup etkileşimini artıracaktır'
    }
  ]
}; 