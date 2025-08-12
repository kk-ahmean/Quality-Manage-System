import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// 加载环境变量
dotenv.config({ path: './config.env' });

const testMongoDB = async () => {
  try {
    console.log('🔍 测试MongoDB连接...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? '已配置' : '未配置');
    
    // 连接MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB连接成功');
    
    // 测试查询
    const users = await User.find();
    console.log(`📊 当前用户数量: ${users.length}`);
    
    // 测试创建用户
    const testUser = new User({
      name: '测试用户',
      email: 'test@example.com',
      password: '123456',
      role: 'developer',
      permissions: ['read', 'write']
    });
    
    await testUser.save();
    console.log('✅ 测试用户创建成功');
    
    // 删除测试用户
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ 测试用户删除成功');
    
    console.log('🎉 MongoDB测试完成，连接正常！');
    
  } catch (error) {
    console.error('❌ MongoDB测试失败:', error);
    console.error('错误详情:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 断开MongoDB连接');
  }
};

// 运行测试
testMongoDB(); 