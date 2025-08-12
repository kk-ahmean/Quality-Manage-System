@echo off
echo ========================================
echo 启动品质管理系统...
echo ========================================

echo.
echo 1. 启动后端服务...
cd server
start "Backend Server" cmd /k "npm start"

echo 2. 等待后端启动...
timeout /t 5

echo 3. 启动前端服务...
cd ..
start "Frontend Server" cmd /k "http-server dist -p 3000 -a 0.0.0.0"

echo.
echo ========================================
echo 系统启动完成！
echo ========================================
echo 前端地址: http://192.168.1.100:3000
echo 后端地址: http://192.168.1.100:5001
echo.
echo 请在其他电脑上访问前端地址进行测试
echo 按任意键退出...
pause 