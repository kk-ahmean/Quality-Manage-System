const axios = require('axios');

async function debugPermissions() {
  try {
    console.log('🔍 开始调试权限数据...');

    // 1. 管理员登录
    console.log('📝 管理员登录...');
    const adminLoginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@example.com',
      password: '123456'
    });

    const adminToken = adminLoginResponse.data.token;
    console.log('✅ 管理员登录成功');

    // 2. 获取管理员用户信息
    console.log('📝 获取管理员用户信息...');
    const adminUserResponse = await axios.get('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const adminUser = adminUserResponse.data.user;
    console.log('🔍 管理员用户信息:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions
    });

    // 3. 检查管理员权限
    console.log('📝 检查管理员权限...');
    const hasUserDeletePermission = adminUser.permissions.includes('user:delete');
    const hasTeamDeletePermission = adminUser.permissions.includes('team:delete');
    const hasProjectDeletePermission = adminUser.permissions.includes('project:delete');
    const hasBugDeletePermission = adminUser.permissions.includes('bug:delete');
    const hasTaskDeletePermission = adminUser.permissions.includes('task:delete');

    console.log('🔍 管理员删除权限检查:');
    console.log(`  user:delete: ${hasUserDeletePermission}`);
    console.log(`  team:delete: ${hasTeamDeletePermission}`);
    console.log(`  project:delete: ${hasProjectDeletePermission}`);
    console.log(`  bug:delete: ${hasBugDeletePermission}`);
    console.log(`  task:delete: ${hasTaskDeletePermission}`);

    // 4. 普通用户登录
    console.log('📝 普通用户登录...');
    const userLoginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'developer@example.com',
      password: '123456'
    });

    const userToken = userLoginResponse.data.token;
    console.log('✅ 普通用户登录成功');

    // 5. 获取普通用户信息
    console.log('📝 获取普通用户信息...');
    const userResponse = await axios.get('http://localhost:3000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const normalUser = userResponse.data.user;
    console.log('🔍 普通用户信息:', {
      id: normalUser.id,
      name: normalUser.name,
      email: normalUser.email,
      role: normalUser.role,
      permissions: normalUser.permissions
    });

    // 6. 检查普通用户权限
    console.log('📝 检查普通用户权限...');
    const normalUserHasUserDeletePermission = normalUser.permissions.includes('user:delete');
    const normalUserHasTeamDeletePermission = normalUser.permissions.includes('team:delete');
    const normalUserHasProjectDeletePermission = normalUser.permissions.includes('project:delete');
    const normalUserHasBugDeletePermission = normalUser.permissions.includes('bug:delete');
    const normalUserHasTaskDeletePermission = normalUser.permissions.includes('task:delete');

    console.log('🔍 普通用户删除权限检查:');
    console.log(`  user:delete: ${normalUserHasUserDeletePermission}`);
    console.log(`  team:delete: ${normalUserHasTeamDeletePermission}`);
    console.log(`  project:delete: ${normalUserHasProjectDeletePermission}`);
    console.log(`  bug:delete: ${normalUserHasBugDeletePermission}`);
    console.log(`  task:delete: ${normalUserHasTaskDeletePermission}`);

    // 7. 测试权限控制函数
    console.log('📝 测试权限控制函数...');
    
    // 模拟前端权限检查
    const isAdmin = (permissions) => permissions.includes('user:delete');
    const hasResourceDeletePermission = (permissions, userId, creatorId, resourceType) => {
      if (isAdmin(permissions)) return true;
      if (userId === creatorId) return true;
      const deletePermission = `${resourceType}:delete`;
      return permissions.includes(deletePermission);
    };

    console.log('🔍 管理员权限检查结果:');
    console.log(`  是否为管理员: ${isAdmin(adminUser.permissions)}`);
    console.log(`  是否有用户删除权限: ${hasResourceDeletePermission(adminUser.permissions, adminUser.id, 'any', 'user')}`);
    console.log(`  是否有团队删除权限: ${hasResourceDeletePermission(adminUser.permissions, adminUser.id, 'any', 'team')}`);
    console.log(`  是否有项目删除权限: ${hasResourceDeletePermission(adminUser.permissions, adminUser.id, 'any', 'project')}`);
    console.log(`  是否有Bug删除权限: ${hasResourceDeletePermission(adminUser.permissions, adminUser.id, 'any', 'bug')}`);
    console.log(`  是否有任务删除权限: ${hasResourceDeletePermission(adminUser.permissions, adminUser.id, 'any', 'task')}`);

    console.log('🔍 普通用户权限检查结果:');
    console.log(`  是否为管理员: ${isAdmin(normalUser.permissions)}`);
    console.log(`  是否有用户删除权限: ${hasResourceDeletePermission(normalUser.permissions, normalUser.id, 'any', 'user')}`);
    console.log(`  是否有团队删除权限: ${hasResourceDeletePermission(normalUser.permissions, normalUser.id, 'any', 'team')}`);
    console.log(`  是否有项目删除权限: ${hasResourceDeletePermission(normalUser.permissions, normalUser.id, 'any', 'project')}`);
    console.log(`  是否有Bug删除权限: ${hasResourceDeletePermission(normalUser.permissions, normalUser.id, 'any', 'bug')}`);
    console.log(`  是否有任务删除权限: ${hasResourceDeletePermission(normalUser.permissions, normalUser.id, 'any', 'task')}`);

    console.log('🎉 权限调试完成');

  } catch (error) {
    console.error('❌ 调试失败:', error.response?.data || error.message);
  }
}

debugPermissions(); 