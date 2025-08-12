import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['leader', 'member', 'observer'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [teamMemberSchema],
  department: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  tags: [{
    type: String,
    trim: true
  }],
  settings: {
    allowMemberInvite: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// 虚拟字段：成员数量
teamSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// 虚拟字段：是否活跃
teamSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// 静态方法：获取团队统计信息
teamSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] }
        },
        archived: {
          $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || { total: 0, active: 0, inactive: 0, archived: 0 };
};

// 实例方法：添加成员
teamSchema.methods.addMember = async function(userId, role = 'member') {
  const existingMember = this.members.find(member => 
    member.user.toString() === userId
  );
  
  if (existingMember) {
    throw new Error('用户已经是团队成员');
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: new Date()
  });
  
  return await this.save();
};

// 实例方法：移除成员
teamSchema.methods.removeMember = async function(userId) {
  this.members = this.members.filter(member => 
    member.user.toString() !== userId
  );
  
  return await this.save();
};

// 实例方法：更新成员角色
teamSchema.methods.updateMemberRole = async function(userId, newRole) {
  const member = this.members.find(member => 
    member.user.toString() === userId
  );
  
  if (!member) {
    throw new Error('用户不是团队成员');
  }
  
  member.role = newRole;
  return await this.save();
};

// 索引
teamSchema.index({ name: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.user': 1 });

const Team = mongoose.model('Team', teamSchema);

export default Team; 