const { chromium } = require('playwright');

async function testPermissions() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🧪 开始测试权限管理功能...');

  try {
    // 1. 测试管理员登录
    console.log('📝 测试管理员登录...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', '123456');
    await page.click('#login-button');
    
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 10000 });
    console.log('✅ 管理员登录成功');

    // 2. 测试管理员在Bug管理页面的删除权限
    console.log('📝 测试管理员在Bug管理页面的删除权限...');
    await page.goto('http://localhost:5173/bugs');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    // 检查是否有删除按钮
    const deleteButtons = await page.locator('button:has-text("删除")').count();
    console.log(`🔍 找到 ${deleteButtons} 个删除按钮`);
    
    if (deleteButtons > 0) {
      console.log('✅ 管理员可以看到删除按钮');
    } else {
      console.log('⚠️ 管理员看不到删除按钮，可能没有Bug数据');
    }

    // 3. 测试管理员在用户管理页面的删除权限
    console.log('📝 测试管理员在用户管理页面的删除权限...');
    await page.goto('http://localhost:5173/users');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const userDeleteButtons = await page.locator('button:has-text("删除")').count();
    console.log(`🔍 找到 ${userDeleteButtons} 个用户删除按钮`);
    
    if (userDeleteButtons > 0) {
      console.log('✅ 管理员可以看到用户删除按钮');
    } else {
      console.log('⚠️ 管理员看不到用户删除按钮，可能没有用户数据');
    }

    // 4. 测试管理员在项目管理页面的删除权限
    console.log('📝 测试管理员在项目管理页面的删除权限...');
    await page.goto('http://localhost:5173/projects');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const projectDeleteButtons = await page.locator('button:has-text("删除")').count();
    console.log(`🔍 找到 ${projectDeleteButtons} 个项目删除按钮`);
    
    if (projectDeleteButtons > 0) {
      console.log('✅ 管理员可以看到项目删除按钮');
    } else {
      console.log('⚠️ 管理员看不到项目删除按钮，可能没有项目数据');
    }

    // 5. 测试管理员在任务管理页面的删除权限
    console.log('📝 测试管理员在任务管理页面的删除权限...');
    await page.goto('http://localhost:5173/tasks');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const taskDeleteButtons = await page.locator('button:has-text("删除")').count();
    console.log(`🔍 找到 ${taskDeleteButtons} 个任务删除按钮`);
    
    if (taskDeleteButtons > 0) {
      console.log('✅ 管理员可以看到任务删除按钮');
    } else {
      console.log('⚠️ 管理员看不到任务删除按钮，可能没有任务数据');
    }

    // 6. 测试管理员在团队管理页面的删除权限
    console.log('📝 测试管理员在团队管理页面的删除权限...');
    await page.goto('http://localhost:5173/teams');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const teamDeleteButtons = await page.locator('button:has-text("删除")').count();
    console.log(`🔍 找到 ${teamDeleteButtons} 个团队删除按钮`);
    
    if (teamDeleteButtons > 0) {
      console.log('✅ 管理员可以看到团队删除按钮');
    } else {
      console.log('⚠️ 管理员看不到团队删除按钮，可能没有团队数据');
    }

    // 7. 测试普通用户登录
    console.log('📝 测试普通用户登录...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('#login-form', { timeout: 10000 });
    
    await page.fill('#email', 'developer@example.com');
    await page.fill('#password', '123456');
    await page.click('#login-button');
    
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 10000 });
    console.log('✅ 普通用户登录成功');

    // 8. 测试普通用户在Bug管理页面的删除权限
    console.log('📝 测试普通用户在Bug管理页面的删除权限...');
    await page.goto('http://localhost:5173/bugs');
    await page.waitForSelector('.ant-table', { timeout: 10000 });
    
    const normalUserDeleteButtons = await page.locator('button:has-text("删除")').count();
    console.log(`🔍 普通用户找到 ${normalUserDeleteButtons} 个删除按钮`);
    
    if (normalUserDeleteButtons === 0) {
      console.log('✅ 普通用户看不到删除按钮（符合预期）');
    } else {
      console.log('⚠️ 普通用户可以看到删除按钮，需要检查权限控制');
    }

    console.log('🎉 权限管理功能测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await browser.close();
  }
}

testPermissions(); 