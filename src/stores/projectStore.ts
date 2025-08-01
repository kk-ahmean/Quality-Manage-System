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

// 模拟数据
const mockProjects: Project[] = [
  {
    id: '1',
    model: 'XH-001',
    sku: 'SKU001',
    interfaceFeatures: 'USB-C, HDMI, WiFi 6',
    productImages: [],
    level: 'L1',
    trade: '内外贸',
    supplier: '供应商A',
    stages: [
      { 
        stage: 'EVT', 
        sampleQuantity: 10, 
        sampleReason: '功能验证',
        testResult: 'PASS',
        approvalVersion: 'v1.0'
      },
      { 
        stage: 'DVT', 
        sampleQuantity: 20, 
        sampleReason: '设计验证',
        testResult: 'PASS',
        approvalVersion: 'v1.1'
      }
    ],
    hardwareSolution: 'ARM架构，4核处理器',
    versions: [
      {
        id: 'v1',
        hardwareVersion: 'HW-1.0',
        softwareVersion: 'SW-1.0',
        description: '初始版本',
        createdAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 'v2',
        hardwareVersion: 'HW-1.1',
        softwareVersion: 'SW-1.1',
        description: '优化版本',
        createdAt: '2024-01-20T14:20:00Z'
      }
    ],
    remarks: '重点项目，需要重点关注',
    members: [
      { userId: 'user1', userName: '张三', role: '研发' },
      { userId: 'user2', userName: '李四', role: '测试' },
      { userId: 'user3', userName: '王五', role: '项目' }
    ],
    status: '研发设计',
    creator: 'user1',
    creatorName: '张三',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    model: 'XH-002',
    sku: 'SKU002',
    interfaceFeatures: 'Type-C, DisplayPort, 5G',
    productImages: [],
    level: 'L2',
    trade: '内贸',
    supplier: '供应商B',
    stages: [
      { 
        stage: 'EVT', 
        sampleQuantity: 5, 
        sampleReason: '初步验证',
        testResult: '条件接收',
        approvalVersion: 'v0.5'
      }
    ],
    hardwareSolution: 'x86架构，8核处理器',
    versions: [
      {
        id: 'v3',
        hardwareVersion: 'HW-2.0',
        softwareVersion: 'SW-2.0',
        description: '测试版本',
        createdAt: '2024-01-16T14:20:00Z'
      }
    ],
    remarks: '中等优先级项目',
    members: [
      { userId: 'user2', userName: '李四', role: '测试' },
      { userId: 'user4', userName: '赵六', role: '产品' }
    ],
    status: 'EVT',
    creator: 'user2',
    creatorName: '李四',
    createdAt: '2024-01-16T14:20:00Z',
    updatedAt: '2024-01-16T14:20:00Z'
  }
];

// 模拟文件上传
const mockFileUpload = async (file: File): Promise<ProjectAttachment> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        type: file.type,
        uploadedBy: useAuthStore.getState().user?.id || 'unknown',
        uploadedAt: new Date().toISOString()
      });
    }, 1000);
  });
};

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
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredProjects = [...mockProjects];
      
      // 应用筛选条件
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredProjects = filteredProjects.filter(project => 
          project.model.toLowerCase().includes(keyword) ||
          project.sku.toLowerCase().includes(keyword) ||
          project.supplier?.toLowerCase().includes(keyword)
        );
      }
      
      if (filters.level?.length) {
        filteredProjects = filteredProjects.filter(project => 
          filters.level!.includes(project.level)
        );
      }
      
      if (filters.trade?.length) {
        filteredProjects = filteredProjects.filter(project => 
          filters.trade!.includes(project.trade)
        );
      }
      
      if (filters.status?.length) {
        filteredProjects = filteredProjects.filter(project => 
          filters.status!.includes(project.status)
        );
      }
      
      if (filters.member) {
        filteredProjects = filteredProjects.filter(project => 
          project.members.some(member => member.userId === filters.member)
        );
      }
      
      // 分页
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedProjects = filteredProjects.slice(start, end);
      
      set({
        projects: paginatedProjects,
        pagination: {
          current: page,
          pageSize,
          total: filteredProjects.length
        },
        loading: false
      });
    } catch (error) {
      console.error('获取项目列表失败:', error);
      set({ loading: false });
    }
  },

  // 创建项目
  createProject: async (projectData: CreateProjectRequest) => {
    set({ loading: true });
    
    try {
      // 模拟文件上传
      let productImages: ProjectAttachment[] = [];
      
      if (projectData.productImages?.length) {
        productImages = await Promise.all(
          projectData.productImages.map(file => mockFileUpload(file))
        );
      }
      
      // 处理版本信息
      const versions: ProjectVersionInfo[] = (projectData.versions || []).map((version, index) => ({
        id: `v${Date.now()}-${index}`,
        ...version,
        createdAt: new Date().toISOString()
      }));
      
      const currentUser = useAuthStore.getState().user;
      const newProject: Project = {
        id: Math.random().toString(36).substr(2, 9),
        ...projectData,
        productImages,
        versions,
        status: projectData.status || '研发设计',
        creator: currentUser?.id || 'unknown',
        creatorName: currentUser?.name || '未知用户',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 添加到模拟数据
      mockProjects.push(newProject);
      
      // 记录系统日志
      useAuthStore.getState().logSystemActivity(
        currentUser?.id || 'unknown',
        'CREATE_PROJECT',
        `创建项目: ${newProject.model} (${newProject.sku})`
      );
      
      set({ loading: false });
      return newProject;
    } catch (error) {
      console.error('创建项目失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 更新项目
  updateProject: async (projectData: UpdateProjectRequest) => {
    set({ loading: true });
    
    try {
      const projectIndex = mockProjects.findIndex(p => p.id === projectData.id);
      if (projectIndex === -1) {
        throw new Error('项目不存在');
      }
      
      const currentProject = mockProjects[projectIndex];
      
      // 检查权限
      if (!get().canEditProject(currentProject)) {
        throw new Error('无权限编辑此项目');
      }
      
      // 模拟文件上传
      let productImages = currentProject.productImages || [];
      if (projectData.productImages?.length) {
        const newImages = await Promise.all(
          projectData.productImages.map(file => mockFileUpload(file))
        );
        productImages = [...productImages, ...newImages];
      }
      
      // 处理版本信息
      let versions = currentProject.versions || [];
      if (projectData.versions?.length) {
        const newVersions: ProjectVersionInfo[] = projectData.versions.map((version, index) => ({
          id: `v${Date.now()}-${index}`,
          ...version,
          createdAt: new Date().toISOString()
        }));
        versions = [...versions, ...newVersions];
      }
      
      const updatedProject: Project = {
        ...currentProject,
        ...projectData,
        productImages,
        versions,
        updatedAt: new Date().toISOString()
      };
      
      mockProjects[projectIndex] = updatedProject;
      
      // 记录系统日志
      const currentUser = useAuthStore.getState().user;
      useAuthStore.getState().logSystemActivity(
        currentUser?.id || 'unknown',
        'UPDATE_PROJECT',
        `更新项目: ${updatedProject.model} (${updatedProject.sku})`
      );
      
      set({ loading: false });
      return updatedProject;
    } catch (error) {
      console.error('更新项目失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 删除项目
  deleteProject: async (id: string) => {
    set({ loading: true });
    
    try {
      const project = mockProjects.find(p => p.id === id);
      if (!project) {
        throw new Error('项目不存在');
      }
      
      // 检查权限
      if (!get().canDeleteProject(project)) {
        throw new Error('无权限删除此项目');
      }
      
      const projectIndex = mockProjects.findIndex(p => p.id === id);
      mockProjects.splice(projectIndex, 1);
      
      // 记录系统日志
      const currentUser = useAuthStore.getState().user;
      useAuthStore.getState().logSystemActivity(
        currentUser?.id || 'unknown',
        'DELETE_PROJECT',
        `删除项目: ${project.model} (${project.sku})`
      );
      
      set({ loading: false });
    } catch (error) {
      console.error('删除项目失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 获取统计数据
  fetchStatistics: async () => {
    try {
      const projects = mockProjects;
      
      const statistics: ProjectStatistics = {
        total: projects.length,
        byStatus: {
          '进行中': projects.filter(p => p.status === '进行中').length,
          '已完成': projects.filter(p => p.status === '已完成').length,
          '已暂停': projects.filter(p => p.status === '已暂停').length,
          '已取消': projects.filter(p => p.status === '已取消').length
        },
        byLevel: {
          'L1': projects.filter(p => p.level === 'L1').length,
          'L2': projects.filter(p => p.level === 'L2').length,
          'L3': projects.filter(p => p.level === 'L3').length
        },
        byTrade: {
          '内贸': projects.filter(p => p.trade === '内贸').length,
          '外贸': projects.filter(p => p.trade === '外贸').length,
          '内外贸': projects.filter(p => p.trade === '内外贸').length
        },
        byStage: {
          'EVT': projects.filter(p => p.stages.some(s => s.stage === 'EVT')).length,
          'DVT': projects.filter(p => p.stages.some(s => s.stage === 'DVT')).length,
          'PVT': projects.filter(p => p.stages.some(s => s.stage === 'PVT')).length,
          'MP': projects.filter(p => p.stages.some(s => s.stage === 'MP')).length,
          '其他': projects.filter(p => p.stages.some(s => s.stage === '其他')).length
        }
      };
      
      set({ statistics });
    } catch (error) {
      console.error('获取统计数据失败:', error);
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
    if (!currentUser) return false;
    
    // 创建人或管理员可以编辑
    return project.creator === currentUser.id || currentUser.role === 'admin';
  },

  // 权限检查 - 是否可以删除项目
  canDeleteProject: (project: Project) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) return false;
    
    // 创建人或管理员可以删除
    return project.creator === currentUser.id || currentUser.role === 'admin';
  }
})); 