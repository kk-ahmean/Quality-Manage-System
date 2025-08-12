import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/auth.js';

// 根据角色获取默认权限
const getDefaultPermissionsByRole = (role) => {
  const adminPermissions = [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'team:read', 'team:create', 'team:update', 'team:delete',
    'bug:read', 'bug:create', 'bug:update', 'bug:delete',
    'task:read', 'task:create', 'task:update', 'task:delete',
    'project:read', 'project:create', 'project:update', 'project:delete',
    'dashboard:read', 'system:settings'
  ];

  const defaultPermissions = [
    'user:read',
    'team:read', 'team:create', 'team:update',
    'bug:read', 'bug:create', 'bug:update',
    'task:read', 'task:create', 'task:update',
    'project:read', 'project:create', 'project:update',
    'dashboard:read', 'system:settings'
  ];

  return role === 'admin' ? adminPermissions : defaultPermissions;
};

const router = express.Router();

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// 内存数据库用户查找函数
const findUserInMemory = (name) => {
  return global.memoryDB.users.find(user => 
    user.name === name ||      // 优先用name字段查找
    user.email === name        // 支持用email查找
  );
};

// 内存数据库模式下的用户创建
const createUserInMemory = (userData) => {
  if (!global.memoryDB) return null;
  const newUser = {
    _id: Date.now().toString(),
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  global.memoryDB.users.push(newUser);
  return newUser;
};

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'developer' } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      });
    }

    // 验证密码强度
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6个字符'
      });
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      return res.status(400).json({
        success: false,
        message: '密码必须包含字母和数字'
      });
    }

    // 检查邮箱是否已存在
    let existingUser;
    if (process.env.USE_MEMORY_DB === 'true' && global.memoryDB) {
      existingUser = findUserInMemory(email);
    } else {
      existingUser = await User.findOne({ email });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 创建新用户
    let user;
    if (process.env.USE_MEMORY_DB === 'true' && global.memoryDB) {
      // 内存数据库模式
      const hashedPassword = await bcrypt.hash(password, 12);
      user = createUserInMemory({
        name,
        email,
        password: hashedPassword,
        role,
        status: 'active',
        permissions: getDefaultPermissionsByRole(role)
      });
    } else {
      // MongoDB模式
      console.log('🔗 使用MongoDB模式创建用户:', { name, email, role });
      user = new User({
        name,
        email,
        password,
        role,
        permissions: getDefaultPermissionsByRole(role)
      });
      await user.save();
      console.log('✅ 用户创建成功:', user._id);
    }

    // 生成JWT令牌
    const token = generateToken(user._id);

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    console.error('错误详情:', {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      errorMessage: error.message,
      errorStack: error.stack
    });
    res.status(500).json({
      success: false,
      message: '用户注册失败',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    // 验证必填字段
    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      });
    }

    // 查找用户 - 支持用email、name登录
    let user;
    if (global.memoryDB && process.env.USE_MEMORY_DB === 'true') {
      // 内存数据库模式
      user = findUserInMemory(name);
      console.log('🔍 内存数据库模式查找用户:', { 
        searchName: name, 
        foundUser: user ? { id: user._id, name: user.name, email: user.email } : null 
      });
    } else {
      // MongoDB模式 - 优先使用name字段，然后email
      user = await User.findOne({ 
        $or: [
          { name: name },     // 优先用name字段登录
          { email: name }     // 支持用email登录
        ] 
      }).select('+password');
      console.log('🔍 MongoDB模式查找用户:', { 
        searchName: name, 
        foundUser: user ? { id: user._id, name: user.name, email: user.email } : null 
      });
    }
    
    if (!user) {
      console.log('❌ 用户未找到:', { searchName: name });
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查用户状态
    if (user.status !== 'active') {
      console.log('❌ 用户状态非活跃:', { userId: user._id, status: user.status });
      return res.status(401).json({
        success: false,
        message: '用户账户已被禁用'
      });
    }

    // 验证密码
    let isPasswordValid;
    if (global.memoryDB && process.env.USE_MEMORY_DB === 'true') {
      // 内存数据库模式
      console.log('🔐 内存数据库模式密码验证:', { 
        userId: user._id, 
        inputPassword: password, 
        storedPasswordHash: user.password.substring(0, 20) + '...' 
      });
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('🔐 密码验证结果:', { userId: user._id, isValid: isPasswordValid });
    } else {
      // MongoDB模式
      console.log('🔐 MongoDB模式密码验证:', { 
        userId: user._id, 
        inputPassword: password 
      });
      isPasswordValid = await user.comparePassword(password);
      console.log('🔐 密码验证结果:', { userId: user._id, isValid: isPasswordValid });
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    if (!global.memoryDB || process.env.USE_MEMORY_DB !== 'true') {
      await user.save();
    }

    // 生成JWT令牌
    const token = generateToken(user._id);

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      avatar: user.avatar,
      department: user.department,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt
    };

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res) => {
  try {
    let user;
    if (global.memoryDB) {
      // 内存数据库模式
      user = global.memoryDB.users.find(u => u._id === req.user.id);
    } else {
      // MongoDB模式
      user = await User.findById(req.user.id).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
});

// 更新用户信息
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, email, avatar, department, phone } = req.body;
    
    let user;
    if (global.memoryDB) {
      // 内存数据库模式
      user = global.memoryDB.users.find(u => u._id === req.user.id);
    } else {
      // MongoDB模式
      user = await User.findById(req.user.id);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新允许的字段
    if (name) user.name = name;
    if (email) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    user.updatedAt = new Date();

    if (!global.memoryDB) {
      await user.save();
    }

    // 返回更新后的用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      avatar: user.avatar,
      department: user.department,
      phone: user.phone,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userResponse
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
});

// 修改密码
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔐 密码修改请求:', {
      userId: req.user.id,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword,
      newPasswordLength: newPassword?.length
    });

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码'
      });
    }

    // 验证新密码强度
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码至少6个字符'
      });
    }

    let user;
    if (global.memoryDB) {
      // 内存数据库模式
      user = global.memoryDB.users.find(u => u._id === req.user.id);
      console.log('📝 内存数据库模式，用户:', user ? { id: user._id, name: user.name } : '未找到');
    } else {
      // MongoDB模式
      user = await User.findById(req.user.id).select('+password');
      console.log('📝 MongoDB模式，用户:', user ? { id: user._id, name: user.name } : '未找到');
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    let isCurrentPasswordValid;
    if (global.memoryDB) {
      // 内存数据库模式
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    } else {
      // MongoDB模式
      isCurrentPasswordValid = await user.comparePassword(currentPassword);
    }
    
    console.log('🔍 当前密码验证结果:', isCurrentPasswordValid);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 更新密码
    if (global.memoryDB) {
      // 内存数据库模式
      user.password = await bcrypt.hash(newPassword, 12);
      console.log('✅ 内存数据库密码更新完成');
    } else {
      // MongoDB模式 - 使用updateOne避免触发pre('save')中间件
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await User.updateOne(
        { _id: req.user.id },
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      console.log('✅ MongoDB密码更新完成，用户ID:', req.user.id);
    }

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('❌ 修改密码失败:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败',
      error: error.message
    });
  }
});

// 用户登出（客户端处理，这里只是返回成功消息）
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

// 刷新令牌
router.post('/refresh-token', authMiddleware, async (req, res) => {
  try {
    let user;
    if (global.memoryDB) {
      // 内存数据库模式
      user = global.memoryDB.users.find(u => u._id === req.user.id);
    } else {
      // MongoDB模式
      user = await User.findById(req.user.id);
    }
    
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    // 生成新的JWT令牌
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: '令牌刷新成功',
      data: { token }
    });
  } catch (error) {
    console.error('刷新令牌失败:', error);
    res.status(500).json({
      success: false,
      message: '刷新令牌失败',
      error: error.message
    });
  }
});

export default router; 