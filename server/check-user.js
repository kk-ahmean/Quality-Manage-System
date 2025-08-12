import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

// 加载环境变量，指定配置文件路径
dotenv.config({ path: './config.env' });

const checkUser = async (searchName) => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');

    // 查找用户
    const user = await User.findOne({ 
      $or: [
        { name: searchName },
        { email: searchName }
      ] 
    }).select('+password');

    if (!user) {
      console.log(`❌ 用户未找到: ${searchName}`);
      return;
    }

    console.log('📋 用户详细信息:');
    console.log(`  ID: ${user._id}`);
    console.log(`  姓名: ${user.name}`);
    console.log(`  邮箱: ${user.email}`);
    console.log(`  角色: ${user.role}`);
    console.log(`  状态: ${user.status}`);
    console.log(`  密码字段存在: ${!!user.password}`);
    console.log(`  密码哈希长度: ${user.password ? user.password.length : 0}`);
    console.log(`  创建时间: ${user.createdAt}`);
    console.log(`  更新时间: ${user.updatedAt}`);

    // 测试密码验证
    if (user.password) {
      try {
        const isPasswordValid = await user.comparePassword('123456');
        console.log(`  密码验证结果: ${isPasswordValid}`);
      } catch (error) {
        console.log(`  密码验证失败: ${error.message}`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 检查用户失败:', error);
    process.exit(1);
  }
};

// 获取命令行参数
const searchName = process.argv[2];
if (!searchName) {
  console.log('请提供要查找的用户名或邮箱');
  console.log('用法: node check-user.js <用户名或邮箱>');
  process.exit(1);
}

checkUser(searchName); 