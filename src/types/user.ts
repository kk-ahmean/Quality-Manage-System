export interface User {
  id: string
  _id?: string // MongoDB的_id字段
  email: string
  name: string // 主要用户名字段
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
  sequenceNumber?: number // 添加序号字段，用于表格显示
}

export type UserRole = 'admin' | 'product_engineer' | 'project_engineer' | 'developer' | 'dqe' | 'tester'

export type UserStatus = 'active' | 'inactive'

// 权限定义
export type Permission = 
  // 用户管理权限
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  // 团队管理权限
  | 'team:read'
  | 'team:create'
  | 'team:update'
  | 'team:delete'
  // Bug管理权限
  | 'bug:read'
  | 'bug:create'
  | 'bug:update'
  | 'bug:delete'
  // 任务管理权限
  | 'task:read'
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  // 项目管理权限
  | 'project:read'
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  // 系统权限
  | 'dashboard:read'
  | 'system:settings'

// 角色权限映射
export interface RolePermissions {
  [key: string]: Permission[]
}

export interface TeamMember {
  user: string
  role: 'leader' | 'member' | 'observer'
  joinedAt?: string
  userInfo?: { // 用户信息
    id: string
    name: string
    email: string
    role: string
  }
}

export interface Team {
  id: string
  name: string
  description?: string
  members: TeamMember[] // 团队成员数组
  leader: string // 团队负责人ID
  leaderInfo?: { // 团队负责人信息
    id: string
    name: string
    email: string
    role: string
  }
  creator: string // 创建者ID
  creatorName?: string // 创建者姓名
  department?: string
  status?: string
  tags?: string[]
  settings?: any
  sequenceNumber?: number // 序号
  createdAt: string
  updatedAt: string
}

export interface CreateUserRequest {
  email: string
  name: string // 主要用户名字段
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