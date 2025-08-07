const { chromium } = require('playwright');

async function testNewFeatures() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试新功能...');

    // 1. 访问登录页面
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    console.log('已访问登录页面');

    // 2. 登录
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
    await page.waitForURL('**/dashboard');
    console.log('登录成功，已跳转到仪表板');

    // 3. 测试项目管理页面 - 三级类目字段
    console.log('\n=== 测试项目管理页面 ===');
    await page.click('text=项目管理');
    await page.waitForURL('**/projects');
    console.log('已导航到项目管理页面');

    // 等待页面加载
    await page.waitForTimeout(2000);

    // 检查表格中是否有三级类目列
    const categoryColumn = await page.locator('th:has-text("三级类目")').count();
    if (categoryColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示三级类目列');
    } else {
      console.log('❌ 项目管理页面表格中未显示三级类目列');
    }

    // 创建新项目测试
    await page.click('button:has-text("新建项目")');
    await page.waitForSelector('input[placeholder="请输入型号"]', { timeout: 10000 });
    
    // 等待表单完全加载
    await page.waitForTimeout(2000);
    
    // 填写项目表单
    await page.fill('input[placeholder="请输入型号"]', '测试型号');
    await page.fill('input[placeholder="请输入SKU"]', 'TEST-SKU-001');
    await page.fill('input[placeholder="请输入三级类目"]', '测试三级类目');
    
    // 使用更精确的选择器
    await page.selectOption('select[placeholder="请选择等级"]', 'L1');
    await page.waitForTimeout(1000);
    await page.selectOption('select[placeholder="请选择内/外贸"]', '内贸');
    await page.waitForTimeout(1000);
    await page.selectOption('select[placeholder="请选择项目状态"]', '研发设计');
    await page.waitForTimeout(1000);
    
    await page.fill('input[placeholder="请输入供应商"]', '测试供应商');
    await page.fill('textarea[placeholder="请输入接口特性"]', '测试接口特性');
    await page.fill('textarea[placeholder="请输入硬件方案"]', '测试硬件方案');
    await page.fill('textarea[placeholder="请输入备注"]', '测试备注');
    
    await page.click('button:has-text("创建")');
    await page.waitForTimeout(3000);
    console.log('✅ 已创建测试项目');

    // 4. 测试任务管理页面 - 新字段
    console.log('\n=== 测试任务管理页面 ===');
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    console.log('已导航到任务管理页面');

    await page.waitForTimeout(2000);

    // 创建新任务测试
    await page.click('button:has-text("创建任务")');
    await page.waitForSelector('input[placeholder="请输入任务标题"]');
    
    // 填写任务表单
    await page.fill('input[placeholder="请输入任务标题"]', '测试任务');
    await page.fill('textarea[placeholder="请输入任务描述"]', '这是一个测试任务');
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

    // 查看任务详情
    const detailButtons = await page.locator('button:has-text("详情")').all();
    if (detailButtons.length > 0) {
      await detailButtons[0].click();
      await page.waitForSelector('.ant-modal-content');
      
      // 检查详情页面是否显示新字段
      const detailText = await page.locator('.ant-modal-content').textContent();
      if (detailText.includes('三级类目') && detailText.includes('型号') && detailText.includes('SKU')) {
        console.log('✅ 任务详情页面已显示新字段');
      } else {
        console.log('❌ 任务详情页面未显示新字段');
      }
      
      await page.click('.ant-modal-close');
    }

    // 5. 测试Bug管理页面 - 新字段
    console.log('\n=== 测试Bug管理页面 ===');
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    console.log('已导航到Bug管理页面');

    await page.waitForTimeout(2000);

    // 创建新Bug测试
    await page.click('button:has-text("新建Bug")');
    await page.waitForSelector('input[placeholder="请输入标题"]');
    
    // 填写Bug表单
    await page.fill('input[placeholder="请输入标题"]', '测试Bug');
    await page.fill('textarea[placeholder="请输入描述"]', '这是一个测试Bug');
    await page.fill('textarea[placeholder="请输入复现步骤"]', '1. 打开应用\n2. 点击按钮\n3. 观察结果');
    await page.fill('input[placeholder="请输入预期结果"]', '应该正常显示');
    await page.fill('input[placeholder="请输入实际结果"]', '出现错误');
    await page.selectOption('select[placeholder="请选择优先级"]', 'P2');
    await page.selectOption('select[placeholder="请选择严重程度"]', 'B');
    await page.selectOption('select[placeholder="请选择类型"]', '功能缺陷');
    await page.selectOption('select[placeholder="请选择责任归属"]', '软件');
    await page.fill('input[placeholder="请输入三级类目"]', 'Bug三级类目');
    await page.fill('input[placeholder="请输入型号"]', 'Bug型号');
    await page.fill('input[placeholder="请输入SKU"]', 'BUG-SKU-001');
    await page.fill('input[placeholder="请输入硬件版本"]', 'v1.0');
    await page.fill('input[placeholder="请输入软件版本"]', 'v2.0');
    
    await page.click('button:has-text("确定")');
    await page.waitForTimeout(2000);
    console.log('✅ 已创建测试Bug');

    // 查看Bug详情
    const bugLinks = await page.locator('a:has-text("测试Bug")').all();
    if (bugLinks.length > 0) {
      await bugLinks[0].click();
      await page.waitForSelector('.ant-modal-content');
      
      // 检查详情页面是否显示新字段
      const detailText = await page.locator('.ant-modal-content').textContent();
      if (detailText.includes('三级类目') && detailText.includes('型号') && detailText.includes('SKU') && 
          detailText.includes('硬件版本') && detailText.includes('软件版本')) {
        console.log('✅ Bug详情页面已显示新字段');
      } else {
        console.log('❌ Bug详情页面未显示新字段');
      }
      
      await page.click('.ant-modal-close');
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
testNewFeatures(); 