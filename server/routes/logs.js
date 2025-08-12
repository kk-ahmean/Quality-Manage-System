import express from 'express';
import UserActivityLog from '../models/UserActivityLog.js';
import { logUserActivity } from '../middleware/activityLogger.js';

const router = express.Router();

// 获取日志列表（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      severity,
      status,
      userId,
      startDate,
      endDate,
      search
    } = req.query;

    // 构建查询条件
    const query = {};

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        // 修复日期筛选：开始日期从00:00:00开始
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDateTime;
      }
      if (endDate) {
        // 修复日期筛选：结束日期到23:59:59结束
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { action: { $regex: search, $options: 'i' } }
      ];
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    let logs, total;

    if (global.memoryDB) {
      // 内存数据库模式
      let filteredLogs = global.memoryDB.userActivityLogs.filter(log => {
        // 改进的内存筛选逻辑，与查询接口保持一致
        if (action && log.action !== action) return false;
        if (severity && log.severity !== severity) return false;
        if (status && log.status !== status) return false;
        if (userId && log.userId !== userId) return false;
        
        // 修复日期筛选逻辑
        if (startDate || endDate) {
          const logDate = new Date(log.createdAt);
          if (startDate) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(0, 0, 0, 0);
            if (logDate < startDateTime) return false;
          }
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            if (logDate > endDateTime) return false;
          }
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          return log.description.toLowerCase().includes(searchLower) ||
                 log.userName.toLowerCase().includes(searchLower) ||
                 log.action.toLowerCase().includes(searchLower);
        }
        return true;
      });

      total = filteredLogs.length;
      logs = filteredLogs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + pageLimit);
    } else {
      // MongoDB模式
      total = await UserActivityLog.countDocuments(query);
      logs = await UserActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit);
        // 移除populate，直接使用userName字段
    }

    // 记录查询操作
    await logUserActivity({
      userId: req.user?.id,
      userName: req.user?.name || '匿名用户',
      action: 'VIEW_SYSTEM_LOGS',
      description: '查看系统日志',
      details: {
        query: req.query,
        resultCount: logs.length,
        totalCount: total
      },
      resourceType: 'system',
      severity: 'low',
      status: 'success',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log._id,
          userId: log.userId,
          userName: log.userName,
          action: log.action,
          description: log.description,
          resourceType: log.resourceType,
          resourceId: log.resourceId,
          severity: log.severity,
          status: log.status,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
          createdAt: log.createdAt,
          updatedAt: log.updatedAt
        })),
        pagination: {
          page: parseInt(page),
          limit: pageLimit,
          total,
          pages: Math.ceil(total / pageLimit)
        }
      }
    });

  } catch (error) {
    console.error('获取日志列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日志列表失败',
      error: error.message
    });
  }
});

// 获取日志统计信息
router.get('/stats', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let stats;

    if (global.memoryDB) {
      // 内存数据库模式
      const filteredLogs = global.memoryDB.userActivityLogs.filter(
        log => new Date(log.createdAt) >= startDate
      );

      // 按日期分组统计
      const dateGroups = {};
      filteredLogs.forEach(log => {
        const date = new Date(log.createdAt).toISOString().split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = { total: 0, actions: {} };
        }
        dateGroups[date].total++;
        
        if (!dateGroups[date].actions[log.action]) {
          dateGroups[date].actions[log.action] = 0;
        }
        dateGroups[date].actions[log.action]++;
      });

      stats = Object.entries(dateGroups).map(([date, data]) => ({
        date,
        totalCount: data.total,
        actions: Object.entries(data.actions).map(([action, count]) => ({
          action,
          count
        }))
      })).sort((a, b) => a.date.localeCompare(b.date));

    } else {
      // MongoDB模式
      stats = await UserActivityLog.getSystemActivityStats(parseInt(days));
    }

    // 记录统计查询操作
    await logUserActivity({
      userId: req.user?.id,
      userName: req.user?.name || '匿名用户',
      action: 'VIEW_LOG_STATS',
      description: '查看日志统计信息',
      details: {
        days: parseInt(days),
        resultCount: stats.length
      },
      resourceType: 'system',
      severity: 'low',
      status: 'success',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取日志统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取日志统计失败',
      error: error.message
    });
  }
});

// 导出日志（CSV格式）- 性能优化版本
router.get('/export', async (req, res) => {
  try {
    const {
      action,
      severity,
      status,
      userId,
      startDate,
      endDate,
      format = 'csv',
      limit = '10000' // 添加导出数量限制，防止超时
    } = req.query;

    // 构建查询条件
    const query = {};

    if (action) {
      query.action = { $regex: action, $options: 'i' };
    }

    if (severity) {
      query.severity = severity;
    }

    if (status) {
      query.status = status;
    }

    if (userId) {
      query.userId = userId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        // 修复日期筛选：开始日期从00:00:00开始
        const startDateTime = new Date(startDate);
        startDateTime.setHours(0, 0, 0, 0);
        query.createdAt.$gte = startDateTime;
      }
      if (endDate) {
        // 修复日期筛选：结束日期到23:59:59结束
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateTime;
      }
    }

    // 设置导出数量限制，防止超时
    const exportLimit = Math.min(parseInt(limit), 50000); // 最大限制5万条

    let logs;
    let totalCount;

    if (global.memoryDB) {
      // 内存数据库模式 - 优化筛选性能
      const filteredLogs = global.memoryDB.userActivityLogs.filter(log => {
        // 改进的内存筛选逻辑，与查询接口保持一致
        if (action && log.action !== action) return false;
        if (severity && log.severity !== severity) return false;
        if (status && log.status !== status) return false;
        if (userId && log.userId !== userId) return false;
        
        // 修复日期筛选逻辑
        if (startDate || endDate) {
          const logDate = new Date(log.createdAt);
          if (startDate) {
            const startDateTime = new Date(startDate);
            startDateTime.setHours(0, 0, 0, 0);
            if (logDate < startDateTime) return false;
          }
          if (endDate) {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            if (logDate > endDateTime) return false;
          }
        }
        
        return true;
      });
      
      totalCount = filteredLogs.length;
      // 限制导出数量，提升性能
      logs = filteredLogs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, exportLimit);
    } else {
      // MongoDB模式 - 优化查询性能
      // 先获取总数
      totalCount = await UserActivityLog.countDocuments(query);
      
      // 限制导出数量，提升性能
      logs = await UserActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(exportLimit);
        // 移除populate，直接使用userName字段
    }

    if (format === 'csv') {
      // 性能优化：检查导出数量
      if (logs.length > exportLimit) {
        console.log(`⚠️  导出日志数量 ${logs.length} 超过限制 ${exportLimit}，已自动限制`);
      }
      
      // 生成CSV内容 - 优化性能
      const csvHeaders = [
        'ID',
        '用户ID',
        '用户名',
        '操作',
        '描述',
        '资源类型',
        '资源ID',
        '严重程度',
        '状态',
        'IP地址',
        '用户代理',
        '创建时间'
      ];

      // 使用更高效的CSV生成方式
      const csvRows = logs.map(log => [
        log._id || log.id || '',
        log.userId || '',
        log.userName || '',
        log.action || '',
        log.description || '',
        log.resourceType || '',
        log.resourceId || '',
        log.severity || '',
        log.status || '',
        log.ipAddress || '',
        log.userAgent || '',
        new Date(log.createdAt).toLocaleString('zh-CN')
      ]);

      // 优化CSV生成，减少内存占用
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => {
          // 处理CSV特殊字符
          const escapedField = String(field).replace(/"/g, '""');
          return `"${escapedField}"`;
        }).join(','))
        .join('\n');

      // 设置响应头
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="system-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      res.setHeader('X-Total-Count', totalCount.toString());
      res.setHeader('X-Exported-Count', logs.length.toString());

      // 记录导出操作
      await logUserActivity({
        userId: req.user?.id,
        userName: req.user?.name || '匿名用户',
        action: 'EXPORT_LOGS',
        description: '导出系统日志',
        details: {
          format: 'csv',
          query: req.query,
          totalCount: totalCount,
          exportedCount: logs.length,
          exportLimit: exportLimit
        },
        resourceType: 'system',
        severity: 'medium',
        status: 'success',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      });

      res.send(csvContent);
    } else {
      res.status(400).json({
        success: false,
        message: '不支持的导出格式，仅支持CSV格式'
      });
    }

  } catch (error) {
    console.error('导出日志失败:', error);
    res.status(500).json({
      success: false,
      message: '导出日志失败',
      error: error.message
    });
  }
});

// 清理旧日志
router.delete('/cleanup', async (req, res) => {
  try {
    const { daysToKeep = 15 } = req.query; // 默认保留15天，提升系统性能

    let deletedCount;

    if (global.memoryDB) {
      // 内存数据库模式
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysToKeep));

      const originalCount = global.memoryDB.userActivityLogs.length;
      global.memoryDB.userActivityLogs = global.memoryDB.userActivityLogs.filter(
        log => new Date(log.createdAt) >= cutoffDate
      );
      deletedCount = originalCount - global.memoryDB.userActivityLogs.length;
    } else {
      // MongoDB模式
      const result = await UserActivityLog.cleanOldLogs(parseInt(daysToKeep));
      deletedCount = result.deletedCount;
    }

    // 记录清理操作
    await logUserActivity({
      userId: req.user?.id,
      userName: req.user?.name || '匿名用户',
      action: 'CLEANUP_LOGS',
      description: '清理旧日志',
      details: {
        daysToKeep: parseInt(daysToKeep),
        deletedCount
      },
      resourceType: 'system',
      severity: 'medium',
      status: 'success',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: `成功清理 ${deletedCount} 条旧日志`,
      data: { deletedCount }
    });

  } catch (error) {
    console.error('清理旧日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清理旧日志失败',
      error: error.message
    });
  }
});

export default router; 