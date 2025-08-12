import mongoose from 'mongoose';

const userActivityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  resourceType: {
    type: String,
    enum: ['user', 'bug', 'project', 'task', 'team', 'system'],
    default: 'user'
  },
  resourceId: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    default: 'success'
  }
}, {
  timestamps: true
});

// 虚拟字段：活动时间（格式化）
userActivityLogSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString('zh-CN');
});

// 虚拟字段：活动持续时间（如果有关联的结束时间）
userActivityLogSchema.virtual('duration').get(function() {
  if (this.updatedAt && this.createdAt) {
    return this.updatedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

// 静态方法：获取用户活动统计
userActivityLogSchema.statics.getUserActivityStats = async function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        count: { $sum: 1 },
        actions: { $addToSet: '$action' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return stats;
};

// 静态方法：获取系统活动统计
userActivityLogSchema.statics.getSystemActivityStats = async function(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          action: '$action'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.date',
        actions: {
          $push: {
            action: '$_id.action',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  return stats;
};

// 静态方法：清理旧日志
userActivityLogSchema.statics.cleanOldLogs = async function(daysToKeep = 15) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate }
  });

  return result;
};

// 实例方法：格式化日志信息
userActivityLogSchema.methods.formatLog = function() {
  return {
    id: this._id,
    userId: this.userId,
    userName: this.userName,
    action: this.action,
    description: this.description,
    ipAddress: this.ipAddress,
    userAgent: this.userAgent,
    resourceType: this.resourceType,
    resourceId: this.resourceId,
    severity: this.severity,
    status: this.status,
    createdAt: this.createdAt,
    formattedTime: this.formattedTime
  };
};

// 索引
userActivityLogSchema.index({ userId: 1, createdAt: -1 });
userActivityLogSchema.index({ action: 1 });
userActivityLogSchema.index({ resourceType: 1, resourceId: 1 });
userActivityLogSchema.index({ createdAt: 1 });
userActivityLogSchema.index({ severity: 1 });
userActivityLogSchema.index({ status: 1 });

const UserActivityLog = mongoose.model('UserActivityLog', userActivityLogSchema);

export default UserActivityLog; 