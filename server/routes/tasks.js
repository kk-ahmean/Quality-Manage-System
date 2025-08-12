import express from 'express';
import Task from '../models/Task.js';
import { authMiddleware, requireCreatorOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// 获取所有任务列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      assignee,
      creator,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    if (global.memoryDB) {
      // 内存数据库模式
      let tasks = global.memoryDB.tasks || [];
      
      // 过滤
      if (status) {
        tasks = tasks.filter(task => task.status === status);
      }
      if (priority) {
        tasks = tasks.filter(task => task.priority === priority);
      }
      if (assignee) {
        tasks = tasks.filter(task => task.assignee === assignee);
      }
      if (creator) {
        tasks = tasks.filter(task => task.creator === creator);
      }
      if (search) {
        tasks = tasks.filter(task => 
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(search.toLowerCase())) ||
          (task.tags && Array.isArray(task.tags) && task.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
        );
      }
      
      // 排序
      tasks.sort((a, b) => {
        const aValue = a[sortBy] || new Date(0);
        const bValue = b[sortBy] || new Date(0);
        return sortOrder === 'desc' ? 
          (bValue > aValue ? 1 : -1) : 
          (aValue > bValue ? 1 : -1);
      });
      
      // 分页
      const total = tasks.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedTasks = tasks.slice(skip, skip + parseInt(limit));
      
      // 添加序号字段
      const users = global.memoryDB.users || [];
      const tasksWithSequence = paginatedTasks.map((task, index) => {
        const assigneeObj = users.find(u => u._id === task.assignee);
        const creatorObj = users.find(u => u._id === task.creator);
        return {
          ...task,
          id: task._id,
          sequenceNumber: skip + index + 1,
          assignee: assigneeObj ? { id: assigneeObj._id, name: assigneeObj.name, email: assigneeObj.email } : task.assignee,
          creator: creatorObj ? { id: creatorObj._id, name: creatorObj.name, email: creatorObj.email } : task.creator
        };
      });
      
      res.json({
        success: true,
        data: {
          tasks: tasksWithSequence,
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
      
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (assignee) query.assignee = assignee;
      if (creator) query.creator = creator;
      
      // 搜索功能
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // 分页
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // 构建排序
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const tasks = await Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('assignee', 'name email')
        .populate('creator', 'name email');

      const total = await Task.countDocuments(query);

      // 为MongoDB模式添加序号
      const tasksWithSequence = tasks.map((task, index) => ({
        ...task.toObject(),
        sequenceNumber: skip + index + 1 // 添加序号，基于全局位置
      }));

      res.json({
        success: true,
        data: {
          tasks: tasksWithSequence,
          pagination: {
            page: parseInt(page),
            pageSize: limitNum,
            total
          }
        }
      });
    }
  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务列表失败',
      error: error.message
    });
  }
});

// 创建新任务
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'P2',
      status = 'todo',
      assignee,
      dueDate,
      estimatedHours,
      categoryLevel3,
      model,
      sku,
      tags = [],
      relatedBugs = []
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: '任务标题不能为空'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const newTask = {
        _id: Date.now().toString(),
        title,
        description,
        priority,
        status,
        assignee,
        creator: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        categoryLevel3,
        model,
        sku,
        tags,
        relatedBugs,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      global.memoryDB.tasks.push(newTask);

      // 返回任务信息
      const { _id, ...taskResponse } = newTask;
      taskResponse.id = _id;
      taskResponse.sequenceNumber = global.memoryDB.tasks.length; // 添加序号
      // 模拟populate
      const users = global.memoryDB.users || [];
      const assigneeObj = users.find(u => u._id === newTask.assignee);
      const creatorObj = users.find(u => u._id === newTask.creator);
      taskResponse.assignee = assigneeObj ? { id: assigneeObj._id, name: assigneeObj.name, email: assigneeObj.email } : newTask.assignee;
      taskResponse.creator = creatorObj ? { id: creatorObj._id, name: creatorObj.name, email: creatorObj.email } : newTask.creator;
      res.status(201).json({
        success: true,
        data: taskResponse
      });
    } else {
      // MongoDB模式
      const newTask = new Task({
        title,
        description,
        priority,
        status,
        assignee,
        creator: req.user.id,
        dueDate,
        estimatedHours,
        categoryLevel3,
        model,
        sku,
        tags,
        relatedBugs,
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedTask = await newTask.save();
      await savedTask.populate('assignee', 'name email');
      await savedTask.populate('creator', 'name email');

      res.status(201).json({
        success: true,
        data: savedTask
      });
    }
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({
      success: false,
      message: '创建任务失败',
      error: error.message
    });
  }
});

// 获取单个任务详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('creator', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: '任务不存在'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('获取任务详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
      error: error.message
    });
  }
});

// 更新任务
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      assignee,
      dueDate,
      estimatedHours,
      actualHours,
      tags,
      relatedBugs,
      progress
    } = req.body;

    if (global.memoryDB) {
      // 内存数据库模式
      const taskIndex = global.memoryDB.tasks.findIndex(task => task._id === req.params.id);
      
      if (taskIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const task = global.memoryDB.tasks[taskIndex];

      // 更新任务信息
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority) task.priority = priority;
      if (status) task.status = status;
      if (assignee) task.assignee = assignee;
      if (dueDate) task.dueDate = new Date(dueDate);
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
      if (actualHours !== undefined) task.actualHours = actualHours;
      if (tags) task.tags = tags;
      if (relatedBugs) task.relatedBugs = relatedBugs;
      if (progress !== undefined) task.progress = progress;
      
      // 如果进度达到100%，自动设置为完成状态
      if (progress >= 100 && task.status !== 'completed') {
        task.status = 'completed';
        task.completedAt = new Date();
      }
      
      task.updatedAt = new Date();

      // 返回更新后的任务信息
      const { _id, ...taskResponse } = task;
      taskResponse.id = _id;

      res.json({
        success: true,
        data: taskResponse
      });
    } else {
      // MongoDB模式
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      // 如果进度达到100%，自动设置为完成状态
      if (progress >= 100 && status !== 'completed') {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      }

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate('assignee', 'name email')
       .populate('creator', 'name email');

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: updatedTask
      });
    }
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务失败',
      error: error.message
    });
  }
});

// 删除任务
router.delete('/:id', authMiddleware, requireCreatorOrAdmin('task'), async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const taskIndex = global.memoryDB.tasks.findIndex(task => task._id === req.params.id);
      
      if (taskIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      // 从数组中删除任务
      global.memoryDB.tasks.splice(taskIndex, 1);

      res.json({
        success: true,
        message: '任务删除成功'
      });
    } else {
      // MongoDB模式
      const task = await Task.findByIdAndDelete(req.params.id);

      if (!task) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        message: '任务删除成功'
      });
    }
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({
      success: false,
      message: '删除任务失败',
      error: error.message
    });
  }
});

// 分配任务
router.post('/:id/assign', authMiddleware, async (req, res) => {
  try {
    const { assignee } = req.body;

    if (!assignee) {
      return res.status(400).json({
        success: false,
        message: '请指定任务负责人'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const taskIndex = global.memoryDB.tasks.findIndex(task => task._id === req.params.id);
      
      if (taskIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const task = global.memoryDB.tasks[taskIndex];
      task.assignee = assignee;
      task.status = 'todo';
      task.updatedAt = new Date();

      // 返回更新后的任务信息
      const { _id, ...taskResponse } = task;
      taskResponse.id = _id;
      // 模拟populate
      const users = global.memoryDB.users || [];
      const assigneeObj = users.find(u => u._id === task.assignee);
      const creatorObj = users.find(u => u._id === task.creator);
      taskResponse.assignee = assigneeObj ? { id: assigneeObj._id, name: assigneeObj.name, email: assigneeObj.email } : task.assignee;
      taskResponse.creator = creatorObj ? { id: creatorObj._id, name: creatorObj.name, email: creatorObj.email } : task.creator;
      res.json({
        success: true,
        data: taskResponse
      });
    } else {
      // MongoDB模式
      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        {
          assignee,
          status: 'todo',
          updatedAt: new Date()
        },
        { new: true }
      ).populate('assignee', 'name email')
       .populate('creator', 'name email');

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: updatedTask
      });
    }
  } catch (error) {
    console.error('分配任务失败:', error);
    res.status(500).json({
      success: false,
      message: '分配任务失败',
      error: error.message
    });
  }
});

// 更新任务进度
router.post('/:id/progress', authMiddleware, async (req, res) => {
  try {
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: '进度值必须在0-100之间'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const taskIndex = global.memoryDB.tasks.findIndex(task => task._id === req.params.id);
      
      if (taskIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      const task = global.memoryDB.tasks[taskIndex];
      task.progress = progress;
      task.updatedAt = new Date();

      // 根据进度自动设置状态
      if (progress >= 100) {
        task.status = 'completed';
        task.completedAt = new Date();
      } else if (progress > 0) {
        task.status = 'in_progress';
      } else {
        task.status = 'todo';
      }

      // 返回更新后的任务信息
      const { _id, ...taskResponse } = task;
      taskResponse.id = _id;

      res.json({
        success: true,
        data: taskResponse
      });
    } else {
      // MongoDB模式
      const updateData = {
        progress,
        updatedAt: new Date()
      };

      // 根据进度自动设置状态
      if (progress >= 100) {
        updateData.status = 'completed';
        updateData.completedAt = new Date();
      } else if (progress > 0) {
        updateData.status = 'in_progress';
      } else {
        updateData.status = 'todo';
      }

      const updatedTask = await Task.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      ).populate('assignee', 'name email')
       .populate('creator', 'name email');

      if (!updatedTask) {
        return res.status(404).json({
          success: false,
          message: '任务不存在'
        });
      }

      res.json({
        success: true,
        data: updatedTask
      });
    }
  } catch (error) {
    console.error('更新任务进度失败:', error);
    res.status(500).json({
      success: false,
      message: '更新任务进度失败',
      error: error.message
    });
  }
});

// 获取任务统计信息
router.get('/statistics/overview', authMiddleware, async (req, res) => {
  try {
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
      Task.countDocuments(),
      Task.countDocuments({ status: 'todo' }),
      Task.countDocuments({ status: 'in_progress' }),
      Task.countDocuments({ status: 'review' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'cancelled' }),
      Task.countDocuments({
        dueDate: { $lt: today },
        status: { $ne: 'completed' }
      }),
      Task.countDocuments({
        dueDate: {
          $gte: new Date(today.setHours(0, 0, 0, 0)),
          $lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }),
      Task.countDocuments({
        dueDate: {
          $gte: today,
          $lte: thisWeek
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        todo,
        inProgress,
        review,
        completed,
        cancelled,
        overdue,
        dueToday,
        dueThisWeek
      }
    });
  } catch (error) {
    console.error('获取任务统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取任务统计失败',
      error: error.message
    });
  }
});

export default router; 