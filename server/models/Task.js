import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, '任务标题不能为空'],
    trim: true,
    maxlength: [200, '任务标题不能超过200个字符']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '任务描述不能超过2000个字符']
  },
  priority: {
    type: String,
    enum: ['P0', 'P1', 'P2', 'P3'],
    default: 'P2',
    required: true
  },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'review', 'completed', 'cancelled'],
    default: 'todo',
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '任务负责人不能为空']
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: [true, '截止日期不能为空']
  },
  estimatedHours: {
    type: Number,
    min: [0, '预估工时不能为负数'],
    default: 0
  },
  actualHours: {
    type: Number,
    min: [0, '实际工时不能为负数'],
    default: 0
  },
  progress: {
    type: Number,
    min: [0, '进度不能为负数'],
    max: [100, '进度不能超过100%'],
    default: 0
  },
  categoryLevel3: {
    type: String,
    trim: true,
    maxlength: [100, '三级类目不能超过100个字符']
  },
  model: {
    type: String,
    trim: true,
    maxlength: [100, '型号不能超过100个字符']
  },
  sku: {
    type: String,
    trim: true,
    maxlength: [100, 'SKU不能超过100个字符']
  },
  tags: [{
    type: String,
    trim: true
  }],
  relatedBugs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bug'
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
taskSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// 虚拟字段：是否逾期
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed') return false;
  return this.dueDate < new Date();
});

// 虚拟字段：剩余天数
taskSchema.virtual('daysRemaining').get(function() {
  if (this.status === 'completed') return 0;
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// 虚拟字段：负责人姓名
taskSchema.virtual('assigneeName').get(function() {
  return this.assignee?.name || '未知用户';
});

// 虚拟字段：创建者姓名
taskSchema.virtual('creatorName').get(function() {
  return this.creator?.name || '未知用户';
});

// 保存前更新updatedAt
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 更新前更新updatedAt
taskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// 静态方法：获取任务统计
taskSchema.statics.getStatistics = async function() {
  const today = new Date();
  const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    total,
    todo,
    inProgress,
    review,
    completed,
    cancelled,
    overdue,
    dueToday,
    dueThisWeek
  ] = await Promise.all([
    this.countDocuments(),
    this.countDocuments({ status: 'todo' }),
    this.countDocuments({ status: 'in_progress' }),
    this.countDocuments({ status: 'review' }),
    this.countDocuments({ status: 'completed' }),
    this.countDocuments({ status: 'cancelled' }),
    this.countDocuments({
      dueDate: { $lt: today },
      status: { $ne: 'completed' }
    }),
    this.countDocuments({
      dueDate: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }),
    this.countDocuments({
      dueDate: {
        $gte: today,
        $lte: thisWeek
      }
    })
  ]);

  return {
    total,
    todo,
    inProgress,
    review,
    completed,
    cancelled,
    overdue,
    dueToday,
    dueThisWeek
  };
};

// 实例方法：更新进度
taskSchema.methods.updateProgress = async function(progress) {
  this.progress = progress;
  
  // 根据进度自动设置状态
  if (progress >= 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (progress > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'todo';
  }
  
  this.updatedAt = new Date();
  return await this.save();
};

// 实例方法：分配任务
taskSchema.methods.assignTo = async function(assigneeId) {
  this.assignee = assigneeId;
  this.status = 'todo';
  this.updatedAt = new Date();
  return await this.save();
};

const Task = mongoose.model('Task', taskSchema);

export default Task; 