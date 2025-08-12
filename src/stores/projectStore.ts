import { create } from 'zustand';
import { 
  Project, 
  ProjectLevel, 
  ProjectTrade, 
  ProjectStage, 
  ProjectStatus,
  ProjectMember,
  ProjectAttachment,
  ProjectStageInfo,
  ProjectVersionInfo,
  CreateProjectRequest, 
  UpdateProjectRequest, 
  ProjectFilters, 
  ProjectListResponse, 
  ProjectStatistics
} from '../types/project';
import { useAuthStore } from './authStore';
import { projectAPI } from '../services/api';

interface ProjectStore {
  // 状态
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  statistics: ProjectStatistics | null;
  filters: ProjectFilters;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // 操作
  fetchProjects: (filters?: ProjectFilters, page?: number, pageSize?: number) => Promise<void>;
  createProject: (project: CreateProjectRequest) => Promise<Project>;
  updateProject: (project: UpdateProjectRequest) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  setSelectedProject: (project: Project | null) => void;
  setFilters: (filters: ProjectFilters) => void;
  resetFilters: () => void;
  
  // 权限检查
  canEditProject: (project: Project) => boolean;
  canDeleteProject: (project: Project) => boolean;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  // 初始状态
  projects: [],
  selectedProject: null,
  loading: false,
  statistics: null,
  filters: {},
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0
  },

  // 获取项目列表
  fetchProjects: async (filters = {}, page = 1, pageSize = 10) => {
    set({ loading: true });
    
    try {
      // 调用真实API
      const response = await projectAPI.getProjects({
        ...filters,
        page,
        pageSize
      });
      
      if (response.data && response.data.success) {
        const { projects, pagination } = response.data.data;
        
        set({
          projects,
          pagination: {
            current: pagination.current || page,
            pageSize: pagination.pageSize || pageSize,
            total: pagination.total || projects.length
          },
          loading: false
        });
      } else {
        throw new Error(response.data?.message || '获取项目列表失败');
      }
    } catch (error: any) {
      console.error('获取项目列表失败:', error);
      set({ loading: false });
    }
  },

  // 创建项目
  createProject: async (projectData: CreateProjectRequest) => {
    set({ loading: true });
    
    try {
      // 调用真实API
      const response = await projectAPI.createProject(projectData);
      
      if (response.data && response.data.success) {
        const newProject = response.data.data;
        
        // 记录系统日志
        const currentUser = useAuthStore.getState().user;
        useAuthStore.getState().logSystemActivity(
          currentUser?.id || 'unknown',
          'CREATE_PROJECT',
          `创建项目: ${newProject.name || newProject.model}`
        );
        
        set({ loading: false });
        return newProject;
      } else {
        throw new Error(response.data?.message || '创建项目失败');
      }
    } catch (error: any) {
      console.error('创建项目失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 更新项目
  updateProject: async (projectData: UpdateProjectRequest) => {
    set({ loading: true });
    
    try {
      // 调用真实API
      const response = await projectAPI.updateProject(projectData.id, projectData);
      
      if (response.data && response.data.success) {
        const updatedProject = response.data.data;
        
        // 记录系统日志
        const currentUser = useAuthStore.getState().user;
        useAuthStore.getState().logSystemActivity(
          currentUser?.id || 'unknown',
          'UPDATE_PROJECT',
          `更新项目: ${updatedProject.model} (${updatedProject.sku})`
        );
        
        set({ loading: false });
        return updatedProject;
      } else {
        throw new Error(response.data?.message || '更新项目失败');
      }
    } catch (error: any) {
      console.error('更新项目失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 删除项目
  deleteProject: async (id: string) => {
    set({ loading: true });
    
    try {
      // 调用真实API
      const response = await projectAPI.deleteProject(id);
      
      if (response.data && response.data.success) {
        // 记录系统日志
        const currentUser = useAuthStore.getState().user;
        useAuthStore.getState().logSystemActivity(
          currentUser?.id || 'unknown',
          'DELETE_PROJECT',
          `删除项目: ${id}`
        );
        
        set({ loading: false });
      } else {
        throw new Error(response.data?.message || '删除项目失败');
      }
    } catch (error: any) {
      console.error('删除项目失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 获取统计数据
  fetchStatistics: async () => {
    set({ loading: true });
    
    try {
      // 调用真实API
      const response = await projectAPI.getProjectStatistics();
      
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

  // 设置选中的项目
  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project });
  },

  // 设置筛选条件
  setFilters: (filters: ProjectFilters) => {
    set({ filters });
  },

  // 重置筛选条件
  resetFilters: () => {
    set({ filters: {} });
  },

  // 权限检查 - 是否可以编辑项目
  canEditProject: (project: Project) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      console.log('权限检查失败: 用户未登录');
      return false;
    }
    
    // 管理员可以编辑所有项目
    if (currentUser.role === 'admin') {
      console.log('权限检查通过: 管理员权限');
      return true;
    }
    
    // 项目创建者可以编辑自己的项目
    if (project.creator === currentUser.id || project.creator === currentUser._id) {
      console.log('权限检查通过: 项目创建者', {
        projectCreator: project.creator,
        currentUserId: currentUser.id,
        currentUser_id: currentUser._id
      });
      return true;
    }
    
    // 检查用户是否有项目编辑权限
    const hasEditPermission = currentUser.permissions?.includes('project:update');
    console.log('权限检查结果:', {
      hasEditPermission,
      userPermissions: currentUser.permissions,
      projectCreator: project.creator,
      currentUserId: currentUser.id
    });
    return hasEditPermission || false;
  },

  // 权限检查 - 是否可以删除项目
  canDeleteProject: (project: Project) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      console.log('权限检查失败: 用户未登录');
      return false;
    }
    
    // 管理员可以删除所有项目
    if (currentUser.role === 'admin') {
      console.log('权限检查通过: 管理员权限');
      return true;
    }
    
    // 项目创建者可以删除自己的项目
    if (project.creator === currentUser.id || project.creator === currentUser._id) {
      console.log('权限检查通过: 项目创建者', {
        projectCreator: project.creator,
        currentUserId: currentUser.id,
        currentUser_id: currentUser._id
      });
      return true;
    }
    
    // 检查用户是否有项目删除权限
    const hasDeletePermission = currentUser.permissions?.includes('project:delete');
    console.log('权限检查结果:', {
      hasDeletePermission,
      userPermissions: currentUser.permissions,
      projectCreator: project.creator,
      currentUserId: currentUser.id
    });
    return hasDeletePermission || false;
  }
})); 