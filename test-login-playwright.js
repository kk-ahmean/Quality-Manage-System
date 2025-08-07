import { chromium } from 'playwright';

async function testLogin() {
  console.log('🔍 开始Playwright登录测试...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  
  try {
    const page = await browser.newPage();
    
    // 访问登录页面
    console.log('📡 访问登录页面...');
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log('📋 页面标题:', title);
    
    // 检查是否有登录表单
    const loginForm = await page.locator('.login-form');
    const formExists = await loginForm.count() > 0;
    console.log('📋 登录表单存在:', formExists);
    
    if (formExists) {
      // 填写用户名
      console.log('📝 填写用户名...');
      await page.fill('input[placeholder="请输入用户名"]', '系统管理员');
      
      // 填写密码
      console.log('📝 填写密码...');
      await page.fill('input[placeholder="请输入密码"]', '123456');
      
      // 点击登录按钮
      console.log('🖱️ 点击登录按钮...');
      await page.click('button[type="submit"]');
      
      // 等待响应
      await page.waitForTimeout(3000);
      
      // 检查是否有错误信息
      const errorElement = await page.locator('.error-message');
      const hasError = await errorElement.count() > 0;
      
      if (hasError) {
        const errorText = await errorElement.textContent();
        console.log('❌ 登录错误:', errorText);
      } else {
        console.log('✅ 登录成功或没有错误信息');
      }
      
      // 检查是否跳转到仪表盘
      const currentUrl = page.url();
      console.log('📋 当前URL:', currentUrl);
      
      if (currentUrl.includes('/dashboard')) {
        console.log('✅ 成功跳转到仪表盘');
      } else {
        console.log('❌ 未跳转到仪表盘');
      }
    } else {
      console.log('❌ 未找到登录表单');
    }
    
    // 截图
    await page.screenshot({ path: 'login-test-result.png' });
    console.log('📸 截图已保存为 login-test-result.png');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin(); 