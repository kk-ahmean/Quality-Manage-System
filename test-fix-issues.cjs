const { chromium } = require('playwright');

async function testFixIssues() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('开始测试修复的问题...');

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

    // 3. 测试用户管理页面 - 编号显示
    console.log('\n=== 测试用户管理页面编号显示 ===');
    await page.click('text=用户管理');
    await page.waitForURL('**/Quality-Manage-System/users');
    console.log('已导航到用户管理页面');

    await page.waitForTimeout(2000);

    // 检查表格中是否有编号列，并且有内容显示
    const userNumberColumn = await page.locator('th:has-text("编号")').count();
    if (userNumberColumn > 0) {
      console.log('✅ 用户管理页面表格中已显示编号列');
      
      // 检查是否有编号内容显示
      const userNumberContent = await page.locator('td span[style*="color: #666"]').count();
      if (userNumberContent > 0) {
        console.log('✅ 用户管理页面编号内容已正确显示');
      } else {
        console.log('❌ 用户管理页面编号内容未显示');
      }
    } else {
      console.log('❌ 用户管理页面表格中未显示编号列');
    }

    // 4. 测试项目管理页面 - 字段显示
    console.log('\n=== 测试项目管理页面字段显示 ===');
    await page.click('text=项目管理');
    await page.waitForURL('**/Quality-Manage-System/projects');
    console.log('已导航到项目管理页面');

    await page.waitForTimeout(2000);

    // 检查表格中的字段
    const projectNumberColumn = await page.locator('th:has-text("编号")').count();
    if (projectNumberColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示编号列');
    } else {
      console.log('❌ 项目管理页面表格中未显示编号列');
    }

    const modelColumn = await page.locator('th:has-text("型号")').count();
    if (modelColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示型号列');
    } else {
      console.log('❌ 项目管理页面表格中未显示型号列');
    }

    const skuColumn = await page.locator('th:has-text("SKU")').count();
    if (skuColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示SKU列');
    } else {
      console.log('❌ 项目管理页面表格中未显示SKU列');
    }

    const supplierColumn = await page.locator('th:has-text("供应商")').count();
    if (supplierColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示供应商列');
    } else {
      console.log('❌ 项目管理页面表格中未显示供应商列');
    }

    const productImagesColumn = await page.locator('th:has-text("产品图片")').count();
    if (productImagesColumn > 0) {
      console.log('✅ 项目管理页面表格中已显示产品图片列');
    } else {
      console.log('❌ 项目管理页面表格中未显示产品图片列');
    }

    // 5. 测试项目查看详情功能
    console.log('\n=== 测试项目查看详情功能 ===');
    
    // 点击第一个项目的查看按钮
    const viewButtons = await page.locator('button:has-text("查看")').count();
    if (viewButtons > 0) {
      await page.click('button:has-text("查看")');
      await page.waitForTimeout(2000);
      console.log('✅ 已点击查看按钮');

      // 检查详情抽屉是否打开
      const drawer = await page.locator('.ant-drawer-content-wrapper').count();
      if (drawer > 0) {
        console.log('✅ 项目详情抽屉已打开');

        // 检查详情中的字段
        const supplierDetail = await page.locator('text=供应商').count();
        if (supplierDetail > 0) {
          console.log('✅ 项目详情中已显示供应商字段');
        } else {
          console.log('❌ 项目详情中未显示供应商字段');
        }

        const interfaceFeaturesDetail = await page.locator('text=接口特性').count();
        if (interfaceFeaturesDetail > 0) {
          console.log('✅ 项目详情中已显示接口特性字段');
        } else {
          console.log('❌ 项目详情中未显示接口特性字段');
        }

        const hardwareSolutionDetail = await page.locator('text=硬件方案').count();
        if (hardwareSolutionDetail > 0) {
          console.log('✅ 项目详情中已显示硬件方案字段');
        } else {
          console.log('❌ 项目详情中未显示硬件方案字段');
        }

        const versionInfoDetail = await page.locator('text=版本信息').count();
        if (versionInfoDetail > 0) {
          console.log('✅ 项目详情中已显示版本信息字段');
        } else {
          console.log('❌ 项目详情中未显示版本信息字段');
        }

        const productImagesDetail = await page.locator('text=产品图片').count();
        if (productImagesDetail > 0) {
          console.log('✅ 项目详情中已显示产品图片字段');
        } else {
          console.log('❌ 项目详情中未显示产品图片字段');
        }

        const stagesDetail = await page.locator('text=样机阶段').count();
        if (stagesDetail > 0) {
          console.log('✅ 项目详情中已显示样机阶段字段');
        } else {
          console.log('❌ 项目详情中未显示样机阶段字段');
        }

        const remarksDetail = await page.locator('text=备注').count();
        if (remarksDetail > 0) {
          console.log('✅ 项目详情中已显示备注字段');
        } else {
          console.log('❌ 项目详情中未显示备注字段');
        }

        // 关闭详情抽屉
        await page.click('.ant-drawer-close');
        await page.waitForTimeout(1000);
      } else {
        console.log('❌ 项目详情抽屉未打开');
      }
    } else {
      console.log('❌ 未找到查看按钮');
    }

    // 6. 测试项目编辑功能
    console.log('\n=== 测试项目编辑功能 ===');
    
    // 点击第一个项目的编辑按钮
    const editButtons = await page.locator('button:has-text("编辑")').count();
    if (editButtons > 0) {
      await page.click('button:has-text("编辑")');
      await page.waitForTimeout(2000);
      console.log('✅ 已点击编辑按钮');

      // 检查编辑模态框是否打开
      const modal = await page.locator('.ant-modal-content').count();
      if (modal > 0) {
        console.log('✅ 项目编辑模态框已打开');

        // 检查编辑表单中的字段
        const modelField = await page.locator('input[placeholder="请输入型号"]').count();
        if (modelField > 0) {
          console.log('✅ 编辑表单中已显示型号字段');
        } else {
          console.log('❌ 编辑表单中未显示型号字段');
        }

        const skuField = await page.locator('input[placeholder="请输入SKU"]').count();
        if (skuField > 0) {
          console.log('✅ 编辑表单中已显示SKU字段');
        } else {
          console.log('❌ 编辑表单中未显示SKU字段');
        }

        const supplierField = await page.locator('input[placeholder="请输入供应商"]').count();
        if (supplierField > 0) {
          console.log('✅ 编辑表单中已显示供应商字段');
        } else {
          console.log('❌ 编辑表单中未显示供应商字段');
        }

        const interfaceFeaturesField = await page.locator('textarea[placeholder="请输入接口特性"]').count();
        if (interfaceFeaturesField > 0) {
          console.log('✅ 编辑表单中已显示接口特性字段');
        } else {
          console.log('❌ 编辑表单中未显示接口特性字段');
        }

        const hardwareSolutionField = await page.locator('textarea[placeholder="请输入硬件方案"]').count();
        if (hardwareSolutionField > 0) {
          console.log('✅ 编辑表单中已显示硬件方案字段');
        } else {
          console.log('❌ 编辑表单中未显示硬件方案字段');
        }

        const remarksField = await page.locator('textarea[placeholder="请输入备注"]').count();
        if (remarksField > 0) {
          console.log('✅ 编辑表单中已显示备注字段');
        } else {
          console.log('❌ 编辑表单中未显示备注字段');
        }

        // 关闭编辑模态框
        await page.click('button:has-text("取消")');
        await page.waitForTimeout(1000);
      } else {
        console.log('❌ 项目编辑模态框未打开');
      }
    } else {
      console.log('❌ 未找到编辑按钮');
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
testFixIssues(); 