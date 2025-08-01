import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Input, Select, Dropdown, Badge, Avatar, Modal, Space, message, List, Tag } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  SearchOutlined, 
  BellOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  DashboardOutlined,
  UserOutlined as UserIcon,
  TeamOutlined,
  CheckSquareOutlined,
  BugOutlined,
  HistoryOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { useBugStore } from '../stores/bugStore';
import { useUserStore } from '../stores/userStore';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';

const { Header, Sider, Content } = AntLayout;

interface LayoutProps {
  children: React.ReactNode;
}

interface SearchResult {
  id: string;
  type: 'task' | 'bug' | 'user' | 'team' | 'project';
  title: string;
  description: string;
  link: string;
  createdAt: string;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();
  const { bugs } = useBugStore();
  const { users } = useUserStore();
  const { tasks } = useTaskStore();
  
  const [collapsed, setCollapsed] = useState(false);
  const [globalSearchKeyword, setGlobalSearchKeyword] = useState('');
  const [globalSearchType, setGlobalSearchType] = useState('all');
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationDetailVisible, setNotificationDetailVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: '系统维护通知',
      content: '系统将于本周六凌晨2:00-4:00进行维护，请提前保存数据。',
      time: '2024-07-30 10:00',
      read: false,
      type: 'maintenance'
    },
    {
      id: '2',
      title: '新功能上线',
      content: '全局搜索功能已上线，现在可以搜索任务、Bug和用户信息。',
      time: '2024-07-29 14:30',
      read: false,
      type: 'feature'
    },
    {
      id: '3',
      title: 'Bug修复完成',
      content: '登录界面样式问题已修复，用户体验得到改善。',
      time: '2024-07-28 16:45',
      read: true,
      type: 'bug'
    }
  ]);

  // 从localStorage加载公告数据并转换为通知
  useEffect(() => {
    const loadNotifications = () => {
      const savedAnnouncements = localStorage.getItem('announcements');
      if (savedAnnouncements) {
        const announcements = JSON.parse(savedAnnouncements);
        const activeAnnouncements = announcements.filter((announcement: any) => announcement.active);
        
        const newNotifications = activeAnnouncements.map((announcement: any) => ({
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          time: new Date(announcement.createdAt).toLocaleString(),
          read: false,
          type: announcement.type || 'info'
        }));
        
        setNotifications(newNotifications);
      }
    };

    // 初始加载
    loadNotifications();

    // 监听自定义事件
    const handleAnnouncementChange = () => {
      loadNotifications();
    };

    window.addEventListener('announcementChange', handleAnnouncementChange);
    
    // 监听storage事件（跨标签页）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'announcements') {
        loadNotifications();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('announcementChange', handleAnnouncementChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 获取通知类型标签和颜色
  const getNotificationTypeInfo = (type: string) => {
    switch (type) {
      case 'info':
        return { label: '信息', color: 'blue' };
      case 'warning':
        return { label: '警告', color: 'orange' };
      case 'success':
        return { label: '成功', color: 'green' };
      case 'error':
        return { label: '错误', color: 'red' };
      case 'maintenance':
        return { label: '系统维护', color: 'orange' };
      case 'feature':
        return { label: '功能更新', color: 'green' };
      case 'bug':
        return { label: 'Bug修复', color: 'red' };
      default:
        return { label: '信息', color: 'blue' };
    }
  };

  // 从各个模块获取真实数据进行搜索
  const getSearchData = (): SearchResult[] => {
    const searchData: SearchResult[] = [];
    
    // 添加Bug数据
    bugs.forEach(bug => {
      searchData.push({
        id: bug.id,
        type: 'bug',
        title: bug.title,
        description: bug.description,
        link: '/bugs',
        createdAt: bug.createdAt
      });
    });
    
    // 添加用户数据
    users.forEach(user => {
      searchData.push({
        id: user.id,
        type: 'user',
        title: user.name,
        description: `${user.role} - ${user.email || '无邮箱'}`,
        link: '/users/list',
        createdAt: user.createdAt || '2024-07-01'
      });
    });
    
    // 添加任务数据
    tasks.forEach(task => {
      searchData.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        link: '/tasks',
        createdAt: task.createdAt
      });
    });
    
    // 添加项目管理数据
    const { projects } = useProjectStore.getState();
    projects.forEach((project: any) => {
      searchData.push({
        id: project.id,
        type: 'project',
        title: project.model,
        description: `SKU: ${project.sku} | 等级: ${project.level} | 状态: ${project.status}`,
        link: '/projects',
        createdAt: project.createdAt
      });
    });
    
    // 添加团队数据（模拟）
    const teamData = [
      {
        id: 'team1',
        name: '开发团队',
        description: '负责系统开发和维护',
        createdAt: '2024-07-01'
      },
      {
        id: 'team2',
        name: '测试团队',
        description: '负责系统测试和质量保证',
        createdAt: '2024-07-02'
      },
      {
        id: 'team3',
        name: '产品团队',
        description: '负责产品规划和需求管理',
        createdAt: '2024-07-03'
      }
    ];
    
    teamData.forEach(team => {
      searchData.push({
        id: team.id,
        type: 'team',
        title: team.name,
        description: team.description,
        link: '/users/teams',
        createdAt: team.createdAt
      });
    });
    
    return searchData;
  };

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('common.dashboard'),
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: '/users/list',
      icon: <UserIcon />,
      label: t('common.userManagement'),
    },
    {
      key: '/users/teams',
      icon: <TeamOutlined />,
      label: t('common.teamManagement'),
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: t('common.taskManagement'),
    },
    {
      key: '/bugs',
      icon: <BugOutlined />,
      label: t('common.bugManagement'),
    },
    {
      key: '/system-logs',
      icon: <HistoryOutlined />,
      label: t('common.systemLog'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('common.systemSettings'),
    },
  ];

  const searchTypes = [
    { label: t('common.search'), value: 'all' },
    { label: t('common.taskManagement'), value: 'task' },
    { label: t('common.bugManagement'), value: 'bug' },
    { label: t('common.userManagement'), value: 'user' },
    { label: t('common.teamManagement'), value: 'team' },
    { label: '项目管理', value: 'project' },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: t('common.profile'),
      icon: <UserOutlined />,
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      label: t('common.settings'),
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings')
    },
    {
      type: 'divider' as const
    },
    {
      key: 'logout',
      label: t('common.logout'),
      icon: <LogoutOutlined />,
      onClick: () => {
        logout()
        navigate('/login')
      }
    }
  ];

  const handleGlobalSearch = async (value: string) => {
    if (!value.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    setSearchLoading(true);
    setSearchModalVisible(true);
    
    // 模拟搜索延迟
    setTimeout(() => {
      const keyword = value.toLowerCase();
      console.log('搜索关键词:', keyword);
      console.log('搜索类型:', globalSearchType);
      
      // 使用真实数据
      const searchData = getSearchData();
      console.log('可用搜索数据:', searchData);
      
      let filteredResults = searchData.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(keyword);
        const descMatch = item.description.toLowerCase().includes(keyword);
        const result = titleMatch || descMatch;
        console.log(`检查项目 "${item.title}": 标题匹配=${titleMatch}, 描述匹配=${descMatch}, 结果=${result}`);
        return result;
      });
      
      console.log('过滤前结果数量:', filteredResults.length);
      
      // 根据搜索类型过滤
      if (globalSearchType !== 'all') {
        filteredResults = filteredResults.filter(item => item.type === globalSearchType);
        console.log('按类型过滤后结果数量:', filteredResults.length);
      }
      
      setSearchResults(filteredResults);
      setSearchLoading(false);
      
      if (filteredResults.length === 0) {
        message.info('未找到相关结果');
      } else {
        message.success(`找到 ${filteredResults.length} 条相关结果`);
      }
    }, 500);
  };

  const handleNotificationClick = () => {
    setNotificationModalVisible(true);
  };

  const handleNotificationItemClick = (notification: any) => {
    // 标记通知为已读
    setNotifications(prev => 
      prev.map(item => 
        item.id === notification.id ? { ...item, read: true } : item
      )
    );
    setSelectedNotification(notification);
    setNotificationDetailVisible(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'task': return 'blue';
      case 'bug': return 'red';
      case 'user': return 'green';
      case 'team': return 'purple';
      case 'project': return 'orange';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return t('common.taskManagement');
      case 'bug': return t('common.bugManagement');
      case 'user': return t('common.userManagement');
      case 'team': return t('common.teamManagement');
      case 'project': return '项目管理';
      default: return type;
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          overflow: 'auto',
          height: '100vh'
        }}
      >
        <div className="logo">
          <h2 style={{ color: 'white', textAlign: 'center', margin: '16px 0' }}>
            Bug管理系统
          </h2>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{ 
          padding: 0, 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          
          <Space>
            {/* 全局搜索入口 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input.Search
                placeholder={`${t('common.search')}：任务管理/Bug管理/用户管理/项目管理...`}
                value={globalSearchKeyword}
                onChange={e => setGlobalSearchKeyword(e.target.value)}
                onSearch={handleGlobalSearch}
                enterButton={<SearchOutlined />}
                style={{ width: 280 }}
              />
              <Select
                value={globalSearchType}
                options={searchTypes}
                onChange={setGlobalSearchType}
                style={{ width: 100 }}
              />
            </div>
            
            {/* 搜索结果显示弹窗 */}
            <Modal
              open={searchModalVisible}
              title={`${t('common.search')}结果`}
              onCancel={() => setSearchModalVisible(false)}
              footer={null}
              width={900}
              style={{ top: 20 }}
              bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
            >
              <List
                loading={searchLoading}
                dataSource={searchResults}
                renderItem={item => (
                  <List.Item 
                    actions={[
                      <a key="view" onClick={() => {
                        navigate(item.link);
                        setSearchModalVisible(false);
                      }}>
                        查看详情
                      </a>
                    ]}
                    style={{ padding: '16px 0' }}
                  >
                    <List.Item.Meta
                      title={
                        <span>
                          <Tag color={getTypeColor(item.type)} style={{ marginRight: 8 }}>
                            {getTypeLabel(item.type)}
                          </Tag>
                          {item.title}
                        </span>
                      }
                      description={
                        <div>
                          <p style={{ margin: '8px 0', color: '#666' }}>{item.description}</p>
                          <small style={{ color: '#999' }}>创建时间: {item.createdAt}</small>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无搜索结果' }}
                style={{ maxHeight: '60vh', overflow: 'auto' }}
              />
            </Modal>
            
            {/* 通知铃铛 */}
            <Badge count={notifications.filter(n => !n.read).length}>
              <BellOutlined 
                style={{ fontSize: '18px', cursor: 'pointer' }} 
                onClick={handleNotificationClick}
              />
            </Badge>
            
            {/* 通知弹窗 */}
            <Modal
              open={notificationModalVisible}
              title="通知中心"
              onCancel={() => setNotificationModalVisible(false)}
              footer={null}
              width={600}
            >
              <List
                dataSource={notifications}
                renderItem={item => (
                  <List.Item onClick={() => handleNotificationItemClick(item)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      title={
                        <span>
                          <Tag color={item.read ? 'default' : 'blue'} style={{ marginRight: 8 }}>
                            {item.read ? '已读' : '未读'}
                          </Tag>
                          <Tag color={getNotificationTypeInfo(item.type).color} style={{ marginRight: 8 }}>
                            {getNotificationTypeInfo(item.type).label}
                          </Tag>
                          {item.title}
                        </span>
                      }
                      description={
                        <div>
                          <p>{item.content}</p>
                          <small style={{ color: '#999' }}>{item.time}</small>
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无通知' }}
              />
            </Modal>
            
            {/* 通知详情弹窗 */}
            <Modal
              open={notificationDetailVisible}
              title={selectedNotification?.title || '通知详情'}
              onCancel={() => setNotificationDetailVisible(false)}
              footer={[
                <Button key="close" onClick={() => setNotificationDetailVisible(false)}>
                  关闭
                </Button>
              ]}
              width={500}
            >
              {selectedNotification && (
                <div>
                  <p><strong>标题：</strong>{selectedNotification.title}</p>
                  <p><strong>内容：</strong></p>
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '4px',
                    marginBottom: '12px'
                  }}>
                    {selectedNotification.content}
                  </div>
                  <p><strong>时间：</strong>{selectedNotification.time}</p>
                  <p><strong>类型：</strong>
                    <Tag color={getNotificationTypeInfo(selectedNotification.type).color}>
                      {getNotificationTypeInfo(selectedNotification.type).label}
                    </Tag>
                  </p>
                  <p><strong>状态：</strong>
                    <Tag color={selectedNotification.read ? 'default' : 'blue'}>
                      {selectedNotification.read ? '已读' : '未读'}
                    </Tag>
                  </p>
                </div>
              )}
            </Modal>
            
            <span>{t('common.welcome')}，{user?.name}</span>
            
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 