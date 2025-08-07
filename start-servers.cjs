const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动Bug管理系统服务器...\n');

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // 端口可用
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // 端口被占用
    });
  });
}

// 启动服务器
async function startServers() {
  try {
    // 检查前端端口
    const frontendPortOccupied = await checkPort(3000);
    if (frontendPortOccupied) {
      console.log('❌ 端口3000已被占用，请先关闭占用该端口的程序');
      console.log('💡 提示：可以使用以下命令查看端口占用情况：');
      console.log('   Windows: netstat -ano | findstr :3000');
      console.log('   Linux/Mac: lsof -i :3000');
      return;
    }

    // 检查后端端口
    const backendPortOccupied = await checkPort(5000);
    if (backendPortOccupied) {
      console.log('❌ 端口5000已被占用，请先关闭占用该端口的程序');
      console.log('💡 提示：可以使用以下命令查看端口占用情况：');
      console.log('   Windows: netstat -ano | findstr :5000');
      console.log('   Linux/Mac: lsof -i :5000');
      return;
    }

    console.log('✅ 端口检查通过，开始启动服务器...\n');

    // 启动后端服务器
    console.log('🔧 启动后端服务器...');
    const backendProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname, 'server'),
      stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[后端] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[后端错误] ${data.toString().trim()}`);
    });

    backendProcess.on('close', (code) => {
      console.log(`[后端] 进程退出，代码: ${code}`);
    });

    // 等待后端启动
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 启动前端服务器
    console.log('\n🌐 启动前端服务器...');
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      stdio: 'pipe'
    });

    frontendProcess.stdout.on('data', (data) => {
      console.log(`[前端] ${data.toString().trim()}`);
    });

    frontendProcess.stderr.on('data', (data) => {
      console.error(`[前端错误] ${data.toString().trim()}`);
    });

    frontendProcess.on('close', (code) => {
      console.log(`[前端] 进程退出，代码: ${code}`);
    });

    // 等待一段时间后显示访问信息
    setTimeout(() => {
      console.log('\n🎉 服务器启动完成！');
      console.log('📱 前端地址: http://localhost:3000/Quality-Manage-System/');
      console.log('🔧 后端API: http://localhost:5000/api');
      console.log('📝 测试账户: admin@example.com / 123456');
      console.log('\n💡 按 Ctrl+C 停止所有服务器');
    }, 5000);

    // 处理进程退出
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止服务器...');
      backendProcess.kill();
      frontendProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ 启动失败:', error);
  }
}

startServers(); 