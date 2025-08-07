import { chromium } from 'playwright';

async function runTests() {
  console.log('🚀 开始Playwright自动测试...\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 测试1: 访问前端页面
    console.log('📋 测试1: 访问前端页面');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    // 检查是否在登录页面
    const loginForm = await page.locator('form').count();
    console.log(`找到表单数量: ${loginForm}`);
    
    if (loginForm > 0) {
      console.log('✅ 前端页面访问成功，显示登录页面');
      
      // 测试2: 登录功能
      console.log('\n📋 测试2: 登录功能');
      
      // 输入用户名和密码
      await page.fill('input[name="username"], input[placeholder*="用户名"]', 'admin@example.com');
      await page.fill('input[type="password"], input[name="password"], input[placeholder*="密码"]', 'admin123');
      
      // 点击登录按钮
      await page.click('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
      
      // 等待页面跳转
      await page.waitForTimeout(3000);
      
      // 检查是否登录成功
      const currentUrl = page.url();
      console.log(`当前URL: ${currentUrl}`);
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/bugs') || !currentUrl.includes('/login')) {
        console.log('✅ 登录成功，已跳转到主页面');
        
        // 测试3: 检查仪表盘功能
        console.log('\n📋 测试3: 检查仪表盘功能');
        
        // 等待页面加载
        await page.waitForTimeout(2000);
        
        // 检查是否有仪表盘内容
        const dashboardContent = await page.locator('.dashboard, .ant-layout-content').count();
        console.log(`仪表盘内容区域数量: ${dashboardContent}`);
        
        if (dashboardContent > 0) {
          console.log('✅ 仪表盘页面加载成功');
        } else {
          console.log('⚠️  仪表盘页面可能未完全加载');
        }
        
        // 测试4: 检查导航菜单
        console.log('\n📋 测试4: 检查导航菜单');
        
        const menuItems = await page.locator('.ant-menu-item, .menu-item, nav a').count();
        console.log(`导航菜单项数量: ${menuItems}`);
        
        if (menuItems > 0) {
          console.log('✅ 导航菜单显示正常');
        } else {
          console.log('⚠️  导航菜单可能未显示');
        }
        
      } else {
        console.log('❌ 登录失败，仍在登录页面');
        
        // 检查是否有错误信息
        const errorMessage = await page.locator('.error-message, .ant-message-error').count();
        if (errorMessage > 0) {
          const errorText = await page.locator('.error-message, .ant-message-error').first().textContent();
          console.log(`错误信息: ${errorText}`);
        }
      }
    } else {
      console.log('❌ 前端页面访问失败，未显示登录页面');
    }
    
    // 测试5: 检查API连接
    console.log('\n📋 测试5: 检查API连接');
    
    // 通过浏览器控制台检查API请求
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        const data = await response.json();
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (apiResponse.success) {
      console.log('✅ API连接成功:', apiResponse.data);
    } else {
      console.log('❌ API连接失败:', apiResponse.error);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
    console.log('\n🏁 Playwright自动测试完成');
  }
}

runTests(); 