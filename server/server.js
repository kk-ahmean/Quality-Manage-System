import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// 路由导入
import authRoutes from './routes/auth.js';
import bugRoutes from './routes/bugs.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';

// 加载环境变量
dotenv.config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// 生成密码哈希
const generatePasswordHash = async (password) => {
  return await bcrypt.hash(password, 12);
};

// 内存数据库存储
const memoryDB = {
  users: [
    {
      _id: '1',
      username: 'admin',
      name: '系统管理员',
      email: 'admin@example.com',
      password: '$2a$12$LjEqM0qU/eAzywircpEN4.pQblrnw3udHWihOVIUZPCaxHzroXxuC', // 123456
      role: 'admin',
      status: 'active',
      permissions: ['read', 'write', 'delete', 'admin'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      username: 'developer',
      name: '开发工程师',
      email: 'developer@example.com',
      password: '$2a$12$LjEqM0qU/eAzywircpEN4.pQblrnw3udHWihOVIUZPCaxHzroXxuC', // 123456
      role: 'developer',
      status: 'active',
      permissions: ['read', 'write'],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '3',
      username: 'tester',
      name: '测试工程师',
      email: 'tester@example.com',
      password: '$2a$12$LjEqM0qU/eAzywircpEN4.pQblrnw3udHWihOVIUZPCaxHzroXxuC', // 123456
      role: 'tester',
      status: 'active',
      permissions: ['read', 'write'],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  bugs: [],
  projects: [],
  tasks: [],
  teams: [],
  userActivityLogs: []
};

// 全局变量，用于在内存数据库模式下存储数据
global.memoryDB = memoryDB;

// 安全中间件
app.use(helmet());

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000 // 限制每个IP 15分钟内最多1000个请求
});
app.use(limiter);

// 日志中间件
app.use(morgan('combined'));

// CORS配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true
}));

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 内存数据库中间件
app.use((req, res, next) => {
  req.memoryDB = global.memoryDB;
  next();
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Bug Management System API is running',
    timestamp: new Date().toISOString(),
    database: global.memoryDB ? 'Memory DB' : 'MongoDB'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API端点不存在'
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : '未知错误'
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 检查MongoDB连接（如果配置了的话）
    if (process.env.MONGODB_URI && !process.env.USE_MEMORY_DB) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB连接成功');
    } else {
      console.log('✅ 使用内存数据库模式');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 服务器运行在端口 ${PORT}`);
      console.log(`📡 API地址: http://localhost:${PORT}/api`);
      console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('⚠️  注意：服务器运行在内存数据库模式下，数据不会持久化');
      console.log('📝 测试账户：');
      console.log('   - admin@example.com / 123456 (管理员)');
      console.log('   - developer@example.com / 123456 (开发工程师)');
      console.log('   - tester@example.com / 123456 (测试工程师)');
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

startServer(); 