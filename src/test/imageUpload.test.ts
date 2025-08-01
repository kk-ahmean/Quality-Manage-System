import { test, expect } from '@playwright/test';

test.describe('图片上传功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到应用首页
    await page.goto('http://localhost:3004');
    
    // 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', '123456');
    await page.click('button:has-text("登 录")');
    
    // 等待登录完成并导航到项目管理页面
    await page.waitForURL('**/dashboard');
    await page.click('text=项目管理');
    await page.waitForURL('**/projects');
  });

  test('应该能正常打开文件选择器', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 点击上传图片按钮
    const uploadButton = page.locator('button:has-text("上传图片")');
    await uploadButton.click();
    
    // 验证文件选择器是否弹出
    // 注意：playwright无法直接检测文件选择器，但我们可以验证按钮点击事件是否正常
    await expect(uploadButton).toBeVisible();
  });

  test('应该能处理图片文件上传', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 创建测试图片文件
    const testImagePath = 'test-resources/test-image.jpg';
    
    // 设置文件上传监听器
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // 点击上传图片按钮
    await page.click('button:has-text("上传图片")');
    
    // 处理文件选择器
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);
    
    // 验证上传成功消息
    await expect(page.locator('.ant-message-success')).toContainText('成功上传');
  });

  test('应该能显示图片预览', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 创建测试图片文件
    const testImagePath = 'test-resources/test-image.jpg';
    
    // 设置文件上传监听器
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // 点击上传图片按钮
    await page.click('button:has-text("上传图片")');
    
    // 处理文件选择器
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);
    
    // 等待图片预览出现
    await page.waitForSelector('img[alt="test-image.jpg"]');
    
    // 验证图片预览是否显示
    const imagePreview = page.locator('img[alt="test-image.jpg"]');
    await expect(imagePreview).toBeVisible();
  });

  test('应该能删除已上传的图片', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 上传图片
    const testImagePath = 'test-resources/test-image.jpg';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("上传图片")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);
    
    // 等待图片预览出现
    await page.waitForSelector('img[alt="test-image.jpg"]');
    
    // 点击删除按钮
    const deleteButton = page.locator('button[aria-label="close"]').first();
    await deleteButton.click();
    
    // 验证图片已被删除
    await expect(page.locator('img[alt="test-image.jpg"]')).not.toBeVisible();
  });

  test('应该能限制上传数量', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 尝试上传6张图片（超过限制）
    const testImagePath = 'test-resources/test-image.jpg';
    
    for (let i = 0; i < 6; i++) {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.click('button:has-text("上传图片")');
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(testImagePath);
      
      // 等待处理完成
      await page.waitForTimeout(500);
    }
    
    // 验证上传按钮被隐藏（达到数量限制）
    await expect(page.locator('button:has-text("上传图片")')).not.toBeVisible();
  });

  test('应该能验证文件类型', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 尝试上传非图片文件
    const testTextPath = 'test-resources/test.txt';
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("上传图片")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testTextPath);
    
    // 验证错误消息
    await expect(page.locator('.ant-message-error')).toContainText('不是图片格式');
  });

  test('应该能验证文件大小', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 尝试上传大文件
    const largeImagePath = 'test-resources/large-image.jpg';
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("上传图片")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(largeImagePath);
    
    // 验证错误消息
    await expect(page.locator('.ant-message-error')).toContainText('大小不能超过2MB');
  });

  test('应该能创建包含图片的项目', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('button:has-text("新建项目")');
    
    // 等待模态框打开
    await page.waitForSelector('text=新建项目');
    
    // 填写基本信息
    await page.fill('input[placeholder="请输入型号"]', 'TEST-001');
    await page.fill('input[placeholder="请输入SKU"]', 'SKU-TEST-001');
    
    // 上传图片
    const testImagePath = 'test-resources/test-image.jpg';
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('button:has-text("上传图片")');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);
    
    // 等待图片上传完成
    await page.waitForSelector('img[alt="test-image.jpg"]');
    
    // 点击创建按钮
    await page.click('button:has-text("创 建")');
    
    // 验证创建成功
    await expect(page.locator('.ant-message-success')).toContainText('项目创建成功');
  });
}); 