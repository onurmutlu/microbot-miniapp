import { gql } from '@apollo/client';

export const OPTIMIZE_MESSAGE = gql`
  mutation OptimizeMessage($message: String!, $groupId: Int!) {
    optimize_message(message: $message, group_id: $groupId) {
      original_message
      optimized_message
      confidence_score
      recommendations {
        type
        message
      }
      performance_predictions {
        engagement_rate
        visibility_score
        quality_rating
      }
    }
  }
`;

export const RESET_GROUP_COOLDOWN = gql`
  mutation ResetGroupCooldown($groupId: Int!) {
    reset_group_cooldown(group_id: $groupId) {
      success
      message
    }
  }
`;

export const UPDATE_SCHEDULER_STATUS = gql`
  mutation UpdateSchedulerStatus($isActive: Boolean!) {
    update_scheduler_status(is_active: $isActive) {
      success
      message
      status {
        is_active
        next_scheduled_time
      }
    }
  }
`;

export const CLEAR_CACHE = gql`
  mutation ClearCache($cacheType: String) {
    clear_cache(cache_type: $cacheType) {
      success
      message
      cleared_keys
    }
  }
`; 