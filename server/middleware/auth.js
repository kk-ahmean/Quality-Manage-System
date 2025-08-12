import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// JWT认证中间件
export const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '访问令牌缺失'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    let user;
    if (global.memoryDB) {
      // 内存数据库模式
      user = global.memoryDB.users.find(u => u._id === decoded.id);
      if (user) {
        // 移除密码字段
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    } else {
      // MongoDB模式
      user = await User.findById(decoded.id).select('-password');
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '用户账户已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error('认证失败:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的访问令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '访问令牌已过期'
      });
    }

    res.status(500).json({
      success: false,
      message: '认证服务错误'
    });
  }
};

// 可选认证中间件（不强制要求登录）
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 继续执行，但不设置用户信息
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.status === 'active') {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // 忽略认证错误，继续执行
    next();
  }
};

// 角色权限中间件
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    next();
  };
};

// 权限检查中间件
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    // 检查用户是否有权限字段
    if (!req.user.permissions || !Array.isArray(req.user.permissions)) {
      console.error('用户权限字段缺失或格式错误:', req.user);
      return res.status(403).json({
        success: false,
        message: '用户权限不足'
      });
    }

    // 检查是否包含所需权限
    if (!req.user.permissions.includes(permission)) {
      console.log('权限检查失败:', {
        required: permission,
        userPermissions: req.user.permissions,
        userId: req.user._id || req.user.id
      });
      return res.status(403).json({
        success: false,
        message: '用户权限不足'
      });
    }

    next();
  };
};

// 创建者权限检查中间件（用于删除操作）
export const requireCreatorOrAdmin = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '需要登录'
      });
    }

    // 检查是否为管理员
    if (req.user.permissions.includes('user:delete')) {
      return next();
    }

    try {
      const resourceId = req.params.id;
      let resource;

      // 根据资源类型查找资源
      switch (resourceType) {
        case 'task':
          const Task = await import('../models/Task.js');
          resource = await Task.default.findById(resourceId);
          break;
        case 'team':
          const Team = await import('../models/Team.js');
          resource = await Team.default.findById(resourceId);
          break;
        case 'project':
          const Project = await import('../models/Project.js');
          resource = await Project.default.findById(resourceId);
          break;
        case 'bug':
          const Bug = await import('../models/Bug.js');
          resource = await Bug.default.findById(resourceId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: '无效的资源类型'
          });
      }

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: '资源不存在'
        });
      }

      // 检查是否为创建者
      if (resource.creator && resource.creator.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: '只有管理员或创建者可以执行此操作'
      });
    } catch (error) {
      console.error('创建者权限检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '权限检查失败'
      });
    }
  };
}; 