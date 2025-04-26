export interface Template {
  id: string;
  name: string;
  content: string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count: number;
  tags: string[];
  language: string;
  metadata: {
    author?: string;
    version?: string;
    last_used?: string;
    rating?: number;
  };
}

export interface TemplateFilters {
  category?: string;
  sentiment?: string;
  search?: string;
  is_active?: boolean;
  language?: string;
  tags?: string[];
}

export interface TemplateFormData {
  name: string;
  content: string;
  category: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  variables: string[];
  is_active: boolean;
  tags: string[];
  language: string;
  metadata?: {
    author?: string;
    version?: string;
  };
}

export interface TemplateAnalysis {
  quality: number;
  suggestions: string[];
  readability: number;
  sentiment: string;
  variable_usage: Record<string, number>;
  complexity: number;
  estimated_response_time: number;
  language_detection: {
    detected_language: string;
    confidence: number;
  };
} 