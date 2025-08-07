const { chromium } = require('playwright');

async function testTaskDetailCreator() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试任务详情创建者显示...');

    // 1. 访问登录页面
    await page.goto('http://localhost:5173/Quality-Manage-System/login');
    console.log('已访问登录页面');

    // 2. 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登录")');
    console.log('已执行登录操作');

    // 等待登录完成并跳转
    await page.waitForURL('**/dashboard');
    console.log('登录成功，已跳转到仪表板');

    // 3. 导航到任务管理页面
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    console.log('已导航到任务管理页面');

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 4. 检查是否有任务列表
    const taskRows = await page.locator('tbody tr').count();
    console.log(`找到 ${taskRows} 个任务`);

    if (taskRows === 0) {
      console.log('没有找到任务，创建一个新任务进行测试...');
      
      // 创建新任务
      await page.click('button:has-text("创建任务")');
      await page.waitForSelector('input[placeholder="请输入任务标题"]');
      
      await page.fill('input[placeholder="请输入任务标题"]', '测试任务');
      await page.fill('textarea[placeholder="请输入任务描述"]', '这是一个测试任务');
      await page.selectOption('select[placeholder="请选择优先级"]', 'P2');
      await page.selectOption('select[placeholder="请选择负责人"]', '1'); // 选择第一个用户
      await page.fill('input[placeholder="请选择截止日期"]', '2024-12-31');
      await page.click('button:has-text("创建")');
      
      await page.waitForTimeout(2000);
      console.log('已创建测试任务');
    }

    // 5. 点击第一个任务的详情按钮
    const detailButtons = await page.locator('button:has-text("详情")').all();
    if (detailButtons.length > 0) {
      await detailButtons[0].click();
      console.log('已点击任务详情按钮');

      // 等待详情模态框出现
      await page.waitForSelector('.ant-modal-content');
      console.log('任务详情模态框已显示');

      // 6. 检查创建者显示
      const creatorText = await page.locator('text=创建者：').locator('..').textContent();
      console.log('创建者显示内容:', creatorText);

      // 验证创建者显示是否正确（应该是当前登录用户的用户名）
      if (creatorText && creatorText.includes('系统管理员')) {
        console.log('✅ 创建者显示正确：显示当前登录用户"系统管理员"');
      } else {
        console.log('❌ 创建者显示错误：', creatorText);
      }

      // 7. 关闭详情模态框
      await page.click('.ant-modal-close');
      console.log('已关闭任务详情模态框');

    } else {
      console.log('❌ 没有找到任务详情按钮');
    }

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
    console.log('测试完成，浏览器已关闭');
  }
}

// 运行测试
testTaskDetailCreator(); 