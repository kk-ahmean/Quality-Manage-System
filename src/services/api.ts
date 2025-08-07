import axios from 'axios';
import { apiConfig } from '../config/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API请求错误:', error);
    console.error('错误响应:', error.response);
    
    if (error.response?.status === 401) {
      // 未授权，清除token并跳转到登录页
      localStorage.removeItem('auth-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post('/auth/login', credentials),
  
  register: (userData: { name: string; email: string; password: string; role: string }) =>
    apiClient.post('/auth/register', userData),
  
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
};

// Bug相关API
export const bugAPI = {
  getBugs: (params?: any) =>
    apiClient.get('/bugs', { params }),
  
  getBug: (id: string) =>
    apiClient.get(`/bugs/${id}`),
  
  createBug: (bugData: any) =>
    apiClient.post('/bugs', bugData),
  
  updateBug: (id: string, bugData: any) =>
    apiClient.put(`/bugs/${id}`, bugData),
  
  deleteBug: (id: string) =>
    apiClient.delete(`/bugs/${id}`),
  
  assignBug: (id: string, assigneeId: string) =>
    apiClient.patch(`/bugs/${id}/assign`, { assigneeId }),
  
  updateBugStatus: (id: string, status: string) =>
    apiClient.patch(`/bugs/${id}/status`, { status }),
  
  addBugComment: (id: string, comment: string) =>
    apiClient.post(`/bugs/${id}/comments`, { content: comment }),
  
  getBugStatistics: () =>
    apiClient.get('/bugs/statistics'),
};

// 用户相关API
export const userAPI = {
  getUsers: (params?: any) =>
    apiClient.get('/users', { params }),
  
  getUser: (id: string) =>
    apiClient.get(`/users/${id}`),
  
  createUser: (userData: any) =>
    apiClient.post('/users', userData),
  
  updateUser: (id: string, userData: any) =>
    apiClient.put(`/users/${id}`, userData),
  
  deleteUser: (id: string) =>
    apiClient.delete(`/users/${id}`),
  
  updateUserPassword: (id: string, password: string) =>
    apiClient.patch(`/users/${id}/password`, { password }),
  
  // 团队管理API
  getTeams: () =>
    apiClient.get('/users/teams'),
  
  createTeam: (teamData: any) =>
    apiClient.post('/users/teams', teamData),
  
  updateTeam: (id: string, teamData: any) =>
    apiClient.put(`/users/teams/${id}`, teamData),
  
  deleteTeam: (id: string) =>
    apiClient.delete(`/users/teams/${id}`),
  
  // 权限管理API
  updateUserPermissions: (id: string, permissions: any) =>
    apiClient.patch(`/users/${id}/permissions`, { permissions }),
  
  // 用户活动日志API
  getUserActivityLogs: (userId: string, params?: any) =>
    apiClient.get(`/users/${userId}/activity-logs`, { params }),
  
  logUserActivity: (userId: string, activityData: any) =>
    apiClient.post(`/users/${userId}/activity-logs`, activityData),
};

// 项目相关API
export const projectAPI = {
  getProjects: (params?: any) =>
    apiClient.get('/projects', { params }),
  
  getProject: (id: string) =>
    apiClient.get(`/projects/${id}`),
  
  createProject: (projectData: any) =>
    apiClient.post('/projects', projectData),
  
  updateProject: (id: string, projectData: any) =>
    apiClient.put(`/projects/${id}`, projectData),
  
  deleteProject: (id: string) =>
    apiClient.delete(`/projects/${id}`),
  
  getProjectStatistics: (id: string) =>
    apiClient.get(`/projects/${id}/statistics`),
};

// 任务相关API
export const taskAPI = {
  getTasks: (params?: any) =>
    apiClient.get('/tasks', { params }),
  
  getTask: (id: string) =>
    apiClient.get(`/tasks/${id}`),
  
  createTask: (taskData: any) =>
    apiClient.post('/tasks', taskData),
  
  updateTask: (id: string, taskData: any) =>
    apiClient.put(`/tasks/${id}`, taskData),
  
  deleteTask: (id: string) =>
    apiClient.delete(`/tasks/${id}`),
  
  assignTask: (id: string, assignee: string) =>
    apiClient.patch(`/tasks/${id}/assign`, { assignee }),
  
  updateTaskStatus: (id: string, status: string) =>
    apiClient.patch(`/tasks/${id}/status`, { status }),
};

// 系统健康检查API
export const systemAPI = {
  health: () =>
    apiClient.get('/health'),
  
  getSystemLogs: (params?: any) =>
    apiClient.get('/system/logs', { params }),
  
  getSystemSettings: () =>
    apiClient.get('/system/settings'),
  
  updateSystemSettings: (settings: any) =>
    apiClient.put('/system/settings', settings),
};

export default apiClient; 