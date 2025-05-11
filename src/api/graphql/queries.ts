import { gql } from '@apollo/client';

export const GET_GROUP_INSIGHTS = gql`
  query GetGroupInsights($groupId: Int!) {
    group_content_insights(group_id: $groupId) {
      status
      content_analysis {
        avg_message_length
        media_rate
      }
      recommendations {
        type
        message
      }
    }
  }
`;

export const GET_SYSTEM_METRICS = gql`
  query GetSystemMetrics {
    system_metrics {
      cpu_usage
      memory_usage
      disk_usage
      uptime
      api_latency
      total_messages
      successful_messages
      failed_messages
    }
  }
`;

export const GET_CACHE_METRICS = gql`
  query GetCacheMetrics {
    cache_metrics {
      hit_rate
      miss_rate
      memory_usage
      keys_count
      evictions
    }
  }
`;

export const GET_SCHEDULER_STATUS = gql`
  query GetSchedulerStatus {
    scheduler_status {
      is_active
      next_scheduled_time
      pending_messages
      last_error
    }
  }
`; 