import express from 'express';
import User from '../models/User.js';
import Team from '../models/Team.js';
import UserActivityLog from '../models/UserActivityLog.js';
import { authMiddleware, requireRole, requireCreatorOrAdmin } from '../middleware/auth.js';

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
      sortOrder = 'asc' // 改为升序，确保最早创建的用户排在前面
    } = req.query;

      if (global.memoryDB && process.env.USE_MEMORY_DB === 'true') {
    // 内存数据库模式
    let users = global.memoryDB.users || [];
      
      // 过滤
      if (role) {
        users = users.filter(user => user.role === role);
      }
      if (status) {
        users = users.filter(user => user.status === status);
      }
      if (search) {
        users = users.filter(user => 
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          (user.department && user.department.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // 排序
      users.sort((a, b) => {
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          // 对于日期字段，转换为Date对象进行比较
          const aValue = new Date(a[sortBy] || new Date(0));
          const bValue = new Date(b[sortBy] || new Date(0));
          return sortOrder === 'desc' ? 
            (bValue.getTime() - aValue.getTime()) : 
            (aValue.getTime() - bValue.getTime());
        } else {
          // 对于其他字段，使用字符串比较
          const aValue = a[sortBy] || '';
          const bValue = b[sortBy] || '';
          return sortOrder === 'desc' ? 
            (bValue > aValue ? 1 : -1) : 
            (aValue > bValue ? 1 : -1);
        }
      });
      
      // 分页
      const total = users.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedUsers = users.slice(skip, skip + parseInt(limit));
      
      // 移除密码字段并添加序号
      const usersWithoutPassword = paginatedUsers.map((user, index) => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          id: user._id, // 确保id字段存在
          sequenceNumber: skip + index + 1 // 添加序号，基于全局位置
        };
      });
      
      res.json({
        success: true,
        data: {
          users: usersWithoutPassword,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } else {
      // MongoDB模式
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

      // 添加序号并统一ID格式 - 与内存数据库模式保持一致
      const usersWithSequence = users.map((user, index) => {
        const userObj = user.toObject();
        return {
          ...userObj,
          id: userObj._id.toString(), // 确保id字段存在且为字符串
          _id: userObj._id.toString(), // 确保_id字段也为字符串
          sequenceNumber: skip + index + 1 // 添加序号，基于全局位置
        };
      });

      res.json({
        success: true,
        data: {
          users: usersWithSequence,
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    }
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// ==================== 团队管理API ====================

// 获取所有团队列表
router.get('/teams', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'asc' // 改为升序，确保最早创建的团队排在前面
    } = req.query;

    if (global.memoryDB) {
      // 内存数据库模式
      let teams = global.memoryDB.teams || [];
      
      // 过滤
      if (status) {
        teams = teams.filter(team => team.status === status);
      }
      
      if (search) {
        teams = teams.filter(team => 
          team.name.toLowerCase().includes(search.toLowerCase()) ||
          (team.description && team.description.toLowerCase().includes(search.toLowerCase())) ||
          (team.department && team.department.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // 排序
      teams.sort((a, b) => {
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          // 对于日期字段，转换为Date对象进行比较
          const aValue = new Date(a[sortBy] || new Date(0));
          const bValue = new Date(b[sortBy] || new Date(0));
          return sortOrder === 'desc' ? 
            (bValue.getTime() - aValue.getTime()) : 
            (aValue.getTime() - bValue.getTime());
        } else {
          // 对于其他字段，使用字符串比较
          const aValue = a[sortBy] || '';
          const bValue = b[sortBy] || '';
          return sortOrder === 'desc' ? 
            (bValue > aValue ? 1 : -1) : 
            (aValue > bValue ? 1 : -1);
        }
      });
      
      // 分页
      const total = teams.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedTeams = teams.slice(skip, skip + parseInt(limit));
      
      // 添加序号字段并关联用户信息
      const teamsWithSequence = paginatedTeams.map((team, index) => {
        // 查找负责人信息 - 支持多种ID格式
        const leader = global.memoryDB.users.find(user => 
          user._id === team.leader || 
          user.id === team.leader || 
          user._id === team.leader?.toString() ||
          user.id === team.leader?.toString()
        );
        
        // 查找成员信息 - 支持多种ID格式
        const members = (team.members || []).map(member => {
          const user = global.memoryDB.users.find(u => 
            u._id === member.user || 
            u.id === member.user || 
            u._id === member.user?.toString() ||
            u.id === member.user?.toString()
          );
          return {
            ...member,
            userInfo: user ? {
              id: user._id || user.id,
              name: user.name,
              email: user.email,
              role: user.role
            } : null
          };
        });
        
        return {
          ...team,
          id: team._id, // 确保id字段存在
          sequenceNumber: skip + index + 1, // 添加序号，基于全局位置
          leaderInfo: leader ? {
            id: leader._id || leader.id,
            name: leader.name,
            email: leader.email,
            role: leader.role
          } : null,
          members: members
        };
      });
      
      res.json({
        success: true,
        data: teamsWithSequence,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      // MongoDB模式 - 采用内存数据库模式的处理方法
      const query = {};
      if (status) query.status = status;
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 获取所有用户数据，模拟内存数据库的global.memoryDB.users
      const allUsers = await User.find({}).select('_id name email role');
      
      const teams = await Team.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Team.countDocuments(query);

      // 采用内存数据库模式的处理方法
      const teamsWithSequence = teams.map((team, index) => {
        const teamObj = team.toObject();
        
        // 查找负责人信息 - 采用内存数据库模式的方法
        const leader = allUsers.find(user => 
          user._id.toString() === teamObj.leader?.toString() || 
          user._id.toString() === teamObj.leader
        );
        
        // 查找成员信息 - 采用内存数据库模式的方法
        const members = (teamObj.members || []).map(member => {
          const user = allUsers.find(u => 
            u._id.toString() === member.user?.toString() || 
            u._id.toString() === member.user
          );
          return {
            ...member,
            userInfo: user ? {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role
            } : null
          };
        });
        
        return {
          ...teamObj,
          id: teamObj._id.toString(), // 确保id字段存在且为字符串
          sequenceNumber: skip + index + 1, // 添加序号，基于全局位置
          leaderInfo: leader ? {
            id: leader._id.toString(),
            name: leader.name,
            email: leader.email,
            role: leader.role
          } : null,
          members: members
        };
      });

      res.json({
        success: true,
        data: teamsWithSequence,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    }
  } catch (error) {
    console.error('获取团队列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取团队列表失败',
      error: error.message
    });
  }
});

// 创建新团队
router.post('/teams', authMiddleware, async (req, res) => {
  try {
    // 检查用户是否有创建团队的权限
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    // 检查权限：管理员或有team:create权限的用户可以创建团队
    const hasPermission = currentUser.role === 'admin' || 
                         currentUser.permissions?.includes('team:create');
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: '您没有创建团队的权限'
      });
    }

    const {
      name,
      description,
      leader,
      department,
      tags = [],
      settings = {}
    } = req.body;

    if (!name || !leader) {
      return res.status(400).json({
        success: false,
        message: '团队名称和负责人不能为空'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const existingTeam = global.memoryDB.teams.find(team => team.name === name);
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: '团队名称已存在'
        });
      }

      // 处理成员数据格式
      let members = [];
      if (req.body.members && Array.isArray(req.body.members)) {
        // 如果传递的是用户ID数组，转换为成员对象数组
        members = req.body.members.map(memberId => ({
          user: memberId,
          role: memberId === leader ? 'leader' : 'member'
        }));
      } else {
        // 默认将负责人添加为成员
        members = [{ user: leader, role: 'leader' }];
      }

      const newTeam = {
        _id: Date.now().toString(),
        name,
        description,
        leader,
        department,
        tags,
        settings,
        members: members,
        creator: currentUser.id || currentUser._id, // 添加创建者字段
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      global.memoryDB.teams.push(newTeam);

      // 返回团队信息
      const { _id, ...teamResponse } = newTeam;
      teamResponse.id = _id;

      res.status(201).json({
        success: true,
        message: '团队创建成功',
        data: teamResponse
      });
    } else {
      // MongoDB模式
      const existingTeam = await Team.findOne({ name });
      if (existingTeam) {
        return res.status(400).json({
          success: false,
          message: '团队名称已存在'
        });
      }

      // 处理成员数据格式
      let members = [];
      if (req.body.members && Array.isArray(req.body.members)) {
        // 如果传递的是用户ID数组，转换为成员对象数组
        members = req.body.members.map(memberId => ({
          user: memberId,
          role: memberId === leader ? 'leader' : 'member'
        }));
      } else {
        // 默认将负责人添加为成员
        members = [{ user: leader, role: 'leader' }];
      }

      const newTeam = new Team({
        name,
        description,
        leader,
        department,
        tags,
        settings,
        members: members,
        creator: currentUser.id || currentUser._id // 添加创建者字段
      });

      await newTeam.save();

      res.status(201).json({
        success: true,
        message: '团队创建成功',
        data: newTeam
      });
    }
  } catch (error) {
    console.error('创建团队失败:', error);
    res.status(500).json({
      success: false,
      message: '创建团队失败',
      error: error.message
    });
  }
});

// 更新团队
router.put('/teams/:id', authMiddleware, async (req, res) => {
  try {
    // 检查用户是否有编辑团队的权限
    const currentUser = req.user;
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: '用户未登录'
      });
    }

    const { name, description, leader, department, tags, settings, members } = req.body;
    
    if (global.memoryDB) {
      // 内存数据库模式
      const teamIndex = global.memoryDB.teams.findIndex(team => team._id === req.params.id);
      
      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '团队不存在'
        });
      }

      const team = global.memoryDB.teams[teamIndex];

      // 检查权限：管理员、有team:update权限的用户或团队创建者可以编辑团队
      const hasPermission = currentUser.role === 'admin' || 
                           currentUser.permissions?.includes('team:update') ||
                           team.creator === currentUser.id ||
                           team.creator === currentUser._id;
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '您没有编辑此团队的权限'
        });
      }

      // 更新团队信息
      if (name) team.name = name;
      if (description !== undefined) team.description = description;
      if (leader) team.leader = leader;
      if (department !== undefined) team.department = department;
      if (tags) team.tags = tags;
      if (settings) team.settings = settings;
      
      // 处理成员数据格式
      if (members && Array.isArray(members)) {
        // 如果传递的是用户ID数组，转换为成员对象数组
        team.members = members.map(memberId => ({
          user: memberId,
          role: memberId === leader ? 'leader' : 'member'
        }));
      }
      
      team.updatedAt = new Date();

      // 返回更新后的团队信息
      const { _id, ...teamResponse } = team;
      teamResponse.id = _id;

      res.json({
        success: true,
        message: '团队更新成功',
        data: teamResponse
      });
    } else {
      // MongoDB模式
      const team = await Team.findById(req.params.id);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          message: '团队不存在'
        });
      }

      // 检查权限：管理员、有team:update权限的用户或团队创建者可以编辑团队
      const hasPermission = currentUser.role === 'admin' || 
                           currentUser.permissions?.includes('team:update') ||
                           team.creator.toString() === (currentUser.id || currentUser._id).toString();
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: '您没有编辑此团队的权限'
        });
      }

      // 更新团队信息
      if (name) team.name = name;
      if (description !== undefined) team.description = description;
      if (leader) team.leader = leader;
      if (department !== undefined) team.department = department;
      if (tags) team.tags = tags;
      if (settings) team.settings = settings;
      
      // 处理成员数据格式
      if (members && Array.isArray(members)) {
        // 如果传递的是用户ID数组，转换为成员对象数组
        team.members = members.map(memberId => ({
          user: memberId,
          role: memberId === leader ? 'leader' : 'member'
        }));
      }

      await team.save();

      res.json({
        success: true,
        message: '团队更新成功',
        data: team
      });
    }
  } catch (error) {
    console.error('更新团队失败:', error);
    res.status(500).json({
      success: false,
      message: '更新团队失败',
      error: error.message
    });
  }
});

// 删除团队
router.delete('/teams/:id', authMiddleware, requireCreatorOrAdmin('team'), async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const teamIndex = global.memoryDB.teams.findIndex(team => team._id === req.params.id);
      
      if (teamIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '团队不存在'
        });
      }

      // 从数组中删除团队
      global.memoryDB.teams.splice(teamIndex, 1);

      res.json({
        success: true,
        message: '团队删除成功'
      });
    } else {
      // MongoDB模式
      const team = await Team.findById(req.params.id);
      
      if (!team) {
        return res.status(404).json({
          success: false,
          message: '团队不存在'
        });
      }

      await Team.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: '团队删除成功'
      });
    }
  } catch (error) {
    console.error('删除团队失败:', error);
    res.status(500).json({
      success: false,
      message: '删除团队失败',
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
    'team:read', 'team:create', 'team:update', 'team:delete',
    'bug:read', 'bug:create', 'bug:update',
    'task:read', 'task:create', 'task:update', 'task:delete',
    'project:read', 'project:create', 'project:update', 'project:delete',
    'dashboard:read', 'system:settings'
  ];

  return role === 'admin' ? adminPermissions : defaultPermissions;
};

// 创建用户（仅管理员）
router.post('/', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { name, email, role, department, permissions, phone, position } = req.body;

    // 验证必填字段
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const existingUser = global.memoryDB.users.find(user => user.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
      }

      // 创建新用户，默认密码为123456
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash('123456', 12);
      console.log('🔐 内存数据库模式创建用户，手动哈希密码');

      // 根据角色设置默认权限
      const defaultPermissions = getDefaultPermissionsByRole(role);
      const finalPermissions = permissions || defaultPermissions;

      const newUser = {
        _id: Date.now().toString(),
        name,
        email,
        phone: phone || '', // 添加手机号字段
        position: position || '', // 添加职位字段
        password: hashedPassword,
        role: role || 'developer',
        department: department || '',
        permissions: finalPermissions,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      global.memoryDB.users.push(newUser);
      console.log('✅ 内存数据库用户创建成功:', { 
        userId: newUser._id, 
        name: newUser.name, 
        email: newUser.email,
        permissions: finalPermissions
      });

      // 返回用户信息（不包含密码）
      const { password, ...userResponse } = newUser;

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: userResponse
      });
    } else {
      // MongoDB模式
      // 检查邮箱是否已存在
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该邮箱已被注册'
        });
      }

      // 创建新用户，默认密码为123456
      // 注意：不需要手动哈希密码，User模型的中间件会自动处理
      console.log('🔐 MongoDB模式创建用户，密码将由模型中间件自动哈希');

      // 根据角色设置默认权限
      const defaultPermissions = getDefaultPermissionsByRole(role);
      const finalPermissions = permissions || defaultPermissions;

      const user = new User({
        name,
        email,
        password: '123456', // 直接使用明文密码，模型中间件会自动哈希
        role: role || 'developer',
        department: department || '',
        position: position || '', // 添加职位字段
        phone: phone || '', // 添加手机号字段
        permissions: finalPermissions
      });

      await user.save();
      console.log('✅ MongoDB用户创建成功:', { 
        userId: user._id, 
        name: user.name, 
        email: user.email,
        permissions: finalPermissions
      });

      // 返回用户信息（不包含密码）
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        department: user.department,
        position: user.position,
        phone: user.phone,
        permissions: user.permissions,
        createdAt: user.createdAt
      };

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: userResponse
      });
    }
  } catch (error) {
    console.error('创建用户失败:', error);
    console.error('错误详情:', {
      errorMessage: error.message,
      errorStack: error.stack,
      requestBody: req.body,
      role: req.body.role
    });
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 更新用户（仅管理员）
router.put('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { email, role, status, department, permissions, phone, position } = req.body;
    
    if (global.memoryDB) {
      // 内存数据库模式
      const userIndex = global.memoryDB.users.findIndex(user => user._id === req.params.id);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const user = global.memoryDB.users[userIndex];

      // 更新用户信息（不允许更新用户名和姓名）
      if (email) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (position !== undefined) user.position = position;
      if (role) user.role = role;
      if (status) user.status = status;
      if (department !== undefined) user.department = department;
      if (permissions) user.permissions = permissions;
      user.updatedAt = new Date();

      // 返回更新后的用户信息（不包含密码）
      const { password, ...userResponse } = user;
      userResponse.id = user._id;

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: userResponse
      });
    } else {
      // MongoDB模式
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 更新用户信息（不允许更新用户名和姓名）
      if (email) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (position !== undefined) user.position = position;
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
        phone: user.phone,
        position: user.position,
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
    }
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
});

// 更新用户权限（仅管理员）
router.patch('/:id/permissions', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    const { permissions } = req.body;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的权限列表'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const userIndex = global.memoryDB.users.findIndex(user => user._id === req.params.id);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const user = global.memoryDB.users[userIndex];
      user.permissions = permissions;
      user.updatedAt = new Date();

      res.json({
        success: true,
        message: '用户权限更新成功',
        data: {
          id: user._id,
          permissions: user.permissions
        }
      });
    } else {
      // MongoDB模式
      const user = await User.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      user.permissions = permissions;
      await user.save();

      res.json({
        success: true,
        message: '用户权限更新成功',
        data: {
          id: user._id,
          permissions: user.permissions
        }
      });
    }
  } catch (error) {
    console.error('更新用户权限失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户权限失败',
      error: error.message
    });
  }
});

// 删除用户（仅管理员）
router.delete('/:id', authMiddleware, requireRole(['admin']), async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const userIndex = global.memoryDB.users.findIndex(user => user._id === req.params.id);
      
      if (userIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      const user = global.memoryDB.users[userIndex];

      // 防止删除自己
      if (user._id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: '不能删除自己的账户'
        });
      }

      // 从数组中删除用户
      global.memoryDB.users.splice(userIndex, 1);

      res.json({
        success: true,
        message: '用户删除成功'
      });
    } else {
      // MongoDB模式
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
    }
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



// ==================== 权限管理API ====================

// 获取用户活动日志
router.get('/:id/activity-logs', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      resourceType,
      severity,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 检查权限：只能查看自己的日志或管理员可以查看所有
    if (req.user.role !== 'admin' && req.params.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此用户的活动日志'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      let logs = global.memoryDB.userActivityLogs.filter(log => log.userId === req.params.id);
      
      // 过滤
      if (action) {
        logs = logs.filter(log => log.action === action);
      }
      if (resourceType) {
        logs = logs.filter(log => log.resourceType === resourceType);
      }
      if (severity) {
        logs = logs.filter(log => log.severity === severity);
      }
      if (startDate || endDate) {
        logs = logs.filter(log => {
          const logDate = new Date(log.createdAt);
          if (startDate && logDate < new Date(startDate)) return false;
          if (endDate && logDate > new Date(endDate)) return false;
          return true;
        });
      }
      
      // 排序
      logs.sort((a, b) => {
        const aValue = a[sortBy] || new Date(0);
        const bValue = b[sortBy] || new Date(0);
        return sortOrder === 'desc' ? 
          (bValue > aValue ? 1 : -1) : 
          (aValue > bValue ? 1 : -1);
      });
      
      // 分页
      const total = logs.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedLogs = logs.slice(skip, skip + parseInt(limit));
      
      res.json({
        success: true,
        data: paginatedLogs,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } else {
      // MongoDB模式
      const query = { userId: req.params.id };
      
      if (action) query.action = action;
      if (resourceType) query.resourceType = resourceType;
      if (severity) query.severity = severity;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const logs = await UserActivityLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await UserActivityLog.countDocuments(query);

      res.json({
        success: true,
        data: logs.map(log => log.formatLog()),
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    }
  } catch (error) {
    console.error('获取用户活动日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户活动日志失败',
      error: error.message
    });
  }
});

// 记录用户活动
router.post('/:id/activity-logs', authMiddleware, async (req, res) => {
  try {
    const {
      action,
      description,
      details,
      resourceType,
      resourceId,
      severity,
      status
    } = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        message: '活动类型不能为空'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      // 获取用户名
      let userName = '未知用户';
      try {
        const user = global.memoryDB.users.find(u => u._id === req.params.id);
        if (user && user.name) {
          userName = user.name;
        }
      } catch (userError) {
        userName = '未知用户';
      }
      
      const activityLog = {
        _id: Date.now().toString(),
        userId: req.params.id,
        userName: userName,
        action,
        description,
        details,
        resourceType,
        resourceId,
        severity: severity || 'low',
        status: status || 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      global.memoryDB.userActivityLogs.push(activityLog);

      res.status(201).json({
        success: true,
        message: '活动日志记录成功',
        data: activityLog
      });
    } else {
      // MongoDB模式
      // 获取用户名
      let userName = '未知用户';
      try {
        const user = await User.findById(req.params.id).select('name');
        if (user && user.name) {
          userName = user.name;
        }
      } catch (userError) {
        userName = '未知用户';
      }
      
      const activityLog = new UserActivityLog({
        userId: req.params.id,
        userName: userName,
        action,
        description,
        details,
        resourceType,
        resourceId,
        severity: severity || 'low',
        status: status || 'success',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      await activityLog.save();

      res.status(201).json({
        success: true,
        message: '活动日志记录成功',
        data: activityLog.formatLog()
      });
    }
  } catch (error) {
    console.error('记录用户活动失败:', error);
    res.status(500).json({
      success: false,
      message: '记录用户活动失败',
      error: error.message
    });
  }
});

export default router; 