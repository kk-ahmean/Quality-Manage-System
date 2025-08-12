import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '项目名称不能为空'],
    trim: true,
    maxlength: [200, '项目名称不能超过200个字符']
  },
  model: {
    type: String,
    required: [true, '型号不能为空'],
    trim: true,
    maxlength: [100, '型号不能超过100个字符']
  },
  sku: {
    type: String,
    required: [true, 'SKU不能为空'],
    trim: true,
    maxlength: [100, 'SKU不能超过100个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '项目描述不能超过2000个字符'],
    default: ''
  },
  categoryLevel3: {
    type: String,
    trim: true,
    maxlength: [100, '三级类目不能超过100个字符'],
    default: '默认类目'
  },
  interfaceFeatures: {
    type: String,
    trim: true,
    maxlength: [1000, '接口特性不能超过1000个字符'],
    default: ''
  },
  supplier: {
    type: String,
    trim: true,
    maxlength: [200, '供应商不能超过200个字符'],
    default: ''
  },
  hardwareSolution: {
    type: String,
    trim: true,
    maxlength: [1000, '硬件方案不能超过1000个字符'],
    default: ''
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [2000, '备注不能超过2000个字符'],
    default: ''
  },
  productImages: [{
    name: {
      type: String,
      default: '产品图片'
    },
    url: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      default: 'image/jpeg'
    },
    uploadedBy: {
      type: String,
      default: '系统管理员'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  versions: [{
    hardwareVersion: {
      type: String,
      trim: true,
      default: ''
    },
    softwareVersion: {
      type: String,
      trim: true,
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  stages: [{
    stage: {
      type: String,
      enum: ['EVT', 'DVT', 'PVT', 'MP', '其他'],
      default: 'EVT'
    },
    sampleQuantity: {
      type: Number,
      min: [1, '送样数量必须大于0'],
      default: 1
    },
    sampleReason: {
      type: String,
      trim: true,
      default: ''
    },
    testResult: {
      type: String,
      enum: ['PASS', 'FAIL', '条件接收'],
      default: 'PASS'
    },
    approvalVersion: {
      type: String,
      trim: true,
      default: ''
    }
  }],
  level: {
    type: String,
    enum: ['level1', 'level2', 'level3', 'level4', 'L1', 'L2', 'L3', 'L4'],
    default: 'L2',
    required: true
  },
  trade: {
    type: String,
    enum: ['software', 'hardware', 'mechanical', 'electrical', 'other', '内贸', '外贸', '内外贸'],
    default: '内贸',
    required: true
  },
  status: {
    type: String,
    enum: ['planning', 'in_progress', 'review', 'completed', 'cancelled', '研发设计', 'EVT', 'DVT', 'PVT', 'MP', '生产制造', '测试验证', '已完成', '已取消'],
    default: 'planning',
    required: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '项目经理不能为空']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    required: [true, '开始日期不能为空']
  },
  endDate: {
    type: Date,
    required: [true, '结束日期不能为空']
  },
  budget: {
    type: Number,
    min: [0, '预算不能为负数'],
    default: 0
  },
  actualCost: {
    type: Number,
    min: [0, '实际成本不能为负数'],
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: { type: String, required: true }, // 使用name字段
    role: {
      type: String,
      enum: ['admin', 'product_engineer', 'project_engineer', 'developer', 'dqe', 'tester'],
      default: 'developer'
    },
    joinDate: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    content: {
      type: String,
      required: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  completedAt: {
    type: Date
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
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 创建文本索引用于搜索
projectSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
});

// 虚拟字段：是否逾期
projectSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return false;
  return this.endDate < new Date();
});

// 虚拟字段：剩余天数
projectSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') return 0;
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// 虚拟字段：项目进度
projectSchema.virtual('progress').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'cancelled') return 0;
  
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (now < start) return 0;
  if (now > end) return 90; // 逾期但未完成
  
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  return Math.min(90, Math.round((elapsed / totalDuration) * 100));
});

// 虚拟字段：项目经理姓名
projectSchema.virtual('managerName').get(function() {
  return this.manager?.name || '未知用户';
});

// 虚拟字段：创建者姓名
projectSchema.virtual('creatorName').get(function() {
  return this.creator?.name || '未知用户';
});

// 虚拟字段：成员数量
projectSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// 保存前更新updatedAt
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 更新前更新updatedAt
projectSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 静态方法：获取项目统计
projectSchema.statics.getStatistics = async function() {
  const [
    total,
    planning,
    inProgress,
    completed,
    cancelled,
    overdue,
    dueThisMonth
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'planning' }),
    this.countDocuments({ status: 'in_progress' }),
    this.countDocuments({ status: 'completed' }),
    this.countDocuments({ status: 'cancelled' }),
    this.countDocuments({
      endDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    }),
    this.countDocuments({
      endDate: {
        $gte: new Date(),
        $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      }
    })
  ]);

  return {
    total,
    planning,
    inProgress,
    completed,
    cancelled,
    overdue,
    dueThisMonth
  };
};

// 实例方法：添加成员
projectSchema.methods.addMember = async function(userId, role) {
  // 检查用户是否已经是项目成员
  const existingMember = this.members.find(member => 
    member.user.toString() === userId
  );

  if (existingMember) {
    throw new Error('用户已经是项目成员');
  }

  this.members.push({
    user: userId,
    role,
    joinDate: new Date()
  });

  this.updatedAt = new Date();
  return await this.save();
};

// 实例方法：移除成员
projectSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId
  );
  
  this.updatedAt = new Date();
  return await this.save();
};

// 实例方法：更新状态
projectSchema.methods.updateStatus = async function(status) {
  this.status = status;
  
  if (status === 'completed') {
    this.completedAt = new Date();
  }
  
  this.updatedAt = new Date();
  return await this.save();
};

const Project = mongoose.model('Project', projectSchema);

export default Project; 