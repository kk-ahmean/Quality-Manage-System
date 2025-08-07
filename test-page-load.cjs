const { chromium } = require('playwright');

async function testPageLoad() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试页面加载...');

    // 1. 访问登录页面
    await page.goto('http://localhost:3000/login');
    console.log('已访问登录页面');

    // 等待页面加载
    await page.waitForTimeout(5000);

    // 获取页面标题
    const title = await page.title();
    console.log('页面标题:', title);

    // 获取页面内容
    const content = await page.content();
    console.log('页面内容长度:', content.length);

    // 检查是否有登录相关的元素
    const hasLoginForm = await page.locator('form').count();
    console.log('表单数量:', hasLoginForm);

    // 检查所有输入框
    const inputs = await page.locator('input').all();
    console.log('输入框数量:', inputs.length);

    // 打印所有输入框的placeholder
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`输入框 ${i + 1} placeholder:`, placeholder);
    }

    // 检查所有按钮
    const buttons = await page.locator('button').all();
    console.log('按钮数量:', buttons.length);

    // 打印所有按钮的文本
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`按钮 ${i + 1} 文本:`, text?.trim());
    }

    // 截图保存
    await page.screenshot({ path: 'page-load-test.png' });
    console.log('已保存截图: page-load-test.png');

  } catch (error) {
    console.error('测试过程中出现错误:', error);
  } finally {
    await browser.close();
    console.log('测试完成，浏览器已关闭');
  }
}

// 运行测试
testPageLoad(); 