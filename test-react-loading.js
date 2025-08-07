import { chromium } from 'playwright';

async function testReactLoading() {
  console.log('🔍 测试React应用加载...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 访问登录页面
    console.log('🌐 访问登录页面...');
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查是否有React根元素
    console.log('🔍 检查React根元素...');
    const rootElement = await page.locator('#root');
    if (await rootElement.count() > 0) {
      console.log('✅ React根元素找到');
      
      // 等待React组件渲染
      console.log('⏳ 等待React组件渲染...');
      await page.waitForTimeout(3000);
      
      // 检查是否有React组件内容
      const reactContent = await page.locator('#root').innerHTML();
      console.log('📋 React根元素内容长度:', reactContent.length);
      
      if (reactContent.length > 100) {
        console.log('✅ React组件已渲染');
        
        // 检查登录表单元素
        const emailInput = await page.locator('#login_email');
        const passwordInput = await page.locator('#login_password');
        const submitButton = await page.locator('button[type="submit"]');
        
        if (await emailInput.count() > 0) {
          console.log('✅ 邮箱输入框找到');
        } else {
          console.log('❌ 邮箱输入框未找到');
        }
        
        if (await passwordInput.count() > 0) {
          console.log('✅ 密码输入框找到');
        } else {
          console.log('❌ 密码输入框未找到');
        }
        
        if (await submitButton.count() > 0) {
          console.log('✅ 提交按钮找到');
        } else {
          console.log('❌ 提交按钮未找到');
        }
        
        // 尝试填写表单
        if (await emailInput.count() > 0 && await passwordInput.count() > 0 && await submitButton.count() > 0) {
          console.log('📝 填写登录表单...');
          await emailInput.fill('admin@example.com');
          await passwordInput.fill('123456');
          
          console.log('🖱️ 点击登录按钮...');
          await submitButton.click();
          
          // 等待登录完成
          await page.waitForTimeout(3000);
          
          const currentUrl = page.url();
          console.log('📍 当前URL:', currentUrl);
          
          if (currentUrl.includes('/dashboard') || !currentUrl.includes('/login')) {
            console.log('✅ 登录成功！');
          } else {
            console.log('❌ 登录失败，仍在登录页面');
          }
        }
      } else {
        console.log('❌ React组件未渲染，内容为空');
      }
    } else {
      console.log('❌ React根元素未找到');
    }
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

testReactLoading(); 