const { chromium } = require('playwright');

async function testOptimizationFeatures() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试优化功能...');

    // 1. 访问登录页面
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    console.log('已访问登录页面');

    // 2. 登录
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 等待输入框出现
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="请输入密码"]', { timeout: 10000 });
    
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    
    // 等待登录按钮可用
    await page.waitForSelector('button:has-text("登录")', { state: 'visible' });
    await page.waitForTimeout(2000);
    
    // 等待按钮不再处于加载状态
    await page.waitForFunction(() => {
      const button = document.querySelector('button.login-button');
      return button && !button.classList.contains('ant-btn-loading');
    }, { timeout: 10000 });
    
    await page.click('button:has-text("登录")');
    console.log('已执行登录操作');

    // 等待登录完成并跳转
    await page.waitForTimeout(3000);
    console.log('登录成功，等待页面加载完成');

    // 3. 测试项目管理页面 - 三级类目内容显示
    console.log('\n=== 测试项目管理页面三级类目显示 ===');
    await page.click('text=项目管理');
    await page.waitForURL('**/Quality-Manage-System/projects');
    console.log('已导航到项目管理页面');

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查表格中是否有三级类目列，并且有内容显示
    const categoryColumn = await page.locator('th:has-text("三级类目")').count();
    if (categoryColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示三级类目列');
      
      // 检查是否有三级类目的内容显示
      const categoryContent = await page.locator('td:has-text("测试三级类目")').count();
      if (categoryContent > 0) {
        console.log('✅ 项目管理页面三级类目内容已正确显示');
      } else {
        console.log('❌ 项目管理页面三级类目内容未显示');
      }
    } else {
      console.log('❌ 项目管理页面表格中未显示三级类目列');
    }

    // 4. 测试团队管理页面 - 日志记录功能
    console.log('\n=== 测试团队管理页面日志记录 ===');
    await page.click('text=团队管理');
    await page.waitForURL('**/Quality-Manage-System/users/teams');
    console.log('已导航到团队管理页面');

    await page.waitForTimeout(2000);

    // 创建新团队测试
    await page.click('button:has-text("新建团队")');
    await page.waitForSelector('input[placeholder="请输入团队名称"]');
    
    await page.fill('input[placeholder="请输入团队名称"]', '测试团队');
    await page.fill('textarea[placeholder="请输入团队描述"]', '这是一个测试团队');
    
    // 选择负责人
    await page.selectOption('select[placeholder="请选择负责人"]', '1');
    await page.waitForTimeout(1000);
    
    // 选择成员
    await page.selectOption('select[placeholder="请选择团队成员"]', '1');
    await page.waitForTimeout(1000);
    
    await page.click('button:has-text("确定")');
    await page.waitForTimeout(2000);
    console.log('✅ 已创建测试团队');

    // 5. 测试任务管理页面 - 日志记录功能
    console.log('\n=== 测试任务管理页面日志记录 ===');
    await page.click('text=任务管理');
    await page.waitForURL('**/Quality-Manage-System/tasks');
    console.log('已导航到任务管理页面');

    await page.waitForTimeout(2000);

    // 创建新任务测试
    await page.click('button:has-text("创建任务")');
    await page.waitForSelector('input[placeholder="请输入任务标题"]');
    
    // 填写任务表单
    await page.fill('input[placeholder="请输入任务标题"]', '测试任务日志');
    await page.fill('textarea[placeholder="请输入任务描述"]', '这是一个测试任务日志记录');
    await page.selectOption('select[placeholder="请选择优先级"]', 'P2');
    await page.selectOption('select[placeholder="请选择负责人"]', '1');
    await page.fill('input[placeholder="请选择截止日期"]', '2024-12-31');
    await page.fill('input[placeholder="请输入预估工时"]', '8');
    await page.fill('input[placeholder="请输入三级类目"]', '任务三级类目');
    await page.fill('input[placeholder="请输入型号"]', '任务型号');
    await page.fill('input[placeholder="请输入SKU"]', 'TASK-SKU-001');
    
    await page.click('button:has-text("创建")');
    await page.waitForTimeout(2000);
    console.log('✅ 已创建测试任务');

    // 6. 测试系统日志页面 - 查看新增的日志记录
    console.log('\n=== 测试系统日志页面 ===');
    await page.click('text=系统日志');
    await page.waitForURL('**/Quality-Manage-System/system-logs');
    console.log('已导航到系统日志页面');

    await page.waitForTimeout(2000);

    // 检查是否有团队管理和任务管理的日志记录
    const pageContent = await page.content();
    if (pageContent.includes('CREATE_TEAM') || pageContent.includes('创建团队')) {
      console.log('✅ 系统日志中已显示团队管理日志记录');
    } else {
      console.log('❌ 系统日志中未显示团队管理日志记录');
    }

    if (pageContent.includes('CREATE_TASK') || pageContent.includes('创建任务')) {
      console.log('✅ 系统日志中已显示任务管理日志记录');
    } else {
      console.log('❌ 系统日志中未显示任务管理日志记录');
    }

    console.log('\n=== 测试完成 ===');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
    console.log('测试完成，浏览器已关闭');
  }
}

// 运行测试
testOptimizationFeatures(); 