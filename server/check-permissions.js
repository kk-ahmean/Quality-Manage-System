import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

// 加载环境变量，指定配置文件路径
dotenv.config({ path: './config.env' });

const checkPermissions = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 获取所有用户
    const users = await User.find({}).select('name email role permissions status');

    console.log('📋 所有用户权限配置:');
    console.log('='.repeat(80));

    users.forEach((user, index) => {
      console.log(`${index + 1}. 用户: ${user.name}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   角色: ${user.role}`);
      console.log(`   状态: ${user.status}`);
      console.log(`   权限: ${user.permissions ? user.permissions.join(', ') : '无权限配置'}`);
      console.log('-'.repeat(40));
    });

    // 统计信息
    console.log('\n📊 权限统计:');
    const roleStats = {};
    const permissionStats = {};
    
    users.forEach(user => {
      // 角色统计
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
      
      // 权限统计
      if (user.permissions) {
        user.permissions.forEach(permission => {
          permissionStats[permission] = (permissionStats[permission] || 0) + 1;
        });
      }
    });

    console.log('\n角色分布:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} 人`);
    });

    console.log('\n权限分布:');
    Object.entries(permissionStats).forEach(([permission, count]) => {
      console.log(`  ${permission}: ${count} 人`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 检查权限失败:', error);
    process.exit(1);
  }
};

checkPermissions(); 