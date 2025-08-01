import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN.js';
import ProjectManagementPage from '../ProjectManagementPage';
import { useProjectStore } from '../../stores/projectStore';
import { useAuthStore } from '../../stores/authStore';
import { useUserStore } from '../../stores/userStore';
import { test, expect } from '@playwright/test';

// Mock stores
vi.mock('../../stores/projectStore');
vi.mock('../../stores/authStore');
vi.mock('../../stores/userStore');

const mockUseProjectStore = useProjectStore as any;
const mockUseAuthStore = useAuthStore as any;
const mockUseUserStore = useUserStore as any;

// Mock data
const mockProjects = [
  {
    id: '1',
    model: 'XH-001',
    sku: 'SKU001',
    interfaceFeatures: 'USB-C, HDMI, WiFi 6',
    productImages: [],
    level: 'L1' as const,
    trade: '内外贸' as const,
    supplier: '供应商A',
    stages: [
      { stage: 'EVT' as const, sampleQuantity: 10, sampleReason: '功能验证' },
      { stage: 'DVT' as const, sampleQuantity: 20, sampleReason: '设计验证' }
    ],
    approvalVersion: 'v1.0',
    hardwareSolution: 'ARM架构，4核处理器',
    hardwareVersion: 'HW-1.0',
    softwareVersion: 'SW-1.0',
    projectReport: undefined,
    developmentRequirements: undefined,
    approvalDocument: undefined,
    electricalTestReport: undefined,
    reliabilityTestReport: undefined,
    environmentalTestReport: undefined,
    sop: undefined,
    trialProductionReport: undefined,
    evtReport: undefined,
    dvtReport: undefined,
    remarks: '重点项目，需要重点关注',
    members: [
      { userId: 'user1', userName: '张三', role: '研发' as const },
      { userId: 'user2', userName: '李四', role: '测试' as const },
      { userId: 'user3', userName: '王五', role: '项目' as const }
    ],
    reviewConclusion: '通过评审，可以进入下一阶段',
    status: '进行中' as const,
    creator: 'user1',
    creatorName: '张三',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  }
];

const mockUser = {
  id: 'user1',
  username: 'admin',
  email: 'admin@example.com',
  name: '管理员',
  role: 'admin' as const,
  status: 'active' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockUsers = [
  { id: 'user1', name: '张三', role: 'developer' },
  { id: 'user2', name: '李四', role: 'tester' },
  { id: 'user3', name: '王五', role: 'project_manager' }
];

const mockProjectStore = {
  projects: mockProjects,
  selectedProject: null,
  loading: false,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 1
  },
  fetchProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  setSelectedProject: vi.fn(),
  canEditProject: vi.fn(() => true),
  canDeleteProject: vi.fn(() => true)
};

const mockAuthStore = {
  user: mockUser,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
  logSystemActivity: vi.fn()
};

const mockUserStore = {
  users: mockUsers,
  fetchUsers: vi.fn()
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </ConfigProvider>
  );
};

test.describe('项目管理页面图片上传功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录
    await page.goto('/');
    await page.fill('[data-testid="username"]', 'admin');
    await page.fill('[data-testid="password"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // 等待登录成功并跳转到项目管理页面
    await page.waitForURL('**/projects');
  });

  test('应该能够点击上传图片按钮并弹出文件选择器', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 查找上传图片区域
    const uploadArea = page.locator('.ant-upload-picture-card-wrapper');
    await expect(uploadArea).toBeVisible();
    
    // 点击上传图片按钮
    const uploadButton = page.locator('.ant-upload-picture-card-wrapper .ant-upload-select');
    await expect(uploadButton).toBeVisible();
    
    // 模拟点击上传按钮（这会触发文件选择器）
    await uploadButton.click();
    
    // 验证文件选择器被触发（通过检查是否有文件输入框）
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('应该能够上传图片并显示预览', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 创建测试图片文件
    const testImagePath = 'test-resources/test-image.jpg';
    
    // 上传图片
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // 等待图片上传完成
    await page.waitForSelector('.ant-upload-list-item-done');
    
    // 验证图片预览显示
    const imagePreview = page.locator('.ant-upload-list-item-thumbnail img');
    await expect(imagePreview).toBeVisible();
    
    // 验证上传成功消息
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('应该能够删除已上传的图片', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 上传图片
    const testImagePath = 'test-resources/test-image.jpg';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // 等待图片上传完成
    await page.waitForSelector('.ant-upload-list-item-done');
    
    // 点击删除按钮
    const deleteButton = page.locator('.ant-upload-list-item-actions .anticon-delete');
    await deleteButton.click();
    
    // 确认删除
    await page.click('.ant-modal-confirm-btns .ant-btn-primary');
    
    // 验证图片被删除
    await expect(page.locator('.ant-upload-list-item')).not.toBeVisible();
  });

  test('应该能够创建包含图片的项目', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 填写基本信息
    await page.fill('input[placeholder="请输入型号"]', 'TEST-001');
    await page.fill('input[placeholder="请输入SKU"]', 'SKU-TEST-001');
    await page.selectOption('select', 'L2');
    await page.selectOption('select', '内贸');
    await page.fill('input[placeholder="请输入供应商"]', '测试供应商');
    await page.selectOption('select', '研发设计');
    
    // 上传图片
    const testImagePath = 'test-resources/test-image.jpg';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // 等待图片上传完成
    await page.waitForSelector('.ant-upload-list-item-done');
    
    // 选择团队成员
    await page.click('.ant-select-selector');
    await page.click('.ant-select-item-option');
    
    // 点击创建按钮
    await page.click('button:has-text("创建")');
    
    // 验证创建成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
    
    // 验证项目列表中显示新创建的项目
    await expect(page.locator('text=TEST-001')).toBeVisible();
  });

  test('应该能够编辑项目并更新图片', async ({ page }) => {
    // 等待项目列表加载
    await page.waitForSelector('.ant-table-tbody');
    
    // 点击编辑按钮
    const editButton = page.locator('.ant-table-tbody tr:first-child .ant-btn-link').filter({ hasText: '编辑' });
    await editButton.click();
    
    // 等待编辑模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 上传新图片
    const testImagePath = 'test-resources/test-image.jpg';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // 等待图片上传完成
    await page.waitForSelector('.ant-upload-list-item-done');
    
    // 点击更新按钮
    await page.click('button:has-text("更新")');
    
    // 验证更新成功
    await expect(page.locator('.ant-message-success')).toBeVisible();
  });

  test('应该限制图片文件类型', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 尝试上传非图片文件
    const testTextPath = 'test-resources/test.txt';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testTextPath);
    
    // 验证错误消息
    await expect(page.locator('.ant-message-error')).toBeVisible();
    await expect(page.locator('text=只能上传图片文件！')).toBeVisible();
  });

  test('应该限制图片文件大小', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 尝试上传大文件（这里需要创建一个大于2MB的测试文件）
    const largeImagePath = 'test-resources/large-image.jpg';
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeImagePath);
    
    // 验证错误消息
    await expect(page.locator('.ant-message-error')).toBeVisible();
    await expect(page.locator('text=图片大小不能超过2MB！')).toBeVisible();
  });

  test('应该限制最多上传5张图片', async ({ page }) => {
    // 点击新建项目按钮
    await page.click('text=新建项目');
    
    // 等待模态框出现
    await page.waitForSelector('.ant-modal');
    
    // 上传5张图片
    const testImagePath = 'test-resources/test-image.jpg';
    const fileInput = page.locator('input[type="file"]');
    
    for (let i = 0; i < 5; i++) {
      await fileInput.setInputFiles(testImagePath);
      await page.waitForSelector('.ant-upload-list-item-done');
    }
    
    // 验证上传按钮被隐藏
    await expect(page.locator('.ant-upload-select')).not.toBeVisible();
  });
}); 