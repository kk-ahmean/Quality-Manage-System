import { test, expect } from '@playwright/test';

test.describe('系统优化功能测试2', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到应用首页
    await page.goto('http://localhost:3001');
    
    // 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    
    // 等待登录完成
    await page.waitForURL('**/dashboard');
  });

  test('项目管理页面新增项目应该添加在最后', async ({ page }) => {
    // 导航到项目管理页面
    await page.click('text=项目管理');
    await page.waitForURL('**/projects');
    
    // 记录当前项目数量
    const initialProjectCount = await page.locator('tbody tr').count();
    
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 填写基本信息
    await page.fill('input[placeholder="请输入型号"]', 'TEST-NEW-001');
    await page.fill('input[placeholder="请输入SKU"]', 'SKU-TEST-NEW-001');
    
    // 选择等级
    await page.click('.ant-form-item:has-text("等级") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("L2")');
    
    // 选择内/外贸
    await page.click('.ant-form-item:has-text("内/外贸") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("内贸")');
    
    // 选择项目状态
    await page.click('.ant-form-item:has-text("项目状态") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("研发设计")');
    
    // 选择团队成员
    await page.click('.ant-form-item:has-text("团队成员") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("系统管理员")');
    
    // 点击创建按钮
    await page.click('button:has-text("创 建")');
    
    // 验证创建成功
    await expect(page.locator('.ant-message-success')).toContainText('项目创建成功');
    
    // 等待页面刷新
    await page.waitForTimeout(1000);
    
    // 验证新项目添加在最后
    const newProjectCount = await page.locator('tbody tr').count();
    expect(newProjectCount).toBeGreaterThan(initialProjectCount);
    
    // 验证最后一个项目是新创建的项目
    const lastProjectRow = page.locator('tbody tr').last();
    await expect(lastProjectRow).toContainText('TEST-NEW-001');
  });

  test('任务管理页面新增任务应该添加在最后', async ({ page }) => {
    // 导航到任务管理页面
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    
    // 记录当前任务数量
    const initialTaskCount = await page.locator('tbody tr').count();
    
    // 点击创建任务按钮
    await page.click('button:has-text("创建任务")');
    
    // 等待模态框打开
    await page.waitForSelector('text=创建任务');
    
    // 填写任务信息
    await page.fill('input[placeholder="请输入任务标题"]', 'TEST-NEW-TASK-001');
    await page.fill('textarea[placeholder="请输入任务描述"]', '这是一个测试任务');
    
    // 选择优先级
    await page.click('.ant-form-item:has-text("优先级") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("P2")');
    
    // 选择负责人
    await page.click('.ant-form-item:has-text("负责人") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("系统管理员")');
    
    // 点击创建按钮
    await page.click('button:has-text("创建")');
    
    // 验证创建成功
    await expect(page.locator('.ant-message-success')).toContainText('任务创建成功');
    
    // 等待页面刷新
    await page.waitForTimeout(1000);
    
    // 验证新任务添加在最后
    const newTaskCount = await page.locator('tbody tr').count();
    expect(newTaskCount).toBeGreaterThan(initialTaskCount);
    
    // 验证最后一个任务是新创建的任务
    const lastTaskRow = page.locator('tbody tr').last();
    await expect(lastTaskRow).toContainText('TEST-NEW-TASK-001');
  });

  test('Bug管理页面新增Bug应该添加在最后', async ({ page }) => {
    // 导航到Bug管理页面
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    
    // 记录当前Bug数量
    const initialBugCount = await page.locator('tbody tr').count();
    
    // 点击新建Bug按钮
    await page.click('button:has-text("新建Bug")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建Bug');
    
    // 填写Bug信息
    await page.fill('input[placeholder="请输入标题"]', 'TEST-NEW-BUG-001');
    await page.fill('textarea[placeholder="请输入描述"]', '这是一个测试Bug');
    await page.fill('textarea[placeholder="请输入复现步骤"]', '1. 打开页面\n2. 点击按钮');
    await page.fill('input[placeholder="请输入预期结果"]', '应该正常显示');
    await page.fill('input[placeholder="请输入实际结果"]', '显示异常');
    
    // 选择优先级
    await page.click('.ant-form-item:has-text("优先级") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("P2")');
    
    // 选择严重程度
    await page.click('.ant-form-item:has-text("严重程度") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("B")');
    
    // 选择类型
    await page.click('.ant-form-item:has-text("类型") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("功能缺陷")');
    
    // 选择责任归属
    await page.click('.ant-form-item:has-text("责任归属") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("软件")');
    
    // 点击确定按钮
    await page.click('button:has-text("确定")');
    
    // 验证创建成功
    await expect(page.locator('.ant-message-success')).toContainText('Bug创建成功');
    
    // 等待页面刷新
    await page.waitForTimeout(1000);
    
    // 验证新Bug添加在最后
    const newBugCount = await page.locator('tbody tr').count();
    expect(newBugCount).toBeGreaterThan(initialBugCount);
    
    // 验证最后一个Bug是新创建的Bug
    const lastBugRow = page.locator('tbody tr').last();
    await expect(lastBugRow).toContainText('TEST-NEW-BUG-001');
  });

  test('任务管理页面筛选框应该有详细的描述信息', async ({ page }) => {
    // 导航到任务管理页面
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    
    // 验证状态筛选框的描述信息
    const statusSelect = page.locator('.ant-select').nth(1);
    await expect(statusSelect.locator('.ant-select-selector')).toContainText('状态');
    
    // 验证优先级筛选框的描述信息
    const prioritySelect = page.locator('.ant-select').nth(2);
    await expect(prioritySelect.locator('.ant-select-selector')).toContainText('优先级');
    
    // 验证负责人筛选框的描述信息
    const assigneeSelect = page.locator('.ant-select').nth(3);
    await expect(assigneeSelect.locator('.ant-select-selector')).toContainText('负责人');
  });

  test('所有页面的编号应该正确递增且新项目在最后', async ({ page }) => {
    // 测试项目管理页面
    await page.click('text=项目管理');
    await page.waitForURL('**/projects');
    
    const projectRows = page.locator('tbody tr');
    const projectCount = await projectRows.count();
    
    if (projectCount >= 2) {
      const firstProjectNumber = projectRows.nth(0).locator('td').first();
      const lastProjectNumber = projectRows.last().locator('td').first();
      await expect(firstProjectNumber).toContainText('1');
      await expect(lastProjectNumber).toContainText(projectCount.toString());
    }
    
    // 测试任务管理页面
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    
    const taskRows = page.locator('tbody tr');
    const taskCount = await taskRows.count();
    
    if (taskCount >= 2) {
      const firstTaskNumber = taskRows.nth(0).locator('td').first();
      const lastTaskNumber = taskRows.last().locator('td').first();
      await expect(firstTaskNumber).toContainText('1');
      await expect(lastTaskNumber).toContainText(taskCount.toString());
    }
    
    // 测试Bug管理页面
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    
    const bugRows = page.locator('tbody tr');
    const bugCount = await bugRows.count();
    
    if (bugCount >= 2) {
      const firstBugNumber = bugRows.nth(0).locator('td').first();
      const lastBugNumber = bugRows.last().locator('td').first();
      await expect(firstBugNumber).toContainText('1');
      await expect(lastBugNumber).toContainText(bugCount.toString());
    }
  });
}); 