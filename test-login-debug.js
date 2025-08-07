import { chromium } from 'playwright';

async function testLoginDebug() {
  console.log('🔍 调试登录问题...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 监听网络请求
    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log('📡 登录API响应:', response.status(), response.url());
        response.json().then(data => {
          console.log('📋 响应数据:', data);
        }).catch(err => {
          console.log('❌ 解析响应失败:', err.message);
        });
      }
    });
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ 控制台错误:', msg.text());
      }
    });
    
    // 访问登录页面
    console.log('🌐 访问登录页面...');
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // 填写登录表单
    console.log('📝 填写登录表单...');
    await page.fill('#login_email', 'admin@example.com');
    await page.fill('#login_password', '123456');
    
    // 点击登录按钮
    console.log('🖱️ 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 等待网络请求完成
    await page.waitForTimeout(5000);
    
    // 检查当前URL
    const currentUrl = page.url();
    console.log('📍 当前URL:', currentUrl);
    
    // 检查是否有错误信息
    const errorElements = await page.locator('.error-message, .ant-message-error').all();
    if (errorElements.length > 0) {
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log('❌ 错误信息:', errorText);
      }
    }
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

testLoginDebug(); 