export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  status: UserStatus
  avatar?: string
  phone?: string
  department?: string
  position?: string
  permissions?: string[] // 用户权限列表
  password?: string // 添加密码字段
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export type UserRole = 'admin' | 'product_engineer' | 'project_engineer' | 'developer' | 'dqe' | 'tester'

export type UserStatus = 'active' | 'inactive'

// 权限定义
export type Permission = 
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  | 'team:read'
  | 'team:create'
  | 'team:update'
  | 'team:delete'
  | 'bug:read'
  | 'bug:create'
  | 'bug:update'
  | 'bug:delete'
  | 'task:read'
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  | 'dashboard:read'
  | 'system:settings'

// 角色权限映射
export interface RolePermissions {
  [key: string]: Permission[]
}

export interface Team {
  id: string
  name: string
  description?: string
  members: string[] // 用户ID数组
  leader: string // 团队负责人ID
  permissions?: string[] // 团队权限
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  username: string
  email: string
  name: string
  password?: string // 改为可选字段
  role: UserRole
  phone?: string
  department?: string
  position?: string
  permissions?: Permission[]
}

export interface UpdateUserRequest {
  id: string
  email?: string
  name?: string
  role?: UserRole
  status?: UserStatus
  phone?: string
  department?: string
  position?: string
  permissions?: Permission[]
}

export interface UserFilters {
  role?: UserRole
  status?: UserStatus
  department?: string
  keyword?: string
}

export interface UserListResponse {
  users: User[]
  total: number
  page: number
  pageSize: number
}

// 用户操作日志
export interface UserActivityLog {
  id: string
  userId: string
  action: string
  description: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

// 批量操作请求
export interface BatchUserOperation {
  userIds: string[]
  operation: 'enable' | 'disable' | 'delete' | 'changeRole'
  role?: UserRole
  permissions?: Permission[]
} 