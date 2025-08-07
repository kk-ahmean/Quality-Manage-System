import fetch from 'node-fetch';

async function testApiLogin() {
  console.log('🔍 测试API登录功能...');
  
  try {
    // 测试登录API
    const loginData = {
      email: 'admin@example.com',
      password: '123456'
    };
    
    console.log('📝 发送登录请求...');
    console.log('📋 请求数据:', loginData);
    
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    console.log('📡 响应状态:', response.status);
    console.log('📡 响应头:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('📋 响应数据:', data);
    
    if (response.ok) {
      console.log('✅ 登录成功！');
      console.log('🔑 Token:', data.data.token);
      console.log('👤 用户信息:', data.data.user);
    } else {
      console.log('❌ 登录失败！');
      console.log('❌ 错误信息:', data.message);
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
  }
}

testApiLogin(); 