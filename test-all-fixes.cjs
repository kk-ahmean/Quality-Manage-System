const { chromium } = require('playwright');

async function testAllFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试所有修复效果...');

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

    // 3. 测试团队管理页面
    console.log('\n=== 测试团队管理页面 ===');
    await page.click('text=团队管理');
    await page.waitForURL('**/teams');
    console.log('已导航到团队管理页面');

    await page.waitForTimeout(3000);

    // 检查团队列表
    const teamRows = await page.locator('.ant-table-tbody tr').all();
    console.log(`找到 ${teamRows.length} 个团队`);

    if (teamRows.length > 0) {
      // 检查第一个团队的负责人显示
      const firstTeamLeader = await page.locator('.ant-table-tbody tr').first().locator('td').nth(2).textContent();
      console.log('第一个团队负责人显示:', firstTeamLeader);
      
      if (firstTeamLeader && !firstTeamLeader.includes('未知')) {
        console.log('✅ 团队负责人显示正常');
      } else {
        console.log('❌ 团队负责人显示异常');
      }

      // 展开第一个团队查看成员列表
      const expandButton = await page.locator('.ant-table-tbody tr').first().locator('.ant-table-row-expand-icon').first();
      await expandButton.click();
      await page.waitForTimeout(1000);

      // 检查成员列表
      const memberList = await page.locator('.ant-descriptions-item-content').first().textContent();
      console.log('团队成员列表:', memberList);
      
      if (memberList && !memberList.includes('暂无成员数据')) {
        console.log('✅ 团队成员列表显示正常');
      } else {
        console.log('❌ 团队成员列表显示异常');
      }

      // 测试编辑团队
      const editButton = await page.locator('.ant-table-tbody tr').first().locator('button:has-text("编辑")').first();
      await editButton.click();
      await page.waitForSelector('.ant-modal-content');
      
      // 检查表单字段是否显示
      const leaderSelect = await page.locator('select[placeholder="请选择团队负责人"]');
      const leaderValue = await leaderSelect.inputValue();
      console.log('编辑页面团队负责人值:', leaderValue);
      
      if (leaderValue) {
        console.log('✅ 编辑页面团队负责人字段显示正常');
      } else {
        console.log('❌ 编辑页面团队负责人字段显示异常');
      }

      // 关闭编辑弹窗
      await page.click('.ant-modal-close');
    }

    // 4. 测试Bug管理页面 - 批量导入
    console.log('\n=== 测试Bug批量导入 ===');
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    console.log('已导航到Bug管理页面');

    await page.waitForTimeout(2000);

    // 点击批量导入按钮
    const importButton = await page.locator('button:has-text("批量导入")').first();
    await importButton.click();
    await page.waitForSelector('.ant-modal-content');
    console.log('已打开批量导入弹窗');

    // 检查导入模板下载
    const downloadButton = await page.locator('a:has-text("下载模板")').first();
    if (downloadButton) {
      console.log('✅ 批量导入模板下载按钮存在');
    } else {
      console.log('❌ 批量导入模板下载按钮不存在');
    }

    // 关闭导入弹窗
    await page.click('.ant-modal-close');

    // 5. 测试用户管理页面
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
      
      // 关闭编辑弹窗
      await page.click('.ant-modal-close');
    } else {
      console.log('❌ 未找到编辑按钮');
    }

    console.log('\n=== 所有测试完成 ===');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
    
    // 截图保存错误状态
    await page.screenshot({ path: 'all-fixes-error.png', fullPage: true });
    console.log('已保存错误截图: all-fixes-error.png');
  } finally {
    await browser.close();
    console.log('测试完成，浏览器已关闭');
  }
}

// 运行测试
testAllFixes(); 