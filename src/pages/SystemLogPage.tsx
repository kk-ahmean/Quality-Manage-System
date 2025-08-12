import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, DatePicker, Select, Spin, Button, message, Card, Row, Col, Statistic, Input, Tooltip, Modal } from 'antd';
import { DownloadOutlined, FilterOutlined, ReloadOutlined, DeleteOutlined, BarChartOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useSystemLogStore, SystemLogEntry, LogFilters } from '../stores/systemLogStore';
import { useUserStore } from '../stores/userStore';

// 操作类型筛选选项 - 只保留重要操作，与后端对应
const actionOptions = [
  { label: '全部操作', value: '' },
  { label: '用户登录', value: 'USER_LOGIN' },
  { label: '用户登出', value: 'USER_LOGOUT' },
  { label: '创建用户', value: 'CREATE_USER' },
  { label: '更新用户', value: 'UPDATE_USER' },
  { label: '删除用户', value: 'DELETE_USER' },
  { label: '修改密码', value: 'CHANGE_PASSWORD' },
  { label: '重置密码', value: 'RESET_PASSWORD' },
  { label: '更新权限', value: 'UPDATE_USER_PERMISSIONS' },
  { label: '创建Bug', value: 'CREATE_BUG' },
  { label: '更新Bug', value: 'UPDATE_BUG' },
  { label: '删除Bug', value: 'DELETE_BUG' },
  { label: '更新Bug状态', value: 'UPDATE_BUG_STATUS' },
  { label: '分配Bug', value: 'ASSIGN_BUG' },
  { label: '创建任务', value: 'CREATE_TASK' },
  { label: '更新任务', value: 'UPDATE_TASK' },
  { label: '删除任务', value: 'DELETE_TASK' },
  { label: '更新任务状态', value: 'UPDATE_TASK_STATUS' },
  { label: '分配任务', value: 'ASSIGN_TASK' },
  { label: '创建项目', value: 'CREATE_PROJECT' },
  { label: '更新项目', value: 'UPDATE_PROJECT' },
  { label: '删除项目', value: 'DELETE_PROJECT' },
  { label: '查看项目统计', value: 'VIEW_PROJECT_STATS' },
  { label: '创建团队', value: 'CREATE_TEAM' },
  { label: '更新团队', value: 'UPDATE_TEAM' },
  { label: '删除团队', value: 'DELETE_TEAM' },
  { label: '导出系统日志', value: 'EXPORT_SYSTEM_LOGS' },
  { label: '清理日志', value: 'CLEANUP_LOGS' },
  { label: '文件上传', value: 'FILE_UPLOAD' },
  { label: '文件下载', value: 'FILE_DOWNLOAD' },
  { label: '数据导入', value: 'DATA_IMPORT' },
  { label: '数据导出', value: 'DATA_EXPORT' },
  { label: '更新系统设置', value: 'UPDATE_SETTINGS' },
];

// 严重程度筛选选项
const severityOptions = [
  { label: '全部级别', value: '' },
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '严重', value: 'critical' },
];

// 状态筛选选项
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failure' },
  { label: '待处理', value: 'pending' },
];

const SystemLogPage: React.FC = () => {
  const { currentUser } = useUserStore();
  const {
    logs,
    stats,
    filters,
    pagination,
    loading,
    error,
    statsLoading,
    fetchSystemLogs,
    fetchLogStats,
    exportLogs,
    cleanupLogs,
    setFilters,
    resetFilters,
    setPagination,
    clearError
  } = useSystemLogStore();

  // 本地状态
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // 初始化数据
  useEffect(() => {
    fetchSystemLogs();
    fetchLogStats(7);
  }, []);

  // 处理筛选条件变化
  const handleFilterChange = (key: keyof LogFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // 筛选条件变化后立即重新获取数据
    fetchSystemLogs(newFilters, 1, pagination.limit);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setDateRange(dates);
    
    if (dates) {
      const startDate = dates[0].format('YYYY-MM-DD');
      const endDate = dates[1].format('YYYY-MM-DD');
      const newFilters = { 
        ...filters, 
        startDate, 
        endDate 
      };
      setFilters(newFilters);
      fetchSystemLogs(newFilters, 1, pagination.limit);
    } else {
      const newFilters = { 
        ...filters, 
        startDate: '', 
        endDate: '' 
      };
      setFilters(newFilters);
      fetchSystemLogs(newFilters, 1, pagination.limit);
    }
  };

  // 处理搜索
  const handleSearch = () => {
    const newFilters = { ...filters, search: searchText };
    setFilters(newFilters);
    // 搜索后立即重新获取数据
    fetchSystemLogs(newFilters, 1, pagination.limit);
  };

  // 处理重置筛选
  const handleResetFilters = () => {
    resetFilters();
    setSearchText('');
    setDateRange(null);
    // 重置后立即重新获取数据
    fetchSystemLogs({}, 1, pagination.limit);
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    const newPageSize = pageSize || pagination.limit;
    setPagination({ ...pagination, page, limit: newPageSize });
    fetchSystemLogs(filters, page, newPageSize);
  };

  // 处理导出 - 性能优化版本
  const handleExport = async () => {
    try {
      // 显示导出进度提示
      const loadingKey = 'export-loading';
      message.loading({ content: '正在导出日志，请稍候...', key: loadingKey, duration: 0 });
      
      // 使用当前的筛选条件进行导出
      await exportLogs(filters, 'csv');
      
      // 导出成功提示
      message.success({ content: '日志导出成功！', key: loadingKey });
      
      // 显示导出信息
      if (logs.length > 10000) {
        message.info('注意：由于数据量较大，实际导出数量已限制在1万条以内，以防止超时');
      }
      
    } catch (error: any) {
      // 详细的错误提示
      const errorMsg = error.message || '日志导出失败';
      message.error({ content: `导出失败: ${errorMsg}`, key: 'export-loading' });
      
      // 如果是超时错误，提供解决建议
      if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        message.warning('建议：尝试缩小筛选范围或选择较短的时间段进行导出');
      }
    }
  };

  // 处理清理日志 - 优化版本
  const handleCleanup = async () => {
    try {
      // 确认清理操作
      Modal.confirm({
        title: '确认清理旧日志',
        content: '此操作将清理15天前的旧日志，清理后无法恢复。确定要继续吗？',
        okText: '确定清理',
        cancelText: '取消',
        okType: 'danger',
        onOk: async () => {
          try {
            const loadingKey = 'cleanup-loading';
            message.loading({ content: '正在清理旧日志...', key: loadingKey, duration: 0 });
            
            await cleanupLogs(15); // 改为15天
            
            message.success({ content: '日志清理成功！', key: loadingKey });
            
            // 显示清理信息
            message.info('系统性能已得到提升，建议定期清理旧日志');
            
          } catch (error: any) {
            message.error({ content: `清理失败: ${error.message || '未知错误'}`, key: 'cleanup-loading' });
          }
        }
      });
    } catch (error) {
      message.error('清理操作被取消');
    }
  };

  // 获取严重程度标签颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'green';
      case 'medium': return 'orange';
      case 'high': return 'red';
      case 'critical': return 'volcano';
      default: return 'default';
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green';
      case 'failure': return 'red';
      case 'pending': return 'orange';
      default: return 'default';
    }
  };

  // 表格列定义
  const columns = [
    { 
      title: '时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt', 
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      width: 150,
      sorter: (a: SystemLogEntry, b: SystemLogEntry) => 
        dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    { 
      title: '用户', 
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string) => name || '匿名用户',
      width: 120,
    },
    { 
      title: '操作', 
      dataIndex: 'action', 
      key: 'action', 
      render: (action: string) => {
        const option = actionOptions.find(opt => opt.value === action);
        return option ? option.label : action;
      },
      width: 120,
    },
    { 
      title: '描述', 
      dataIndex: 'description', 
      key: 'description',
      render: (desc: string) => (
        <Tooltip title={desc}>
          <span style={{ maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {desc}
          </span>
        </Tooltip>
      ),
      ellipsis: true,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>
          {severityOptions.find(opt => opt.value === severity)?.label || severity}
        </Tag>
      ),
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {statusOptions.find(opt => opt.value === status)?.label || status}
        </Tag>
      ),
      width: 100,
    },
    { 
      title: 'IP地址', 
      dataIndex: 'ipAddress', 
      key: 'ipAddress', 
      render: (ip: string) => ip || '-',
      width: 120,
    },
  ];

  // 错误提示
  if (error) {
    message.error(error);
    clearError();
  }

  return (
    <div className="system-log-page" style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总日志数"
              value={pagination.total}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日日志"
              value={stats.find(s => s.date === dayjs().format('YYYY-MM-DD'))?.totalCount || 0}
              prefix={<BarChartOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功操作"
              value={logs.filter(log => log.status === 'success').length}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="失败操作"
              value={logs.filter(log => log.status === 'failure').length}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="large" style={{ width: '100%' }}>
          <Select
            value={filters.action}
            options={actionOptions}
            onChange={(value) => handleFilterChange('action', value)}
            style={{ width: 150 }}
            placeholder="操作类型"
            allowClear
          />
          <Select
            value={filters.severity}
            options={severityOptions}
            onChange={(value) => handleFilterChange('severity', value)}
            style={{ width: 100 }}
            placeholder="严重程度"
            allowClear
          />
          <Select
            value={filters.status}
            options={statusOptions}
            onChange={(value) => handleFilterChange('status', value)}
            style={{ width: 100 }}
            placeholder="状态"
            allowClear
          />
          <DatePicker.RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={['开始日期', '结束日期']}
            allowClear
            format="YYYY-MM-DD"
          />
          <Input
            placeholder="搜索关键词"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
            suffix={<SearchOutlined />}
          />
          <Button onClick={handleSearch} type="primary">
            搜索
          </Button>
          <Button onClick={handleResetFilters}>
            重置
          </Button>
        </Space>
      </Card>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={() => fetchSystemLogs()}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={logs.length === 0}
            title={logs.length === 0 ? '暂无日志可导出' : `导出当前筛选结果（最多1万条）`}
          >
            导出日志
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={handleCleanup}
            loading={loading}
            danger
            title="清理15天前的旧日志，提升系统性能"
          >
            清理旧日志
          </Button>
        </Space>
      </div>
      
      {/* 日志表格 */}
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={logs}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handlePageChange,
            onShowSizeChange: (current, size) => handlePageChange(1, size),
          }}
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default SystemLogPage; 