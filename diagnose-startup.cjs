const fs = require('fs');
const path = require('path');

console.log('🔍 诊断Bug管理系统启动问题...\n');

// 检查文件是否存在
function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? '存在' : '不存在'}`);
  return exists;
}

// 检查目录是否存在
function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${exists ? '存在' : '不存在'}`);
  return exists;
}

// 检查package.json中的依赖
function checkDependencies(packagePath, description) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`✅ ${description}: 依赖项数量 ${Object.keys(packageJson.dependencies || {}).length}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}: 解析失败 - ${error.message}`);
    return false;
  }
}

// 检查Node.js版本
function checkNodeVersion() {
  const version = process.version;
  console.log(`✅ Node.js版本: ${version}`);
  
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  if (majorVersion >= 16) {
    console.log('✅ Node.js版本符合要求 (>= 16)');
    return true;
  } else {
    console.log('❌ Node.js版本过低，建议升级到16或更高版本');
    return false;
  }
}

// 检查npm版本
function checkNpmVersion() {
  try {
    const { execSync } = require('child_process');
    const version = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`✅ npm版本: ${version}`);
    return true;
  } catch (error) {
    console.log('❌ 无法获取npm版本');
    return false;
  }
}

// 主诊断函数
function diagnose() {
  console.log('=== 系统环境检查 ===');
  checkNodeVersion();
  checkNpmVersion();
  
  console.log('\n=== 前端项目检查 ===');
  checkFile('package.json', '前端package.json');
  checkFile('vite.config.ts', 'Vite配置文件');
  checkFile('tsconfig.json', 'TypeScript配置');
  checkDirectory('src', '源代码目录');
  checkDirectory('node_modules', '前端依赖目录');
  checkDependencies('package.json', '前端依赖项');
  
  console.log('\n=== 后端项目检查 ===');
  checkFile('server/package.json', '后端package.json');
  checkFile('server/server.js', '后端服务器文件');
  checkFile('server/config.env', '后端环境配置');
  checkDirectory('server/node_modules', '后端依赖目录');
  checkDependencies('server/package.json', '后端依赖项');
  
  console.log('\n=== 路由文件检查 ===');
  checkFile('server/routes/auth.js', '认证路由');
  checkFile('server/routes/bugs.js', 'Bug管理路由');
  checkFile('server/routes/users.js', '用户管理路由');
  checkFile('server/routes/projects.js', '项目管理路由');
  checkFile('server/routes/tasks.js', '任务管理路由');
  
  console.log('\n=== 模型文件检查 ===');
  checkFile('server/models/User.js', '用户模型');
  checkFile('server/models/Bug.js', 'Bug模型');
  checkFile('server/models/Project.js', '项目模型');
  checkFile('server/models/Task.js', '任务模型');
  checkFile('server/models/UserActivityLog.js', '用户活动日志模型');
  
  console.log('\n=== 前端页面检查 ===');
  checkFile('src/pages/LoginPage.tsx', '登录页面');
  checkFile('src/pages/DashboardPage.tsx', '仪表板页面');
  checkFile('src/pages/ProjectManagementPage.tsx', '项目管理页面');
  checkFile('src/pages/TaskManagementPage.tsx', '任务管理页面');
  checkFile('src/pages/TeamManagementPage.tsx', '团队管理页面');
  checkFile('src/pages/SystemLogPage.tsx', '系统日志页面');
  
  console.log('\n=== 启动建议 ===');
  console.log('1. 如果所有文件都存在，尝试运行: node start-servers.js');
  console.log('2. 如果依赖缺失，先运行: npm install');
  console.log('3. 如果后端依赖缺失，先运行: cd server && npm install');
  console.log('4. 如果端口被占用，检查端口3000和5000是否被其他程序占用');
  console.log('5. 如果仍有问题，请查看具体的错误信息');
}

diagnose(); 