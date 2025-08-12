const axios = require('axios');

// 测试配置
const BASE_URL = 'http://localhost:3001';
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

// 测试结果
let testResults = [];

// 记录测试结果
function logTestResult(testName, success, message, details = null) {
  const result = {
    testName,
    success,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}: ${message}`);
  if (details) {
    console.log(`   详情: ${JSON.stringify(details, null, 2)}`);
  }
}

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/login`, TEST_USER);
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error('登录失败');
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
}

// 测试创建用户（应该记录日志）
async function testCreateUser(token) {
  try {
    const userData = {
      name: '测试用户',
      email: 'testuser@example.com',
      password: 'test123',
      role: 'user'
    };
    
    const response = await axios.post(`${BASE_URL}/api/users`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('创建用户日志记录', true, '成功创建用户并记录日志', {
        userId: response.data.data.user._id,
        userName: response.data.data.user.name
      });
      return response.data.data.user._id;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('创建用户日志记录', false, `创建用户失败: ${error.message}`);
    return null;
  }
}

// 测试更新用户（应该记录日志）
async function testUpdateUser(token, userId) {
  if (!userId) return;
  
  try {
    const updateData = {
      name: '更新后的测试用户',
      role: 'developer'
    };
    
    const response = await axios.put(`${BASE_URL}/api/users/${userId}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('更新用户日志记录', true, '成功更新用户并记录日志', {
        userId,
        updatedName: updateData.name
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('更新用户日志记录', false, `更新用户失败: ${error.message}`);
  }
}

// 测试删除用户（应该记录日志）
async function testDeleteUser(token, userId) {
  if (!userId) return;
  
  try {
    const response = await axios.delete(`${BASE_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('删除用户日志记录', true, '成功删除用户并记录日志', {
        userId
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('删除用户日志记录', false, `删除用户失败: ${error.message}`);
  }
}

// 测试查看用户列表（不应该记录日志）
async function testViewUsers(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('查看用户列表', true, '成功查看用户列表（不记录日志）', {
        userCount: response.data.data.users.length
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('查看用户列表', false, `查看用户列表失败: ${error.message}`);
  }
}

// 测试创建Bug（应该记录日志）
async function testCreateBug(token) {
  try {
    const bugData = {
      title: '测试Bug',
      description: '这是一个测试Bug',
      severity: 'medium',
      priority: 'normal',
      status: 'open'
    };
    
    const response = await axios.post(`${BASE_URL}/api/bugs`, bugData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('创建Bug日志记录', true, '成功创建Bug并记录日志', {
        bugId: response.data.data.bug._id,
        bugTitle: response.data.data.bug.title
      });
      return response.data.data.bug._id;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('创建Bug日志记录', false, `创建Bug失败: ${error.message}`);
    return null;
  }
}

// 测试查看Bug列表（不应该记录日志）
async function testViewBugs(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/bugs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('查看Bug列表', true, '成功查看Bug列表（不记录日志）', {
        bugCount: response.data.data.bugs.length
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('查看Bug列表', false, `查看Bug列表失败: ${error.message}`);
  }
}

// 测试查看系统日志（应该记录日志）
async function testViewSystemLogs(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('查看系统日志', true, '成功查看系统日志', {
        logCount: response.data.data.logs.length,
        totalLogs: response.data.data.pagination.total
      });
      
      // 检查是否有我们刚才创建的操作日志
      const recentLogs = response.data.data.logs.slice(0, 10);
      const hasCreateUserLog = recentLogs.some(log => 
        log.action === 'CREATE_USER' && 
        log.description.includes('测试用户')
      );
      
      if (hasCreateUserLog) {
        logTestResult('日志描述准确性', true, '日志描述包含具体操作内容', {
          foundLog: recentLogs.find(log => log.action === 'CREATE_USER')
        });
      } else {
        logTestResult('日志描述准确性', false, '未找到包含具体操作内容的日志');
      }
      
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('查看系统日志', false, `查看系统日志失败: ${error.message}`);
  }
}

// 测试查看日志统计（应该记录日志）
async function testViewLogStats(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/logs/stats?days=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('查看日志统计', true, '成功查看日志统计', {
        statsCount: response.data.data.length
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch ( error) {
    logTestResult('查看日志统计', false, `查看日志统计失败: ${error.message}`);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试系统日志优化功能...\n');
  
  try {
    // 登录获取token
    const token = await login();
    logTestResult('用户登录', true, '成功获取访问令牌');
    
    // 测试各种操作
    console.log('\n📝 测试重要操作日志记录...');
    const userId = await testCreateUser(token);
    await testUpdateUser(token, userId);
    await testDeleteUser(token, userId);
    await testCreateBug(token);
    
    console.log('\n👀 测试查看操作（不记录日志）...');
    await testViewUsers(token);
    await testViewBugs(token);
    
    console.log('\n📊 测试日志查看功能...');
    await testViewSystemLogs(token);
    await testViewLogStats(token);
    
    console.log('\n📋 测试结果汇总:');
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    
    console.log(`\n总测试数: ${totalCount}`);
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${totalCount - successCount}`);
    console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
      console.log('\n🎉 所有测试通过！系统日志优化功能正常工作。');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查系统配置。');
    }
    
  } catch (error) {
    console.error('\n💥 测试过程中发生错误:', error.message);
  }
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
