import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN.js';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import TaskManagementPage from '../TaskManagementPage';
import { useTaskStore } from '../../stores/taskStore';
import { useUserStore } from '../../stores/userStore';

vi.mock('../../stores/taskStore', () => ({
  useTaskStore: vi.fn()
}));
vi.mock('../../stores/userStore', () => ({
  useUserStore: vi.fn()
}));
const mockUseTaskStore = vi.mocked(useTaskStore);
const mockUseUserStore = vi.mocked(useUserStore);

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>{component}</ConfigProvider>
    </BrowserRouter>
  );
};

describe('TaskManagementPage', () => {
  const mockTasks = [
    {
      id: '1',
      title: '任务1',
      description: '描述1',
      priority: 'P1',
      status: 'todo',
      assignee: 'user1',
      assigneeName: '张三',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      dueDate: '2024-01-10T00:00:00Z',
      progress: 0,
      tags: ['前端'],
      attachments: [],
      comments: []
    }
  ];
  const mockStore = {
    tasks: mockTasks,
    loading: false,
    statistics: {
      total: 1,
      todo: 1,
      inProgress: 0,
      review: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0
    },
    filters: {},
    pagination: { current: 1, pageSize: 20, total: 1 },
    fetchTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    assignTask: vi.fn(),
    updateTaskProgress: vi.fn(),
    addTaskComment: vi.fn(),
    batchOperation: vi.fn(),
    fetchStatistics: vi.fn(),
    getStatistics: vi.fn(),
    setSelectedTask: vi.fn(),
    setFilters: vi.fn(),
    resetFilters: vi.fn()
  };

  const mockUsers = [
    { id: 'user1', name: '张三', email: 'zhangsan@example.com' },
    { id: 'user2', name: '李四', email: 'lisi@example.com' }
  ];

  const mockUserStore = {
    users: mockUsers,
    fetchUsers: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTaskStore.mockReturnValue(mockStore);
    mockUseUserStore.mockReturnValue(mockUserStore);
  });

  it('should render task list', () => {
    renderWithProviders(<TaskManagementPage />);
    expect(screen.getByText('任务1')).toBeInTheDocument();
    expect(screen.getByText('todo')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('should open create task modal', () => {
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('新建任务'));
    expect(screen.getByText('新建任务')).toBeInTheDocument();
    expect(screen.getByLabelText('任务标题')).toBeInTheDocument();
  });

  it('should call createTask when submitting create modal', async () => {
    mockStore.createTask.mockResolvedValue({});
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('新建任务'));
    fireEvent.change(screen.getByLabelText('任务标题'), { target: { value: '新任务' } });
    fireEvent.change(screen.getByLabelText('任务描述'), { target: { value: '描述' } });
    fireEvent.mouseDown(screen.getByLabelText('优先级'), { button: 0 });
    fireEvent.click(screen.getByText('P1'));
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.createTask).toHaveBeenCalled();
    });
  });

  it('should open edit task modal', () => {
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('编辑'));
    expect(screen.getByText('编辑任务')).toBeInTheDocument();
    expect(screen.getByDisplayValue('任务1')).toBeInTheDocument();
  });

  it('should call updateTask when submitting edit modal', async () => {
    mockStore.updateTask.mockResolvedValue({});
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('编辑'));
    fireEvent.change(screen.getByLabelText('任务标题'), { target: { value: '任务1-修改' } });
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.updateTask).toHaveBeenCalled();
    });
  });

  it('should call deleteTask when confirming deletion', async () => {
    mockStore.deleteTask.mockResolvedValue();
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('删除'));
    await waitFor(() => {
      expect(mockStore.deleteTask).toHaveBeenCalledWith('1');
    });
  });

  it('should open detail modal when clicking task title', () => {
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('任务1'));
    expect(screen.getByText('任务详情')).toBeInTheDocument();
    expect(screen.getByText('描述1')).toBeInTheDocument();
  });

  it('should open comment modal and call addTaskComment', async () => {
    mockStore.addTaskComment.mockResolvedValue();
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByText('操作'));
    fireEvent.click(screen.getByText('评论'));
    fireEvent.change(screen.getByPlaceholderText('请输入评论内容'), { target: { value: '新评论' } });
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.addTaskComment).toHaveBeenCalled();
    });
  });

  it('should call batchOperation when clicking 批量删除', async () => {
    mockStore.batchOperation.mockResolvedValue();
    renderWithProviders(<TaskManagementPage />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('批量删除'));
    fireEvent.click(screen.getByText('确定'));
    await waitFor(() => {
      expect(mockStore.batchOperation).toHaveBeenCalled();
    });
  });

  it('should filter tasks by status', () => {
    renderWithProviders(<TaskManagementPage />);
    fireEvent.mouseDown(screen.getByLabelText('状态'), { button: 0 });
    fireEvent.click(screen.getByText('todo'));
    expect(mockStore.setFilters).toHaveBeenCalled();
    expect(mockStore.fetchTasks).toHaveBeenCalled();
  });
}); 