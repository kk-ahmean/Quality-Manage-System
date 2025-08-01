import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN.js';
import { describe, it, beforeEach, expect, vi } from 'vitest';

// Mock @ant-design/plots
vi.mock('@ant-design/plots', () => ({
  Line: (props: any) => <div data-testid="mock-line-chart" {...props} />,
}));

// Mock bugStore
vi.doMock('../stores/bugStore', () => ({
  useBugStore: () => ({
    bugs: [
      { id: 1, status: '新建', type: '功能缺陷', priority: 'P1', responsibility: '软件', createdAt: '2024-01-15' },
      { id: 2, status: '处理中', type: '性能问题', priority: 'P2', responsibility: '软件', createdAt: '2024-01-14' },
      { id: 3, status: '处理中', type: '界面问题', priority: 'P1', responsibility: '软件', createdAt: '2024-01-13' },
      { id: 4, status: '待验证', type: '安全问题', priority: 'P0', responsibility: '软件', createdAt: '2024-01-12' },
      { id: 5, status: '已解决', type: '功能缺陷', priority: 'P2', responsibility: '软件', createdAt: '2024-01-11' }
    ],
    statistics: {
      total: 5,
      byStatus: {
        '新建': 1,
        '处理中': 2,
        '待验证': 1,
        '已解决': 1
      }
    },
    fetchBugs: vi.fn(),
    fetchStatistics: vi.fn(),
    loading: false
  })
}));

// Mock taskStore
vi.doMock('../stores/taskStore', () => ({
  useTaskStore: () => ({
    tasks: [
      { id: 1, status: 'todo', priority: 'high', assignee: 'user1', assigneeName: '张三', createdAt: '2024-01-15' },
      { id: 2, status: 'in_progress', priority: 'medium', assignee: 'user2', assigneeName: '李四', createdAt: '2024-01-14' },
      { id: 3, status: 'review', priority: 'low', assignee: 'user3', assigneeName: '王五', createdAt: '2024-01-13' },
      { id: 4, status: 'completed', priority: 'high', assignee: 'user1', assigneeName: '张三', createdAt: '2024-01-12' },
      { id: 5, status: 'todo', priority: 'medium', assignee: 'user2', assigneeName: '李四', createdAt: '2024-01-11' }
    ],
    statistics: {
      total: 5,
      todo: 2,
      inProgress: 1,
      review: 1,
      completed: 1
    },
    fetchTasks: vi.fn(),
    getStatistics: vi.fn(),
    loading: false
  })
}));

import DashboardPage from '../DashboardPage';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>{component}</ConfigProvider>
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard title', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('仪表盘')).toBeInTheDocument();
  });

  it('should render bug overview section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Bug概览')).toBeInTheDocument();
  });

  it('should render task overview section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('任务概览')).toBeInTheDocument();
  });

  it('should render bug statistics cards', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Bug总数')).toBeInTheDocument();
    expect(screen.getByText('已解决')).toBeInTheDocument();
    expect(screen.getByText('处理中')).toBeInTheDocument();
    expect(screen.getByText('未解决')).toBeInTheDocument();
  });

  it('should render task statistics cards', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('任务总数')).toBeInTheDocument();
    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('进行中')).toBeInTheDocument();
    expect(screen.getByText('待处理')).toBeInTheDocument();
  });

  it('should render bug distribution section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Bug分布')).toBeInTheDocument();
  });

  it('should render task distribution section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('任务分布')).toBeInTheDocument();
  });

  it('should render bug trend section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Bug趋势')).toBeInTheDocument();
  });

  it('should render task trend section', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('任务趋势')).toBeInTheDocument();
  });

  it('should render progress bars', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Bug解决率')).toBeInTheDocument();
    expect(screen.getByText('任务完成率')).toBeInTheDocument();
  });
}); 