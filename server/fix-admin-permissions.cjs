const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config({ path: './config.env' });

// 根据角色获取默认权限
const getDefaultPermissionsByRole = (role) => {
  const adminPermissions = [
    'user:read', 'user:create', 'user:update', 'user:delete',
    'team:read', 'team:create', 'team:update', 'team:delete',
    'bug:read', 'bug:create', 'bug:update', 'bug:delete',
    'task:read', 'task:create', 'task:update', 'task:delete',
    'project:read', 'project:create', 'project:update', 'project:delete',
    'dashboard:read', 'system:settings'
  ];

  const defaultPermissions = [
    'user:read',
    'team:read', 'team:create', 'team:update',
    'bug:read', 'bug:create', 'bug:update',
    'task:read', 'task:create', 'task:update',
    'project:read', 'project:create', 'project:update',
    'dashboard:read', 'system:settings'
  ];

  return role === 'admin' ? adminPermissions : defaultPermissions;
};

const fixAdminPermissions = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 动态导入User模型
    const User = (await import('./models/User.js')).default;

    // 查找管理员用户
    const adminUsers = await User.find({ role: 'admin' });
    console.log(`📊 找到 ${adminUsers.length} 个管理员用户`);

    for (const user of adminUsers) {
      console.log(`🔍 检查管理员用户: ${user.name} (${user.email})`);
      console.log(`   当前权限: ${user.permissions ? user.permissions.join(', ') : '无'}`);
      
      // 获取正确的管理员权限
      const correctPermissions = getDefaultPermissionsByRole('admin');
      console.log(`   正确权限: ${correctPermissions.join(', ')}`);
      
      // 检查权限是否需要修复
      const currentPermissions = user.permissions || [];
      const needsFix = JSON.stringify(currentPermissions.sort()) !== JSON.stringify(correctPermissions.sort());
      
      if (needsFix) {
        console.log(`🔧 修复管理员权限: ${user.name} (${user.email})`);
        user.permissions = correctPermissions;
        await user.save();
        console.log(`✅ 权限修复完成`);
      } else {
        console.log(`✅ 权限已正确`);
      }
    }

    // 检查其他用户
    const otherUsers = await User.find({ role: { $ne: 'admin' } });
    console.log(`📊 找到 ${otherUsers.length} 个非管理员用户`);

    for (const user of otherUsers) {
      console.log(`🔍 检查用户: ${user.name} (${user.email}) - 角色: ${user.role}`);
      console.log(`   当前权限: ${user.permissions ? user.permissions.join(', ') : '无'}`);
      
      // 获取正确的权限
      const correctPermissions = getDefaultPermissionsByRole(user.role);
      console.log(`   正确权限: ${correctPermissions.join(', ')}`);
      
      // 检查权限是否需要修复
      const currentPermissions = user.permissions || [];
      const needsFix = JSON.stringify(currentPermissions.sort()) !== JSON.stringify(correctPermissions.sort());
      
      if (needsFix) {
        console.log(`🔧 修复用户权限: ${user.name} (${user.email})`);
        user.permissions = correctPermissions;
        await user.save();
        console.log(`✅ 权限修复完成`);
      } else {
        console.log(`✅ 权限已正确`);
      }
    }

    console.log('🎉 权限修复完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 权限修复失败:', error);
    process.exit(1);
  }
};

fixAdminPermissions(); 