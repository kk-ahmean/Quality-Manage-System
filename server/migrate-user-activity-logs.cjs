import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, 'config.env') });

// 动态导入模型
let User, UserActivityLog;

const migrateUserActivityLogs = async () => {
  try {
    console.log('🚀 开始迁移用户活动日志数据...');
    
    // 检查MongoDB连接
    if (!process.env.MONGODB_URI) {
      console.log('❌ 错误: MONGODB_URI 未配置');
      console.log('请确保在 config.env 文件中配置了 MONGODB_URI');
      process.exit(1);
    }
    
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ 数据库连接成功');
    
    // 动态导入模型
    User = (await import('./models/User.js')).default;
    UserActivityLog = (await import('./models/UserActivityLog.js')).default;
    
    // 查找所有没有userName字段的日志记录
    const logsWithoutUserName = await UserActivityLog.find({
      $or: [
        { userName: { $exists: false } },
        { userName: null },
        { userName: '' }
      ]
    });
    
    console.log(`📊 找到 ${logsWithoutUserName.length} 条需要迁移的日志记录`);
    
    if (logsWithoutUserName.length === 0) {
      console.log('✅ 所有日志记录都已经包含userName字段，无需迁移');
      return;
    }
    
    // 开始迁移
    let successCount = 0;
    let errorCount = 0;
    
    for (const log of logsWithoutUserName) {
      try {
        let userName = '未知用户';
        
        // 如果有userId，尝试获取用户名
        if (log.userId) {
          try {
            const user = await User.findById(log.userId).select('name');
            if (user && user.name) {
              userName = user.name;
            }
          } catch (userError) {
            console.log(`⚠️  无法获取用户 ${log.userId} 的信息:`, userError.message);
          }
        }
        
        // 更新日志记录
        await UserActivityLog.updateOne(
          { _id: log._id },
          { 
            $set: { userName: userName },
            $currentDate: { updatedAt: true }
          }
        );
        
        successCount++;
        if (successCount % 100 === 0) {
          console.log(`📈 已迁移 ${successCount} 条记录...`);
        }
        
      } catch (error) {
        console.error(`❌ 迁移日志记录 ${log._id} 失败:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 数据迁移完成!');
    console.log(`✅ 成功迁移: ${successCount} 条记录`);
    if (errorCount > 0) {
      console.log(`❌ 迁移失败: ${errorCount} 条记录`);
    }
    
    // 验证迁移结果
    const remainingLogs = await UserActivityLog.find({
      $or: [
        { userName: { $exists: false } },
        { userName: null },
        { userName: '' }
      ]
    });
    
    if (remainingLogs.length === 0) {
      console.log('✅ 验证通过: 所有日志记录都包含userName字段');
    } else {
      console.log(`⚠️  验证失败: 仍有 ${remainingLogs.length} 条记录缺少userName字段`);
    }
    
  } catch (error) {
    console.error('❌ 数据迁移失败:', error);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 数据库连接已关闭');
    }
    process.exit(0);
  }
};

// 运行迁移
migrateUserActivityLogs();
