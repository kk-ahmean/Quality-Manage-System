# PM2 常用命令参考

## 安装PM2
```bash
npm install -g pm2
```

## 启动服务
```bash
# 使用配置文件启动所有服务
pm2 start ecosystem.config.js

# 启动单个应用
pm2 start server/server.js --name "backend"
pm2 start "http-server dist -p 3000 -a 0.0.0.0" --name "frontend"
```

## 查看服务状态
```bash
# 查看所有应用状态
pm2 status
pm2 list

# 查看详细信息
pm2 show bug-management-backend
pm2 show bug-management-frontend
```

## 日志管理
```bash
# 查看所有日志
pm2 logs

# 查看特定应用日志
pm2 logs bug-management-backend
pm2 logs bug-management-frontend

# 查看错误日志
pm2 logs --err

# 实时监控日志
pm2 logs --lines 100

# 清空日志
pm2 flush
```

## 进程管理
```bash
# 重启所有应用
pm2 restart all

# 重启特定应用
pm2 restart bug-management-backend
pm2 restart bug-management-frontend

# 停止所有应用
pm2 stop all

# 停止特定应用
pm2 stop bug-management-backend

# 删除所有应用
pm2 delete all

# 删除特定应用
pm2 delete bug-management-backend
```

## 监控
```bash
# 打开监控界面
pm2 monit

# 查看资源使用情况
pm2 status
```

## 自动启动
```bash
# 保存当前进程列表
pm2 save

# 设置开机自启动
pm2 startup

# 恢复保存的进程列表
pm2 resurrect
```

## 更新应用
```bash
# 重新加载应用（零停机时间）
pm2 reload all
pm2 reload bug-management-backend

# 重启应用
pm2 restart all
```

## 环境变量
```bash
# 使用特定环境变量启动
pm2 start ecosystem.config.js --env production

# 查看环境变量
pm2 env 0
```

## 集群模式
```bash
# 启动集群模式（多实例）
pm2 start ecosystem.config.js -i max

# 启动指定数量的实例
pm2 start ecosystem.config.js -i 2
```

## 常用组合命令
```bash
# 完整重启流程
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.js
pm2 save

# 查看系统状态
pm2 status && pm2 monit

# 快速重启后端
pm2 restart bug-management-backend && pm2 logs bug-management-backend
``` 