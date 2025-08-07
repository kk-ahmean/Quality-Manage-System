import { chromium } from 'playwright';

async function testConnection() {
  console.log('🔍 开始测试前端与后端连接...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 测试后端API健康检查
    console.log('📡 测试后端API健康检查...');
    const response = await page.goto('http://localhost:5000/api/health');
    if (response.ok()) {
      const data = await response.json();
      console.log('✅ 后端API连接成功:', data);
    } else {
      console.log('❌ 后端API连接失败:', response.status());
    }
    
    // 测试前端页面加载
    console.log('🌐 测试前端页面加载...');
    await page.goto('http://localhost:3000/Quality-Manage-System/');
    const title = await page.title();
    console.log('✅ 前端页面加载成功:', title);
    
    // 测试登录功能
    console.log('🔐 测试登录功能...');
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    
    // 等待页面加载完成
    await page.waitForLoadState('networkidle');
    
    // 检查登录页面元素
    console.log('🔍 检查登录页面元素...');
    
    // 使用正确的选择器
    const emailInput = await page.locator('input[name="email"]');
    const passwordInput = await page.locator('input[name="password"]');
    const submitButton = await page.locator('button[type="submit"]');
    
    if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await submitButton.count() > 0) {
      console.log('✅ 登录表单元素找到');
      
      // 填写登录表单
      console.log('📝 填写登录表单...');
      await emailInput.fill('admin@example.com');
      await passwordInput.fill('123456');
      
      // 等待一下再点击
      await page.waitForTimeout(1000);
      
      console.log('🖱️ 点击登录按钮...');
      await submitButton.click();
      
      // 等待登录完成
      console.log('⏳ 等待登录完成...');
      await page.waitForTimeout(5000);
      
      // 检查是否登录成功
      const currentUrl = page.url();
      console.log('📍 当前URL:', currentUrl);
      
      // 检查是否有错误信息
      const errorElement = await page.locator('.error, .alert, .message, .ant-message, .ant-notification').first();
      if (await errorElement.count() > 0) {
        const errorText = await errorElement.textContent();
        console.log('❌ 登录错误信息:', errorText);
      }
      
      // 检查网络请求
      console.log('🌐 检查网络请求...');
      const requests = page.request;
      
      if (currentUrl.includes('/dashboard') || currentUrl.includes('/home') || !currentUrl.includes('/login')) {
        console.log('✅ 登录功能正常');
      } else {
        console.log('❌ 登录功能异常，仍在登录页面');
        
        // 尝试手动测试API
        console.log('🔧 手动测试登录API...');
        const loginResponse = await page.request.post('http://localhost:5000/api/auth/login', {
          data: {
            email: 'admin@example.com',
            password: '123456'
          }
        });
        
        if (loginResponse.ok()) {
          const loginData = await loginResponse.json();
          console.log('✅ 登录API响应:', loginData);
        } else {
          console.log('❌ 登录API失败:', loginResponse.status());
          const errorData = await loginResponse.text();
          console.log('❌ 错误详情:', errorData);
        }
      }
    } else {
      console.log('❌ 登录表单元素未找到');
      console.log('📋 页面内容:', await page.content());
    }
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

testConnection(); 