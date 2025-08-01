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
      assignee,
      reporter,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (severity) query.severity = severity;
    if (type) query.type = type;
    if (assignee) query.assignee = assignee;
    if (reporter) query.reporter = reporter;
    
    // 搜索功能
    if (search) {
      query.$text = { $search: search };
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
      data: bugs,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
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

// 添加评论
router.post('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({
        success: false,
        message: '评论内容不能为空'
      });
    }

    const bug = await Bug.findById(req.params.id);
    
    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    const comment = {
      content: content.trim(),
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
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const stats = await Bug.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: 1
            }
          },
          bySeverity: {
            $push: {
              severity: '$severity',
              count: 1
            }
          }
        }
      }
    ]);

    // 处理统计数据
    const result = {
      total: stats[0]?.total || 0,
      byStatus: {},
      byPriority: {},
      bySeverity: {}
    };

    // 处理状态统计
    if (stats[0]?.byStatus) {
      stats[0].byStatus.forEach(item => {
        result.byStatus[item.status] = (result.byStatus[item.status] || 0) + item.count;
      });
    }

    // 处理优先级统计
    if (stats[0]?.byPriority) {
      stats[0].byPriority.forEach(item => {
        result.byPriority[item.priority] = (result.byPriority[item.priority] || 0) + item.count;
      });
    }

    // 处理严重程度统计
    if (stats[0]?.bySeverity) {
      stats[0].bySeverity.forEach(item => {
        result.bySeverity[item.severity] = (result.bySeverity[item.severity] || 0) + item.count;
      });
    }

    res.json({
      success: true,
      data: result
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