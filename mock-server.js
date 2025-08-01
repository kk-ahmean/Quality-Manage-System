const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// 系统日志
app.get('/api/system-logs', (req, res) => {
  const { type, date, page = 1, pageSize = 10 } = req.query;
  const allLogs = [
    { id: '1', type: 'OPERATION', user: 'admin', action: '登录', description: '管理员登录系统', ipAddress: '192.168.1.1', createdAt: '2024-07-29T10:00:00Z' },
    { id: '2', type: 'EXCEPTION', description: '数据库连接超时', createdAt: '2024-07-29T11:00:00Z' },
    { id: '3', type: 'OPERATION', user: 'user1', action: '创建Bug', description: '创建了一个Bug', ipAddress: '192.168.1.2', createdAt: '2024-07-28T09:00:00Z' },
  ];
  let logs = allLogs;
  if (type && type !== 'all') logs = logs.filter(l => l.type === type);
  if (date) logs = logs.filter(l => l.createdAt.startsWith(date));
  const total = logs.length;
  const start = (page - 1) * pageSize;
  const end = start + Number(pageSize);
  res.json({ logs: logs.slice(start, end), total });
});

// 全局搜索
app.get('/api/global-search', (req, res) => {
  const { type, keyword } = req.query;
  const all = [
    { id: 't1', type: 'task', title: '任务示例1', desc: '任务描述', link: '/tasks' },
    { id: 'b1', type: 'bug', title: 'Bug示例1', desc: 'Bug描述', link: '/bugs' },
    { id: 'u1', type: 'user', title: '用户示例1', desc: '用户描述', link: '/users/list' },
  ];
  let result = all;
  if (type && type !== 'all') result = result.filter(i => i.type === type);
  if (keyword) result = result.filter(i => i.title.includes(keyword) || i.desc.includes(keyword));
  res.json({ results: result });
});

// 批量导入用户
app.post('/api/users/batch-import', (req, res) => {
  const { users } = req.body;
  res.json({ success: true, count: users.length });
});

app.listen(3001, () => {
  console.log('Mock server running at http://localhost:3001');
}); 