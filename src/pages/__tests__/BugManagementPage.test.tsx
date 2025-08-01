import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN.js';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';
import BugManagementPage from '../BugManagementPage';
import { useBugStore } from '../../stores/bugStore';

vi.mock('../../stores/bugStore', () => ({
  useBugStore: vi.fn()
}));
const mockUseBugStore = vi.mocked(useBugStore);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>{component}</ConfigProvider>
    </BrowserRouter>
  );
};

describe('BugManagementPage', () => {
  const mockBugs = [
    {
      id: '1',
      title: 'Bug1',
      description: 'desc1',
      reproductionSteps: 'step1',
      expectedResult: 'expect1',
      actualResult: 'actual1',
      priority: 'P1',
      severity: 'A',
      type: '功能缺陷',
      responsibility: '软件',
      status: '新建',
      reporter: 'user1',
      reporterName: '张三',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      tags: ['UI'],
      attachments: [],
      comments: []
    }
  ];
  const mockStore = {
    bugs: mockBugs,
    loading: false,
    statistics: null,
    filters: {},
    pagination: { current: 1, pageSize: 20, total: 1 },
    fetchBugs: vi.fn(),
    createBug: vi.fn(),
    updateBug: vi.fn(),
    deleteBug: vi.fn(),
    assignBug: vi.fn(),
    updateBugStatus: vi.fn(),
    addBugComment: vi.fn(),
    batchOperation: vi.fn(),
    fetchStatistics: vi.fn(),
    setSelectedBug: vi.fn(),
    setFilters: vi.fn(),
    resetFilters: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBugStore.mockReturnValue(mockStore);
  });

  it('should render bug list', () => {
    renderWithProviders(<BugManagementPage />);
    expect(screen.getByText('Bug1')).toBeInTheDocument();
    expect(screen.getByText('新建')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('should open create bug modal', () => {
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('新建Bug'));
    expect(screen.getByText('新建Bug')).toBeInTheDocument();
    expect(screen.getByLabelText('Bug标题')).toBeInTheDocument();
  });

  it('should call createBug when submitting create modal', async () => {
    mockStore.createBug.mockResolvedValue({});
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('新建Bug'));
    fireEvent.change(screen.getByLabelText('Bug标题'), { target: { value: '新Bug' } });
    fireEvent.change(screen.getByLabelText('Bug描述'), { target: { value: '描述' } });
    fireEvent.change(screen.getByLabelText('复现步骤'), { target: { value: '步骤' } });
    fireEvent.change(screen.getByLabelText('预期结果'), { target: { value: '预期' } });
    fireEvent.change(screen.getByLabelText('实际结果'), { target: { value: '实际' } });
    fireEvent.mouseDown(screen.getByLabelText('优先级'), { button: 0 });
    fireEvent.click(screen.getByText('P1'));
    fireEvent.mouseDown(screen.getByLabelText('严重程度'), { button: 0 });
    fireEvent.click(screen.getByText('A'));
    fireEvent.mouseDown(screen.getByLabelText('类型'), { button: 0 });
    fireEvent.click(screen.getByText('功能缺陷'));
    fireEvent.mouseDown(screen.getByLabelText('责任归属'), { button: 0 });
    fireEvent.click(screen.getByText('软件'));
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.createBug).toHaveBeenCalled();
    });
  });

  it('should open edit bug modal', () => {
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('编辑'));
    expect(screen.getByText('编辑Bug')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bug1')).toBeInTheDocument();
  });

  it('should call updateBug when submitting edit modal', async () => {
    mockStore.updateBug.mockResolvedValue({});
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('编辑'));
    fireEvent.change(screen.getByLabelText('Bug标题'), { target: { value: 'Bug1-修改' } });
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.updateBug).toHaveBeenCalled();
    });
  });

  it('should call deleteBug when confirming deletion', async () => {
    mockStore.deleteBug.mockResolvedValue();
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('删除'));
    await waitFor(() => {
      expect(mockStore.deleteBug).toHaveBeenCalledWith('1');
    });
  });

  it('should open detail modal when clicking bug title', () => {
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('Bug1'));
    expect(screen.getByText('Bug详情')).toBeInTheDocument();
    expect(screen.getByText('desc1')).toBeInTheDocument();
  });

  it('should open comment modal and call addBugComment', async () => {
    mockStore.addBugComment.mockResolvedValue();
    renderWithProviders(<BugManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('评论'));
    fireEvent.change(screen.getByPlaceholderText('请输入评论内容'), { target: { value: '新评论' } });
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.addBugComment).toHaveBeenCalled();
    });
  });

  it('should call batchOperation when clicking 批量删除', async () => {
    mockStore.batchOperation.mockResolvedValue();
    renderWithProviders(<BugManagementPage />);
    // 选中行
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('批量删除'));
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.batchOperation).toHaveBeenCalled();
    });
  });

  it('should filter bugs by status', () => {
    renderWithProviders(<BugManagementPage />);
    fireEvent.mouseDown(screen.getByLabelText('状态'), { button: 0 });
    fireEvent.click(screen.getByText('新建'));
    expect(mockStore.setFilters).toHaveBeenCalled();
    expect(mockStore.fetchBugs).toHaveBeenCalled();
  });
}); 