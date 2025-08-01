import React, { useState, useContext, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, Space, List, Tag, Modal, message, Popconfirm, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BellOutlined, LockOutlined } from '@ant-design/icons';
import { LanguageContext } from '../main';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores/authStore';

const { Option } = Select;
const { TextArea } = Input;
const { Password } = Input;

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  active: boolean;
  createdAt: string;
}

const SystemSettingsPage: React.FC = () => {
  const { locale, setLocale } = useContext(LanguageContext);
  const { t } = useTranslation();
  const { user, updateUserPassword } = useAuthStore();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // 从localStorage加载公告数据
  useEffect(() => {
    const savedAnnouncements = localStorage.getItem('announcements');
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    }
    
    // 加载主题设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // 保存公告数据到localStorage
  const saveAnnouncements = (newAnnouncements: Announcement[]) => {
    setAnnouncements(newAnnouncements);
    localStorage.setItem('announcements', JSON.stringify(newAnnouncements));
    
    // 触发自定义事件，通知Layout组件更新通知
    window.dispatchEvent(new Event('announcementChange'));
  };

  const handleLanguageChange = (value: 'zh' | 'en') => {
    setLocale(value);
    message.success('语言设置已更新');
  };

  const handleThemeChange = (checked: boolean) => {
    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    message.success(`已切换为${checked ? '暗黑' : '明亮'}模式`);
  };

  // 处理密码重置
  const handlePasswordReset = async (values: any) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 调试信息
      console.log('密码重置尝试:', {
        username: user?.username,
        userPassword: user?.password,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      // 这里应该调用后端API验证当前密码并更新新密码
      // 模拟验证逻辑 - 使用当前用户的密码进行验证
      if (user && user.password === values.currentPassword) {
        // 更新用户密码
        updateUserPassword(user.username, values.newPassword);
        message.success('密码重置成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
      } else {
        console.log('密码验证失败:', {
          expected: user?.password,
          provided: values.currentPassword
        });
        message.error('当前密码错误');
      }
    } catch (error) {
      message.error('密码重置失败');
    }
  };

  const handleNoticeSubmit = async (values: any) => {
    try {
      const newAnnouncement: Announcement = {
        id: editingAnnouncement ? editingAnnouncement.id : Date.now().toString(),
        title: values.title,
        content: values.content,
        type: values.type || 'info',
        active: values.active !== false,
        createdAt: editingAnnouncement ? editingAnnouncement.createdAt : new Date().toISOString()
      };

      let newAnnouncements;
      if (editingAnnouncement) {
        // 编辑现有公告
        newAnnouncements = announcements.map(item => 
          item.id === editingAnnouncement.id ? newAnnouncement : item
        );
        message.success('公告更新成功');
      } else {
        // 添加新公告
        newAnnouncements = [...announcements, newAnnouncement];
        message.success('公告添加成功');
      }

      saveAnnouncements(newAnnouncements);
      form.resetFields();
      setModalVisible(false);
      setEditingAnnouncement(null);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    form.setFieldsValue(announcement);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    const newAnnouncements = announcements.filter(item => item.id !== id);
    saveAnnouncements(newAnnouncements);
    message.success('公告删除成功');
  };

  const handleToggleActive = (id: string) => {
    const newAnnouncements = announcements.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    );
    saveAnnouncements(newAnnouncements);
    message.success('公告状态已更新');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'blue';
      case 'warning': return 'orange';
      case 'success': return 'green';
      case 'error': return 'red';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'info': return '信息';
      case 'warning': return '警告';
      case 'success': return '成功';
      case 'error': return '错误';
      default: return type;
    }
  };

  return (
    <div>
      <Card title={t('common.systemSettings')} style={{ marginBottom: 24 }}>
        <Form layout="vertical">
          <Form.Item label="语言设置">
            <Select value={locale} onChange={handleLanguageChange} style={{ width: 120 }}>
              <Option value="zh">中文</Option>
              <Option value="en">English</Option>
            </Select>
          </Form.Item>
          <Form.Item label="主题设置">
            <Switch
              checked={theme === 'dark'}
              onChange={handleThemeChange}
              checkedChildren="暗黑模式"
              unCheckedChildren="明亮模式"
            />
          </Form.Item>
        </Form>
      </Card>

      {/* 密码重置卡片 */}
      <Card 
        title="密码管理" 
        style={{ marginBottom: 24 }}
        extra={
          <Button 
            type="primary" 
            icon={<LockOutlined />} 
            onClick={() => setPasswordModalVisible(true)}
          >
            重置密码
          </Button>
        }
      >
        <p style={{ color: '#666', marginBottom: 0 }}>
          您可以在这里重置您的登录密码。重置密码需要验证当前密码以确保安全性。
        </p>
      </Card>

      <Card 
        title="公告管理" 
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加公告
          </Button>
        }
      >
        <List
          dataSource={announcements}
          renderItem={item => (
            <List.Item
              actions={[
                <Button 
                  key="edit" 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={() => handleEdit(item)}
                >
                  编辑
                </Button>,
                <Popconfirm
                  key="delete"
                  title="确定要删除这个公告吗？"
                  onConfirm={() => handleDelete(item.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
                <Switch
                  key="active"
                  checked={item.active}
                  onChange={() => handleToggleActive(item.id)}
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={getTypeColor(item.type)}>
                      {getTypeLabel(item.type)}
                    </Tag>
                    {item.title}
                    {!item.active && <Tag color="default">已禁用</Tag>}
                  </Space>
                }
                description={
                  <div>
                    <p>{item.content}</p>
                    <small style={{ color: '#999' }}>
                      创建时间: {new Date(item.createdAt).toLocaleString()}
                    </small>
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无公告' }}
        />
      </Card>

      {/* 密码重置模态框 */}
      <Modal
        title="重置密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form 
          form={passwordForm} 
          layout="vertical" 
          onFinish={handlePasswordReset}
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[
              { required: true, message: '请输入当前密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Password placeholder="请输入当前密码" />
          </Form.Item>
          
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Password placeholder="请输入新密码" />
          </Form.Item>
          
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Password placeholder="请再次输入新密码" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认重置
              </Button>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingAnnouncement ? '编辑公告' : '添加公告'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingAnnouncement(null);
          form.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleNoticeSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="type" label="类型" initialValue="info">
            <Select>
              <Option value="info">信息</Option>
              <Option value="warning">警告</Option>
              <Option value="success">成功</Option>
              <Option value="error">错误</Option>
            </Select>
          </Form.Item>
          <Form.Item name="active" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAnnouncement ? '更新' : '添加'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingAnnouncement(null);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SystemSettingsPage; 