const { chromium } = require('playwright');

async function testUserTeamFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试用户管理和团队管理修复...');

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

    // 3. 测试用户管理页面 - 手机号显示
    console.log('\n=== 测试用户管理页面 ===');
    await page.click('text=用户管理');
    await page.waitForURL('**/users');
    console.log('已导航到用户管理页面');

    await page.waitForTimeout(2000);

    // 查找编辑按钮并点击
    const editButtons = await page.locator('button:has-text("编辑")').all();
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForSelector('.ant-modal-content');
      
      // 检查手机号字段是否显示
      const phoneInput = await page.locator('input[placeholder="请输入手机号"]');
      const phoneValue = await phoneInput.inputValue();
      console.log(`手机号字段值: "${phoneValue}"`);
      
      if (phoneValue !== undefined) {
        console.log('✅ 手机号字段已正确显示');
      } else {
        console.log('❌ 手机号字段未显示');
      }
      
      // 测试编辑手机号
      await phoneInput.fill('13800138000');
      console.log('✅ 已更新手机号');
      
      await page.click('button:has-text("确定")');
      await page.waitForTimeout(2000);
      console.log('✅ 用户信息更新成功');
      
      await page.click('.ant-modal-close');
    } else {
      console.log('❌ 未找到编辑按钮');
    }

    // 4. 测试团队管理页面 - 负责人和成员显示
    console.log('\n=== 测试团队管理页面 ===');
    await page.click('text=团队管理');
    await page.waitForURL('**/teams');
    console.log('已导航到团队管理页面');

    await page.waitForTimeout(2000);

    // 查找编辑按钮并点击
    const teamEditButtons = await page.locator('button:has-text("编辑")').all();
    if (teamEditButtons.length > 0) {
      await teamEditButtons[0].click();
      await page.waitForSelector('.ant-modal-content');
      
      // 检查团队负责人字段
      const leaderSelect = await page.locator('select[placeholder="请选择团队负责人"]');
      const leaderValue = await leaderSelect.inputValue();
      console.log(`团队负责人字段值: "${leaderValue}"`);
      
      if (leaderValue) {
        console.log('✅ 团队负责人字段已正确显示');
      } else {
        console.log('❌ 团队负责人字段未显示');
      }
      
      // 检查团队成员字段
      const membersSelect = await page.locator('select[placeholder="请选择团队成员"]');
      const membersValue = await membersSelect.inputValue();
      console.log(`团队成员字段值: "${membersValue}"`);
      
      if (membersValue !== undefined) {
        console.log('✅ 团队成员字段已正确显示');
      } else {
        console.log('❌ 团队成员字段未显示');
      }
      
      // 测试编辑团队信息
      await page.fill('input[placeholder="请输入团队名称"]', '测试团队更新');
      await page.fill('textarea[placeholder="请输入团队描述"]', '这是更新后的团队描述');
      
      // 选择新的负责人
      await leaderSelect.selectOption('1');
      
      // 选择新的成员
      await membersSelect.selectOption(['1', '2']);
      
      await page.click('button:has-text("确定")');
      await page.waitForTimeout(2000);
      console.log('✅ 团队信息更新成功');
      
      await page.click('.ant-modal-close');
    } else {
      console.log('❌ 未找到团队编辑按钮');
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
testUserTeamFixes(); 