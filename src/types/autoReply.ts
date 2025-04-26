export interface AutoReplyRule {
  id: string;
  keyword: string;
  response: string;
  is_active: boolean;
  match_type: 'exact' | 'contains' | 'regex';
  priority: number;
  group_ids: string[];
  created_at: string;
  updated_at: string;
  variables: string[];
  conditions: {
    time_range?: {
      start: string;
      end: string;
    };
    day_of_week?: number[];
    user_status?: 'member' | 'admin' | 'creator';
  };
}

export interface AutoReplyFormData {
  keyword: string;
  response: string;
  match_type: 'exact' | 'contains' | 'regex';
  priority: number;
  group_ids: string[];
  variables: string[];
  conditions: {
    time_range?: {
      start: string;
      end: string;
    };
    day_of_week?: number[];
    user_status?: 'member' | 'admin' | 'creator';
  };
}

export interface AutoReplyFilters {
  search?: string;
  match_type?: string;
  is_active?: boolean;
  group_id?: string;
} 