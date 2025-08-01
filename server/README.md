# Bug管理系统后端API

这是一个基于Node.js + Express + MongoDB的Bug管理系统后端API服务。

## 功能特性

- ✅ 用户认证与授权（JWT）
- ✅ 用户管理（CRUD操作）
- ✅ Bug管理（CRUD操作）
- ✅ 评论系统
- ✅ 文件上传
- ✅ 权限控制
- ✅ 数据统计
- 🔄 项目管理（待实现）
- 🔄 任务管理（待实现）

## 技术栈

- **Node.js** - 运行环境
- **Express** - Web框架
- **MongoDB** - 数据库
- **Mongoose** - ODM
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **CORS** - 跨域支持

## 安装和运行

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `config.env` 文件并根据你的环境修改配置：

```bash
# MongoDB连接配置
MONGODB_URI=mongodb://localhost:27017/bug-management-system

# JWT密钥（请修改为你的密钥）
JWT_SECRET=your-super-secret-jwt-key-here

# 服务器配置
PORT=5000
NODE_ENV=development

# CORS配置
CORS_ORIGIN=http://localhost:3000
```

### 3. 安装MongoDB

#### 本地安装
1. 下载并安装 [MongoDB Community Server](https://www.mongodb.com/try/download/community)
2. 启动MongoDB服务

#### 使用MongoDB Atlas（推荐）
1. 注册 [MongoDB Atlas](https://www.mongodb.com/atlas)
2. 创建免费集群
3. 获取连接字符串并更新 `MONGODB_URI`

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:5000` 启动

## API文档

### 认证相关

#### 用户注册
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "用户名",
  "email": "user@example.com",
  "password": "密码",
  "role": "developer"
}
```

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "密码"
}
```

### Bug管理

#### 获取Bug列表
```
GET /api/bugs?page=1&limit=10&status=新建&priority=P1
Authorization: Bearer <token>
```

#### 创建Bug
```
POST /api/bugs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Bug标题",
  "description": "Bug描述",
  "reproductionSteps": "重现步骤",
  "expectedResult": "期望结果",
  "actualResult": "实际结果",
  "priority": "P1",
  "severity": "A",
  "type": "功能缺陷"
}
```

#### 更新Bug
```
PUT /api/bugs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "处理中",
  "assignee": "user_id"
}
```

#### 删除Bug
```
DELETE /api/bugs/:id
Authorization: Bearer <token>
```

#### 添加评论
```
POST /api/bugs/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "评论内容"
}
```

### 用户管理

#### 获取用户列表
```
GET /api/users?page=1&limit=10&role=developer
Authorization: Bearer <token>
```

#### 创建用户（仅管理员）
```
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "用户名",
  "email": "user@example.com",
  "password": "密码",
  "role": "developer",
  "department": "技术部"
}
```

## 数据库结构

### 用户表 (users)
- `name` - 用户名
- `email` - 邮箱（唯一）
- `password` - 密码（加密）
- `role` - 角色（admin/manager/developer/tester/viewer）
- `status` - 状态（active/inactive/suspended）
- `permissions` - 权限数组
- `department` - 部门
- `lastLoginAt` - 最后登录时间

### Bug表 (bugs)
- `title` - 标题
- `description` - 描述
- `reproductionSteps` - 重现步骤
- `expectedResult` - 期望结果
- `actualResult` - 实际结果
- `priority` - 优先级（P0/P1/P2/P3）
- `severity` - 严重程度（S/A/B/C）
- `type` - 类型
- `status` - 状态
- `reporter` - 报告人
- `assignee` - 负责人
- `comments` - 评论数组
- `attachments` - 附件数组

## 部署

### 本地部署
1. 确保MongoDB已安装并运行
2. 配置环境变量
3. 运行 `npm start`

### 云部署
推荐使用以下平台：
- **Heroku** - 简单易用
- **Railway** - 现代化平台
- **Render** - 免费额度
- **Vercel** - 适合前端部署

## 开发

### 项目结构
```
server/
├── models/          # 数据模型
├── routes/          # 路由
├── middleware/      # 中间件
├── config.env       # 环境变量
├── server.js        # 主文件
└── package.json     # 依赖配置
```

### 添加新功能
1. 在 `models/` 中创建数据模型
2. 在 `routes/` 中创建路由
3. 在 `server.js` 中注册路由
4. 更新API文档

## 故障排除

### 常见问题

1. **MongoDB连接失败**
   - 检查MongoDB服务是否运行
   - 验证连接字符串是否正确
   - 检查网络连接

2. **JWT认证失败**
   - 检查JWT_SECRET是否正确设置
   - 验证token格式是否正确
   - 检查token是否过期

3. **CORS错误**
   - 检查CORS_ORIGIN配置
   - 确保前端URL正确

## 许可证

MIT License 