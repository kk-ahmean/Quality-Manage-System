const axios = require('axios');

// 测试优化后的日志系统
async function testOptimizedLogs() {
  const baseURL = 'http://localhost:5001/api';
  
  console.log('🧪 测试优化后的日志系统...\n');
  
  try {
    // 1. 测试健康检查（应该被过滤掉）
    console.log('1️⃣ 测试健康检查（应该被过滤掉）');
    try {
      await axios.get(`${baseURL}/health`);
      console.log('   ✅ 健康检查请求成功，但不会记录日志');
    } catch (error) {
      console.log('   ❌ 健康检查请求失败:', error.message);
    }
    
    // 2. 测试用户登录（重要操作，应该记录）
    console.log('\n2️⃣ 测试用户登录（重要操作，应该记录）');
    try {
      const loginResponse = await axios.post(`${baseURL}/users/login`, {
        email: 'admin@example.com',
        password: '123456'
      });
      console.log('   ✅ 用户登录成功，应该记录日志');
      console.log('   📝 响应:', loginResponse.data.message);
    } catch (error) {
      console.log('   ❌ 用户登录失败:', error.response?.data?.message || error.message);
    }
    
    // 3. 测试查看用户列表（查看操作，应该记录）
    console.log('\n3️⃣ 测试查看用户列表（查看操作，应该记录）');
    try {
      const usersResponse = await axios.get(`${baseURL}/users`);
      console.log('   ✅ 查看用户列表成功，应该记录日志');
      console.log('   📝 用户数量:', usersResponse.data.data?.length || 0);
    } catch (error) {
      console.log('   ❌ 查看用户列表失败:', error.response?.data?.message || error.message);
    }
    
    // 4. 测试创建项目（重要操作，应该记录）
    console.log('\n4️⃣ 测试创建项目（重要操作，应该记录）');
    try {
      const projectResponse = await axios.post(`${baseURL}/projects`, {
        name: '测试项目',
        description: '这是一个测试项目',
        status: 'active',
        priority: 'medium'
      });
      console.log('   ✅ 创建项目成功，应该记录日志');
      console.log('   📝 项目ID:', projectResponse.data.data?._id || '未知');
    } catch (error) {
      console.log('   ❌ 创建项目失败:', error.response?.data?.message || error.message);
    }
    
    // 5. 测试查看日志（查看操作，应该记录）
    console.log('\n5️⃣ 测试查看日志（查看操作，应该记录）');
    try {
      const logsResponse = await axios.get(`${baseURL}/logs`);
      console.log('   ✅ 查看日志成功，应该记录日志');
      console.log('   📝 日志数量:', logsResponse.data.data?.length || 0);
    } catch (error) {
      console.log('   ❌ 查看日志失败:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎯 测试完成！');
    console.log('📊 请检查服务器控制台，应该只显示重要操作的日志');
    console.log('🔍 健康检查等操作应该被过滤掉，不会产生日志');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testOptimizedLogs();