import express from 'express';
import Project from '../models/Project.js';
import { authMiddleware, requireCreatorOrAdmin } from '../middleware/auth.js';
import mongoose from 'mongoose'; // Added missing import for mongoose

const router = express.Router();

// 获取所有项目列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      level,
      trade,
      search,
      sortBy = 'createdAt',
      sortOrder = 'asc' // 改为升序，确保最早创建的项目排在前面
    } = req.query;

    if (global.memoryDB) {
      // 内存数据库模式
      let projects = global.memoryDB.projects || [];
      
      // 过滤
      if (status) {
        projects = projects.filter(project => project.status === status);
      }
      if (level) {
        projects = projects.filter(project => project.level === level);
      }
      if (trade) {
        projects = projects.filter(project => project.trade === trade);
      }
      if (search) {
        projects = projects.filter(project => 
          project.name.toLowerCase().includes(search.toLowerCase()) ||
          (project.sku && project.sku.toLowerCase().includes(search.toLowerCase())) ||
          (project.supplier && project.supplier.toLowerCase().includes(search.toLowerCase())) ||
          (project.description && project.description.toLowerCase().includes(search.toLowerCase()))
        );
      }
      
      // 排序
      projects.sort((a, b) => {
        if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
          // 对于日期字段，转换为Date对象进行比较
          const aValue = new Date(a[sortBy] || new Date(0));
          const bValue = new Date(b[sortBy] || new Date(0));
          return sortOrder === 'desc' ? 
            (bValue.getTime() - aValue.getTime()) : 
            (aValue.getTime() - bValue.getTime());
        } else {
          // 对于其他字段，使用字符串比较
          const aValue = a[sortBy] || '';
          const bValue = b[sortBy] || '';
          return sortOrder === 'desc' ? 
            (bValue > aValue ? 1 : -1) : 
            (aValue > bValue ? 1 : -1);
        }
      });
      
      // 分页
      const total = projects.length;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const paginatedProjects = projects.slice(skip, skip + parseInt(limit));
      
      // 确保返回完整的项目数据
      const projectsWithFullData = paginatedProjects.map((project, index) => ({
        id: project._id,
        sequenceNumber: skip + index + 1, // 添加序号，基于全局位置
        model: project.name, // 将name映射到model
        sku: project.sku || project.name, // 使用sku或name作为默认值
        categoryLevel3: project.categoryLevel3 || '-', // 添加三级类目字段
        interfaceFeatures: project.interfaceFeatures,
        description: project.description,
        level: project.level,
        trade: project.trade,
        supplier: project.supplier || '-', // 确保供应商字段有默认值
        status: project.status,
        manager: project.manager,
        creator: project.creator,
        creatorName: project.creatorName || '系统管理员',
        productImages: project.productImages || [],
        members: project.members || [],
        versions: project.versions || [],
        stages: project.stages || [],
        hardwareSolution: project.hardwareSolution || '-', // 确保硬件方案字段有默认值
        remarks: project.remarks || '-', // 确保备注字段有默认值
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      }));
      
      res.json({
        success: true,
        data: {
          projects: projectsWithFullData,
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
      if (level) query.level = level;
      if (trade) query.trade = trade;
      
      // 搜索功能
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { supplier: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // 分页
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const limitNum = parseInt(limit);

      // 构建排序
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const projects = await Project.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('manager', 'name email')
        .populate('creator', 'name email');

      const total = await Project.countDocuments(query);

      // 添加序号和字段映射
      const projectsWithFullData = projects.map((project, index) => ({
        ...project.toObject(),
        sequenceNumber: skip + index + 1, // 添加序号，基于全局位置
        model: project.name, // 将name映射到model
        sku: project.sku || project.name, // 使用sku或name作为默认值
        categoryLevel3: project.categoryLevel3 || '-', // 添加三级类目字段
        supplier: project.supplier || '-', // 确保供应商字段有默认值
        productImages: project.productImages || [], // 确保产品图片字段有默认值
        hardwareSolution: project.hardwareSolution || '-', // 确保硬件方案字段有默认值
        remarks: project.remarks || '-', // 确保备注字段有默认值
        versions: project.versions || [], // 确保版本信息字段有默认值
        stages: project.stages || [] // 确保样机阶段字段有默认值
      }));

      res.json({
        success: true,
        data: {
          projects: projectsWithFullData,
          pagination: {
            page: parseInt(page),
            pageSize: limitNum,
            total
          }
        }
      });
    }
  } catch (error) {
    console.error('获取项目列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
});

// 创建新项目
router.post('/', authMiddleware, async (req, res) => {
  try {
    // 调试：检查接收到的原始数据
    console.log('=== 项目创建调试信息 ===');
    console.log('请求体类型:', typeof req.body);
    console.log('productImages类型:', typeof req.body.productImages);
    console.log('productImages是否为数组:', Array.isArray(req.body.productImages));
    console.log('productImages内容:', JSON.stringify(req.body.productImages, null, 2));
    console.log('=== 调试信息结束 ===');

    const {
      name,
      model, // 添加model字段支持
      description,
      categoryLevel3, // 添加三级类目字段
      level = 'level1',
      trade = 'software',
      status = 'planning',
      manager,
      startDate,
      endDate,
      budget,
      tags = [],
      members = [],
      supplier, // 确保提取供应商字段
      interfaceFeatures, // 确保提取接口特性字段
      hardwareSolution, // 确保提取硬件方案字段
      remarks, // 确保提取备注字段
      productImages // 添加产品图片字段
    } = req.body;

    // 使用model或name作为项目名称
    const projectName = model || name;
    
    console.log('项目名称:', projectName); // 调试信息
    console.log('项目数据:', { name, model, description, level, trade, status, manager }); // 调试信息
    
    if (!projectName) {
      console.log('项目名称为空，返回400错误'); // 调试信息
      return res.status(400).json({
        success: false,
        message: '项目名称不能为空'
      });
    }

    if (global.memoryDB) {
      // 内存数据库模式
      const newProject = {
        _id: Date.now().toString(),
        name: projectName,
        model: projectName, // 添加model字段
        sku: req.body.sku || projectName, // 添加sku字段
        categoryLevel3: categoryLevel3, // 添加三级类目字段
        interfaceFeatures: req.body.interfaceFeatures,
        description,
        level,
        trade,
        supplier: req.body.supplier, // 确保保存供应商字段
        status,
        manager: manager || req.user.id,
        creator: req.user.id,
        creatorName: req.user.name || '系统管理员',
        productImages: processedProductImages, // 使用处理后的图片数据
        members,
        versions: req.body.versions || [],
        stages: req.body.stages || [],
        hardwareSolution: req.body.hardwareSolution, // 确保保存硬件方案字段
        remarks: req.body.remarks, // 确保保存备注字段
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('创建内存项目:', newProject); // 调试信息
      global.memoryDB.projects.push(newProject);

      // 返回项目信息
      const { _id, ...projectResponse } = newProject;
      projectResponse.id = _id;

      console.log('返回项目响应:', projectResponse); // 调试信息
      res.status(201).json({
        success: true,
        data: projectResponse
      });
    } else {
      // MongoDB模式 - 采用与内存模式相同的处理方式
      console.log('=== MongoDB模式项目创建 ===');
      
      // 处理产品图片数据，确保格式正确 - 与内存模式保持一致
      let processedProductImages = [];
      console.log('接收到的原始productImages:', productImages);
      console.log('productImages类型:', typeof productImages);
      console.log('productImages是否为数组:', Array.isArray(productImages));
      
      if (productImages && Array.isArray(productImages) && productImages.length > 0) {
        // 确保包含MongoDB模型中定义的所有字段，与内存模式保持一致
        processedProductImages = productImages.map((img) => ({
          name: img.name || '产品图片',
          url: img.url || '',
          size: img.size || 0,
          type: img.type || 'image/jpeg',
          uploadedBy: req.user.name || '系统管理员',
          uploadedAt: new Date()
        }));
      }

      console.log('处理后的图片数据:', processedProductImages); // 调试信息

      // 处理members字段，确保格式正确 - 与内存模式保持一致
      const processedMembers = members.map(member => ({
        userId: new mongoose.Types.ObjectId(member.userId), // 转换为ObjectId
        name: member.name || '未知用户', // 使用name字段
        role: member.role || 'developer',
        joinDate: new Date()
      }));

      // 创建项目对象 - 与内存模式保持一致的结构
      const projectData = {
        name: projectName,
        model: projectName,
        sku: req.body.sku || projectName,
        categoryLevel3: categoryLevel3 || '默认类目',
        description: description || '',
        level: level || 'L2',
        trade: trade || '内贸',
        status: status || '研发设计',
        manager: manager || (req.user._id || req.user.id),
        creator: req.user._id || req.user.id,
        startDate: startDate || new Date(),
        endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        budget: budget || 0,
        tags: tags || [],
        members: processedMembers,
        supplier: req.body.supplier || '',
        interfaceFeatures: req.body.interfaceFeatures || '',
        hardwareSolution: req.body.hardwareSolution || '',
        remarks: req.body.remarks || '',
        productImages: processedProductImages, // 使用处理后的图片数据
        versions: req.body.versions || [],
        stages: req.body.stages || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('MongoDB项目数据:', projectData); // 调试信息

      const newProject = new Project(projectData);
      const savedProject = await newProject.save();
      
      // 填充关联数据
      await savedProject.populate('manager', 'name email');
      await savedProject.populate('creator', 'name email');

      console.log('MongoDB项目创建成功:', savedProject._id); // 调试信息

      res.status(201).json({
        success: true,
        data: savedProject
      });
    }
  } catch (error) {
    console.error('创建项目失败:', error);
    console.error('错误详情:', {
      errorMessage: error.message,
      errorStack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({
      success: false,
      message: '创建项目失败',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 获取单个项目详情
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const project = global.memoryDB.projects.find(p => p._id === req.params.id);
      
      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      // 确保返回完整的项目数据
      const projectWithFullData = {
        id: project._id,
        model: project.name, // 将name映射到model
        sku: project.sku || project.name, // 使用sku或name作为默认值
        interfaceFeatures: project.interfaceFeatures,
        description: project.description,
        level: project.level,
        trade: project.trade,
        supplier: project.supplier || '-', // 确保供应商字段有默认值
        status: project.status,
        manager: project.manager,
        creator: project.creator,
        creatorName: project.creatorName || '系统管理员',
        productImages: project.productImages || [],
        members: project.members || [],
        versions: project.versions || [],
        stages: project.stages || [],
        hardwareSolution: project.hardwareSolution || '-', // 确保硬件方案字段有默认值
        remarks: project.remarks || '-', // 确保备注字段有默认值
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };

      res.json({
        success: true,
        data: projectWithFullData
      });
    } else {
      // MongoDB模式
      const project = await Project.findById(req.params.id)
        .populate('manager', 'name email')
        .populate('creator', 'name email');

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      // 确保返回完整的项目数据
      const projectWithFullData = {
        ...project.toObject(),
        model: project.name, // 将name映射到model
        sku: project.sku || project.name, // 使用sku或name作为默认值
        categoryLevel3: project.categoryLevel3 || '-', // 添加三级类目字段
        supplier: project.supplier || '-', // 确保供应商字段有默认值
        productImages: project.productImages || [], // 确保产品图片字段有默认值
        hardwareSolution: project.hardwareSolution || '-', // 确保硬件方案字段有默认值
        remarks: project.remarks || '-', // 确保备注字段有默认值
        versions: project.versions || [], // 确保版本信息字段有默认值
        stages: project.stages || [], // 确保样机阶段字段有默认值
        interfaceFeatures: project.interfaceFeatures || '-' // 确保接口特性字段有默认值
      };

      res.json({
        success: true,
        data: projectWithFullData
      });
    }
  } catch (error) {
    console.error('获取项目详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
      error: error.message
    });
  }
});

// 更新项目
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const projectIndex = global.memoryDB.projects.findIndex(p => p._id === req.params.id);
      
      if (projectIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      const project = global.memoryDB.projects[projectIndex];
      
      // 更新项目数据
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      // 处理字段映射
      if (updateData.model) {
        updateData.name = updateData.model; // 将model映射到name
      }

      Object.assign(project, updateData);

      // 确保返回完整的项目数据
      const projectWithFullData = {
        id: project._id,
        model: project.name, // 将name映射到model
        sku: project.sku || project.name, // 使用sku或name作为默认值
        interfaceFeatures: project.interfaceFeatures,
        description: project.description,
        level: project.level,
        trade: project.trade,
        supplier: project.supplier || '-', // 确保供应商字段有默认值
        status: project.status,
        manager: project.manager,
        creator: project.creator,
        creatorName: project.creatorName || '系统管理员',
        productImages: project.productImages || [],
        members: project.members || [],
        versions: project.versions || [],
        stages: project.stages || [],
        hardwareSolution: project.hardwareSolution || '-', // 确保硬件方案字段有默认值
        remarks: project.remarks || '-', // 确保备注字段有默认值
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };

      res.json({
        success: true,
        data: projectWithFullData
      });
    } else {
      // MongoDB模式 - 采用与内存模式相同的处理方式
      console.log('=== MongoDB模式项目更新 ===');
      console.log('更新请求体:', req.body);
      
      // 处理产品图片数据，确保格式正确 - 与内存模式保持一致
      let processedProductImages = [];
      if (req.body.productImages && Array.isArray(req.body.productImages) && req.body.productImages.length > 0) {
        processedProductImages = req.body.productImages.map((img) => ({
          name: img.name || '产品图片',
          url: img.url || '',
          size: img.size || 0,
          type: img.type || 'image/jpeg',
          uploadedBy: req.user.name || '系统管理员',
          uploadedAt: new Date()
        }));
      }

      // 处理members字段，确保格式正确 - 与内存模式保持一致
      let processedMembers = [];
      if (req.body.members && Array.isArray(req.body.members)) {
        processedMembers = req.body.members.map(member => ({
          userId: new mongoose.Types.ObjectId(member.userId),
          name: member.name || '未知用户', // 使用name字段
          role: member.role || 'developer',
          joinDate: new Date()
        }));
      }

      // 构建更新数据 - 与内存模式保持一致的结构
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      // 处理字段映射
      if (updateData.model) {
        updateData.name = updateData.model; // 将model映射到name
      }

      // 确保必需字段有默认值
      updateData.categoryLevel3 = updateData.categoryLevel3 || '默认类目';
      updateData.description = updateData.description || '';
      updateData.level = updateData.level || 'L2';
      updateData.trade = updateData.trade || '内贸';
      updateData.status = updateData.status || '研发设计';
      updateData.supplier = updateData.supplier || '';
      updateData.interfaceFeatures = updateData.interfaceFeatures || '';
      updateData.hardwareSolution = updateData.hardwareSolution || '';
      updateData.remarks = updateData.remarks || '';
      updateData.budget = updateData.budget || 0;
      updateData.tags = updateData.tags || [];
      updateData.versions = updateData.versions || [];
      updateData.stages = updateData.stages || [];

      // 如果有处理后的图片数据，使用处理后的数据
      if (processedProductImages.length > 0) {
        updateData.productImages = processedProductImages;
      }

      // 如果有处理后的成员数据，使用处理后的数据
      if (processedMembers.length > 0) {
        updateData.members = processedMembers;
      }

      console.log('MongoDB更新数据:', updateData); // 调试信息

      const updatedProject = await Project.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('manager', 'name email')
       .populate('creator', 'name email');

      if (!updatedProject) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      console.log('MongoDB项目更新成功:', updatedProject._id); // 调试信息

      res.json({
        success: true,
        data: updatedProject
      });
    }
  } catch (error) {
    console.error('更新项目失败:', error);
    console.error('错误详情:', {
      errorMessage: error.message,
      errorStack: error.stack,
      requestBody: req.body,
      projectId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: '更新项目失败',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 删除项目
router.delete('/:id', authMiddleware, requireCreatorOrAdmin('project'), async (req, res) => {
  try {
    if (global.memoryDB) {
      // 内存数据库模式
      const projectIndex = global.memoryDB.projects.findIndex(p => p._id === req.params.id);
      
      if (projectIndex === -1) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      global.memoryDB.projects.splice(projectIndex, 1);

      res.json({
        success: true,
        message: '项目删除成功'
      });
    } else {
      // MongoDB模式
      const project = await Project.findByIdAndDelete(req.params.id);

      if (!project) {
        return res.status(404).json({
          success: false,
          message: '项目不存在'
        });
      }

      res.json({
        success: true,
        message: '项目删除成功'
      });
    }
  } catch (error) {
    console.error('删除项目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message
    });
  }
});

// 添加项目成员
router.post('/:id/members', authMiddleware, async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: '请提供用户ID和角色'
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 检查用户是否已经是项目成员
    const existingMember = project.members.find(member => 
      member.user.toString() === userId
    );

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: '用户已经是项目成员'
      });
    }

    project.members.push({
      user: userId,
      role,
      joinDate: new Date()
    });

    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('添加项目成员失败:', error);
    res.status(500).json({
      success: false,
      message: '添加项目成员失败',
      error: error.message
    });
  }
});

// 移除项目成员
router.delete('/:id/members/:userId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    project.members = project.members.filter(member => 
      member.user.toString() !== req.params.userId
    );

    await project.save();
    await project.populate('members.user', 'name email role');

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('移除项目成员失败:', error);
    res.status(500).json({
      success: false,
      message: '移除项目成员失败',
      error: error.message
    });
  }
});

// 更新项目状态
router.post('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供项目状态'
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('manager', 'name email')
     .populate('members.user', 'name email role');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('更新项目状态失败:', error);
    res.status(500).json({
      success: false,
      message: '更新项目状态失败',
      error: error.message
    });
  }
});

// 获取项目统计信息
router.get('/statistics/overview', authMiddleware, async (req, res) => {
  try {
    const [
      total,
      planning,
      inProgress,
      completed,
      cancelled,
      overdue,
      dueThisMonth
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'planning' }),
      Project.countDocuments({ status: 'in_progress' }),
      Project.countDocuments({ status: 'completed' }),
      Project.countDocuments({ status: 'cancelled' }),
      Project.countDocuments({
        endDate: { $lt: new Date() },
        status: { $nin: ['completed', 'cancelled'] }
      }),
      Project.countDocuments({
        endDate: {
          $gte: new Date(),
          $lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total,
        planning,
        inProgress,
        completed,
        cancelled,
        overdue,
        dueThisMonth
      }
    });
  } catch (error) {
    console.error('获取项目统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目统计失败',
      error: error.message
    });
  }
});

export default router; 