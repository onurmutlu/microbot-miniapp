/**
 * Önbellek istatistikleri için mock veri
 */
export default {
  hit_rate: 0.89,
  miss_rate: 0.11,
  memory_usage: 256, // MB
  keys_count: 42890,
  evictions: 128,
  average_ttl: 3600, // saniye
  top_keys: [
    {
      key: 'user:session:active',
      size: 24.5, // KB
      hits: 58920
    },
    {
      key: 'group:stats:daily',
      size: 186.3, // KB
      hits: 42180
    },
    {
      key: 'message:templates',
      size: 312.7, // KB
      hits: 38640
    }
  ]
}; 