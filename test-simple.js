import { chromium } from 'playwright';

async function testSimple() {
  console.log('🔍 简单测试...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // 监听控制台错误
    page.on('console', msg => {
      console.log('📋 控制台消息:', msg.text());
    });
    
    page.on('pageerror', error => {
      console.log('❌ 页面错误:', error.message);
    });
    
    // 访问页面
    console.log('🌐 访问页面...');
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 检查页面标题
    const title = await page.title();
    console.log('📋 页面标题:', title);
    
    // 检查是否有JavaScript错误
    const errors = await page.evaluate(() => {
      return window.errors || [];
    });
    console.log('📋 JavaScript错误:', errors);
    
    // 检查React根元素
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'No root element';
    });
    console.log('📋 React根元素内容:', rootContent.substring(0, 200));
    
    // 等待更长时间
    console.log('⏳ 等待5秒...');
    await page.waitForTimeout(5000);
    
    // 再次检查React根元素
    const rootContent2 = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'No root element';
    });
    console.log('📋 5秒后React根元素内容:', rootContent2.substring(0, 200));
    
  } catch (error) {
    console.log('❌ 测试过程中出现错误:', error.message);
  } finally {
    await browser.close();
  }
}

testSimple(); 