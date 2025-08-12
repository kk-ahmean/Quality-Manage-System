const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// 测试用户信息
const testUser = {
  name: 'admin',
  password: '123456'
};

async function testPasswordReset() {
  try {
    console.log('🧪 开始测试密码重置功能...\n');

    // 1. 首先登录获取token
    console.log('1️⃣ 登录获取认证token...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      name: testUser.name,
      password: testUser.password
    });

    if (!loginResponse.data.success) {
      throw new Error('登录失败: ' + loginResponse.data.message);
    }

    const { token, user } = loginResponse.data.data;
    console.log('✅ 登录成功，用户:', user.name, 'ID:', user.id);
    console.log('🔑 Token:', token.substring(0, 20) + '...\n');

    // 2. 修改密码
    console.log('2️⃣ 修改密码...');
    const newPassword = 'newpass123';
    const changePasswordResponse = await axios.put(`${API_BASE_URL}/auth/change-password`, {
      currentPassword: testUser.password,
      newPassword: newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!changePasswordResponse.data.success) {
      throw new Error('密码修改失败: ' + changePasswordResponse.data.message);
    }

    console.log('✅ 密码修改成功:', changePasswordResponse.data.message);
    console.log('🔄 新密码:', newPassword, '\n');

    // 3. 使用新密码登录
    console.log('3️⃣ 使用新密码登录...');
    const newLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      name: testUser.name,
      password: newPassword
    });

    if (!newLoginResponse.data.success) {
      throw new Error('新密码登录失败: ' + newLoginResponse.data.message);
    }

    const { token: newToken, user: newUser } = newLoginResponse.data.data;
    console.log('✅ 新密码登录成功，用户:', newUser.name, 'ID:', newUser.id);
    console.log('🔑 新Token:', newToken.substring(0, 20) + '...\n');

    // 4. 使用旧密码尝试登录（应该失败）
    console.log('4️⃣ 使用旧密码尝试登录（应该失败）...');
    try {
      const oldPasswordLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        name: testUser.name,
        password: testUser.password
      });
      
      if (oldPasswordLoginResponse.data.success) {
        console.log('❌ 旧密码仍然可以登录，这是错误的！');
      } else {
        console.log('✅ 旧密码无法登录，符合预期');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 旧密码无法登录，符合预期');
      } else {
        console.log('❌ 旧密码登录时发生意外错误:', error.message);
      }
    }

    // 5. 将密码改回原密码
    console.log('\n5️⃣ 将密码改回原密码...');
    const revertPasswordResponse = await axios.put(`${API_BASE_URL}/auth/change-password`, {
      currentPassword: newPassword,
      newPassword: testUser.password
    }, {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });

    if (!revertPasswordResponse.data.success) {
      throw new Error('密码恢复失败: ' + revertPasswordResponse.data.message);
    }

    console.log('✅ 密码恢复成功:', revertPasswordResponse.data.message);
    console.log('🔄 恢复后的密码:', testUser.password, '\n');

    // 6. 验证原密码可以登录
    console.log('6️⃣ 验证原密码可以登录...');
    const finalLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      name: testUser.name,
      password: testUser.password
    });

    if (!finalLoginResponse.data.success) {
      throw new Error('原密码登录失败: ' + finalLoginResponse.data.message);
    }

    console.log('✅ 原密码登录成功，用户:', finalLoginResponse.data.data.user.name);
    console.log('🔑 最终Token:', finalLoginResponse.data.data.token.substring(0, 20) + '...\n');

    console.log('🎉 密码重置功能测试完成！所有测试都通过了！');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    process.exit(1);
  }
}

// 运行测试
testPasswordReset(); 