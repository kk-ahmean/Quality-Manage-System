const axios = require('axios');

async function testUsersData() {
  try {
    console.log('开始测试用户数据获取...');

    // 测试获取用户列表
    const response = await axios.get('http://192.168.53.20:5001/api/users', {
      headers: {
        'Authorization': 'Bearer your-token-here' // 需要有效的token
      }
    });

    console.log('用户数据响应:', response.data);
    
    if (response.data.success) {
      const users = response.data.data.users;
      console.log(`✅ 成功获取 ${users.length} 个用户`);
      
      users.forEach((user, index) => {
        console.log(`用户 ${index + 1}:`, {
          id: user.id || user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          email: user.email
        });
      });
    } else {
      console.log('❌ 获取用户数据失败:', response.data.message);
    }

  } catch (error) {
    console.error('测试用户数据失败:', error.response?.data || error.message);
  }
}

// 运行测试
testUsersData(); 