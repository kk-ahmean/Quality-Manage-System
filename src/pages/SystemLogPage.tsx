import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, DatePicker, Select, Spin, Button, message } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useUserStore } from '../stores/userStore';
import { getAllUsers } from '../stores/authStore';

// 日志类型
const logTypes = [
  { label: '全部', value: '' },
  { label: '用户操作', value: 'OPERATION' },
  { label: '系统异常', value: 'EXCEPTION' },
];

// 操作类型筛选
const actionTypes = [
  { label: '全部操作', value: '' },
  { label: '登录/登出', value: 'LOGIN' },
  { label: '密码重置', value: 'PASSWORD_RESET' },
  { label: '用户管理', value: 'USER' },
  { label: 'Bug管理', value: 'BUG' },
  { label: '任务管理', value: 'TASK' },
  { label: '团队管理', value: 'TEAM' },
  { label: '项目管理', value: 'PROJECT' },
];

// 示例数据结构
export interface SystemLog {
  id: string;
  type: 'OPERATION' | 'EXCEPTION';
  user?: string;
  action?: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

const SystemLogPage: React.FC = () => {
  const { activityLogs, fetchUserActivityLogs, loading } = useUserStore();
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [allLogs, setAllLogs] = useState<SystemLog[]>([]);
  const [type, setType] = useState('');
  const [actionType, setActionType] = useState('');
  const [date, setDate] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // 获取所有日志数据
  useEffect(() => {
    const fetchAllLogs = async () => {
      const logs: SystemLog[] = [];
      
      // 获取全局系统日志
      if (window.systemLogs && window.systemLogs.length > 0) {
        const users = getAllUsers();
        const userMap = new Map(users.map(u => [u.id, u.username]));
        
        window.systemLogs.forEach(log => {
          const username = userMap.get(log.userId) || '未知用户';
          logs.push({
            id: log.id,
            type: 'OPERATION',
            user: username,
            action: log.action,
            description: log.description,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt
          });
        });
      }
      
      // 添加一些静态的示例日志（如果没有实际日志）
      if (logs.length === 0) {
        const mockSystemLogs: SystemLog[] = [
          {
            id: '1',
            type: 'OPERATION',
            user: 'admin',
            action: 'LOGIN',
            description: '用户登录系统',
            ipAddress: '192.168.1.100',
            createdAt: '2024-07-29T11:12:55Z'
          },
          {
            id: '2',
            type: 'OPERATION',
            user: 'developer',
            action: 'CREATE_BUG',
            description: '创建Bug: 登录页面显示异常',
            ipAddress: '192.168.1.101',
            createdAt: '2024-07-28T15:30:00Z'
          },
          {
            id: '3',
            type: 'OPERATION',
            user: 'tester',
            action: 'UPDATE_TASK',
            description: '更新任务进度: 完成测试用例编写',
            ipAddress: '192.168.1.102',
            createdAt: '2024-07-27T10:15:00Z'
          },
          {
            id: '4',
            type: 'EXCEPTION',
            user: 'system',
            action: 'SYSTEM_ERROR',
            description: '数据库连接超时',
            ipAddress: '192.168.1.103',
            createdAt: '2024-07-26T14:20:00Z'
          },
          {
            id: '5',
            type: 'OPERATION',
            user: 'admin',
            action: 'CREATE_USER',
            description: '创建新用户: 张三',
            ipAddress: '192.168.1.100',
            createdAt: '2024-07-25T09:45:00Z'
          }
        ];
        
        logs.push(...mockSystemLogs);
      }
      
      setAllLogs(logs);
      setFilteredLogs(logs);
      setTotal(logs.length);
    };
    
    fetchAllLogs();
  }, []);

  // 过滤日志数据
  useEffect(() => {
    let filtered = [...allLogs];
    
    if (type) {
      filtered = filtered.filter(log => log.type === type);
    }
    
    if (actionType) {
      filtered = filtered.filter(log => log.action?.includes(actionType));
    }
    
    if (date) {
      const selectedDate = dayjs(date).format('YYYY-MM-DD');
      filtered = filtered.filter(log => 
        dayjs(log.createdAt).format('YYYY-MM-DD') === selectedDate
      );
    }
    
    setFilteredLogs(filtered);
    setTotal(filtered.length);
    setPage(1);
  }, [allLogs, type, actionType, date]);

  // 导出CSV功能
  const exportToCSV = () => {
    try {
      const headers = ['时间', '类型', '用户', '操作', '描述', 'IP地址'];
      const csvContent = [
        headers.join(','),
        ...filteredLogs.map(log => [
          dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss'),
          log.type === 'OPERATION' ? '用户操作' : '系统异常',
          log.user || '-',
          log.action || '-',
          `"${log.description}"`,
          log.ipAddress || '-'
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `系统日志_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('日志导出成功');
    } catch (error) {
      message.error('日志导出失败');
      console.error('导出失败:', error);
    }
  };

  const columns = [
    { 
      title: '时间', 
      dataIndex: 'createdAt', 
      key: 'createdAt', 
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
      className: 'log-time-column'
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (t: string) => t === 'OPERATION' ? <Tag color="blue">用户操作</Tag> : <Tag color="red">系统异常</Tag>,
      className: 'log-type-column'
    },
    { 
      title: '用户', 
      dataIndex: 'user', 
      key: 'user', 
      render: (u: string) => u || '-',
      className: 'log-user-column'
    },
    { 
      title: '操作', 
      dataIndex: 'action', 
      key: 'action', 
      render: (a: string) => a || '-',
      className: 'log-action-column'
    },
    { 
      title: '描述', 
      dataIndex: 'description', 
      key: 'description',
      className: 'log-description-column'
    },
    { 
      title: 'IP地址', 
      dataIndex: 'ipAddress', 
      key: 'ipAddress', 
      render: (ip: string) => ip || '-',
      className: 'log-ip-column'
    },
  ];

  // 分页数据
  const paginatedLogs = filteredLogs.slice((page - 1) * 10, page * 10);

  return (
    <div className="system-log-page">
      <div className="log-filters" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            value={type}
            options={logTypes}
            onChange={v => setType(v)}
            style={{ width: 120 }}
            placeholder="日志类型"
          />
          <Select
            value={actionType}
            options={actionTypes}
            onChange={v => setActionType(v)}
            style={{ width: 140 }}
            placeholder="操作类型"
          />
          <DatePicker
            value={date}
            onChange={v => setDate(v)}
            allowClear
            placeholder="选择日期"
          />
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
            disabled={filteredLogs.length === 0}
          >
            导出日志
          </Button>
        </Space>
      </div>
      
      <Spin spinning={loading}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={paginatedLogs}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => setPage(p),
            showTotal: t => `共${t}条`,
            className: 'log-table-pagination'
          }}
          className="system-log-table"
          size="middle"
        />
      </Spin>
    </div>
  );
};

export default SystemLogPage; 