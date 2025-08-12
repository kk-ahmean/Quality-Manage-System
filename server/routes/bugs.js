import express from 'express';
import Bug from '../models/Bug.js';
import { authMiddleware, requireCreatorOrAdmin } from '../middleware/auth.js';

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
        sequenceNumber: idx + 1,
        // 确保creator和reporter字段格式正确
        creator: bug.creator,
        creatorName: bug.creatorName,
        reporter: bug.reporter,
        reporterName: bug.reporterName,
        assignee: bug.assignee,
        assigneeName: bug.assigneeName
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
        .populate('creator', 'name email')
        .populate('assignee', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      // 获取总数
      const total = await Bug.countDocuments(query);

      // 处理返回数据，确保字段格式正确
      const processedBugs = bugs.map(bug => {
        const bugObj = bug.toObject();
        return {
          ...bugObj,
          id: bugObj._id,
          creator: bugObj.creator._id || bugObj.creator,
          creatorName: bugObj.creator.name || bugObj.creatorName,
          reporter: bugObj.reporter._id || bugObj.reporter,
          reporterName: bugObj.reporter.name || bugObj.reporterName,
          assignee: bugObj.assignee ? (bugObj.assignee._id || bugObj.assignee) : null,
          assigneeName: bugObj.assignee ? (bugObj.assignee.name || bugObj.assigneeName) : ''
        };
      });

      res.json({
        success: true,
        data: {
          bugs: processedBugs,
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
      .populate('creator', 'name email')
      .populate('assignee', 'name email')
      .populate('comments.author', 'name email');

    if (!bug) {
      return res.status(404).json({
        success: false,
        message: 'Bug不存在'
      });
    }

    // 处理返回数据，确保字段格式正确
    const bugObj = bug.toObject();
    const processedBug = {
      ...bugObj,
      id: bugObj._id,
      creator: bugObj.creator._id || bugObj.creator,
      creatorName: bugObj.creator.name || bugObj.creatorName,
      reporter: bugObj.reporter._id || bugObj.reporter,
      reporterName: bugObj.reporter.name || bugObj.reporterName,
      assignee: bugObj.assignee ? (bugObj.assignee._id || bugObj.assignee) : null,
      assigneeName: bugObj.assignee ? (bugObj.assignee.name || bugObj.assigneeName) : ''
    };

    res.json({
      success: true,
      data: processedBug
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
      const bugData = { ...req.body };
      
      // 确保必填字段有默认值
      if (!bugData.description) bugData.description = '批量导入的Bug';
      if (!bugData.reproductionSteps) bugData.reproductionSteps = '批量导入';
      if (!bugData.actualResult) bugData.actualResult = '批量导入';
      if (!bugData.categoryLevel3) bugData.categoryLevel3 = '默认类目';
      if (!bugData.model) bugData.model = '默认型号';
      if (!bugData.sku) bugData.sku = '默认SKU';
      if (!bugData.hardwareVersion) bugData.hardwareVersion = '默认硬件版本';
      if (!bugData.softwareVersion) bugData.softwareVersion = '默认软件版本';
      
      // 确保枚举字段的值有效
      const validPriorities = ['P0', 'P1', 'P2', 'P3'];
      const validSeverities = ['S', 'A', 'B', 'C'];
      const validTypes = ['电气性能', '可靠性', '环保', '安规', '资料', '兼容性', '复测与确认', '设备特性', '其它'];
      const validResponsibilities = ['软件', '硬件', '结构', 'ID', '包装', '产品', '项目', '供应商', 'DQE', '实验室'];
      const validStatuses = ['新建', '处理中', '待验证', '已解决', '已关闭', '重新打开'];
      
      if (bugData.priority && !validPriorities.includes(bugData.priority)) {
        bugData.priority = 'P3';
      }
      if (bugData.severity && !validSeverities.includes(bugData.severity)) {
        bugData.severity = 'C';
      }
      if (bugData.type && !validTypes.includes(bugData.type)) {
        bugData.type = '电气性能';
      }
      if (bugData.responsibility && !validResponsibilities.includes(bugData.responsibility)) {
        bugData.responsibility = '软件';
      }
      if (bugData.status && !validStatuses.includes(bugData.status)) {
        bugData.status = '新建';
      }
      
      // 确保assignee字段格式正确
      if (bugData.assignee === '') {
        bugData.assignee = null;
      }
      
      const newBug = {
        _id: Date.now().toString(),
        ...bugData,
        reporter: req.user.id,
        reporterName: req.user.name,
        creator: req.user.id,
        creatorName: req.user.name,
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
        reporterName: req.user.name,
        creator: req.user.id,
        creatorName: req.user.name
      };

      // 确保必填字段有默认值
      if (!bugData.description) bugData.description = '批量导入的Bug';
      if (!bugData.reproductionSteps) bugData.reproductionSteps = '批量导入';
      if (!bugData.actualResult) bugData.actualResult = '批量导入';
      if (!bugData.categoryLevel3) bugData.categoryLevel3 = '默认类目';
      if (!bugData.model) bugData.model = '默认型号';
      if (!bugData.sku) bugData.sku = '默认SKU';
      if (!bugData.hardwareVersion) bugData.hardwareVersion = '默认硬件版本';
      if (!bugData.softwareVersion) bugData.softwareVersion = '默认软件版本';
      
      // 确保枚举字段的值有效
      const validPriorities = ['P0', 'P1', 'P2', 'P3'];
      const validSeverities = ['S', 'A', 'B', 'C'];
      const validTypes = ['电气性能', '可靠性', '环保', '安规', '资料', '兼容性', '复测与确认', '设备特性', '其它'];
      const validResponsibilities = ['软件', '硬件', '结构', 'ID', '包装', '产品', '项目', '供应商', 'DQE', '实验室'];
      const validStatuses = ['新建', '处理中', '待验证', '已解决', '已关闭', '重新打开'];
      
      if (bugData.priority && !validPriorities.includes(bugData.priority)) {
        bugData.priority = 'P3';
      }
      if (bugData.severity && !validSeverities.includes(bugData.severity)) {
        bugData.severity = 'C';
      }
      if (bugData.type && !validTypes.includes(bugData.type)) {
        bugData.type = '电气性能';
      }
      if (bugData.responsibility && !validResponsibilities.includes(bugData.responsibility)) {
        bugData.responsibility = '软件';
      }
      if (bugData.status && !validStatuses.includes(bugData.status)) {
        bugData.status = '新建';
      }
      
      // 确保assignee字段格式正确
      if (bugData.assignee === '') {
        bugData.assignee = null;
      }

      console.log('创建Bug数据:', bugData);

      const bug = new Bug(bugData);
      await bug.save();

      // 重新查询以获取关联数据
      const savedBug = await Bug.findById(bug._id)
        .populate('reporter', 'name email')
        .populate('creator', 'name email')
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
      
      // 权限检查：所有用户都可以编辑Bug，但权限不同
      const isAdmin = req.user.role === 'admin';
      const isCreator = bug.creator === req.user.id || bug.creator === req.user._id;
      const isReporter = bug.reporter === req.user.id || bug.reporter === req.user._id;
      
      console.log('Bug编辑权限检查:', {
        userId: req.user.id,
        user_id: req.user._id,
        userRole: req.user.role,
        bugCreator: bug.creator,
        bugReporter: bug.reporter,
        isAdmin,
        isCreator,
        isReporter
      });
      
      // 检查是否尝试编辑核心字段（非管理员且非创建者/报告者）
      if (!isAdmin && !isCreator && !isReporter) {
        const coreFields = ['title', 'description', 'reproductionSteps', 'expectedResult', 'actualResult'];
        const hasCoreFieldChanges = coreFields.some(field => req.body.hasOwnProperty(field));
        
        console.log('权限检查详情:', {
          requestBody: req.body,
          requestBodyKeys: Object.keys(req.body),
          coreFields,
          hasCoreFieldChanges,
          attemptedCoreFields: Object.keys(req.body).filter(field => coreFields.includes(field))
        });
        
        if (hasCoreFieldChanges) {
          console.log('权限不足，拒绝编辑核心字段:', {
            attemptedFields: Object.keys(req.body).filter(field => coreFields.includes(field))
          });
          return res.status(403).json({ 
            success: false, 
            message: '权限不足，只有管理员、创建者或报告者可以编辑Bug的核心字段（标题、描述、复现步骤、预期结果、实际结果）' 
          });
        }
      }
      
      // 记录更新前的Bug信息
      console.log('更新Bug:', {
        bugId: bug._id,
        oldData: {
          title: bug.title,
          status: bug.status,
          priority: bug.priority
        },
        newData: req.body
      });
      
      Object.assign(bug, req.body);
      bug.updatedAt = new Date();
      global.memoryDB.bugs[bugIndex] = bug;
      
      console.log('Bug更新成功');
      
      // 返回处理后的Bug信息，确保字段格式正确
      const { _id, ...bugResponse } = bug;
      const processedBug = {
        ...bugResponse,
        id: _id,
        creator: bug.creator,
        creatorName: bug.creatorName,
        reporter: bug.reporter,
        reporterName: bug.reporterName,
        assignee: bug.assignee,
        assigneeName: bug.assigneeName
      };
      
      res.json({ success: true, message: 'Bug更新成功', data: processedBug });
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

    // 权限检查：所有用户都可以编辑Bug，但权限不同
    const isAdmin = req.user.role === 'admin';
    const isCreator = bug.creator.toString() === req.user.id || bug.creator.toString() === req.user._id;
    const isReporter = bug.reporter.toString() === req.user.id || bug.reporter.toString() === req.user._id;
    
    console.log('Bug编辑权限检查 (MongoDB):', {
      userId: req.user.id,
      user_id: req.user._id,
      userRole: req.user.role,
      bugCreator: bug.creator.toString(),
      bugReporter: bug.reporter.toString(),
      isAdmin,
      isCreator,
      isReporter
    });
    
    // 检查是否尝试编辑核心字段（非管理员且非创建者/报告者）
    if (!isAdmin && !isCreator && !isReporter) {
      const coreFields = ['title', 'description', 'reproductionSteps', 'expectedResult', 'actualResult'];
      const hasCoreFieldChanges = coreFields.some(field => req.body.hasOwnProperty(field));
      
      console.log('权限检查详情 (MongoDB):', {
        requestBody: req.body,
        requestBodyKeys: Object.keys(req.body),
        coreFields,
        hasCoreFieldChanges,
        attemptedCoreFields: Object.keys(req.body).filter(field => coreFields.includes(field))
      });
      
      if (hasCoreFieldChanges) {
        console.log('权限不足，拒绝编辑核心字段 (MongoDB):', {
          attemptedFields: Object.keys(req.body).filter(field => coreFields.includes(field))
        });
        return res.status(403).json({
          success: false,
          message: '权限不足，只有管理员、创建者或报告者可以编辑Bug的核心字段（标题、描述、复现步骤、预期结果、实际结果）'
        });
      }
    }

    // 记录更新前的Bug信息
    console.log('更新Bug (MongoDB):', {
      bugId: bug._id,
      oldData: {
        title: bug.title,
        status: bug.status,
        priority: bug.priority
      },
      newData: req.body
    });

    // 更新Bug数据
    Object.assign(bug, req.body);
    bug.updatedAt = new Date();
    
    await bug.save();

    console.log('Bug更新成功 (MongoDB)');

    // 重新查询以获取关联数据
    const updatedBug = await Bug.findById(bug._id)
      .populate('reporter', 'name email')
      .populate('creator', 'name email')
      .populate('assignee', 'name email');

    // 处理返回数据，确保字段格式正确
    const bugObj = updatedBug.toObject();
    const processedBug = {
      ...bugObj,
      id: bugObj._id,
      creator: bugObj.creator._id || bugObj.creator,
      creatorName: bugObj.creator.name || bugObj.creatorName,
      reporter: bugObj.reporter._id || bugObj.reporter,
      reporterName: bugObj.reporter.name || bugObj.reporterName,
      assignee: bugObj.assignee ? (bugObj.assignee._id || bugObj.assignee) : null,
      assigneeName: bugObj.assignee ? (bugObj.assignee.name || bugObj.assigneeName) : ''
    };

    res.json({
      success: true,
      message: 'Bug更新成功',
      data: processedBug
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
router.delete('/:id', authMiddleware, requireCreatorOrAdmin('bug'), async (req, res) => {
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
      .populate('creator', 'name email')
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
      .populate('creator', 'name email')
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
    const bugs = await Bug.find().populate('reporter', 'name email').populate('creator', 'name email').populate('assignee', 'name email');
    
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