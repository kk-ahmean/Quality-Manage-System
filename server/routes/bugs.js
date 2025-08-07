import express from 'express';
import Bug from '../models/Bug.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 获取所有Bug列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      severity,
      type,
      responsibility,
      keyword,
      assignee,
      reporter,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (global.memoryDB) {
      // 内存数据库模式
      let bugs = global.memoryDB.bugs || [];
      
      // 多选筛选 - 支持数组格式
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        bugs = bugs.filter(bug => statusArray.includes(bug.status));
      }
      if (priority) {
        const priorityArray = Array.isArray(priority) ? priority : [priority];
        bugs = bugs.filter(bug => priorityArray.includes(bug.priority));
      }
      if (severity) {
        const severityArray = Array.isArray(severity) ? severity : [severity];
        bugs = bugs.filter(bug => severityArray.includes(bug.severity));
      }
      if (type) {
        const typeArray = Array.isArray(type) ? type : [type];
        bugs = bugs.filter(bug => typeArray.includes(bug.type));
      }
      if (responsibility) {
        const responsibilityArray = Array.isArray(responsibility) ? responsibility : [responsibility];
        bugs = bugs.filter(bug => responsibilityArray.includes(bug.responsibility));
      }
      if (assignee) {
        bugs = bugs.filter(bug => bug.assignee === assignee);
      }
      if (reporter) {
        bugs = bugs.filter(bug => bug.reporter === reporter);
      }
      // 关键词搜索 - 支持keyword参数
      if (keyword || search) {
        const searchTerm = keyword || search;
        bugs = bugs.filter(bug => 
          bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (bug.description && bug.description.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // 排序
      bugs.sort((a, b) => {
        const aValue = a[sortBy] || new Date(0);
        const bValue = b[sortBy] || new Date(0);
        return sortOrder === 'desc' ? 
          (bValue > aValue ? 1 : -1) : 
          (aValue > bValue ? 1 : -1);
      });
      
      // 分页
      const total = bugs.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      // 全局唯一递增编号
      const bugsWithSequence = bugs.map((bug, idx) => ({
        ...bug,
        id: bug._id,
        sequenceNumber: idx + 1
      }));
      const paginatedBugs = bugsWithSequence.slice(skip, skip + parseInt(limit));
      
      res.json({
        success: true,
        data: {
          bugs: paginatedBugs,
          pagination: {
            current: parseInt(page),
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
      
      // 多选筛选支持
      if (status) {
        const statusArray = Array.isArray(status) ? status : [status];
        query.status = { $in: statusArray };
      }
      if (priority) {
        const priorityArray = Array.isArray(priority) ? priority : [priority];
        query.priority = { $in: priorityArray };
      }
      if (severity) {
        const severityArray = Array.isArray(severity) ? severity : [severity];
        query.severity = { $in: severityArray };
      }
      if (type) {
        const typeArray = Array.isArray(type) ? type : [type];
        query.type = { $in: typeArray };
      }
      if (responsibility) {
        const responsibilityArray = Array.isArray(responsibility) ? responsibility : [responsibility];
        query.responsibility = { $in: responsibilityArray };
      }
      if (assignee) query.assignee = assignee;
      if (reporter) query.reporter = reporter;
      
      // 关键词搜索
      if (keyword || search) {
        const searchTerm = keyword || search;
        query.$or = [
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } }
        ];
      }

      // 分页
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // 排序
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      // 执行查询
      const bugs = await Bug.find(query)
        .populate('reporter', 'name email')
        .populate('assignee', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // 获取总数
      const total = await Bug.countDocuments(query);

      res.json({
        success: true,
        data: {
          bugs: bugs,
          pagination: {
            current: parseInt(page),
            pageSize: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    }
  } catch (error) {
    console.error('获取Bug列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取Bug列表失败',
      error: error.message
    });
  }
});

// 获取单个Bug详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id)
      .populate('reporter', 'name email')
      .populate('assignee', 'name email')
      .populate('comments.author', 'name email');

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    res.json({
      success: true,
      data: bug
    });
  } catch (error) {
    console.error('获取Bug详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取Bug详情失败',
      error: error.message
    });
  }
});

// 创建新Bug
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const newBug = {
        _id: Date.now().toString(),
        ...req.body,
        reporter: req.user.id,
        reporterName: req.user.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      global.memoryDB.bugs.push(newBug);

      // 返回Bug信息
      const { _id, ...bugResponse } = newBug;
      bugResponse.id = _id;

      res.status(201).json({
        success: true,
        message: 'Bug创建成功',
        data: bugResponse
      });
    } else {
      // MongoDB模式
      const bugData = {
        ...req.body,
        reporter: req.user.id,
        reporterName: req.user.name
      };

      const bug = new Bug(bugData);
      await bug.save();

      // 重新查询以获取关联数据
      const savedBug = await Bug.findById(bug._id)
        .populate('reporter', 'name email')
        .populate('assignee', 'name email');

      res.status(201).json({
        success: true,
        message: 'Bug创建成功',
        data: savedBug
      });
    }
  } catch (error) {
    console.error('创建Bug失败:', error);
    res.status(400).json({
      success: false,
      message: '创建Bug失败',
      error: error.message
    });
  }
});

// 更新Bug
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const bugIndex = global.memoryDB.bugs.findIndex(bug => bug._id === req.params.id);
      if (bugIndex === -1) {
        return res.status(404).json({ success: false, message: 'Bug不存在' });
      }
      const bug = global.memoryDB.bugs[bugIndex];
      Object.assign(bug, req.body);
      bug.updatedAt = new Date();
      global.memoryDB.bugs[bugIndex] = bug;
      res.json({ success: true, message: 'Bug更新成功', data: { ...bug, id: bug._id } });
      return;
    }
    // MongoDB模式
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    // 更新Bug数据
    Object.assign(bug, req.body);
    bug.updatedAt = new Date();
    
    await bug.save();

    // 重新查询以获取关联数据
    const updatedBug = await Bug.findById(bug._id)
      .populate('reporter', 'name email')
      .populate('assignee', 'name email');

    res.json({
      success: true,
      message: 'Bug更新成功',
      data: updatedBug
    });
  } catch (error) {
    console.error('更新Bug失败:', error);
    res.status(400).json({
      success: false,
      message: '更新Bug失败',
      error: error.message
    });
  }
});

// 删除Bug
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    await Bug.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Bug删除成功'
    });
  } catch (error) {
    console.error('删除Bug失败:', error);
    res.status(500).json({
      success: false,
      message: '删除Bug失败',
      error: error.message
    });
  }
});

// 分配Bug
router.patch('/:id/assign', authMiddleware, async (req, res) => {
  try {
    const { assigneeId, dueDate } = req.body;
    
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    // 更新分配信息
    bug.assignee = assigneeId;
    bug.status = '处理中';
    if (dueDate) {
      bug.dueDate = new Date(dueDate);
    }
    bug.updatedAt = new Date();
    
    await bug.save();

    // 重新查询以获取关联数据
    const updatedBug = await Bug.findById(bug._id)
      .populate('reporter', 'name email')
      .populate('assignee', 'name email');

    res.json({
      success: true,
      message: 'Bug分配成功',
      data: updatedBug
    });
  } catch (error) {
    console.error('分配Bug失败:', error);
    res.status(400).json({
      success: false,
      message: '分配Bug失败',
      error: error.message
    });
  }
});

// 更新Bug状态
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    // 更新状态
    bug.status = status;
    bug.updatedAt = new Date();
    
    // 如果状态为已解决，设置解决时间
    if (status === '已解决') {
      bug.resolvedAt = new Date();
    }
    
    // 如果状态为已关闭，设置关闭时间
    if (status === '已关闭') {
      bug.closedAt = new Date();
    }
    
    await bug.save();

    // 重新查询以获取关联数据
    const updatedBug = await Bug.findById(bug._id)
      .populate('reporter', 'name email')
      .populate('assignee', 'name email');

    res.json({
      success: true,
      message: 'Bug状态更新成功',
      data: updatedBug
    });
  } catch (error) {
    console.error('更新Bug状态失败:', error);
    res.status(400).json({
      success: false,
      message: '更新Bug状态失败',
      error: error.message
    });
  }
});

// 添加评论
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const bug = global.memoryDB.bugs.find(bug => bug._id === req.params.id);
      if (!bug) {
        return res.status(404).json({ success: false, message: 'Bug不存在' });
      }
      if (!bug.comments) bug.comments = [];
      const comment = {
        _id: Date.now().toString(),
        content: req.body.content,
        author: req.user.id,
        authorName: req.user.name,
        createdAt: new Date(),
      };
      bug.comments.push(comment);
      res.json({ success: true, message: '评论添加成功', data: comment });
      return;
    }
    // MongoDB模式
    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    const comment = {
      content: req.body.content.trim(),
      author: req.user.id,
      authorName: req.user.name,
      createdAt: new Date()
    };

    bug.comments.push(comment);
    await bug.save();

    res.status(201).json({
      success: true,
      message: '评论添加成功',
      data: comment
    });
  } catch (error) {
    console.error('添加评论失败:', error);
    res.status(500).json({
      success: false,
      message: '添加评论失败',
      error: error.message
    });
  }
});

// 获取Bug统计信息
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    // 获取所有Bug
    const bugs = await Bug.find().populate('reporter', 'name email').populate('assignee', 'name email');
    
    // 按状态统计
    const byStatus = {};
    const byPriority = {};
    const bySeverity = {};
    const byType = {};
    const byResponsibility = {};
    
    bugs.forEach(bug => {
      // 状态统计
      byStatus[bug.status] = (byStatus[bug.status] || 0) + 1;
      
      // 优先级统计
      byPriority[bug.priority] = (byPriority[bug.priority] || 0) + 1;
      
      // 严重程度统计
      bySeverity[bug.severity] = (bySeverity[bug.severity] || 0) + 1;
      
      // 类型统计
      byType[bug.type] = (byType[bug.type] || 0) + 1;
      
      // 责任归属统计
      byResponsibility[bug.responsibility] = (byResponsibility[bug.responsibility] || 0) + 1;
    });
    
    // 计算解决率
    const resolvedCount = (byStatus['已解决'] || 0) + (byStatus['已关闭'] || 0);
    const resolutionRate = bugs.length > 0 ? Math.round((resolvedCount / bugs.length) * 100) : 0;
    
    // 计算平均解决时间（模拟数据）
    const averageResolutionTime = 3.5;
    
    const statistics = {
      total: bugs.length,
      byStatus,
      byPriority,
      bySeverity,
      byType,
      byResponsibility,
      resolutionRate,
      averageResolutionTime
    };

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败',
      error: error.message
    });
  }
});

export default router; 