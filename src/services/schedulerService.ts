import api from '../utils/api';

export interface SchedulerStatus {
  is_running: boolean;
  last_execution: string | null;
  next_execution: string | null;
  active_templates: number;
  total_templates: number;
}

export interface TemplateScheduleData {
  template_id: string;
  interval_minutes: number;
  cron_expression: string | null;
  is_active: boolean;
}

export interface CronValidationResponse {
  is_valid: boolean;
  error?: string;
  next_dates?: string[];
}

export interface ScheduleHistory {
  id: string;
  template_id: string;
  execution_time: string;
  status: 'success' | 'failed';
  error_message?: string;
}

export const schedulerService = {
  async getStatus(): Promise<SchedulerStatus> {
    const response = await api.get<SchedulerStatus>('/scheduler/status');
    return response.data;
  },

  async startScheduler(): Promise<void> {
    await api.post('/scheduler/start');
  },

  async stopScheduler(): Promise<void> {
    await api.post('/scheduler/stop');
  },

  async updateTemplateSchedule(data: {
    template_id: string;
    interval_minutes: number;
    cron_expression: string | null;
    is_active: boolean;
  }): Promise<void> {
    await api.post('/scheduler/template', data);
  },

  async validateCronExpression(expression: string): Promise<CronValidationResponse> {
    const response = await api.post<CronValidationResponse>('/scheduler/validate-cron', { expression });
    return response.data;
  },

  async getScheduleHistory(limit: number = 10): Promise<ScheduleHistory[]> {
    const response = await api.get<ScheduleHistory[]>(`/scheduler/history?limit=${limit}`);
    return response.data;
  }
}; 