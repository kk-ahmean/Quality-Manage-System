const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

// 测试用户信息
const testUser = {
  name: 'admin',
  password: '123456'
};

async function testCompletePasswordFlow() {
  try {
    console.log('🧪 开始测试完整的密码重置流程...\n');

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

    // 2. 验证token有效性
    console.log('2️⃣ 验证token有效性...');
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!meResponse.data.success) {
      throw new Error('Token验证失败: ' + meResponse.data.message);
    }

    console.log('✅ Token有效，用户信息:', meResponse.data.data.name, '\n');

    // 3. 修改密码
    console.log('3️⃣ 修改密码...');
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

    // 4. 验证旧token仍然有效（因为用户还在使用）
    console.log('4️⃣ 验证旧token是否仍然有效...');
    try {
      const oldTokenMeResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (oldTokenMeResponse.data.success) {
        console.log('✅ 旧token仍然有效（用户还在使用中）');
      } else {
        console.log('❌ 旧token失效了');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('❌ 旧token已失效');
      } else {
        console.log('❌ 验证旧token时发生错误:', error.message);
      }
    }

    // 5. 使用新密码登录
    console.log('\n5️⃣ 使用新密码登录...');
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

    // 6. 验证新token
    console.log('6️⃣ 验证新token...');
    const newTokenMeResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${newToken}`
      }
    });

    if (!newTokenMeResponse.data.success) {
      throw new Error('新Token验证失败: ' + newTokenMeResponse.data.message);
    }

    console.log('✅ 新Token有效，用户信息:', newTokenMeResponse.data.data.name, '\n');

    // 7. 使用旧密码尝试登录（应该失败）
    console.log('7️⃣ 使用旧密码尝试登录（应该失败）...');
    try {
      const oldPasswordLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        name: testUser.name,
        password: testUser.password
      });
      
      if (oldPasswordLoginResponse.data.success) {
        console.log('❌ 旧密码仍然可以登录，这是错误的！');
        throw new Error('旧密码仍然可以登录');
      } else {
        console.log('✅ 旧密码无法登录，符合预期');
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ 旧密码无法登录，符合预期');
      } else if (error.message === '旧密码仍然可以登录') {
        throw error;
      } else {
        console.log('❌ 旧密码登录时发生意外错误:', error.message);
      }
    }

    // 8. 将密码改回原密码
    console.log('\n8️⃣ 将密码改回原密码...');
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

    // 9. 验证原密码可以登录
    console.log('9️⃣ 验证原密码可以登录...');
    const finalLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      name: testUser.name,
      password: testUser.password
    });

    if (!finalLoginResponse.data.success) {
      throw new Error('原密码登录失败: ' + finalLoginResponse.data.message);
    }

    console.log('✅ 原密码登录成功，用户:', finalLoginResponse.data.data.user.name);
    console.log('🔑 最终Token:', finalLoginResponse.data.data.token.substring(0, 20) + '...\n');

    console.log('🎉 完整密码重置流程测试完成！所有测试都通过了！');
    console.log('\n📋 测试总结:');
    console.log('   ✅ 密码修改API正常工作');
    console.log('   ✅ 新密码可以正常登录');
    console.log('   ✅ 旧密码无法登录');
    console.log('   ✅ 密码恢复功能正常');
    console.log('   ✅ Token验证机制正常');

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
testCompletePasswordFlow(); 