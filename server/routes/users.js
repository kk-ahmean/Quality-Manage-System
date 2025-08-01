import express from 'express';
import User from '../models/User.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// 获取用户列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    
    // 搜索功能
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // 排序
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // 执行查询
    const users = await User.find(query)
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 获取单个用户详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

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
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
});

// 创建用户（仅管理员）
router.post('/', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, password, role, department, permissions } = req.body;

    // 验证必填字段
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      });
    }

    // 检查邮箱是否已存在
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 创建新用户
    const user = new User({
      name,
      email,
      password,
      role: role || 'developer',
      department: department || '',
      permissions: permissions || ['read', 'write']
    });

    await user.save();

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department,
      permissions: user.permissions,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: userResponse
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
});

// 更新用户（仅管理员）
router.put('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, role, status, department, permissions } = req.body;
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;
    if (department !== undefined) user.department = department;
    if (permissions) user.permissions = permissions;

    await user.save();

    // 返回更新后的用户信息（不包含密码）
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      department: user.department,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userResponse
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
});

// 删除用户（仅管理员）
router.delete('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 防止删除自己
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

// 批量操作用户
router.post('/batch', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { userIds, operation, value } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的用户ID列表'
      });
    }

    if (!operation || !value) {
      return res.status(400).json({
        success: false,
        message: '请提供操作类型和值'
      });
    }

    let updateData = {};
    
    switch (operation) {
      case 'enable':
        updateData.status = 'active';
        break;
      case 'disable':
        updateData.status = 'inactive';
        break;
      case 'changeRole':
        updateData.role = value;
        break;
      case 'changePermissions':
        updateData.permissions = value;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作类型'
        });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    res.json({
      success: true,
      message: `批量${operation}操作成功`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('批量操作用户失败:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
});

export default router; 