import { create } from 'zustand'
import { 
  User, 
  Team, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters, 
  UserListResponse,
  Permission,
  RolePermissions,
  UserActivityLog,
  BatchUserOperation
} from '../types/user'
import { addUserToGlobalStore } from './authStore'
import { userAPI } from '../services/api'

interface UserState {
  users: User[]
  teams: Team[]
  currentUser: User | null
  loading: boolean
  error: string | null
  filters: UserFilters
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  selectedUsers: string[] // 批量操作选中的用户
  activityLogs: UserActivityLog[]
}

interface UserActions {
  // 用户列表相关
  fetchUsers: (filters?: UserFilters, page?: number, pageSize?: number) => Promise<void>
  createUser: (userData: CreateUserRequest) => Promise<void>
  updateUser: (userData: UpdateUserRequest) => Promise<void>
  deleteUser: (userId: string) => Promise<void>
  getUserById: (userId: string) => User | undefined
  
  // 团队相关
  fetchTeams: () => Promise<void>
  createTeam: (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateTeam: (teamId: string, teamData: Partial<Team>) => Promise<void>
  deleteTeam: (teamId: string) => Promise<void>
  
  // 权限管理
  getRolePermissions: (role: string) => Permission[]
  checkUserPermission: (userId: string, permission: Permission) => boolean
  updateUserPermissions: (userId: string, permissions: Permission[]) => Promise<void>
  
  // 批量操作
  setSelectedUsers: (userIds: string[]) => void
  batchOperation: (operation: BatchUserOperation) => Promise<void>
  
  // 用户活动日志
  fetchUserActivityLogs: (userId: string) => Promise<void>
  logUserActivity: (userId: string, action: string, description: string) => Promise<void>
  
  // 状态管理
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: UserFilters) => void
  clearError: () => void
}

type UserStore = UserState & UserActions

// 角色权限映射
const rolePermissions: RolePermissions = {
  admin: [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'team:read', 'team:create', 'team:update', 'team:delete',
    'bug:read', 'bug:create', 'bug:update', 'bug:delete',
    'task:read', 'task:create', 'task:update', 'task:delete',
    'dashboard:read', 'system:settings'
  ],
  product_engineer: [
    'user:read', 'team:read', 'bug:read', 'bug:create', 'bug:update',
    'task:read', 'task:create', 'task:update', 'dashboard:read'
  ],
  project_engineer: [
    'user:read', 'team:read', 'team:update',
    'bug:read', 'bug:create', 'bug:update',
    'task:read', 'task:create', 'task:update', 'task:delete',
    'dashboard:read'
  ],
  developer: [
    'user:read', 'team:read',
    'bug:read', 'bug:update',
    'task:read', 'task:update',
    'dashboard:read'
  ],
  dqe: [
    'user:read', 'team:read',
    'bug:read', 'bug:create', 'bug:update',
    'task:read', 'task:update',
    'dashboard:read'
  ],
  tester: [
    'user:read', 'team:read',
    'bug:read', 'bug:create', 'bug:update',
    'task:read',
    'dashboard:read'
  ]
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  teams: [],
  currentUser: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },
  selectedUsers: [],
  activityLogs: [],

  fetchUsers: async (filters = {}, page = 1, pageSize = 10) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.getUsers({
        ...filters,
        page,
        pageSize
      })
      
      if (response.data && response.data.success) {
        const { users, pagination } = response.data.data
        
        // 统一处理用户ID字段，将_id映射为id
        const normalizedUsers = users.map(user => ({
          ...user,
          id: user._id || user.id
        }))
        
        set({
          users: normalizedUsers,
          pagination: {
            page: pagination.page || page,
            pageSize: pagination.pageSize || pageSize,
            total: pagination.total || users.length
          },
          filters,
          loading: false
        })
      } else {
        throw new Error(response.data?.message || '获取用户列表失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '获取用户列表失败'
      })
    }
  },

  createUser: async (userData: CreateUserRequest) => {
    set({ loading: true, error: null })
    
    try {
      console.log('发送用户数据:', userData)
      
      // 调用真实API
      const response = await userAPI.createUser(userData)
      
      console.log('API响应:', response)
      
      if (response.data && response.data.success) {
        const newUser = response.data.data
        
        // 统一处理用户ID字段
        const normalizedUser = {
          ...newUser,
          id: newUser._id || newUser.id
        }
        
        // 添加到全局存储
        addUserToGlobalStore(normalizedUser)
        
        // 调试信息
        console.log('创建用户成功:', {
          username: newUser.username,
          newUser: newUser
        })
        
        // 记录活动日志
        await get().logUserActivity(newUser.id, 'CREATE_USER', `创建用户: ${userData.name}`)
        
        // 重新获取用户列表
        await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
        
        set({ loading: false })
      } else {
        throw new Error(response.data?.message || '创建用户失败')
      }
    } catch (error: any) {
      console.error('创建用户错误:', error)
      console.error('错误响应:', error.response)
      
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '创建用户失败'
      })
    }
  },

  updateUser: async (userData: UpdateUserRequest) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.updateUser(userData.id, userData)
      
      if (response.data && response.data.success) {
        const updatedUser = response.data.data
        
        // 记录活动日志
        await get().logUserActivity(userData.id, 'UPDATE_USER', `更新用户信息: ${userData.name || updatedUser.name}`)
        
        // 重新获取用户列表
        await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
        
        set({ loading: false })
      } else {
        throw new Error(response.data?.message || '更新用户失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '更新用户失败'
      })
    }
  },

  deleteUser: async (userId: string) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.deleteUser(userId)
      
      if (response.data && response.data.success) {
        // 记录活动日志
        await get().logUserActivity(userId, 'DELETE_USER', `删除用户`)
        
        // 重新获取用户列表
        await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
        
        set({ loading: false })
      } else {
        throw new Error(response.data?.message || '删除用户失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '删除用户失败'
      })
    }
  },

  getUserById: (userId: string) => {
    return get().users.find(user => user.id === userId)
  },

  fetchTeams: async () => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.getTeams()
      
      if (response.data && response.data.success) {
        set({
          teams: response.data.data,
          loading: false
        })
      } else {
        throw new Error(response.data?.message || '获取团队列表失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '获取团队列表失败'
      })
    }
  },

  createTeam: async (teamData) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.createTeam(teamData)
      
      if (response.data && response.data.success) {
        // 重新获取团队列表
        await get().fetchTeams()
        
        set({ loading: false })
      } else {
        throw new Error(response.data?.message || '创建团队失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '创建团队失败'
      })
    }
  },

  updateTeam: async (teamId: string, teamData: Partial<Team>) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.updateTeam(teamId, teamData)
      
      if (response.data && response.data.success) {
        // 重新获取团队列表
        await get().fetchTeams()
        
        set({ loading: false })
      } else {
        throw new Error(response.data?.message || '更新团队失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '更新团队失败'
      })
    }
  },

  deleteTeam: async (teamId: string) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.deleteTeam(teamId)
      
      if (response.data && response.data.success) {
        // 重新获取团队列表
        await get().fetchTeams()
        
        set({ loading: false })
      } else {
        throw new Error(response.data?.message || '删除团队失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '删除团队失败'
      })
    }
  },

  // 权限管理
  getRolePermissions: (role: string) => {
    return rolePermissions[role] || []
  },

  checkUserPermission: (userId: string, permission: Permission) => {
    const user = get().users.find(u => u.id === userId)
    if (!user) return false
    
    return user.permissions?.includes(permission) || false
  },

  updateUserPermissions: async (userId: string, permissions: Permission[]) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.updateUserPermissions(userId, permissions)
      
      if (response.data && response.data.success) {
        // 更新本地状态中的用户权限
        set(state => ({
          users: state.users.map(user => 
            user.id === userId 
              ? { ...user, permissions: permissions }
              : user
          ),
          loading: false
        }))
        
        // 记录活动日志
        await get().logUserActivity(userId, 'UPDATE_PERMISSIONS', `更新用户权限`)
      } else {
        throw new Error(response.data?.message || '更新用户权限失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '更新用户权限失败'
      })
    }
  },

  // 批量操作
  setSelectedUsers: (userIds: string[]) => {
    set({ selectedUsers: userIds })
  },

  batchOperation: async (operation: BatchUserOperation) => {
    set({ loading: true, error: null })
    
    try {
      // 根据操作类型调用相应的API
      switch (operation.operation) {
        case 'enable':
          // 批量启用 - 逐个调用API
          for (const userId of operation.userIds) {
            await userAPI.updateUser(userId, { status: 'active' })
          }
          break
        case 'disable':
          // 批量禁用 - 逐个调用API
          for (const userId of operation.userIds) {
            await userAPI.updateUser(userId, { status: 'inactive' })
          }
          break
        case 'delete':
          // 批量删除 - 逐个调用API
          for (const userId of operation.userIds) {
            await userAPI.deleteUser(userId)
          }
          break
        case 'changeRole':
          // 批量更改角色 - 逐个调用API
          if (operation.role) {
            for (const userId of operation.userIds) {
              await userAPI.updateUser(userId, { role: operation.role })
            }
          }
          break
      }
      
      // 记录活动日志
      await get().logUserActivity('system', 'BATCH_OPERATION', `批量操作: ${operation.operation}`)
      
      // 重新获取用户列表
      await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
      
      set({ loading: false, selectedUsers: [] })
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '批量操作失败'
      })
    }
  },

  // 用户活动日志
  fetchUserActivityLogs: async (userId: string) => {
    set({ loading: true, error: null })
    
    try {
      // 调用真实API
      const response = await userAPI.getUserActivityLogs(userId)
      
      if (response.data && response.data.success) {
        set({
          activityLogs: response.data.data,
          loading: false
        })
      } else {
        throw new Error(response.data?.message || '获取用户活动日志失败')
      }
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || '获取用户活动日志失败'
      })
    }
  },

  logUserActivity: async (userId: string, action: string, description: string) => {
    try {
      // 调用真实API
      const response = await userAPI.logUserActivity(userId, {
        action,
        description,
        resourceType: 'user',
        resourceId: userId,
        severity: 'low',
        status: 'success'
      })
      
      if (response.data && response.data.success) {
        console.log('记录用户活动成功:', response.data.data)
      } else {
        console.error('记录用户活动失败:', response.data?.message)
      }
    } catch (error) {
      console.error('记录用户活动失败:', error)
    }
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  setFilters: (filters: UserFilters) => {
    set({ filters })
  },

  clearError: () => {
    set({ error: null })
  }
})) 