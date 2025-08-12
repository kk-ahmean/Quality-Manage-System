import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import dotenv from 'dotenv';

// 加载环境变量，指定配置文件路径
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

const initUsers = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 检查是否存在默认用户
    const existingUsers = await User.find({});
    console.log(`📊 当前数据库中有 ${existingUsers.length} 个用户`);

    if (existingUsers.length === 0) {
      // 创建默认用户
      const defaultUsers = [
        {
          name: '系统管理员',
          email: 'admin@example.com',
          password: '123456',
          role: 'admin',
          permissions: getDefaultPermissionsByRole('admin')
        },
        {
          name: '开发工程师',
          email: 'developer@example.com',
          password: '123456',
          role: 'developer',
          permissions: getDefaultPermissionsByRole('developer')
        },
        {
          name: '测试工程师',
          email: 'tester@example.com',
          password: '123456',
          role: 'tester',
          permissions: getDefaultPermissionsByRole('tester')
        }
      ];

      for (const userData of defaultUsers) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ 创建默认用户: ${user.name} (${user.email})`);
        console.log(`   权限: ${userData.permissions.join(', ')}`);
      }
    } else {
      // 修复现有用户的密码和权限
      console.log('🔧 检查并修复现有用户密码和权限...');
      
      for (const user of existingUsers) {
        let needsUpdate = false;
        
        // 检查密码字段是否存在
        if (!user.password) {
          console.log(`🔧 用户密码为空，设置默认密码: ${user.name} (${user.email})`);
          user.password = '123456'; // 模型中间件会自动哈希
          needsUpdate = true;
        } else {
          try {
            // 检查密码是否正确哈希
            const isPasswordValid = await user.comparePassword('123456');
            
            if (!isPasswordValid) {
              console.log(`🔧 修复用户密码: ${user.name} (${user.email})`);
              user.password = '123456'; // 模型中间件会自动重新哈希
              needsUpdate = true;
            } else {
              console.log(`✅ 用户密码正常: ${user.name} (${user.email})`);
            }
          } catch (error) {
            console.log(`🔧 用户密码验证失败，重新设置: ${user.name} (${user.email})`);
            user.password = '123456'; // 模型中间件会自动重新哈希
            needsUpdate = true;
          }
        }

        // 检查并修复权限
        const expectedPermissions = getDefaultPermissionsByRole(user.role);
        if (!user.permissions || user.permissions.length === 0 || 
            JSON.stringify(user.permissions.sort()) !== JSON.stringify(expectedPermissions.sort())) {
          console.log(`🔧 修复用户权限: ${user.name} (${user.email})`);
          console.log(`   原权限: ${user.permissions ? user.permissions.join(', ') : '无'}`);
          console.log(`   新权限: ${expectedPermissions.join(', ')}`);
          user.permissions = expectedPermissions;
          needsUpdate = true;
        } else {
          console.log(`✅ 用户权限正常: ${user.name} (${user.email})`);
        }

        if (needsUpdate) {
          await user.save();
        }
      }
    }

    console.log('🎉 用户初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 用户初始化失败:', error);
    process.exit(1);
  }
};

initUsers(); 