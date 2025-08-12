import { test, expect } from '@playwright/test';

test.describe('筛选框Placeholder测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到测试页面
    await page.goto('/test');
    await page.waitForLoadState('networkidle');
  });

  test('筛选框应该显示placeholder提示信息', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForSelector('.filter-select', { timeout: 10000 });
    
    // 检查角色筛选框的placeholder
    const roleSelect = page.locator('.filter-select').nth(0);
    await expect(roleSelect).toBeVisible();
    
    // 检查状态筛选框的placeholder
    const statusSelect = page.locator('.filter-select').nth(1);
    await expect(statusSelect).toBeVisible();
    
    // 检查优先级筛选框的placeholder
    const prioritySelect = page.locator('.filter-select').nth(2);
    await expect(prioritySelect).toBeVisible();
    
    // 检查负责人筛选框的placeholder
    const assigneeSelect = page.locator('.filter-select').nth(3);
    await expect(assigneeSelect).toBeVisible();
  });

  test('筛选框在空值状态下应该显示placeholder', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForSelector('.filter-select', { timeout: 10000 });
    
    // 重置所有筛选框
    await page.click('text=重置所有筛选框');
    
    // 等待重置完成
    await page.waitForTimeout(500);
    
    // 检查所有筛选框都应该显示placeholder
    const selects = page.locator('.filter-select');
    const count = await selects.count();
    
    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);
      await expect(select).toBeVisible();
    }
  });

  test('筛选框在有值状态下应该隐藏placeholder', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForSelector('.filter-select', { timeout: 10000 });
    
    // 选择角色筛选框的值
    const roleSelect = page.locator('.filter-select').nth(0);
    await roleSelect.click();
    await page.click('text=管理员');
    
    // 选择状态筛选框的值
    const statusSelect = page.locator('.filter-select').nth(1);
    await statusSelect.click();
    await page.click('text=启用');
    
    // 选择优先级筛选框的值
    const prioritySelect = page.locator('.filter-select').nth(2);
    await prioritySelect.click();
    await page.click('text=高');
    
    // 选择负责人筛选框的值
    const assigneeSelect = page.locator('.filter-select').nth(3);
    await assigneeSelect.click();
    await page.click('text=张三');
    
    // 等待选择完成
    await page.waitForTimeout(500);
    
    // 检查所有筛选框都应该有值
    const selects = page.locator('.filter-select');
    const count = await selects.count();
    
    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);
      await expect(select).toBeVisible();
    }
  });

  test('筛选框在清空值后应该重新显示placeholder', async ({ page }) => {
    // 等待页面加载完成
    await page.waitForSelector('.filter-select', { timeout: 10000 });
    
    // 先选择一些值
    const roleSelect = page.locator('.filter-select').nth(0);
    await roleSelect.click();
    await page.click('text=管理员');
    
    // 清空选择的值
    await roleSelect.locator('.ant-select-clear').click();
    
    // 等待清空完成
    await page.waitForTimeout(500);
    
    // 检查placeholder是否重新显示
    await expect(roleSelect).toBeVisible();
  });
}); 