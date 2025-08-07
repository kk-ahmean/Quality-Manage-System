import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, '评论内容是必需的'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const bugSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Bug标题是必需的'],
    trim: true,
    maxlength: [200, '标题不能超过200个字符']
  },
  description: {
    type: String,
    required: [true, 'Bug描述是必需的'],
    trim: true
  },
  reproductionSteps: {
    type: String,
    required: [true, '重现步骤是必需的'],
    trim: true
  },
  expectedResult: {
    type: String,
    trim: true
  },
  actualResult: {
    type: String,
    required: [true, '实际结果是必需的'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['P0', 'P1', 'P2', 'P3']
  },
  severity: {
    type: String,
    enum: ['S', 'A', 'B', 'C'],
    default: 'B'
  },
  type: {
    type: String,
    enum: ['电气性能', '可靠性', '环保', '安规', '资料', '兼容性', '复测与确认', '设备特性', '其它'],
    default: '电气性能'
  },
  responsibility: {
    type: String,
    enum: ['软件', '硬件', '结构', 'ID', '包装', '产品', '项目', '供应商', 'DQE', '实验室'],
    default: '软件'
  },
  status: {
    type: String,
    enum: ['新建', '处理中', '待验证', '已解决', '已关闭', '重新打开'],
    required: [true, '状态是必需的'],
    default: '新建'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reporterName: {
    type: String,
    required: true
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assigneeName: {
    type: String,
    default: ''
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  tags: {
    type: String,
    trim: true,
    maxlength: [50, '标签不能超过50个字符']
  },
  categoryLevel3: {
    type: String,
    required: [true, '三级类目不能为空'],
    trim: true,
    maxlength: [100, '三级类目不能超过100个字符']
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
  hardwareVersion: {
    type: String,
    required: [true, '硬件版本不能为空'],
    trim: true,
    maxlength: [50, '硬件版本不能超过50个字符']
  },
  softwareVersion: {
    type: String,
    required: [true, '软件版本不能为空'],
    trim: true,
    maxlength: [50, '软件版本不能超过50个字符']
  },
  dueDate: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  closedAt: {
    type: Date,
    default: null
  },
  comments: [commentSchema],
  attachments: [attachmentSchema],
  estimatedHours: {
    type: Number,
    default: 0
  },
  actualHours: {
    type: Number,
    default: 0
  },
  version: {
    type: String,
    default: ''
  },
  environment: {
    type: String,
    default: ''
  },
  browser: {
    type: String,
    default: ''
  },
  os: {
    type: String,
    default: ''
  },
  device: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: true
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

// 索引
bugSchema.index({ title: 'text', description: 'text' });
bugSchema.index({ status: 1, priority: 1 });
bugSchema.index({ reporter: 1, assignee: 1 });
bugSchema.index({ createdAt: -1 });

// 虚拟字段：Bug年龄（天数）
bugSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// 虚拟字段：是否逾期
bugSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate && this.status !== '已解决' && this.status !== '已关闭';
});

// 确保虚拟字段在JSON序列化时包含
bugSchema.set('toJSON', { virtuals: true });

const Bug = mongoose.model('Bug', bugSchema);

export default Bug; 