import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '用户名是必需的'],
    trim: true,
    maxlength: [50, '用户名不能超过50个字符']
  },
  email: {
    type: String,
    required: [true, '邮箱是必需的'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址']
  },
  password: {
    type: String,
    required: [true, '密码是必需的'],
    minlength: [6, '密码至少6个字符'],
    select: false // 查询时默认不返回密码
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'developer', 'tester', 'viewer', 'dqe', '项目工程师', '产品工程师', 'product_engineer', 'project_engineer', '管理员', 'DQE', '测试员'],
    default: 'developer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  avatar: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  permissions: [{
    type: String,
    enum: [
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
      'dashboard:read', 'system:settings',
      // 兼容旧权限
      'read', 'write', 'delete', 'admin'
    ]
  }],
  lastLoginAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码验证方法
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 虚拟字段：用户全名
userSchema.virtual('fullName').get(function() {
  return `${this.name}`;
});

// 确保虚拟字段在JSON序列化时包含
userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User; 