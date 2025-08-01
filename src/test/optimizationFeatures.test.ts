import { test, expect } from '@playwright/test';

test.describe('系统优化功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到应用首页
    await page.goto('http://localhost:3002');
    
    // 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    
    // 等待登录完成
    await page.waitForURL('**/dashboard');
  });

  test('全局搜索下拉框应该包含项目管理选项', async ({ page }) => {
    // 点击全局搜索类型选择器
    const searchTypeSelect = page.locator('.ant-select').first();
    await searchTypeSelect.click();
    
    // 验证是否包含项目管理选项
    const projectOption = page.locator('.ant-select-dropdown .ant-select-item-option:has-text("项目管理")');
    await expect(projectOption).toBeVisible();
  });

  test('用户管理页面应该显示编号且没有批量导入功能', async ({ page }) => {
    // 导航到用户管理页面
    await page.click('text=用户管理');
    await page.waitForURL('**/users/list');
    
    // 验证表格中是否显示编号列
    const numberColumn = page.locator('th:has-text("编号")');
    await expect(numberColumn).toBeVisible();
    
    // 验证第一行是否有编号
    const firstRowNumber = page.locator('tbody tr').first().locator('td').first();
    await expect(firstRowNumber).toContainText('1');
    
    // 验证没有批量导入按钮
    const importButton = page.locator('button:has-text("批量导入")');
    await expect(importButton).not.toBeVisible();
    
    // 验证没有勾选功能
    const checkbox = page.locator('tbody tr').first().locator('.ant-checkbox');
    await expect(checkbox).not.toBeVisible();
  });

  test('团队管理页面应该显示编号', async ({ page }) => {
    // 导航到团队管理页面
    await page.click('text=团队管理');
    await page.waitForURL('**/users/teams');
    
    // 验证表格中是否显示编号列
    const numberColumn = page.locator('th:has-text("编号")');
    await expect(numberColumn).toBeVisible();
    
    // 验证第一行是否有编号
    const firstRowNumber = page.locator('tbody tr').first().locator('td').first();
    await expect(firstRowNumber).toContainText('1');
  });

  test('任务管理页面应该显示编号且没有勾选功能', async ({ page }) => {
    // 导航到任务管理页面
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    
    // 验证表格中是否显示编号列
    const numberColumn = page.locator('th:has-text("编号")');
    await expect(numberColumn).toBeVisible();
    
    // 验证第一行是否有编号
    const firstRowNumber = page.locator('tbody tr').first().locator('td').first();
    await expect(firstRowNumber).toContainText('1');
    
    // 验证没有勾选功能
    const checkbox = page.locator('tbody tr').first().locator('.ant-checkbox');
    await expect(checkbox).not.toBeVisible();
  });

  test('任务管理页面筛选框应该有提示信息', async ({ page }) => {
    // 导航到任务管理页面
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    
    // 验证状态筛选框的提示信息
    const statusSelect = page.locator('select').nth(0);
    await expect(statusSelect).toHaveAttribute('placeholder', '请选择任务状态进行筛选');
    
    // 验证优先级筛选框的提示信息
    const prioritySelect = page.locator('select').nth(1);
    await expect(prioritySelect).toHaveAttribute('placeholder', '请选择任务优先级进行筛选');
    
    // 验证负责人筛选框的提示信息
    const assigneeSelect = page.locator('select').nth(2);
    await expect(assigneeSelect).toHaveAttribute('placeholder', '请选择任务负责人进行筛选');
  });

  test('Bug管理页面应该显示编号', async ({ page }) => {
    // 导航到Bug管理页面
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    
    // 验证表格中是否显示编号列
    const numberColumn = page.locator('th:has-text("编号")');
    await expect(numberColumn).toBeVisible();
    
    // 验证第一行是否有编号
    const firstRowNumber = page.locator('tbody tr').first().locator('td').first();
    await expect(firstRowNumber).toContainText('1');
  });

  test('Bug管理页面应该有责任归属筛选', async ({ page }) => {
    // 导航到Bug管理页面
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    
    // 验证责任归属筛选框存在
    const responsibilityFilter = page.locator('label:has-text("责任归属")');
    await expect(responsibilityFilter).toBeVisible();
    
    // 点击责任归属筛选框
    const responsibilitySelect = page.locator('label:has-text("责任归属")').locator('..').locator('.ant-select');
    await responsibilitySelect.click();
    
    // 验证筛选选项
    const responsibilityOptions = page.locator('.ant-select-dropdown .ant-select-item-option');
    await expect(responsibilityOptions.first()).toBeVisible();
  });

  test('所有页面的编号应该正确递增', async ({ page }) => {
    // 测试用户管理页面编号
    await page.click('text=用户管理');
    await page.waitForURL('**/users/list');
    
    const userFirstNumber = page.locator('tbody tr').nth(0).locator('td').first();
    const userSecondNumber = page.locator('tbody tr').nth(1).locator('td').first();
    await expect(userFirstNumber).toContainText('1');
    await expect(userSecondNumber).toContainText('2');
    
    // 测试团队管理页面编号
    await page.click('text=团队管理');
    await page.waitForURL('**/users/teams');
    
    const teamFirstNumber = page.locator('tbody tr').nth(0).locator('td').first();
    const teamSecondNumber = page.locator('tbody tr').nth(1).locator('td').first();
    await expect(teamFirstNumber).toContainText('1');
    await expect(teamSecondNumber).toContainText('2');
    
    // 测试任务管理页面编号
    await page.click('text=任务管理');
    await page.waitForURL('**/tasks');
    
    const taskFirstNumber = page.locator('tbody tr').nth(0).locator('td').first();
    const taskSecondNumber = page.locator('tbody tr').nth(1).locator('td').first();
    await expect(taskFirstNumber).toContainText('1');
    await expect(taskSecondNumber).toContainText('2');
    
    // 测试Bug管理页面编号
    await page.click('text=Bug管理');
    await page.waitForURL('**/bugs');
    
    const bugFirstNumber = page.locator('tbody tr').nth(0).locator('td').first();
    const bugSecondNumber = page.locator('tbody tr').nth(1).locator('td').first();
    await expect(bugFirstNumber).toContainText('1');
    await expect(bugSecondNumber).toContainText('2');
  });
}); 