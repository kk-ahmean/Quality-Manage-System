import UserActivityLog from '../models/UserActivityLog.js';

// 日志级别定义
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// 当前日志级别（可通过环境变量配置）
const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'INFO'];

// 操作类型映射 - 优化为更用户友好的中文描述，只保留重要操作
const actionTypeMap = {
  // 用户管理
  'POST /api/users': 'CREATE_USER',
  'PUT /api/users': 'UPDATE_USER',
  'DELETE /api/users': 'DELETE_USER',
  'POST /api/users/login': 'USER_LOGIN',
  'POST /api/users/logout': 'USER_LOGOUT',
  'PUT /api/users/change-password': 'CHANGE_PASSWORD',
  'POST /api/users/reset-password': 'RESET_PASSWORD',
  'PATCH /api/users/:id/password': 'CHANGE_PASSWORD',
  'PATCH /api/users/:id/permissions': 'UPDATE_USER_PERMISSIONS',
  
  // Bug管理
  'POST /api/bugs': 'CREATE_BUG',
  'PUT /api/bugs': 'UPDATE_BUG',
  'DELETE /api/bugs': 'DELETE_BUG',
  'PATCH /api/bugs/:id/status': 'UPDATE_BUG_STATUS',
  'PATCH /api/bugs/:id/assign': 'ASSIGN_BUG',
  
  // 项目管理
  'POST /api/projects': 'CREATE_PROJECT',
  'PUT /api/projects': 'UPDATE_PROJECT',
  'DELETE /api/projects': 'DELETE_PROJECT',
  'GET /api/projects/:id/statistics': 'VIEW_PROJECT_STATS',
  
  // 任务管理
  'POST /api/tasks': 'CREATE_TASK',
  'PUT /api/tasks': 'UPDATE_TASK',
  'DELETE /api/tasks': 'DELETE_TASK',
  'PATCH /api/tasks/:id/status': 'UPDATE_TASK_STATUS',
  'PATCH /api/tasks/:id/assign': 'ASSIGN_TASK',
  
  // 团队管理
  'POST /api/users/teams': 'CREATE_TEAM',
  'PUT /api/users/teams': 'UPDATE_TEAM',
  'DELETE /api/users/teams': 'DELETE_TEAM',
  
  // 日志管理
  'GET /api/logs/export': 'EXPORT_SYSTEM_LOGS',
  'DELETE /api/logs/cleanup': 'CLEANUP_LOGS',
  
  // 文件操作
  'POST /api/upload': 'FILE_UPLOAD',
  'GET /api/download': 'FILE_DOWNLOAD',
  
  // 数据操作
  'POST /api/import': 'DATA_IMPORT',
  'GET /api/export': 'DATA_EXPORT',
  
  // 系统操作
  'PUT /api/settings': 'UPDATE_SETTINGS',
};

// 资源类型映射
const resourceTypeMap = {
  'users': 'user',
  'bugs': 'bug',
  'projects': 'project',
  'tasks': 'task',
  'teams': 'team',
  'upload': 'file',
  'import': 'data',
  'export': 'data',
  'settings': 'system',
  'dashboard': 'system',
  'auth': 'auth'
};

// 敏感字段列表（这些字段的值会被过滤掉）
const sensitiveFields = [
  'password', 'token', 'secret', 'key', 'authorization', 
  'cookie', 'session', 'auth', 'credential'
];

// 不需要记录日志的路径和操作 - 扩展排除列表
const excludedPaths = [
  '/api/health',           // 健康检查
  '/api/favicon.ico',      // 网站图标
  '/api/robots.txt',       // 机器人协议
  '/api/sitemap.xml',      // 网站地图
  '/api/.well-known',      // 安全配置
  '/api/metrics',          // 监控指标
  '/api/status',           // 状态检查
  '/api/logs',             // 查看系统日志（避免循环记录）
  '/api/logs/stats',       // 查看日志统计
  '/api/users',            // 查看用户列表
  '/api/bugs',             // 查看Bug列表
  '/api/projects',         // 查看项目列表
  '/api/tasks',            // 查看任务列表
  '/api/users/teams',      // 查看团队列表
  '/api/dashboard',        // 查看仪表板
  '/api/settings'          // 查看设置
];

// 不需要记录日志的HTTP方法
const excludedMethods = [
  'OPTIONS',               // 预检请求
  'HEAD',                  // 头部请求
  'GET'                    // 排除所有GET请求（查看操作）
];

// 日志记录频率控制（防止过多日志）
const logRateLimit = {
  windowMs: 60000, // 1分钟窗口
  maxLogs: 50,     // 每分钟最多50条日志（减少冗余）
  logs: new Map()  // 存储IP地址的日志计数
};

// 检查日志频率限制
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - logRateLimit.windowMs;
  
  if (!logRateLimit.logs.has(ip)) {
    logRateLimit.logs.set(ip, []);
  }
  
  const ipLogs = logRateLimit.logs.get(ip);
  
  // 清理过期的日志记录
  const validLogs = ipLogs.filter(timestamp => timestamp > windowStart);
  
  if (validLogs.length >= logRateLimit.maxLogs) {
    return false; // 超过限制
  }
  
  // 添加新的日志记录
  validLogs.push(now);
  logRateLimit.logs.set(ip, validLogs);
  
  return true; // 允许记录
}

// 检查是否需要跳过日志记录
function shouldSkipLogging(req) {
  // 跳过排除的路径
  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return true;
  }
  
  // 跳过排除的HTTP方法
  if (excludedMethods.includes(req.method)) {
    return true;
  }
  
  // 跳过静态资源请求
  if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return true;
  }
  
  // 跳过页面访问日志（减少冗余）
  if (req.method === 'GET' && !req.path.includes('/api/')) {
    return true;
  }
  
  // 跳过查看类操作
  if (req.method === 'GET' && !req.path.includes('/statistics')) {
    return true;
  }
  
  return false;
}

// 过滤敏感信息
function filterSensitiveData(obj, depth = 0) {
  if (depth > 3) return '[深度限制]'; // 防止无限递归
  
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  const filtered = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // 检查是否是敏感字段
    if (sensitiveFields.some(field => lowerKey.includes(field))) {
      filtered[key] = '[已过滤]';
    } else if (typeof value === 'object' && value !== null) {
      filtered[key] = filterSensitiveData(value, depth + 1);
    } else {
      filtered[key] = value;
    }
  }
  
  return filtered;
}

// 确定日志级别
function determineLogLevel(req, responseData, error) {
  if (error) return LOG_LEVELS.ERROR;
  
  try {
    const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    
    // 检查响应状态
    if (data && data.success === false) {
      return LOG_LEVELS.WARN;
    }
    
    // 删除操作通常是高优先级
    if (req.method === 'DELETE') {
      return LOG_LEVELS.WARN;
    }
    
    // 创建和更新操作是中等优先级
    if (req.method === 'POST' || req.method === 'PUT') {
      return LOG_LEVELS.INFO;
    }
    
    return LOG_LEVELS.INFO;
  } catch {
    return LOG_LEVELS.INFO;
  }
}

// 确定严重程度
function determineSeverity(req, responseData, error) {
  if (error) return 'critical';
  
  // 删除操作通常是高严重程度
  if (req.method === 'DELETE') {
    return 'high';
  }
  
  // 创建和更新操作是中等严重程度
  if (req.method === 'POST' || req.method === 'PUT') {
    return 'medium';
  }
  
  // 查看操作是低严重程度
  return 'low';
}

// 确定状态
function determineStatus(responseData, error) {
  if (error) return 'failure';
  
  try {
    const data = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
    return data?.success ? 'success' : 'failure';
  } catch {
    return 'success';
  }
}

// 构建描述信息 - 优化为更详细和准确的中文描述
function buildDescription(req, action, responseData) {
  const descriptions = {
    // 用户管理
    'CREATE_USER': '创建新用户账户',
    'UPDATE_USER': '更新用户基本信息',
    'DELETE_USER': '删除用户账户',
    'USER_LOGIN': '用户登录系统',
    'USER_LOGOUT': '用户退出登录',
    'CHANGE_PASSWORD': '修改用户密码',
    'RESET_PASSWORD': '重置用户密码',
    'UPDATE_USER_PERMISSIONS': '调整用户权限设置',
    
    // Bug管理
    'CREATE_BUG': '提交新的Bug报告',
    'UPDATE_BUG': '修改Bug信息',
    'DELETE_BUG': '删除Bug记录',
    'UPDATE_BUG_STATUS': '更新Bug处理状态',
    'ASSIGN_BUG': '分配Bug给处理人员',
    
    // 项目管理
    'CREATE_PROJECT': '创建新项目',
    'UPDATE_PROJECT': '更新项目信息',
    'DELETE_PROJECT': '删除项目',
    'VIEW_PROJECT_STATS': '查看项目统计信息',
    
    // 任务管理
    'CREATE_TASK': '创建新任务',
    'UPDATE_TASK': '更新任务信息',
    'DELETE_TASK': '删除任务',
    'UPDATE_TASK_STATUS': '更新任务进度状态',
    'ASSIGN_TASK': '分配任务给执行人员',
    
    // 团队管理
    'CREATE_TEAM': '创建新团队',
    'UPDATE_TEAM': '更新团队信息',
    'DELETE_TEAM': '删除团队',
    
    // 日志管理
    'EXPORT_SYSTEM_LOGS': '导出系统日志',
    'CLEANUP_LOGS': '清理过期日志记录',
    
    // 文件操作
    'FILE_UPLOAD': '上传文件到系统',
    'FILE_DOWNLOAD': '从系统下载文件',
    
    // 数据操作
    'DATA_IMPORT': '导入数据到系统',
    'DATA_EXPORT': '从系统导出数据',
    
    // 系统操作
    'UPDATE_SETTINGS': '更新系统配置',
  };
  
  // 如果没有找到对应的描述，生成用户友好的描述
  if (descriptions[action]) {
    return descriptions[action];
  }
  
  // 根据HTTP方法和路径生成描述
  const methodDescriptions = {
    'POST': '创建',
    'PUT': '更新',
    'PATCH': '修改',
    'DELETE': '删除'
  };
  
  const methodDesc = methodDescriptions[req.method] || req.method;
  const pathDesc = req.path.split('/').pop() || '信息';
  
  return `${methodDesc}${pathDesc}`;
}

// 构建更详细的描述信息
function buildDetailedDescription(req, action, responseData) {
  let baseDescription = buildDescription(req, action, responseData);
  
  try {
    // 尝试解析响应数据以获取更多信息
    let responseInfo = null;
    if (typeof responseData === 'string') {
      try {
        responseInfo = JSON.parse(responseData);
      } catch {
        // 如果解析失败，使用原始字符串
        responseInfo = { data: responseData };
      }
    } else {
      responseInfo = responseData;
    }
    
    // 根据操作类型添加详细信息
    switch (action) {
      case 'CREATE_USER':
        if (responseInfo?.data?.user) {
          const user = responseInfo.data.user;
          return `创建用户：${user.name || user.username || '未知用户'}`;
        }
        break;
        
      case 'UPDATE_USER':
        if (req.params?.id) {
          return `更新用户信息，用户ID：${req.params.id}`;
        }
        break;
        
      case 'DELETE_USER':
        if (req.params?.id) {
          return `删除用户，用户ID：${req.params.id}`;
        }
        break;
        
      case 'CREATE_BUG':
        if (responseInfo?.data?.bug) {
          const bug = responseInfo.data.bug;
          return `创建Bug：${bug.title || '未知标题'}`;
        }
        break;
        
      case 'UPDATE_BUG':
        if (req.params?.id) {
          return `更新Bug信息，Bug ID：${req.params.id}`;
        }
        break;
        
      case 'DELETE_BUG':
        if (req.params?.id) {
          return `删除Bug，Bug ID：${req.params.id}`;
        }
        break;
        
      case 'UPDATE_BUG_STATUS':
        if (req.params?.id && req.body?.status) {
          return `更新Bug状态，Bug ID：${req.params.id}，新状态：${req.body.status}`;
        }
        break;
        
      case 'ASSIGN_BUG':
        if (req.params?.id && req.body?.assignedTo) {
          return `分配Bug，Bug ID：${req.params.id}，分配给：${req.body.assignedTo}`;
        }
        break;
        
      case 'CREATE_PROJECT':
        if (responseInfo?.data?.project) {
          const project = responseInfo.data.project;
          return `创建项目：${project.name || '未知项目名'}`;
        }
        break;
        
      case 'UPDATE_PROJECT':
        if (req.params?.id) {
          return `更新项目信息，项目ID：${req.params.id}`;
        }
        break;
        
      case 'DELETE_PROJECT':
        if (req.params?.id) {
          return `删除项目，项目ID：${req.params.id}`;
        }
        break;
        
      case 'CREATE_TASK':
        if (responseInfo?.data?.task) {
          const task = responseInfo.data.task;
          return `创建任务：${task.title || '未知任务名'}`;
        }
        break;
        
      case 'UPDATE_TASK':
        if (req.params?.id) {
          return `更新任务信息，任务ID：${req.params.id}`;
        }
        break;
        
      case 'DELETE_TASK':
        if (req.params?.id) {
          return `删除任务，任务ID：${req.params.id}`;
        }
        break;
        
      case 'UPDATE_TASK_STATUS':
        if (req.params?.id && req.body?.status) {
          return `更新任务状态，任务ID：${req.params.id}，新状态：${req.body.status}`;
        }
        break;
        
      case 'ASSIGN_TASK':
        if (req.params?.id && req.body?.assignedTo) {
          return `分配任务，任务ID：${req.params.id}，分配给：${req.body.assignedTo}`;
        }
        break;
        
      case 'CREATE_TEAM':
        if (responseInfo?.data?.team) {
          const team = responseInfo.data.team;
          return `创建团队：${team.name || '未知团队名'}`;
        }
        break;
        
      case 'UPDATE_TEAM':
        if (req.params?.id) {
          return `更新团队信息，团队ID：${req.params.id}`;
        }
        break;
        
      case 'DELETE_TEAM':
        if (req.params?.id) {
          return `删除团队，团队ID：${req.params.id}`;
        }
        break;
        
      case 'FILE_UPLOAD':
        if (req.files && req.files.length > 0) {
          const fileNames = req.files.map(f => f.originalname).join(', ');
          return `上传文件：${fileNames}`;
        }
        break;
        
      case 'EXPORT_SYSTEM_LOGS':
        if (req.query?.format) {
          return `导出系统日志，格式：${req.query.format}`;
        }
        break;
        
      case 'CLEANUP_LOGS':
        if (req.query?.daysToKeep) {
          return `清理日志，保留天数：${req.query.daysToKeep}`;
        }
        break;
    }
    
    // 如果没有特殊处理，返回基础描述
    return baseDescription;
    
  } catch (error) {
    // 如果处理过程中出错，返回基础描述
    return baseDescription;
  }
}

// 提取资源ID
function extractResourceId(req) {
  // 从路径参数中提取ID
  if (req.params && req.params.id) {
    return req.params.id;
    // 从请求体中提取ID
    if (req.body && req.body.id) {
      return req.body.id;
    }
    
    return null;
  }
}

// 获取客户端IP地址
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.headers['x-forwarded-for'] || 
         'unknown';
}

// 日志中间件
export const activityLogger = (req, res, next) => {
  // 检查是否需要跳过日志记录
  if (shouldSkipLogging(req)) {
    return next();
  }
  
  const startTime = Date.now();
  const clientIP = getClientIP(req);
  
  // 检查频率限制
  if (!checkRateLimit(clientIP)) {
    // 减少频率限制警告的日志输出
    if (process.env.NODE_ENV === 'development') {
      console.warn(`⚠️ IP ${clientIP} 日志记录频率过高，跳过记录`);
    }
    return next();
  }
  
  // 添加防重复标记，避免同一请求多次记录日志
  if (req._logRecorded) {
    return next();
  }
  
  // 标记已记录日志
  req._logRecorded = true;
  
  // 保存原始的send方法
  const originalSend = res.send;
  
  // 重写send方法以捕获响应
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // 异步记录日志，不阻塞响应
    logActivity(req, res, duration, data, clientIP).catch(err => {
      if (process.env.NODE_ENV === 'development') {
        console.error('记录活动日志时发生错误:', err);
      }
    });
    
    // 调用原始的send方法
    originalSend.call(this, data);
  };
  
  next();
};

// 记录活动日志
async function logActivity(req, res, duration, responseData, clientIP) {
  try {
    // 获取用户信息 - 优化用户信息获取逻辑
    let userId = null;
    let userName = '匿名用户';
    
    // 检查用户是否已登录 - 优先从认证中间件获取
    if (req.user) {
      if (req.user._id) {
        userId = req.user._id.toString();
        userName = req.user.name || req.user.username || req.user.email || '未知用户';
      } else if (req.user.id) {
        userId = req.user.id;
        userName = req.user.name || req.user.username || req.user.email || '未知用户';
      }
    }
    
    // 如果还是没有获取到用户信息，尝试从请求头获取
    if (!userName || userName === '匿名用户' || userName === '未知用户') {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // 这里可以解析token获取用户信息，但为了性能考虑，暂时跳过
        // 在实际生产环境中，应该从JWT token中解析用户信息
        console.log('⚠️ 无法从认证中间件获取用户信息，可能需要检查认证配置');
      }
    }
    
    // 构建操作标识（支持动态路径参数）
    let operationKey = `${req.method} ${req.path}`;
    let action = actionTypeMap[operationKey];
    
    // 如果没有找到精确匹配，尝试匹配带参数的路径
    if (!action) {
      // 将路径中的ID参数替换为:id进行匹配
      const normalizedPath = req.path.replace(/\/[a-f0-9-]{20,}/g, '/:id');
      operationKey = `${req.method} ${normalizedPath}`;
      action = actionTypeMap[operationKey];
    }
    
    // 如果还是没有找到，跳过记录（只记录预定义的重要操作）
    if (!action) {
      return;
    }
    
    // 获取资源类型
    const pathParts = req.path.split('/');
    const resourceType = resourceTypeMap[pathParts[2]] || 'system';
    
    // 构建详细描述
    const description = buildDetailedDescription(req, action, responseData);
    
    // 确定日志级别
    const logLevel = determineLogLevel(req, responseData);
    
    // 如果日志级别低于当前设置的级别，则跳过
    if (logLevel < CURRENT_LOG_LEVEL) {
      return;
    }
    
    // 确定严重程度
    const severity = determineSeverity(req, responseData);
    
    // 确定状态
    const status = determineStatus(responseData);
    
    // 过滤敏感信息
    const filteredBody = filterSensitiveData(req.body);
    const filteredQuery = filterSensitiveData(req.query);
    const filteredResponse = filterSensitiveData(responseData);
    
    // 创建日志记录
    const logData = {
      userId: userId,
      userName: userName,
      action: action,
      description: description,
      details: {
        method: req.method,
        path: req.path,
        query: filteredQuery,
        body: filteredBody,
        response: filteredResponse,
        duration: duration,
        userAgent: req.get('User-Agent'),
        ipAddress: clientIP,
        logLevel: Object.keys(LOG_LEVELS)[logLevel]
      },
      resourceType: resourceType,
      resourceId: extractResourceId(req),
      severity: severity,
      status: status,
      ipAddress: clientIP,
      userAgent: req.get('User-Agent')
    };
    
    // 保存到数据库
    if (global.memoryDB) {
      // 内存数据库模式
      const logEntry = {
        _id: Date.now().toString(),
        ...logData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      global.memoryDB.userActivityLogs.push(logEntry);
      
      // 限制内存中的日志数量，防止内存溢出
      if (global.memoryDB.userActivityLogs.length > 3000) { // 进一步减少到3000条
        global.memoryDB.userActivityLogs = global.memoryDB.userActivityLogs.slice(-1500);
      }
    } else {
      // MongoDB模式
      const activityLog = new UserActivityLog(logData);
      await activityLog.save();
    }
    
    // 控制台输出（开发环境）- 优化输出格式
    if (process.env.NODE_ENV === 'development') {
      const levelEmoji = {
        [LOG_LEVELS.DEBUG]: '🔍',
        [LOG_LEVELS.INFO]: 'ℹ️',
        [LOG_LEVELS.WARN]: '⚠️',
        [LOG_LEVELS.ERROR]: '❌',
        [LOG_LEVELS.CRITICAL]: '🚨'
      };
      
      // 只输出重要操作的日志
      if (logLevel >= LOG_LEVELS.INFO) {
        console.log(`${levelEmoji[logLevel] || 'ℹ️'} [${action}] ${userName} - ${description} (${duration}ms)`);
      }
    }
    
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('记录活动日志时发生错误:', error);
    }
  }
}

// 手动记录日志的函数（供其他模块调用）
export const logUserActivity = async (logData) => {
  try {
    // 确保logData包含userName字段
    if (!logData.userName && logData.userId) {
      // 如果没有userName但有userId，尝试从数据库获取用户名
      try {
        const User = await import('../models/User.js');
        const user = await User.default.findById(logData.userId).select('name');
        if (user && user.name) {
          logData.userName = user.name;
        } else {
          logData.userName = '未知用户';
        }
      } catch (userError) {
        logData.userName = '未知用户';
      }
    }
    
    if (global.memoryDB) {
      // 内存数据库模式
      const logEntry = {
        _id: Date.now().toString(),
        ...logData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      global.memoryDB.userActivityLogs.push(logEntry);
    } else {
      // MongoDB模式
      const activityLog = new UserActivityLog(logData);
      await activityLog.save();
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('手动记录活动日志失败:', error);
    }
  }
};

// 清理过期的频率限制记录
setInterval(() => {
  const now = Date.now();
  const windowStart = now - logRateLimit.windowMs;
  
  for (const [ip, logs] of logRateLimit.logs.entries()) {
    const validLogs = logs.filter(timestamp => timestamp > windowStart);
    if (validLogs.length === 0) {
      logRateLimit.logs.delete(ip);
    } else {
      logRateLimit.logs.set(ip, validLogs);
    }
  }
}, 60000); // 每分钟清理一次