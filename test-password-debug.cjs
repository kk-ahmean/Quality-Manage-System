const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// 测试用户信息
const testUser = {
  name: 'admin',
  password: '123456'
};

async function testPasswordDebug() {
  try {
    console.log('🧪 开始调试密码重置功能...\n');
    console.log('🔗 API地址:', API_BASE_URL);
    console.log('👤 测试用户:', testUser.name);
    console.log('🔑 测试密码:', testUser.password, '\n');

    // 1. 检查服务器连接
    console.log('1️⃣ 检查服务器连接...');
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
      console.log('✅ 服务器连接正常');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ 无法连接到服务器，请确保后端服务器正在运行');
        console.log('💡 请运行: npm run dev 或 node server/server.js');
        return;
      } else if (error.code === 'ENOTFOUND') {
        console.log('❌ 无法解析服务器地址');
        return;
      } else if (error.code === 'ETIMEDOUT') {
        console.log('❌ 连接超时，服务器可能响应缓慢');
        return;
      } else {
        console.log('❌ 连接错误:', error.message);
        return;
      }
    }

    // 2. 尝试登录
    console.log('\n2️⃣ 尝试登录...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        name: testUser.name,
        password: testUser.password
      }, { timeout: 10000 });

      console.log('✅ 登录请求成功');
      console.log('📊 响应状态:', loginResponse.status);
      console.log('📋 响应数据:', JSON.stringify(loginResponse.data, null, 2));

      if (loginResponse.data.success) {
        const { token, user } = loginResponse.data.data;
        console.log('✅ 登录成功，用户:', user.name, 'ID:', user.id);
        console.log('🔑 Token长度:', token.length);
        
        // 3. 测试密码修改
        console.log('\n3️⃣ 测试密码修改...');
        const newPassword = 'newpass123';
        
        try {
          const changePasswordResponse = await axios.put(`${API_BASE_URL}/auth/change-password`, {
            currentPassword: testUser.password,
            newPassword: newPassword
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000
          });

          console.log('✅ 密码修改请求成功');
          console.log('📊 响应状态:', changePasswordResponse.status);
          console.log('📋 响应数据:', JSON.stringify(changePasswordResponse.data, null, 2));

          if (changePasswordResponse.data.success) {
            console.log('✅ 密码修改成功！');
            
            // 4. 测试新密码登录
            console.log('\n4️⃣ 测试新密码登录...');
            try {
              const newLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                name: testUser.name,
                password: newPassword
              }, { timeout: 10000 });

              if (newLoginResponse.data.success) {
                console.log('✅ 新密码登录成功！');
                console.log('🎉 密码重置功能完全正常！');
              } else {
                console.log('❌ 新密码登录失败:', newLoginResponse.data.message);
              }
            } catch (error) {
              console.log('❌ 新密码登录时发生错误:', error.message);
              if (error.response) {
                console.log('响应状态:', error.response.status);
                console.log('响应数据:', error.response.data);
              }
            }
          } else {
            console.log('❌ 密码修改失败:', changePasswordResponse.data.message);
          }
        } catch (error) {
          console.log('❌ 密码修改时发生错误:', error.message);
          if (error.response) {
            console.log('响应状态:', error.response.status);
            console.log('响应数据:', error.response.data);
          }
        }
      } else {
        console.log('❌ 登录失败:', loginResponse.data.message);
      }
    } catch (error) {
      console.log('❌ 登录请求失败:', error.message);
      if (error.response) {
        console.log('响应状态:', error.response.status);
        console.log('响应数据:', error.response.data);
      } else if (error.request) {
        console.log('❌ 没有收到响应，服务器可能没有运行');
        console.log('💡 请确保后端服务器正在运行在端口3001上');
      }
    }

  } catch (error) {
    console.error('❌ 测试过程中发生未预期的错误:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testPasswordDebug(); 