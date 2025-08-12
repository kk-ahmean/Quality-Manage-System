import { Permission } from '../types/user';

// 管理员权限 - 拥有所有权限
export const ADMIN_PERMISSIONS: Permission[] = [
  // 用户管理权限
  'user:read', 'user:create', 'user:update', 'user:delete',
  // 团队管理权限
  'team:read', 'team:create', 'team:update', 'team:delete',
  // Bug管理权限
  'bug:read', 'bug:create', 'bug:update', 'bug:delete',
  // 任务管理权限
  'task:read', 'task:create', 'task:update', 'task:delete',
  // 项目管理权限
  'project:read', 'project:create', 'project:update', 'project:delete',
  // 系统权限
  'dashboard:read', 'system:settings'
];

// 新用户默认权限 - 基础权限，包括创建者删除权限
export const DEFAULT_USER_PERMISSIONS: Permission[] = [
  // 用户管理权限
  'user:read',
  // 团队管理权限
  'team:read', 'team:create', 'team:update', 'team:delete',
  // Bug管理权限
  'bug:read', 'bug:create', 'bug:update',
  // 任务管理权限
  'task:read', 'task:create', 'task:update', 'task:delete',
  // 项目管理权限
  'project:read', 'project:create', 'project:update', 'project:delete',
  // 系统权限
  'dashboard:read', 'system:settings'
];

// 根据角色获取默认权限
export const getDefaultPermissionsByRole = (role: string): Permission[] => {
  switch (role) {
    case 'admin':
      return ADMIN_PERMISSIONS;
    default:
      return DEFAULT_USER_PERMISSIONS;
  }
};

// 检查用户是否有特定权限
export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
  return userPermissions.includes(requiredPermission);
};

// 检查用户是否有多个权限中的任意一个
export const hasAnyPermission = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
};

// 检查用户是否有所有指定权限
export const hasAllPermissions = (userPermissions: Permission[], requiredPermissions: Permission[]): boolean => {
  return requiredPermissions.every(permission => userPermissions.includes(permission));
};

// 检查用户是否为管理员
export const isAdmin = (userPermissions: Permission[]): boolean => {
  return hasPermission(userPermissions, 'user:delete');
};

// 检查用户是否为创建者（通过比较用户ID）
export const isCreator = (userId: string, creatorId: string): boolean => {
  return userId === creatorId;
};

// 检查用户是否有删除权限（管理员或创建者）
export const hasDeletePermission = (
  userPermissions: Permission[], 
  userId: string, 
  creatorId: string
): boolean => {
  return isAdmin(userPermissions) || isCreator(userId, creatorId);
};

// 检查用户是否有特定资源的删除权限
export const hasResourceDeletePermission = (
  userPermissions: Permission[],
  userId: string,
  resourceCreatorId: string,
  resourceType: 'user' | 'team' | 'bug' | 'task' | 'project'
): boolean => {
  // 管理员拥有所有删除权限
  if (isAdmin(userPermissions)) {
    return true;
  }
  
  // 对于Bug，只有管理员可以删除
  if (resourceType === 'bug') {
    return false;
  }
  
  // 创建者拥有删除权限（除了Bug）
  if (isCreator(userId, resourceCreatorId)) {
    return true;
  }
  
  // 检查是否有特定资源的删除权限
  const deletePermission = `${resourceType}:delete` as Permission;
  return hasPermission(userPermissions, deletePermission);
};

// 检查用户是否可以查看删除按钮
export const canShowDeleteButton = (
  userPermissions: Permission[],
  userId: string,
  resourceCreatorId: string,
  resourceType: 'user' | 'team' | 'bug' | 'task' | 'project'
): boolean => {
  return hasResourceDeletePermission(userPermissions, userId, resourceCreatorId, resourceType);
};

// 获取用户的所有权限文本描述
export const getPermissionText = (permission: Permission): string => {
  const permissionTexts: Record<Permission, string> = {
    // 用户管理权限
    'user:read': '查看用户',
    'user:create': '创建用户',
    'user:update': '编辑用户',
    'user:delete': '删除用户',
    // 团队管理权限
    'team:read': '查看团队',
    'team:create': '创建团队',
    'team:update': '编辑团队',
    'team:delete': '删除团队',
    // Bug管理权限
    'bug:read': '查看Bug',
    'bug:create': '创建Bug',
    'bug:update': '编辑Bug',
    'bug:delete': '删除Bug',
    // 任务管理权限
    'task:read': '查看任务',
    'task:create': '创建任务',
    'task:update': '编辑任务',
    'task:delete': '删除任务',
    // 项目管理权限
    'project:read': '查看项目',
    'project:create': '创建项目',
    'project:update': '编辑项目',
    'project:delete': '删除项目',
    // 系统权限
    'dashboard:read': '查看仪表盘',
    'system:settings': '系统设置'
  };
  
  return permissionTexts[permission] || permission;
}; 