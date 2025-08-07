import bcrypt from 'bcryptjs';

async function testPassword() {
  console.log('🔍 测试密码哈希...');
  
  const password = '123456';
  const hash = '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('📝 测试密码:', password);
  console.log('🔐 存储的哈希:', hash);
  
  const isValid = await bcrypt.compare(password, hash);
  console.log('✅ 密码验证结果:', isValid);
  
  // 生成新的哈希
  const newHash = await bcrypt.hash(password, 12);
  console.log('🆕 新生成的哈希:', newHash);
  
  const isNewValid = await bcrypt.compare(password, newHash);
  console.log('✅ 新哈希验证结果:', isNewValid);
}

testPassword(); 