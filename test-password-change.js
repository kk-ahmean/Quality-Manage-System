const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// 测试用户信息
const testUser = {
  name: 'yanglu',
  password: '123456' // 原始密码
};

async function testPasswordChange() {
  try {
    console.log('🧪 开始测试密码修改功能...');
    
    // 1. 登录获取token
    console.log('1️⃣ 尝试登录获取token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      name: testUser.name,
      password: testUser.password
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功，获取到token');
      
      // 2. 修改密码
      console.log('2️⃣ 尝试修改密码...');
      const changePasswordResponse = await axios.put(`${API_BASE_URL}/auth/change-password`, {
        currentPassword: testUser.password,
        newPassword: 'yanglu' // 新密码
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (changePasswordResponse.data.success) {
        console.log('✅ 密码修改成功');
        
        // 3. 尝试用新密码登录
        console.log('3️⃣ 尝试用新密码登录...');
        const newLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          name: testUser.name,
          password: 'yanglu'
        });
        
        if (newLoginResponse.data.success) {
          console.log('✅ 新密码登录成功！');
        } else {
          console.log('❌ 新密码登录失败:', newLoginResponse.data.message);
        }
        
        // 4. 尝试用旧密码登录（应该失败）
        console.log('4️⃣ 尝试用旧密码登录（应该失败）...');
        try {
          const oldLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            name: testUser.name,
            password: testUser.password
          });
          console.log('❌ 旧密码仍然可以登录，这是问题！');
        } catch (error) {
          if (error.response?.data?.message) {
            console.log('✅ 旧密码登录失败（正常）:', error.response.data.message);
          } else {
            console.log('✅ 旧密码登录失败（正常）');
          }
        }
        
      } else {
        console.log('❌ 密码修改失败:', changePasswordResponse.data.message);
      }
      
    } else {
      console.log('❌ 登录失败:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', error.response.data);
    }
  }
}

// 运行测试
testPasswordChange(); 