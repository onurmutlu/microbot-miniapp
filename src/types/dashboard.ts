export interface DashboardStatistics {
  last24hMessages: number;
  successRate: number;
  activeGroupCount: number;
  activeTemplateCount: number;
  schedulerStatus: {
    isActive: boolean;
    nextScheduledTime: string | null;
    pendingMessages: number;
  };
}

export interface GroupActivity {
  categories: {
    name: string;
    count: number;
  }[];
  groups: GroupInfo[];
}

export interface GroupInfo {
  id: string;
  name: string;
  category: string;
  memberCount: number;
  messagesLast24h: number;
  successRate: number;
  lastActivity: string;
}

export interface OptimalInterval {
  groupId: string;
  groupName: string;
  optimalInterval: number; // dakika cinsinden
  averageResponseRate: number;
  confidenceScore: number; // 0-1 arası
}

export interface CooledGroup {
  id: string;
  name: string;
  cooldownUntil: string;
  cooldownReason: string;
  failedAttempts: number;
}

export interface ScheduledStats {
  totalScheduled: number;
  successCount: number;
  failureCount: number;
  byHour: {
    hour: number;
    count: number;
    successRate: number;
  }[];
  byTemplate: {
    templateId: string;
    templateName: string;
    count: number;
    successRate: number;
  }[];
  byGroup: {
    groupId: string;
    groupName: string;
    count: number;
    successRate: number;
  }[];
}

export interface SchedulerStatus {
  isActive: boolean;
  nextScheduledTime: string | null;
  pendingMessages: number;
  lastError: string | null;
} 