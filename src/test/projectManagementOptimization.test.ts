import { test, expect } from '@playwright/test';

test.describe('项目管理模块优化功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到应用首页
    await page.goto('http://localhost:3001');
    
    // 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    
    // 等待登录完成并导航到项目管理页面
    await page.waitForURL('**/dashboard');
    await page.click('text=项目管理');
    await page.waitForURL('**/projects');
  });

  test('应该显示项目编号', async ({ page }) => {
    // 验证表格中是否显示编号列
    const numberColumn = page.locator('th:has-text("编号")');
    await expect(numberColumn).toBeVisible();
    
    // 验证第一行是否有编号
    const firstRowNumber = page.locator('tbody tr').first().locator('td').first();
    await expect(firstRowNumber).toContainText('1');
  });

  test('不应该显示团队成员列', async ({ page }) => {
    // 验证表格中不显示团队成员列
    const teamMembersColumn = page.locator('th:has-text("团队成员")');
    await expect(teamMembersColumn).not.toBeVisible();
  });

  test('表格不应该有水平滚动条', async ({ page }) => {
    // 获取表格容器
    const tableContainer = page.locator('.ant-table-wrapper');
    
    // 验证表格容器的样式 - 修复null检查
    const style = await tableContainer.getAttribute('style');
    if (style) {
      expect(style).not.toContain('overflow-x: auto');
      expect(style).not.toContain('overflow-x: scroll');
    }
    
    // 验证表格没有水平滚动
    const hasHorizontalScroll = await page.evaluate(() => {
      const table = document.querySelector('.ant-table-wrapper');
      return table ? table.scrollWidth > table.clientWidth : false;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('全局搜索应该支持项目管理', async ({ page }) => {
    // 点击全局搜索框
    const searchInput = page.locator('input[placeholder*="任务管理"]');
    await searchInput.click();
    
    // 输入搜索关键词
    await searchInput.fill('XH-001');
    
    // 按回车键进行搜索
    await searchInput.press('Enter');
    
    // 等待搜索结果弹窗
    await page.waitForSelector('.ant-modal-content', { timeout: 10000 });
    
    // 验证搜索结果中包含项目管理内容
    const searchResults = page.locator('.ant-list-item');
    await expect(searchResults.first()).toBeVisible();
  });

  test('应该能创建项目并记录系统日志', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 填写基本信息
    await page.fill('input[placeholder="请输入型号"]', 'TEST-OPT-001');
    await page.fill('input[placeholder="请输入SKU"]', 'SKU-TEST-OPT-001');
    
    // 选择等级 - 使用更精确的选择器
    await page.click('.ant-form-item:has-text("等级") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("L2")');
    
    // 选择内/外贸 - 使用更精确的选择器
    await page.click('.ant-form-item:has-text("内/外贸") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("内贸")');
    
    // 选择项目状态 - 使用更精确的选择器
    await page.click('.ant-form-item:has-text("项目状态") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("研发设计")');
    
    // 选择团队成员 - 使用更精确的选择器
    await page.click('.ant-form-item:has-text("团队成员") .ant-select');
    await page.click('.ant-select-dropdown .ant-select-item-option:has-text("admin")');
    
    // 点击创建按钮
    await page.click('button:has-text("创 建")');
    
    // 验证创建成功
    await expect(page.locator('.ant-message-success')).toContainText('项目创建成功');
    
    // 导航到系统日志页面验证日志记录
    await page.click('text=系统日志');
    await page.waitForURL('**/system-logs');
    
    // 验证日志中是否包含项目管理操作
    const projectLogs = page.locator('td:has-text("PROJECT_CREATE")');
    await expect(projectLogs.first()).toBeVisible();
  });

  test('应该能删除项目并记录系统日志', async ({ page }) => {
    // 点击第一个项目的删除按钮
    const deleteButton = page.locator('button:has-text("删除")').first();
    await deleteButton.click();
    
    // 确认删除 - 使用更精确的选择器
    await page.click('.ant-popconfirm .ant-btn-primary');
    
    // 验证删除成功
    await expect(page.locator('.ant-message-success')).toContainText('项目删除成功');
    
    // 导航到系统日志页面验证日志记录
    await page.click('text=系统日志');
    await page.waitForURL('**/system-logs');
    
    // 验证日志中是否包含项目管理删除操作
    const projectLogs = page.locator('td:has-text("PROJECT_DELETE")');
    await expect(projectLogs.first()).toBeVisible();
  });

  test('系统日志应该支持项目管理操作筛选', async ({ page }) => {
    // 导航到系统日志页面
    await page.click('text=系统日志');
    await page.waitForURL('**/system-logs');
    
    // 点击操作类型筛选
    const actionTypeSelect = page.locator('.ant-select').nth(1);
    await actionTypeSelect.click();
    
    // 选择项目管理
    await page.click('text=项目管理');
    
    // 验证筛选结果
    const filteredLogs = page.locator('tbody tr');
    await expect(filteredLogs.first()).toBeVisible();
  });

  test('表格布局应该合理，不会出现水平滚动', async ({ page }) => {
    // 获取表格的宽度
    const table = page.locator('.ant-table-wrapper');
    const tableWidth = await table.boundingBox();
    
    // 获取视口宽度
    const viewport = page.viewportSize();
    
    // 验证表格宽度不超过视口宽度
    expect(tableWidth?.width).toBeLessThanOrEqual(viewport?.width || 1200);
  });

  test('编号应该正确递增', async ({ page }) => {
    // 获取前几行的编号
    const firstRowNumber = page.locator('tbody tr').nth(0).locator('td').first();
    const secondRowNumber = page.locator('tbody tr').nth(1).locator('td').first();
    
    // 验证编号递增 - 修复文本解析
    const firstNumberText = await firstRowNumber.textContent();
    const secondNumberText = await secondRowNumber.textContent();
    
    // 提取数字 - 改进正则表达式
    const firstNumber = parseInt(firstNumberText?.match(/\d+/)?.[0] || '0');
    const secondNumber = parseInt(secondNumberText?.match(/\d+/)?.[0] || '0');
    
    // 如果解析失败，尝试其他方法
    if (firstNumber === 0) {
      // 尝试直接检查文本内容
      await expect(firstRowNumber).toContainText('1');
      await expect(secondRowNumber).toContainText('2');
    } else {
      expect(firstNumber).toBe(1);
      expect(secondNumber).toBe(2);
    }
  });
}); 