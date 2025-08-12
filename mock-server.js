import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// 中间件
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// 模拟用户数据
const users = [
  {
    id: '1',
    name: '系统管理员',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    phone: '13800138000',
    department: '技术部',
    position: '系统管理员',
    permissions: ['read', 'write', 'delete', 'admin'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '开发工程师',
    email: 'developer@example.com',
    role: 'developer',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=developer',
    phone: '13800138001',
    department: '开发部',
    position: '高级开发工程师',
    permissions: ['read', 'write'],
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: '测试工程师',
    email: 'tester@example.com',
    role: 'tester',
    status: 'active',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tester',
    phone: '13800138002',
    department: '测试部',
    position: '测试工程师',
    permissions: ['read', 'write'],
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  }
]

const mockBugs = [
  {
    id: '1',
    title: '登录页面无法正常显示验证码',
    description: '用户反馈登录页面的验证码图片无法正常显示，导致无法完成登录操作。',
    priority: 'P1',
    severity: 'A',
    type: '功能缺陷',
    responsibility: '软件',
    status: '新建',
    reporter: 'user1',
    reporterName: '张三',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    title: '系统响应速度过慢',
    description: '用户反馈系统在处理大量数据时响应速度明显变慢，影响工作效率。',
    priority: 'P2',
    severity: 'B',
    type: '性能问题',
    responsibility: '软件',
    status: '处理中',
    assignee: 'user2',
    assigneeName: '李四',
    reporter: 'user3',
    reporterName: '王五',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z'
  }
];

const mockProjects = [
  {
    id: '1',
    name: 'Bug管理系统开发',
    description: '开发一个完整的Bug管理系统，包含用户管理、项目管理、Bug跟踪等功能',
    status: '进行中',
    priority: '高',
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-06-30T00:00:00Z',
    manager: 'user1',
    managerName: '张三',
    team: ['user1', 'user2', 'user3'],
    progress: 75,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: '移动端应用开发',
    description: '开发移动端Bug管理应用，支持iOS和Android平台',
    status: '计划中',
    priority: '中',
    startDate: '2024-07-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    manager: 'user2',
    managerName: '李四',
    team: ['user2', 'user3'],
    progress: 0,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

const mockTasks = [
  {
    id: '1',
    title: '设计数据库结构',
    description: '设计Bug管理系统的数据库表结构，包括用户、项目、Bug、任务等表',
    status: '已完成',
    priority: '高',
    assignee: 'user1',
    assigneeName: '张三',
    reporter: 'user1',
    reporterName: '张三',
    projectId: '1',
    projectName: 'Bug管理系统开发',
    dueDate: '2024-01-15T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    title: '开发用户管理模块',
    description: '实现用户注册、登录、权限管理等功能',
    status: '进行中',
    priority: '高',
    assignee: 'user2',
    assigneeName: '李四',
    reporter: 'user1',
    reporterName: '张三',
    projectId: '1',
    projectName: 'Bug管理系统开发',
    dueDate: '2024-02-15T00:00:00Z',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
];

const mockTeams = [
  {
    id: '1',
    name: '开发团队',
    description: '负责系统核心功能开发',
    leader: 'user1',
    leaderName: '张三',
    members: ['user1', 'user2', 'user3'],
    memberCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '测试团队',
    description: '负责系统测试和质量保证',
    leader: 'user3',
    leaderName: '王五',
    members: ['user3', 'user4'],
    memberCount: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

const mockSystemSettings = {
  id: '1',
  siteName: 'Bug管理系统',
  siteDescription: '专业的缺陷跟踪与项目管理平台',
  allowRegistration: true,
  emailNotification: true,
  maxFileSize: 10,
  supportedFileTypes: ['jpg', 'png', 'pdf', 'doc', 'docx'],
  maintenanceMode: false,
  updatedAt: '2024-01-15T10:30:00Z'
};

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Mock Bug Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// 认证路由
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // 模拟登录验证
  const user = users.find(u => u.name === email || u.email === email);
  
  if (user && password === 'admin123') {
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          phone: user.phone,
          department: user.department,
          position: user.position,
          permissions: user.permissions,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: '用户名或密码错误'
    });
  }
});

// Bug相关路由
app.get('/api/bugs', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedBugs = mockBugs.slice(start, end);
  
  res.json({
    success: true,
    data: {
      bugs: paginatedBugs,
      pagination: {
        current: parseInt(page),
        pageSize: parseInt(pageSize),
        total: mockBugs.length
      }
    }
  });
});

app.post('/api/bugs', (req, res) => {
  const newBug = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockBugs.push(newBug);
  
  res.json({
    success: true,
    data: newBug,
    message: 'Bug创建成功'
  });
});

// 用户相关路由
app.get('/api/users', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedUsers = users.slice(start, end);
  
  res.json({
    success: true,
    data: {
      users: paginatedUsers,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: users.length
      }
    }
  });
});

app.post('/api/users', (req, res) => {
  // 创建新用户
  const newUser = {
    id: (users.length + 1).toString(),
    name: req.body.name,
    email: req.body.email,
    role: req.body.role || 'user',
    status: 'active',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.body.name}`,
    phone: req.body.phone || '',
    department: req.body.department || '',
    position: req.body.position || '',
    permissions: req.body.permissions || ['read'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  users.push(newUser);
  
  res.json({
    success: true,
    data: newUser,
    message: '用户创建成功'
  });
});

// 项目相关路由
app.get('/api/projects', (req, res) => {
  res.json({
    success: true,
    data: {
      projects: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0
      }
    }
  });
});

// 项目相关路由
app.get('/api/projects', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedProjects = mockProjects.slice(start, end);
  
  res.json({
    success: true,
    data: {
      projects: paginatedProjects,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: mockProjects.length
      }
    }
  });
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockProjects.push(newProject);
  
  res.json({
    success: true,
    data: newProject,
    message: '项目创建成功'
  });
});

app.put('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectIndex = mockProjects.findIndex(p => p.id === id);
  
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
  
  mockProjects[projectIndex] = {
    ...mockProjects[projectIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockProjects[projectIndex],
    message: '项目更新成功'
  });
});

app.delete('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projectIndex = mockProjects.findIndex(p => p.id === id);
  
  if (projectIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '项目不存在'
    });
  }
  
  mockProjects.splice(projectIndex, 1);
  
  res.json({
    success: true,
    message: '项目删除成功'
  });
});

// 任务相关路由
app.get('/api/tasks', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedTasks = mockTasks.slice(start, end);
  
  res.json({
    success: true,
    data: {
      tasks: paginatedTasks,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: mockTasks.length
      }
    }
  });
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockTasks.push(newTask);
  
  res.json({
    success: true,
    data: newTask,
    message: '任务创建成功'
  });
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '任务不存在'
    });
  }
  
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  res.json({
    success: true,
    data: mockTasks[taskIndex],
    message: '任务更新成功'
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = mockTasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) {
    return res.status(404).json({
      success: false,
      message: '任务不存在'
    });
  }
  
  mockTasks.splice(taskIndex, 1);
  
  res.json({
    success: true,
    message: '任务删除成功'
  });
});

// 团队相关路由
app.get('/api/teams', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedTeams = mockTeams.slice(start, end);
  
  res.json({
    success: true,
    data: {
      teams: paginatedTeams,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: mockTeams.length
      }
    }
  });
});

app.post('/api/teams', (req, res) => {
  const newTeam = {
    id: Date.now().toString(),
    ...req.body,
    memberCount: req.body.members ? req.body.members.length : 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  mockTeams.push(newTeam);
  
  res.json({
    success: true,
    data: newTeam,
    message: '团队创建成功'
  });
});

// 系统设置相关路由
app.get('/api/system/settings', (req, res) => {
  res.json({
    success: true,
    data: mockSystemSettings
  });
});

app.put('/api/system/settings', (req, res) => {
  Object.assign(mockSystemSettings, {
    ...req.body,
    updatedAt: new Date().toISOString()
  });
  
  res.json({
    success: true,
    data: mockSystemSettings,
    message: '系统设置更新成功'
  });
});

// 系统日志相关路由
app.get('/api/system/logs', (req, res) => {
  const mockLogs = [
    {
      id: '1',
      type: 'OPERATION',
      user: 'admin',
      action: '登录',
      description: '管理员登录系统',
      ipAddress: '192.168.1.1',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      type: 'EXCEPTION',
      description: '数据库连接超时',
      createdAt: '2024-01-15T11:00:00Z'
    },
    {
      id: '3',
      type: 'OPERATION',
      user: 'user1',
      action: '创建Bug',
      description: '创建了一个Bug',
      ipAddress: '192.168.1.2',
      createdAt: '2024-01-14T09:00:00Z'
    }
  ];
  
  const { page = 1, pageSize = 20 } = req.query;
  const start = (page - 1) * pageSize;
  const end = start + parseInt(pageSize);
  const paginatedLogs = mockLogs.slice(start, end);
  
  res.json({
    success: true,
    data: {
      logs: paginatedLogs,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: mockLogs.length
      }
    }
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Mock服务器运行在端口 ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🔗 前端地址: http://localhost:3000`);
  console.log(`✅ 健康检查: http://localhost:${PORT}/api/health`);
}); 