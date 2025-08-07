async function testSimpleAPI() {
  console.log('🔍 简单API测试...');
  
  try {
    // 测试健康检查端点
    console.log('📡 测试健康检查...');
    const healthResponse = await fetch('http://127.0.0.1:5000/api/health');
    console.log('📋 健康检查状态:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ 健康检查成功:', healthData);
      
      // 测试登录API
      console.log('📡 测试登录API...');
      const loginData = {
        username: '系统管理员',
        password: '123456'
      };
      
      const loginResponse = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });
      
      console.log('📋 登录API状态:', loginResponse.status);
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ 登录成功:', loginData);
      } else {
        const errorData = await loginResponse.json();
        console.log('❌ 登录失败:', errorData);
      }
    } else {
      console.log('❌ 健康检查失败');
    }
    
  } catch (error) {
    console.log('❌ 请求失败:', error.message);
    console.log('🔍 错误详情:', error);
  }
}

testSimpleAPI(); 