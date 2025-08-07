import { create } from 'zustand';
import { 
  Bug, 
  BugPriority, 
  BugSeverity, 
  BugType, 
  BugStatus, 
  BugResponsibility,
  CreateBugRequest, 
  UpdateBugRequest, 
  BugFilters, 
  BugListResponse, 
  BugStatistics,
  AssignBugRequest,
  UpdateBugStatusRequest,
  AddBugCommentRequest,
  BatchBugOperation,
  BugComment,
  BugAttachment
} from '../types/bug';
import { bugAPI } from '../services/api';

interface BugStore {
  // 状态
  bugs: Bug[];
  selectedBug: Bug | null;
  loading: boolean;
  statistics: BugStatistics | null;
  filters: BugFilters;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // 操作
  fetchBugs: (filters?: BugFilters, page?: number, pageSize?: number) => Promise<void>;
  createBug: (bug: CreateBugRequest) => Promise<Bug>;
  updateBug: (bug: UpdateBugRequest) => Promise<Bug>;
  deleteBug: (id: string) => Promise<void>;
  assignBug: (request: AssignBugRequest) => Promise<void>;
  updateBugStatus: (request: UpdateBugStatusRequest) => Promise<void>;
  addBugComment: (request: AddBugCommentRequest) => Promise<void>;
  batchOperation: (operation: BatchBugOperation) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  getUnresolvedBugsByDate: () => Array<{date: string, value: number, type: string}>;
  setSelectedBug: (bug: Bug | null) => void;
  setFilters: (filters: BugFilters) => void;
  resetFilters: () => void;
}

export const useBugStore = create<BugStore>((set, get) => ({
  // 初始状态
  bugs: [],
  selectedBug: null,
  loading: false,
  statistics: null,
  filters: {},
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0
  },

  // 获取Bug列表
  fetchBugs: async (filters = {}, page = 1, pageSize = 20) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.getBugs({
        ...filters,
        page,
        limit: pageSize
      });
      
      if (response.data && response.data.success) {
        const { bugs, pagination: paginationData } = response.data.data;
        
        set({
          bugs,
          pagination: {
            current: paginationData.current || page,
            pageSize: paginationData.pageSize || pageSize,
            total: paginationData.total || bugs.length
          },
          loading: false
        });
      } else {
        throw new Error(response.data?.message || '获取Bug列表失败');
      }
    } catch (error: any) {
      console.error('获取Bug列表失败:', error);
      set({ loading: false });
    }
  },

  // 创建Bug
  createBug: async (bugData: CreateBugRequest) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.createBug(bugData);
      
      if (response.data && response.data.success) {
        const newBug = response.data.data;
        
        set(state => ({
          bugs: [...state.bugs, newBug],
          loading: false
        }));

        return newBug;
      } else {
        throw new Error(response.data?.message || '创建Bug失败');
      }
    } catch (error: any) {
      console.error('创建Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 更新Bug
  updateBug: async (bugData: UpdateBugRequest) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.updateBug(bugData.id, bugData);
      
      if (response.data && response.data.success) {
        const updatedBug = response.data.data;
        
        set(state => ({
          bugs: state.bugs.map(bug => bug.id === bugData.id ? updatedBug : bug),
          selectedBug: state.selectedBug?.id === bugData.id ? updatedBug : state.selectedBug,
          loading: false
        }));

        return updatedBug;
      } else {
        throw new Error(response.data?.message || '更新Bug失败');
      }
    } catch (error: any) {
      console.error('更新Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 删除Bug
  deleteBug: async (id: string) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.deleteBug(id);
      
      if (response.data && response.data.success) {
        set(state => ({
          bugs: state.bugs.filter(bug => bug.id !== id),
          selectedBug: state.selectedBug?.id === id ? null : state.selectedBug,
          loading: false
        }));
      } else {
        throw new Error(response.data?.message || '删除Bug失败');
      }
    } catch (error: any) {
      console.error('删除Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 分配Bug
  assignBug: async (request: AssignBugRequest) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.assignBug(request.bugId, request.assignee);
      
      if (response.data && response.data.success) {
        // 重新获取Bug列表以获取最新数据
        const { filters, pagination } = get();
        get().fetchBugs(filters, pagination.current, pagination.pageSize);
      } else {
        throw new Error(response.data?.message || '分配Bug失败');
      }
    } catch (error: any) {
      console.error('分配Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 更新Bug状态
  updateBugStatus: async (request: UpdateBugStatusRequest) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.updateBugStatus(request.bugId, request.status);
      
      if (response.data && response.data.success) {
        // 重新获取Bug列表以获取最新数据
        const { filters, pagination } = get();
        get().fetchBugs(filters, pagination.current, pagination.pageSize);
      } else {
        throw new Error(response.data?.message || '更新Bug状态失败');
      }
    } catch (error: any) {
      console.error('更新Bug状态失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 添加Bug评论
  addBugComment: async (request: AddBugCommentRequest) => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.addBugComment(request.bugId, request.content);
      
      if (response.data && response.data.success) {
        // 重新获取Bug列表以获取最新数据
        const { filters, pagination } = get();
        get().fetchBugs(filters, pagination.current, pagination.pageSize);
      } else {
        throw new Error(response.data?.message || '添加Bug评论失败');
      }
    } catch (error: any) {
      console.error('添加Bug评论失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 批量操作
  batchOperation: async (operation: BatchBugOperation) => {
    set({ loading: true });
    try {
      // 根据操作类型调用相应的API
      switch (operation.operation) {
        case 'assign':
          // 批量分配 - 逐个调用API
          for (const bugId of operation.bugIds) {
            await bugAPI.assignBug(bugId, operation.data.assignee);
          }
          break;
        case 'updateStatus':
          // 批量更新状态 - 逐个调用API
          for (const bugId of operation.bugIds) {
            await bugAPI.updateBugStatus(bugId, operation.data.status);
          }
          break;
        case 'delete':
          // 批量删除 - 逐个调用API
          for (const bugId of operation.bugIds) {
            await bugAPI.deleteBug(bugId);
          }
          break;
      }

      // 重新获取当前页面的数据
      const { filters, pagination } = get();
      get().fetchBugs(filters, pagination.current, pagination.pageSize);
    } catch (error: any) {
      console.error('批量操作失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 获取统计数据
  fetchStatistics: async () => {
    set({ loading: true });
    try {
      // 调用真实API
      const response = await bugAPI.getBugStatistics();
      
      if (response.data && response.data.success) {
        set({
          statistics: response.data.data,
          loading: false
        });
      } else {
        throw new Error(response.data?.message || '获取统计数据失败');
      }
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
      set({ loading: false });
    }
  },

  // 获取按日期统计的未解决Bug数据
  getUnresolvedBugsByDate: () => {
    const bugs = get().bugs;
    
    // 按创建日期分组统计Bug总数和未解决数
    const bugsByDate: Record<string, { total: number; unresolved: number }> = {};
    
    bugs.forEach(bug => {
      const date = new Date(bug.createdAt).toISOString().split('T')[0]; // 获取YYYY-MM-DD格式
      if (!bugsByDate[date]) {
        bugsByDate[date] = { total: 0, unresolved: 0 };
      }
      bugsByDate[date].total++;
      
      // 统计未解决的Bug：只要状态不是"已解决"的都算作未解决
      if (bug.status !== '已解决') {
        bugsByDate[date].unresolved++;
      }
    });
    
    // 转换为图表数据格式，按日期排序
    const sortedDates = Object.keys(bugsByDate).sort();
    return sortedDates.map(date => ({
      date,
      value: bugsByDate[date].unresolved, // 直接使用未解决数
      type: '未解决Bug'
    }));
  },

  // 设置选中的Bug
  setSelectedBug: (bug: Bug | null) => {
    set({ selectedBug: bug });
  },

  // 设置过滤器
  setFilters: (filters: BugFilters) => {
    set({ filters });
  },

  // 重置过滤器
  resetFilters: () => {
    set({ filters: {} });
  }
})); 