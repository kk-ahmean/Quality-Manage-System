import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Tag,
  Avatar,
  Tooltip,
  InputNumber,
  Divider,
  Checkbox,
  Dropdown,
  Menu,
  Badge,
  Tabs,
  List,
  Descriptions,
  Switch
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  SettingOutlined,
  MoreOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined,
  ExportOutlined,
  ImportOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { User, UserRole, UserStatus, CreateUserRequest, UpdateUserRequest, Permission } from '../types/user'
import { logSystemActivity } from '../stores/authStore'
import { useAuthStore } from '../stores/authStore'
import { canShowDeleteButton, hasPermission } from '../utils/permissions'
import dayjs from 'dayjs'


const { Option } = Select
const { TabPane } = Tabs

const UserManagementPage: React.FC = () => {
  const {
    users,
    loading,
    error,
    pagination,
    selectedUsers,
    activityLogs,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    clearError,
    setSelectedUsers,
    batchOperation,
    getRolePermissions,
    updateUserPermissions,
    fetchUserActivityLogs
  } = useUserStore()

  const { user: currentUser } = useAuthStore()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false)
  const [isActivityModalVisible, setIsActivityModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [selectedUserForPermission, setSelectedUserForPermission] = useState<User | null>(null)
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<User | null>(null)
  const [searchText, setSearchText] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [form] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [permissionForm] = Form.useForm()

  useEffect(() => {
    fetchUsers()
    clearError()
  }, [fetchUsers, clearError])

  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

  const handleAddUser = () => {
    setEditingUser(null)
    form.resetFields()
    form.setFieldsValue({ status: 'active' }) // 设置默认状态
    setIsModalVisible(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    
    // 调试日志
    console.log('编辑用户数据:', {
      user,
      phone: user.phone,
      department: user.department,
      position: user.position
    })
    
    form.setFieldsValue({
      name: user.name, // 显示姓名但不允许编辑
      email: user.email,
      phone: user.phone || '', // 确保手机号字段有值
      role: user.role,
      department: user.department || '', // 确保部门字段有值
      position: user.position || '', // 确保职位字段有值
      status: user.status
    })
    setIsModalVisible(true)
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const userToDelete = users.find(u => u.id === userId)
      await deleteUser(userId)
      
      // 记录删除用户日志
      if (currentUser && userToDelete) {
        logSystemActivity(currentUser.id, 'DELETE_USER', `删除用户: ${userToDelete.name}`)
      }
      
      message.success('用户删除成功')
    } catch (error) {
      message.error('用户删除失败')
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingUser) {
        // 更新用户 - 不更新用户名和姓名
        const updateData = {
          id: editingUser.id,
          email: values.email,
          phone: values.phone || '',
          role: values.role,
          department: values.department || '',
          position: values.position || '',
          status: values.status
        }
        
        console.log('更新用户数据:', updateData)
        
        await updateUser(updateData)
        
        // 记录更新用户日志
        if (currentUser) {
          logSystemActivity(currentUser.id, 'UPDATE_USER', `更新用户信息: ${editingUser.name}`)
        }
        
        message.success('用户更新成功')
      } else {
        // 创建用户 - 统一使用name字段作为用户名
        // 准备用户数据
        const userData = {
          ...values,
          name: values.name, // 使用name字段
          // 移除username字段，统一使用name
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // 记录系统日志
        logSystemActivity(currentUser.id, 'CREATE_USER', `创建新用户: ${values.name}`)
        
        await createUser(userData)
        
        // 记录创建用户日志
        if (currentUser) {
          logSystemActivity(currentUser.id, 'CREATE_USER', `创建新用户: ${values.name}`)
        }
        
        message.success('用户创建成功')
      }
      
      setIsModalVisible(false)
      setEditingUser(null) // 清空编辑状态
      form.resetFields()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    setEditingUser(null) // 清空编辑状态
    form.resetFields()
    console.log('用户表单已重置')
  }

  const handleSearch = async (values: any) => {
    const filters: any = {}
    if (searchText) filters.search = searchText
    if (roleFilter) filters.role = roleFilter
    if (statusFilter) filters.status = statusFilter
    
    await fetchUsers(filters)
  }

  const handleSearchInput = (value: string) => {
    setSearchText(value)
  }

  const handleSearchSubmit = () => {
    const filters: any = {}
    if (searchText) filters.search = searchText
    if (roleFilter) filters.role = roleFilter
    if (statusFilter) filters.status = statusFilter
    
    fetchUsers(filters)
  }

  const handleResetFilters = () => {
    setSearchText('')
    setRoleFilter('')
    setStatusFilter('')
    fetchUsers()
  }

  const handleTableChange = (pagination: any) => {
    fetchUsers(undefined, pagination.current, pagination.pageSize)
  }

  const handleRowSelection = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedUsers(selectedRowKeys as string[])
    }
  }

  const handleBatchOperation = async (operation: 'enable' | 'disable' | 'delete' | 'changeRole') => {
    if (selectedUsers.length === 0) {
      message.warning('请选择要操作的用户')
      return
    }

    try {
      await batchOperation({
        operation,
        userIds: selectedUsers
      })
      
      // 记录批量操作日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'BATCH_OPERATION', `批量操作: ${operation}, 影响用户数: ${selectedUsers.length}`)
      }
      
      message.success('批量操作成功')
      setSelectedUsers([])
    } catch (error) {
      message.error('批量操作失败')
    }
  }

  const handlePermissionEdit = (user: User) => {
    setSelectedUserForPermission(user)
    permissionForm.setFieldsValue({
      permissions: user.permissions || []
    })
    setIsPermissionModalVisible(true)
  }

  const handlePermissionModalOk = async () => {
    try {
      const values = await permissionForm.validateFields()
      
      if (selectedUserForPermission) {
        await updateUserPermissions(selectedUserForPermission.id, values.permissions)
        
        // 记录权限更新日志
        if (currentUser) {
          logSystemActivity(currentUser.id, 'UPDATE_PERMISSIONS', `更新用户权限: ${selectedUserForPermission.name}`)
        }
        
        message.success('权限更新成功')
        setIsPermissionModalVisible(false)
        setSelectedUserForPermission(null) // 清空选中的用户
        permissionForm.resetFields()
      }
    } catch (error) {
      message.error('权限更新失败')
    }
  }

  const handlePermissionModalCancel = () => {
    setIsPermissionModalVisible(false)
    setSelectedUserForPermission(null) // 清空选中的用户
    permissionForm.resetFields()
  }

  const handleActivityView = async (user: User) => {
    setSelectedUserForActivity(user)
    await fetchUserActivityLogs(user.id)
    setIsActivityModalVisible(true)
  }

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'red',
      product_engineer: 'blue',
      project_engineer: 'green',
      developer: 'orange',
      dqe: 'purple',
      tester: 'cyan'
    }
    return colors[role]
  }

  const getRoleText = (role: UserRole) => {
    const texts: Record<UserRole, string> = {
      admin: '管理员',
      product_engineer: '产品工程师',
      project_engineer: '项目工程师',
      developer: '开发者',
      dqe: 'DQE',
      tester: '测试员'
    }
    return texts[role]
  }

  const getPermissionText = (permission: Permission) => {
    const texts: Record<Permission, string> = {
      // 用户管理权限
      'user:read': '查看用户',
      'user:create': '创建用户',
      'user:update': '更新用户',
      'user:delete': '删除用户',
      // 团队管理权限
      'team:read': '查看团队',
      'team:create': '创建团队',
      'team:update': '更新团队',
      'team:delete': '删除团队',
      // Bug管理权限
      'bug:read': '查看Bug',
      'bug:create': '创建Bug',
      'bug:update': '更新Bug',
      'bug:delete': '删除Bug',
      // 任务管理权限
      'task:read': '查看任务',
      'task:create': '创建任务',
      'task:update': '更新任务',
      'task:delete': '删除任务',
      // 项目管理权限
      'project:read': '查看项目',
      'project:create': '创建项目',
      'project:update': '更新项目',
      'project:delete': '删除项目',
      // 系统权限
      'dashboard:read': '查看仪表盘',
      'system:settings': '系统设置'
    }
    return texts[permission] || permission
  }

  const batchMenuItems = [
    {
      key: 'enable',
      label: '批量启用',
      icon: <UnlockOutlined />
    },
    {
      key: 'disable',
      label: '批量禁用',
      icon: <LockOutlined />
    },
    {
      key: 'delete',
      label: '批量删除',
      icon: <DeleteOutlined />,
      danger: true
    }
  ]

  const columns = [
    {
      title: '编号',
      key: 'index',
      width: 60,
      render: (_: any, record: any) => (
        <span style={{ color: '#666', fontWeight: 'bold' }}>
          {record.sequenceNumber || '-'}
        </span>
      )
    },
    {
      title: '用户信息',
      key: 'user',
      render: (record: User) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            style={{ backgroundColor: record.status === 'active' ? '#52c41a' : '#d9d9d9' }}
          />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
              @{record.name}
            </div>
            <div style={{ fontSize: '11px', color: '#999' }}>
              创建于 {dayjs(record.createdAt).format('YYYY-MM-DD')}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <Tooltip title={email}>
          <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {email}
          </span>
        </Tooltip>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      )
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      render: (department: string) => (
        <Tag color="blue" style={{ margin: 0 }}>
          {department || '未分配'}
        </Tag>
      )
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      render: (position: string) => (
        <Tag color="purple" style={{ margin: 0 }}>
          {position || '未分配'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: UserStatus) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (lastLoginAt: string) => 
        lastLoginAt ? dayjs(lastLoginAt).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: User) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => handleEditUser(record)
              },
              {
                key: 'permission',
                label: '权限',
                icon: <SettingOutlined />,
                onClick: () => handlePermissionEdit(record)
              },
              {
                key: 'activity',
                label: '活动',
                icon: <HistoryOutlined />,
                onClick: () => handleActivityView(record)
              },
              {
                type: 'divider'
              },
              ...(hasPermission(
                (currentUser?.permissions || []) as Permission[],
                'user:delete'
              ) ? [{
                key: 'delete',
                label: (
                  <Popconfirm
                    title="确定要删除这个用户吗？"
                    description="删除后无法恢复，请谨慎操作。"
                    onConfirm={() => handleDeleteUser(record.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <span style={{ color: '#ff4d4f' }}>删除</span>
                  </Popconfirm>
                ),
                icon: <DeleteOutlined />,
                danger: true
              }] : [])
            ]
          }}
          >
          <Button type="link" size="small" icon={<MoreOutlined />}>
            操作
          </Button>
        </Dropdown>
      )
    }
  ]

  return (
    <div>
      <Card
        className="user-management-card"
        title="用户管理"
        extra={
          <Space>
            <Button onClick={() => fetchUsers()} loading={loading} icon={<ReloadOutlined />}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>添加用户</Button>
          </Space>
        }
      >
        {/* 搜索表单 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索用户名、姓名或邮箱"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearchSubmit()}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择角色"
              value={roleFilter}
              onChange={setRoleFilter}
              allowClear
              style={{ width: '100%' }}
              notFoundContent="暂无角色数据"
              showSearch={false}
            >
              <Option value="admin">管理员</Option>
              <Option value="product_engineer">产品工程师</Option>
              <Option value="project_engineer">项目工程师</Option>
              <Option value="developer">开发者</Option>
              <Option value="dqe">DQE</Option>
              <Option value="tester">测试员</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
              notFoundContent="暂无状态数据"
              showSearch={false}
            >
              <Option value="active">启用</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button
                icon={<SearchOutlined />}
                onClick={handleSearchSubmit}
              >
                搜索
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}

          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 添加/编辑用户模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: 'active' }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="用户名"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3个字符' }
                ]}
              >
                <Input disabled={!!editingUser} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input disabled={!!editingUser} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select>
                  <Option value="admin">管理员</Option>
                  <Option value="product_engineer">产品工程师</Option>
                  <Option value="project_engineer">项目工程师</Option>
                  <Option value="developer">开发者</Option>
                  <Option value="dqe">DQE</Option>
                  <Option value="tester">测试员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select>
                  <Option value="active">启用</Option>
                  <Option value="inactive">禁用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="department"
                label="部门"
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="position"
                label="职位"
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 权限管理模态框 */}
      <Modal
        title={`权限管理 - ${selectedUserForPermission?.name}`}
        open={isPermissionModalVisible}
        onOk={handlePermissionModalOk}
        onCancel={handlePermissionModalCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={permissionForm}
          layout="vertical"
        >
          <Form.Item
            name="permissions"
            label="用户权限"
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Checkbox value="user:read">查看用户</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="user:create">创建用户</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="user:update">更新用户</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="user:delete">删除用户</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="team:read">查看团队</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="team:create">创建团队</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="team:update">更新团队</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="team:delete">删除团队</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="bug:read">查看Bug</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="bug:create">创建Bug</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="bug:update">更新Bug</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="bug:delete">删除Bug</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="task:read">查看任务</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="task:create">创建任务</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="task:update">更新任务</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="task:delete">删除任务</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="project:read">查看项目</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="project:create">创建项目</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="project:update">更新项目</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="project:delete">删除项目</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="dashboard:read">查看仪表盘</Checkbox>
                </Col>
                <Col span={12}>
                  <Checkbox value="system:settings">系统设置</Checkbox>
                </Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户活动日志模态框 */}
      <Modal
        title={`用户活动日志 - ${selectedUserForActivity?.name}`}
        open={isActivityModalVisible}
        onCancel={() => setIsActivityModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          loading={loading}
          dataSource={activityLogs}
          renderItem={(log) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<HistoryOutlined />} />}
                title={log.description}
                description={
                  <Space direction="vertical" size="small">
                    <span>操作: {log.action}</span>
                    <span>IP地址: {log.ipAddress}</span>
                    <span>时间: {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>


    </div>
  )
}

export default UserManagementPage 