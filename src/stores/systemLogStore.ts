import { create } from 'zustand';
import { systemLogAPI } from '../services/systemLogAPI';

// 日志条目接口
export interface SystemLogEntry {
  id: string;
  userId?: string;
  userName: string;
  action: string;
  description: string;
  resourceType: string;
  resourceId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'pending';
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
  details?: any;
}

// 日志统计接口
export interface LogStats {
  date: string;
  totalCount: number;
  actions: Array<{
    action: string;
    count: number;
  }>;
}

// 日志筛选条件接口
export interface LogFilters {
  action?: string;
  severity?: string;
  status?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: string; // 添加导出数量限制参数
}

// 分页信息接口
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// 系统日志状态接口
interface SystemLogState {
  logs: SystemLogEntry[];
  stats: LogStats[];
  filters: LogFilters;
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  statsLoading: boolean;
}

// 系统日志操作接口
interface SystemLogActions {
  // 获取系统日志
  fetchSystemLogs: (filters?: LogFilters, page?: number, limit?: number) => Promise<void>;
  
  // 获取日志统计
  fetchLogStats: (days?: number) => Promise<void>;
  
  // 导出日志
  exportLogs: (filters?: LogFilters, format?: string) => Promise<void>;
  
  // 清理旧日志
  cleanupLogs: (daysToKeep?: number) => Promise<void>;
  
  // 设置筛选条件
  setFilters: (filters: Partial<LogFilters>) => void;
  
  // 重置筛选条件
  resetFilters: () => void;
  
  // 设置分页
  setPagination: (pagination: Partial<Pagination>) => void;
  
  // 设置加载状态
  setLoading: (loading: boolean) => void;
  
  // 设置错误信息
  setError: (error: string | null) => void;
  
  // 清除错误信息
  clearError: () => void;
}

type SystemLogStore = SystemLogState & SystemLogActions;

// 默认筛选条件
const defaultFilters: LogFilters = {
  action: '',
  severity: '',
  status: '',
  userId: '',
  startDate: '',
  endDate: '',
  search: ''
};

// 默认分页信息
const defaultPagination: Pagination = {
  page: 1,
  limit: 50,
  total: 0,
  pages: 0
};

export const useSystemLogStore = create<SystemLogStore>((set, get) => ({
  // 初始状态
  logs: [],
  stats: [],
  filters: { ...defaultFilters },
  pagination: { ...defaultPagination },
  loading: false,
  error: null,
  statsLoading: false,

  // 获取系统日志
  fetchSystemLogs: async (filters = {}, page = 1, limit = 50) => {
    set({ loading: true, error: null });
    
    try {
      // 合并筛选条件，确保新的筛选条件能覆盖旧的
      const currentFilters = get().filters;
      const mergedFilters = { ...currentFilters, ...filters };
      
      // 构建请求参数
      const params = {
        ...mergedFilters,
        page,
        limit
      };
      
      // 移除空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await systemLogAPI.getSystemLogs(params);
      
      if (response.data && response.data.success) {
        const { logs, pagination } = response.data.data;
        set({
          logs: logs.map((log: any) => ({
            id: log.id,
            userId: log.userId,
            userName: log.userName,
            action: log.action,
            description: log.description,
            resourceType: log.resourceType,
            resourceId: log.resourceId,
            severity: log.severity,
            status: log.status,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            createdAt: log.createdAt,
            updatedAt: log.updatedAt,
            details: log.details
          })),
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: pagination.pages
          },
          loading: false
        });
      } else {
        throw new Error(response.data?.message || '获取系统日志失败');
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '获取系统日志失败'
      });
    }
  },

  // 获取日志统计
  fetchLogStats: async (days = 7) => {
    set({ statsLoading: true });
    
    try {
      const response = await systemLogAPI.getLogStats(days);
      
      if (response.data && response.data.success) {
        set({
          stats: response.data.data,
          statsLoading: false
        });
      } else {
        throw new Error(response.data?.message || '获取日志统计失败');
      }
    } catch (error: any) {
      set({
        statsLoading: false,
        error: error.response?.data?.message || error.message || '获取日志统计失败'
      });
    }
  },

  // 导出日志 - 性能优化版本
  exportLogs: async (filters = {}, format = 'csv') => {
    try {
      // 合并筛选条件
      const currentFilters = get().filters;
      const mergedFilters = { ...currentFilters, ...filters };
      
      // 移除空值参数
      const params = { ...mergedFilters, format };
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      // 添加导出数量限制，防止超时
      if (!params.limit) {
        params.limit = '10000'; // 默认限制1万条
      }
      
      const response = await systemLogAPI.exportLogs(params);
      
      // 获取响应头信息
      const totalCount = response.headers['x-total-count'];
      const exportedCount = response.headers['x-exported-count'];
      
      // 创建下载链接
      const blob = new Blob([response.data], { 
        type: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `系统日志_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // 记录导出信息
      console.log(`📊 导出完成: 总计 ${totalCount} 条记录，实际导出 ${exportedCount} 条记录`);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '导出日志失败';
      console.error('❌ 导出日志失败:', errorMessage);
      
      set({
        error: errorMessage
      });
      throw error;
    }
  },

  // 清理旧日志
  cleanupLogs: async (daysToKeep = 15) => { // 默认保留15天，提升系统性能
    set({ loading: true, error: null });
    
    try {
      const response = await systemLogAPI.cleanupLogs(daysToKeep);
      
      if (response.data && response.data.success) {
        // 重新获取日志列表
        await get().fetchSystemLogs();
        set({ loading: false });
      } else {
        throw new Error(response.data?.message || '清理日志失败');
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '清理日志失败'
      });
      throw error;
    }
  },

  // 设置筛选条件
  setFilters: (filters: Partial<LogFilters>) => {
    set(state => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 } // 重置到第一页
    }));
  },

  // 重置筛选条件
  resetFilters: () => {
    set({
      filters: { ...defaultFilters },
      pagination: { ...defaultPagination, page: 1 }
    });
  },

  // 设置分页
  setPagination: (pagination: Partial<Pagination>) => {
    set(state => ({
      pagination: { ...state.pagination, ...pagination }
    }));
  },

  // 设置加载状态
  setLoading: (loading: boolean) => {
    set({ loading });
  },

  // 设置错误信息
  setError: (error: string | null) => {
    set({ error });
  },

  // 清除错误信息
  clearError: () => {
    set({ error: null });
  }
})); 