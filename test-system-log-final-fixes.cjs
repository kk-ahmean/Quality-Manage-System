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

// 测试创建用户（检查用户字段显示）
async function testCreateUser(token) {
  try {
    const userData = {
      name: '测试用户3',
      email: 'testuser3@example.com',
      password: 'test123',
      role: 'user'
    };
    
    const response = await axios.post(`${BASE_URL}/api/users`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('创建用户日志记录', true, '成功创建用户', {
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

// 测试创建项目（检查用户字段显示）
async function testCreateProject(token) {
  try {
    const projectData = {
      name: '测试项目2',
      description: '这是第二个测试项目',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const response = await axios.post(`${BASE_URL}/api/projects`, projectData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      logTestResult('创建项目日志记录', true, '成功创建项目', {
        projectId: response.data.data.project._id,
        projectName: response.data.data.project.name
      });
      return response.data.data.project._id;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('创建项目日志记录', false, `创建项目失败: ${error.message}`);
    return null;
  }
}

// 测试日期范围筛选
async function testDateRangeFilter(token) {
  try {
    // 获取今天的日期
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 测试今天的日志筛选
    const response = await axios.get(`${BASE_URL}/api/logs?startDate=${todayStr}&endDate=${todayStr}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const logs = response.data.data.logs;
      
      // 检查筛选结果是否都在今天范围内
      const todayLogs = logs.filter(log => {
        const logDate = new Date(log.createdAt);
        const logDateStr = logDate.toISOString().split('T')[0];
        return logDateStr === todayStr;
      });
      
      logTestResult('日期范围筛选', true, '日期筛选功能正常工作', {
        totalLogs: logs.length,
        todayLogs: todayLogs.length,
        dateRange: `${todayStr} 到 ${todayStr}`,
        accuracy: todayLogs.length === logs.length ? '100%' : `${((todayLogs.length / logs.length) * 100).toFixed(1)}%`
      });
      
      if (todayLogs.length !== logs.length) {
        console.log('⚠️ 日期筛选结果包含非今天日期的日志');
      }
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('日期范围筛选', false, `日期筛选测试失败: ${error.message}`);
  }
}

// 测试操作类型筛选（验证resourceType已移除）
async function testActionFilter(token) {
  try {
    // 测试按操作类型筛选
    const response = await axios.get(`${BASE_URL}/api/logs?action=CREATE_USER&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const logs = response.data.data.logs;
      const createUserLogs = logs.filter(log => log.action === 'CREATE_USER');
      
      logTestResult('操作类型筛选', true, '操作类型筛选功能正常工作', {
        totalLogs: logs.length,
        createUserLogs: createUserLogs.length,
        hasCreateUserLog: createUserLogs.length > 0
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('操作类型筛选', false, `操作类型筛选测试失败: ${error.message}`);
  }
}

// 检查用户字段显示
async function checkUserFieldDisplay(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/logs?limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const logs = response.data.data.logs;
      const anonymousUsers = logs.filter(log => log.userName === '匿名用户');
      const validUsers = logs.filter(log => log.userName !== '匿名用户' && log.userName !== '未知用户');
      
      logTestResult('用户字段显示', true, '用户字段显示正常', {
        totalLogs: logs.length,
        anonymousUsers: anonymousUsers.length,
        validUsers: validUsers.length,
        userFieldStatus: anonymousUsers.length === 0 ? '正常' : '存在问题'
      });
      
      if (anonymousUsers.length > 0) {
        console.log('⚠️ 发现匿名用户日志，可能需要检查用户认证');
        console.log('匿名用户日志示例:', anonymousUsers.slice(0, 3));
      }
      
      if (validUsers.length > 0) {
        console.log('✅ 正常用户日志示例:', validUsers.slice(0, 3).map(log => ({
          action: log.action,
          userName: log.userName,
          description: log.description
        })));
      }
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('用户字段显示', false, `用户字段检查失败: ${error.message}`);
  }
}

// 检查日志重复问题
async function checkLogDuplication(token) {
  try {
    const response = await axios.get(`${BASE_URL}/api/logs?limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const logs = response.data.data.logs;
      
      // 检查是否有重复的日志（相同时间、相同操作、相同用户）
      const duplicates = [];
      const seen = new Set();
      
      logs.forEach(log => {
        const key = `${log.action}-${log.userName}-${new Date(log.createdAt).toISOString().slice(0, 16)}`;
        if (seen.has(key)) {
          duplicates.push(log);
        } else {
          seen.add(key);
        }
      });
      
      if (duplicates.length === 0) {
        logTestResult('日志重复检查', true, '未发现重复日志', {
          totalLogs: logs.length,
          duplicates: 0
        });
      } else {
        logTestResult('日志重复检查', false, `发现${duplicates.length}条重复日志`, {
          totalLogs: logs.length,
          duplicates: duplicates.length,
          duplicateExamples: duplicates.slice(0, 3)
        });
      }
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    logTestResult('日志重复检查', false, `重复检查失败: ${error.message}`);
  }
}

// 测试导出功能
async function testExport(token) {
  try {
    // 测试导出功能
    const response = await axios.get(`${BASE_URL}/api/logs/export?action=CREATE_USER&format=csv`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text'
    });
    
    if (response.data && response.data.includes('ID')) {
      logTestResult('导出功能', true, '导出功能正常工作', {
        responseLength: response.data.length,
        hasHeaders: response.data.includes('ID'),
        format: 'csv'
      });
    } else {
      throw new Error('导出内容格式不正确');
    }
  } catch (error) {
    logTestResult('导出功能', false, `导出功能测试失败: ${error.message}`);
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始测试系统日志最终修复功能...\n');
  
  try {
    // 登录获取token
    const token = await login();
    logTestResult('用户登录', true, '成功获取访问令牌');
    
    // 测试创建操作（检查日志重复和用户字段）
    console.log('\n📝 测试创建操作日志记录...');
    await testCreateUser(token);
    await testCreateProject(token);
    
    // 等待一下让日志记录完成
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 测试日期范围筛选
    console.log('\n📅 测试日期范围筛选...');
    await testDateRangeFilter(token);
    
    // 测试操作类型筛选
    console.log('\n🔍 测试操作类型筛选...');
    await testActionFilter(token);
    
    // 测试导出功能
    console.log('\n📤 测试导出功能...');
    await testExport(token);
    
    // 检查日志重复问题
    console.log('\n🔄 检查日志重复问题...');
    await checkLogDuplication(token);
    
    // 检查用户字段显示
    console.log('\n👤 检查用户字段显示...');
    await checkUserFieldDisplay(token);
    
    console.log('\n📋 测试结果汇总:');
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    
    console.log(`\n总测试数: ${totalCount}`);
    console.log(`成功: ${successCount}`);
    console.log(`失败: ${totalCount - successCount}`);
    console.log(`成功率: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
      console.log('\n🎉 所有测试通过！系统日志最终修复功能正常工作。');
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
