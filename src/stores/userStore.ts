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

// 模拟用户数据
const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    name: '系统管理员',
    role: 'admin',
    status: 'active',
    department: '技术部',
    position: '系统管理员',
    permissions: rolePermissions.admin,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-07-29T11:12:55Z'
  },
  {
    id: '2',
    username: 'developer',
    email: 'developer@example.com',
    name: '开发工程师',
    role: 'developer',
    status: 'active',
    department: '技术部',
    position: '前端开发',
    permissions: rolePermissions.developer,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    lastLoginAt: '2024-07-28T15:30:00Z'
  },
  {
    id: '3',
    username: 'tester',
    email: 'tester@example.com',
    name: '测试工程师',
    role: 'tester',
    status: 'active',
    department: '质量部',
    position: '测试工程师',
    permissions: rolePermissions.tester,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    lastLoginAt: '2024-07-27T10:15:00Z'
  },
  {
    id: '4',
    username: 'product_manager',
    email: 'pm@example.com',
    name: '产品经理',
    role: 'product_engineer',
    status: 'active',
    department: '产品部',
    position: '产品经理',
    permissions: rolePermissions.product_engineer,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
    lastLoginAt: '2024-07-26T14:20:00Z'
  },
  {
    id: '5',
    username: 'project_manager',
    email: 'project@example.com',
    name: '项目经理',
    role: 'project_engineer',
    status: 'active',
    department: '项目管理部',
    position: '项目经理',
    permissions: rolePermissions.project_engineer,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
    lastLoginAt: '2024-07-25T09:45:00Z'
  },
  {
    id: '6',
    username: 'dqe_engineer',
    email: 'dqe@example.com',
    name: '质量工程师',
    role: 'dqe',
    status: 'active',
    department: '质量部',
    position: '质量工程师',
    permissions: rolePermissions.dqe,
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-06T00:00:00Z',
    lastLoginAt: '2024-07-24T16:30:00Z'
  }
]

// 模拟团队数据
const mockTeams: Team[] = [
  {
    id: '1',
    name: '前端开发团队',
    description: '负责前端功能开发和维护',
    members: ['2', '3'],
    leader: '2',
    permissions: ['bug:read', 'bug:update', 'task:read', 'task:update'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '质量保证团队',
    description: '负责产品质量把控和测试',
    members: ['3', '6'],
    leader: '6',
    permissions: ['bug:read', 'bug:create', 'bug:update', 'task:read'],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
]

// 模拟用户活动日志
const mockActivityLogs: UserActivityLog[] = [
  {
    id: '1',
    userId: '1',
    action: 'LOGIN',
    description: '用户登录系统',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: '2024-07-29T11:12:55Z'
  },
  {
    id: '2',
    userId: '2',
    action: 'CREATE_BUG',
    description: '创建Bug: 登录页面显示异常',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    createdAt: '2024-07-28T15:30:00Z'
  }
]

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
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let filteredUsers = [...mockUsers]
      
      // 应用过滤器
      if (filters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === filters.role)
      }
      
      if (filters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status)
      }
      
      if (filters.department) {
        filteredUsers = filteredUsers.filter(user => 
          user.department?.toLowerCase().includes(filters.department!.toLowerCase())
        )
      }
      
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        filteredUsers = filteredUsers.filter(user =>
          user.name.toLowerCase().includes(keyword) ||
          user.username.toLowerCase().includes(keyword) ||
          user.email.toLowerCase().includes(keyword)
        )
      }
      
      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedUsers = filteredUsers.slice(start, end)
      
      set({
        users: paginatedUsers,
        pagination: {
          page,
          pageSize,
          total: filteredUsers.length
        },
        filters,
        loading: false
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '获取用户列表失败'
      })
    }
  },

  createUser: async (userData: CreateUserRequest) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 检查用户名是否已存在
      const existingUser = mockUsers.find(user => user.username === userData.username)
      if (existingUser) {
        throw new Error('用户名已存在')
      }
      
      // 检查邮箱是否已存在
      const existingEmail = mockUsers.find(user => user.email === userData.email)
      if (existingEmail) {
        throw new Error('邮箱已存在')
      }
      
      const newUser: User = {
        id: Date.now().toString(),
        username: userData.username,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: 'active',
        phone: userData.phone,
        department: userData.department,
        position: userData.position,
        permissions: userData.permissions || rolePermissions[userData.role],
        password: '123456', // 使用默认密码
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockUsers.push(newUser)
      
      // 添加到全局存储（包含默认密码）
      addUserToGlobalStore(newUser)
      
      // 调试信息
      console.log('创建用户成功:', {
        username: newUser.username,
        password: '123456', // 默认密码
        newUser: newUser
      })
      
      // 记录活动日志
      await get().logUserActivity(newUser.id, 'CREATE_USER', `创建用户: ${userData.name}`)
      
      // 重新获取用户列表
      await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '创建用户失败'
      })
    }
  },

  updateUser: async (userData: UpdateUserRequest) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const userIndex = mockUsers.findIndex(user => user.id === userData.id)
      if (userIndex === -1) {
        throw new Error('用户不存在')
      }
      
      const oldUser = mockUsers[userIndex]
      
      // 更新用户信息
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...userData,
        permissions: userData.permissions || rolePermissions[userData.role || oldUser.role],
        updatedAt: new Date().toISOString()
      }
      
      // 记录活动日志
      await get().logUserActivity(userData.id, 'UPDATE_USER', `更新用户信息: ${userData.name || oldUser.name}`)
      
      // 重新获取用户列表
      await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新用户失败'
      })
    }
  },

  deleteUser: async (userId: string) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const userIndex = mockUsers.findIndex(user => user.id === userId)
      if (userIndex === -1) {
        throw new Error('用户不存在')
      }
      
      // 检查是否为当前登录用户
      const currentUser = get().currentUser
      if (currentUser && currentUser.id === userId) {
        throw new Error('不能删除当前登录用户')
      }
      
      // 检查用户关联数据（这里简化处理）
      const user = mockUsers[userIndex]
      if (user.role === 'admin') {
        throw new Error('不能删除管理员用户')
      }
      
      const deletedUser = mockUsers[userIndex]
      mockUsers.splice(userIndex, 1)
      
      // 记录活动日志
      await get().logUserActivity(userId, 'DELETE_USER', `删除用户: ${deletedUser.name}`)
      
      // 重新获取用户列表
      await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '删除用户失败'
      })
    }
  },

  getUserById: (userId: string) => {
    return mockUsers.find(user => user.id === userId)
  },

  // 获取所有用户数据（供authStore使用）
  getAllUsers: () => {
    return mockUsers
  },

  // 根据用户名获取用户
  getUserByUsername: (username: string) => {
    return mockUsers.find(user => user.username === username)
  },

  fetchTeams: async () => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      set({
        teams: [...mockTeams],
        loading: false
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '获取团队列表失败'
      })
    }
  },

  createTeam: async (teamData) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newTeam: Team = {
        id: Date.now().toString(),
        name: teamData.name,
        description: teamData.description,
        members: teamData.members,
        leader: teamData.leader,
        permissions: teamData.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockTeams.push(newTeam)
      
      // 重新获取团队列表
      await get().fetchTeams()
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '创建团队失败'
      })
    }
  },

  updateTeam: async (teamId: string, teamData: Partial<Team>) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const teamIndex = mockTeams.findIndex(team => team.id === teamId)
      if (teamIndex === -1) {
        throw new Error('团队不存在')
      }
      
      mockTeams[teamIndex] = {
        ...mockTeams[teamIndex],
        ...teamData,
        updatedAt: new Date().toISOString()
      }
      
      // 重新获取团队列表
      await get().fetchTeams()
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新团队失败'
      })
    }
  },

  deleteTeam: async (teamId: string) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const teamIndex = mockTeams.findIndex(team => team.id === teamId)
      if (teamIndex === -1) {
        throw new Error('团队不存在')
      }
      
      mockTeams.splice(teamIndex, 1)
      
      // 重新获取团队列表
      await get().fetchTeams()
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '删除团队失败'
      })
    }
  },

  // 权限管理
  getRolePermissions: (role: string) => {
    return rolePermissions[role] || []
  },

  checkUserPermission: (userId: string, permission: Permission) => {
    const user = mockUsers.find(u => u.id === userId)
    if (!user) return false
    
    return user.permissions?.includes(permission) || false
  },

  updateUserPermissions: async (userId: string, permissions: Permission[]) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const userIndex = mockUsers.findIndex(user => user.id === userId)
      if (userIndex === -1) {
        throw new Error('用户不存在')
      }
      
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        permissions,
        updatedAt: new Date().toISOString()
      }
      
      // 记录活动日志
      await get().logUserActivity(userId, 'UPDATE_PERMISSIONS', `更新用户权限`)
      
      set({ loading: false })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '更新用户权限失败'
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
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      for (const userId of operation.userIds) {
        const userIndex = mockUsers.findIndex(user => user.id === userId)
        if (userIndex === -1) continue
        
        switch (operation.operation) {
          case 'enable':
            mockUsers[userIndex].status = 'active'
            break
          case 'disable':
            mockUsers[userIndex].status = 'inactive'
            break
          case 'delete':
            if (mockUsers[userIndex].role === 'admin') continue
            mockUsers.splice(userIndex, 1)
            break
          case 'changeRole':
            if (operation.role) {
              mockUsers[userIndex].role = operation.role
              mockUsers[userIndex].permissions = rolePermissions[operation.role]
            }
            break
        }
      }
      
      // 记录活动日志
      await get().logUserActivity('system', 'BATCH_OPERATION', `批量操作: ${operation.operation}`)
      
      // 重新获取用户列表
      await get().fetchUsers(get().filters, get().pagination.page, get().pagination.pageSize)
      
      set({ loading: false, selectedUsers: [] })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '批量操作失败'
      })
    }
  },

  // 用户活动日志
  fetchUserActivityLogs: async (userId: string) => {
    set({ loading: true, error: null })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const userLogs = mockActivityLogs.filter(log => log.userId === userId)
      
      set({
        activityLogs: userLogs,
        loading: false
      })
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : '获取用户活动日志失败'
      })
    }
  },

  logUserActivity: async (userId: string, action: string, description: string) => {
    try {
      const newLog: UserActivityLog = {
        id: Date.now().toString(),
        userId,
        action,
        description,
        ipAddress: '192.168.1.100', // 模拟IP地址
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        createdAt: new Date().toISOString()
      }
      
      mockActivityLogs.unshift(newLog)
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