const axios = require('axios');

async function debugDatabase() {
  try {
    console.log('开始调试数据库数据...');

    // 1. 获取用户列表
    console.log('\n=== 获取用户列表 ===');
    const usersResponse = await axios.get('http://192.168.53.20:5000/api/users', {
      headers: {
        'Authorization': 'Bearer your-token-here' // 需要有效的token
      }
    });
    console.log('用户数据:', usersResponse.data);

    // 2. 获取团队列表
    console.log('\n=== 获取团队列表 ===');
    const teamsResponse = await axios.get('http://192.168.53.20:5000/api/users/teams', {
      headers: {
        'Authorization': 'Bearer your-token-here' // 需要有效的token
      }
    });
    console.log('团队数据:', teamsResponse.data);

  } catch (error) {
    console.error('调试失败:', error.response?.data || error.message);
  }
}

// 运行调试
debugDatabase(); 