import apiClient from './api';

// 系统日志API
export const systemLogAPI = {
  // 获取系统日志列表
  getSystemLogs: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    severity?: string;
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => apiClient.get('/logs', { params }),

  // 获取日志统计信息
  getLogStats: (days: number = 7) => 
    apiClient.get('/logs/stats', { params: { days } }),

  // 导出日志
  exportLogs: (params?: {
    action?: string;
    resourceType?: string;
    severity?: string;
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    format?: string;
  }) => apiClient.get('/logs/export', { 
    params,
    responseType: 'blob'
  }),

  // 清理旧日志
  cleanupLogs: (daysToKeep: number = 90) => 
    apiClient.delete('/logs/cleanup', { 
      params: { daysToKeep } 
    }),

  // 获取用户活动日志
  getUserActivityLogs: (userId: string, params?: {
    page?: number;
    limit?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get(`/users/${userId}/activity-logs`, { params }),

  // 记录用户活动
  logUserActivity: (userId: string, activityData: {
    action: string;
    description: string;
    resourceType?: string;
    resourceId?: string;
    severity?: string;
    status?: string;
    details?: any;
  }) => apiClient.post(`/users/${userId}/activity-logs`, activityData),
};

export default systemLogAPI; 