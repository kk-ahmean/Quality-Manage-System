const { chromium } = require('playwright');

async function testProjectCreation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试项目创建功能...');

    // 1. 访问登录页面
    await page.goto('http://localhost:3000/Quality-Manage-System/login');
    console.log('已访问登录页面');

    // 2. 登录
    await page.waitForTimeout(3000);
    await page.waitForSelector('input[placeholder="请输入用户名"]', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="请输入密码"]', { timeout: 10000 });
    
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    
    await page.waitForSelector('button:has-text("登录")', { state: 'visible' });
    await page.waitForTimeout(2000);
    
    await page.waitForFunction(() => {
      const button = document.querySelector('button.login-button');
      return button && !button.classList.contains('ant-btn-loading');
    }, { timeout: 10000 });
    
    await page.click('button:has-text("登录")');
    console.log('已执行登录操作');

    await page.waitForTimeout(3000);
    console.log('登录成功，等待页面加载完成');

    // 3. 导航到项目管理页面
    console.log('\n=== 测试项目管理页面 ===');
    await page.click('text=项目管理');
    await page.waitForURL('**/Quality-Manage-System/projects');
    console.log('已导航到项目管理页面');

    await page.waitForTimeout(2000);

    // 4. 测试新建项目功能
    console.log('\n=== 测试新建项目功能 ===');
    await page.click('button:has-text("新建项目")');
    await page.waitForTimeout(2000);
    console.log('✅ 已点击新建项目按钮');

    // 检查新建项目模态框是否打开
    const modal = await page.locator('.ant-modal-content').count();
    if (modal > 0) {
      console.log('✅ 新建项目模态框已打开');

      // 填写项目基本信息
      await page.fill('input[placeholder="请输入型号"]', '测试型号001');
      await page.fill('input[placeholder="请输入SKU"]', 'TEST-SKU-001');
      await page.fill('input[placeholder="请输入三级类目"]', '测试三级类目');
      
      // 选择等级
      await page.selectOption('select[placeholder="请选择等级"]', 'L2');
      await page.waitForTimeout(500);
      
      // 选择内/外贸
      await page.selectOption('select[placeholder="请选择内/外贸"]', '内贸');
      await page.waitForTimeout(500);
      
      // 填写供应商
      await page.fill('input[placeholder="请输入供应商"]', '测试供应商');
      
      // 选择项目状态
      await page.selectOption('select[placeholder="请选择项目状态"]', '研发设计');
      await page.waitForTimeout(500);

      // 填写接口特性
      await page.fill('textarea[placeholder="请输入接口特性"]', '测试接口特性');
      
      // 填写硬件方案
      await page.fill('textarea[placeholder="请输入硬件方案"]', '测试硬件方案');

      // 5. 测试团队成员选择 - 检查角色显示
      console.log('\n=== 测试团队成员角色显示 ===');
      
      // 点击团队成员选择框
      await page.click('input[placeholder="请选择团队成员"]');
      await page.waitForTimeout(1000);
      
      // 检查下拉选项中的角色显示
      const dropdownOptions = await page.locator('.ant-select-dropdown .ant-select-item-option').count();
      if (dropdownOptions > 0) {
        console.log(`✅ 团队成员下拉框中有 ${dropdownOptions} 个选项`);
        
        // 获取第一个选项的文本
        const firstOptionText = await page.locator('.ant-select-dropdown .ant-select-item-option').first().textContent();
        console.log('第一个选项文本:', firstOptionText);
        
        // 检查是否包含中文角色名称
        if (firstOptionText && (firstOptionText.includes('管理员') || firstOptionText.includes('工程师'))) {
          console.log('✅ 团队成员角色显示为中文');
        } else {
          console.log('❌ 团队成员角色显示为英文');
        }
      } else {
        console.log('❌ 团队成员下拉框中没有选项');
      }

      // 选择第一个团队成员
      await page.click('.ant-select-dropdown .ant-select-item-option');
      await page.waitForTimeout(500);

      // 6. 测试版本信息添加
      console.log('\n=== 测试版本信息添加 ===');
      await page.click('button:has-text("添加版本信息")');
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder="请输入硬件版本"]', 'V1.0');
      await page.fill('input[placeholder="请输入软件版本"]', 'V1.0');
      await page.fill('input[placeholder="请输入版本描述"]', '测试版本');

      // 7. 测试样机阶段添加
      console.log('\n=== 测试样机阶段添加 ===');
      await page.click('button:has-text("添加阶段")');
      await page.waitForTimeout(500);
      
      await page.selectOption('select[placeholder="请选择阶段"]', 'EVT');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="数量"]', '10');
      await page.fill('input[placeholder="请输入送样原因"]', '测试送样');
      await page.selectOption('select[placeholder="测试结果"]', 'PASS');
      await page.waitForTimeout(500);
      await page.fill('input[placeholder="请输入承认书版本"]', 'V1.0');

      // 8. 填写备注
      await page.fill('textarea[placeholder="请输入备注"]', '这是一个测试项目');

      // 9. 提交表单
      console.log('\n=== 测试表单提交 ===');
      await page.click('button:has-text("创建")');
      await page.waitForTimeout(3000);

      // 检查是否有错误信息
      const errorMessage = await page.locator('.ant-message-error').count();
      if (errorMessage > 0) {
        const errorText = await page.locator('.ant-message-error').textContent();
        console.log('❌ 创建项目失败:', errorText);
      } else {
        console.log('✅ 项目创建成功');
      }

      // 关闭模态框
      await page.click('button:has-text("取消")');
      await page.waitForTimeout(1000);

    } else {
      console.log('❌ 新建项目模态框未打开');
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
testProjectCreation(); 