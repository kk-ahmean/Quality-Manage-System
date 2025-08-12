const { chromium } = require('playwright');

async function testTeamPageSimple() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试团队管理页面基本功能...');

    // 1. 访问登录页面
    await page.goto('http://192.168.53.20:3000/Quality-Manage-System/login');
    console.log('已访问登录页面');

    // 2. 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    
    // 等待登录按钮可用
    await page.waitForSelector('button:has-text("登录")', { state: 'visible' });
    await page.waitForTimeout(2000);
    
    await page.click('button:has-text("登录")');
    console.log('已执行登录操作');

    // 等待登录完成并跳转
    await page.waitForURL('**/dashboard');
    console.log('登录成功，已跳转到仪表板');

    // 3. 直接访问团队管理页面
    console.log('\n=== 测试团队管理页面 ===');
    await page.goto('http://192.168.53.20:3000/Quality-Manage-System/users/teams');
    console.log('已直接访问团队管理页面');

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 检查页面是否正常显示
    const pageTitle = await page.locator('h1, .ant-card-head-title').first().textContent();
    console.log('页面标题:', pageTitle);

    // 检查是否有错误信息
    const errorElements = await page.locator('.ant-alert-error, .ant-message-error').all();
    if (errorElements.length > 0) {
      console.log('❌ 发现错误信息');
      for (const error of errorElements) {
        const errorText = await error.textContent();
        console.log('错误内容:', errorText);
      }
    } else {
      console.log('✅ 未发现错误信息');
    }

    // 检查表格是否加载
    const table = await page.locator('.ant-table').first();
    if (await table.isVisible()) {
      console.log('✅ 表格正常显示');
      
      // 检查表格行数
      const rows = await page.locator('.ant-table-tbody tr').all();
      console.log(`表格行数: ${rows.length}`);
    } else {
      console.log('❌ 表格未显示');
    }

    // 检查加载状态
    const loadingSpinner = await page.locator('.ant-spin').first();
    if (await loadingSpinner.isVisible()) {
      console.log('⏳ 页面仍在加载中');
    } else {
      console.log('✅ 页面加载完成');
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
    
    // 截图保存错误状态
    await page.screenshot({ path: 'team-page-error.png', fullPage: true });
    console.log('已保存错误截图: team-page-error.png');
  } finally {
    await browser.close();
    console.log('测试完成，浏览器已关闭');
  }
}

// 运行测试
testTeamPageSimple(); 