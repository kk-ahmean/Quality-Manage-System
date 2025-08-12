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
  List,
  Descriptions,
  Alert,
  
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined,
  CrownOutlined
} from '@ant-design/icons'
import { useUserStore } from '../stores/userStore'
import { useAuthStore } from '../stores/authStore'
import { logSystemActivity } from '../stores/authStore'
import { Team, User, Permission } from '../types/user'
import { canShowDeleteButton, hasPermission } from '../utils/permissions'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const TeamManagementPage: React.FC = () => {
  const {
    teams,
    users,
    loading,
    error,
    fetchTeams,
    fetchUsers,
    createTeam,
    updateTeam,
    deleteTeam,
    clearError,
    logUserActivity
  } = useUserStore()
  
  const { user: currentUser } = useAuthStore()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    console.log('开始加载团队管理页面数据...')
    // 确保先加载用户数据，再加载团队数据
    const loadData = async () => {
      try {
        await fetchUsers()
        console.log('用户数据加载完成，用户数量:', users.length)
        await fetchTeams(pagination.current, pagination.pageSize, (paginationInfo) => {
          console.log('收到分页信息:', paginationInfo)
          setPagination(prev => ({
            ...prev,
            total: paginationInfo.total,
            current: paginationInfo.current,
            pageSize: paginationInfo.pageSize
          }))
        })
      } catch (error) {
        console.error('数据加载失败:', error)
      }
    }
    loadData()
    clearError()
  }, [fetchTeams, fetchUsers, clearError])

  // 添加分页状态调试
  useEffect(() => {
    console.log('分页状态变化:', pagination)
  }, [pagination])


  // 添加调试日志
  useEffect(() => {
    console.log('团队管理页面数据:', {
      teams: teams,
      users: users,
      teamsCount: teams.length,
      usersCount: users.length,
      loading: loading,
      error: error
    })
    
    // 检查用户数据格式
    if (users.length > 0) {
      console.log('用户数据示例:', users.slice(0, 3).map(u => ({
        id: u.id,
        _id: u._id,
        name: u.name,
        role: u.role
      })))
    }
    
    // 检查团队数据格式
    if (teams.length > 0) {
      console.log('团队数据示例:', teams.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        leader: t.leader,
        leaderInfo: t.leaderInfo,
        members: t.members?.slice(0, 2) || []
      })))
    }
  }, [teams, users, loading, error])

  useEffect(() => {
    if (error) {
      message.error(error)
    }
  }, [error])

  const handleAddTeam = () => {
    setEditingTeam(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team)
    
    // 处理成员数据格式 - 提取用户ID
    const memberIds = team.members?.map(member => {
      // TeamMember类型中user字段是string
      if (typeof member === 'string') {
        return member
      } else if (member && typeof member === 'object') {
        return member.user
      }
      return null
    }).filter(id => id) || []
    
    console.log('编辑团队数据:', {
      team,
      memberIds,
      leader: team.leader,
      members: team.members,
      users: users.map(u => ({ id: u.id, _id: u._id, name: u.name }))
    })
    
    // 确保表单字段正确设置
    const formData = {
      name: team.name,
      description: team.description || '',
      members: memberIds,
      leader: team.leader
    }
    
    console.log('设置表单数据:', formData)
    
    // 先重置表单，再设置值
    form.resetFields()
    
    // 直接设置表单值，不等待用户数据
    setTimeout(() => {
      try {
        form.setFieldsValue(formData)
        console.log('表单值已设置成功')
      } catch (error) {
        console.error('设置表单值失败:', error)
        // 如果设置失败，再次尝试
        setTimeout(() => {
          form.setFieldsValue(formData)
          console.log('表单值第二次设置')
        }, 200)
      }
    }, 100)
    
    setIsModalVisible(true)
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      const teamToDelete = teams.find(team => team.id === teamId)
      await deleteTeam(teamId)
      message.success('团队删除成功')
      
      // 重新加载当前页数据
      fetchTeams(pagination.current, pagination.pageSize, (paginationData) => {
        setPagination(prev => ({
          ...prev,
          total: paginationData.total,
          current: paginationData.current,
          pageSize: paginationData.pageSize
        }))
      })
      
      // 记录活动日志
      if (currentUser) {
        logSystemActivity(
          currentUser.id,
          'DELETE_TEAM',
          `删除团队: ${teamToDelete?.name || '未知团队'}`
        )
      }
    } catch (err) {
      // 错误已在store中处理
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      console.log('提交的团队数据:', values)
      
      if (editingTeam) {
        // 更新团队 - 确保数据格式正确
        const updateData = {
          name: values.name,
          description: values.description || '',
          leader: values.leader,
          members: values.members || []
        }
        
        console.log('更新团队数据:', updateData)
        
        await updateTeam(editingTeam.id, updateData)
        message.success('团队更新成功')
        
        // 重新加载当前页数据
        fetchTeams(pagination.current, pagination.pageSize, (paginationData) => {
          setPagination(prev => ({
            ...prev,
            total: paginationData.total,
            current: paginationData.current,
            pageSize: paginationData.pageSize
          }))
        })
        
        // 记录活动日志
        if (currentUser) {
          logSystemActivity(
            currentUser.id,
            'UPDATE_TEAM',
            `更新团队: ${values.name}`
          )
        }
      } else {
        // 创建团队
        const createData = {
          name: values.name,
          description: values.description || '',
          leader: values.leader,
          creator: currentUser?.id || '',
          members: values.members || []
        }
        
        await createTeam(createData)
        message.success('团队创建成功')
        
        // 重新加载当前页数据
        fetchTeams(pagination.current, pagination.pageSize, (paginationData) => {
          setPagination(prev => ({
            ...prev,
            total: paginationData.total,
            current: paginationData.current,
            pageSize: paginationData.pageSize
          }))
        })
        
        // 记录活动日志
        if (currentUser) {
          logSystemActivity(
            currentUser.id,
            'CREATE_TEAM',
            `创建团队: ${values.name}`
          )
        }
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (err) {
      console.error('团队操作失败:', err)
      // 表单验证错误或API错误已在store中处理
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingTeam(null)
    console.log('团队表单已重置')
  }

  const handleTableChange = (paginationInfo: any) => {
    console.log('分页变化:', paginationInfo)
    const newPagination = {
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
      total: paginationInfo.total || pagination.total
    }
    setPagination(newPagination)
    
    // 重新加载数据
    fetchTeams(newPagination.current, newPagination.pageSize, (paginationData) => {
      setPagination(prev => ({
        ...prev,
        total: paginationData.total,
        current: paginationData.current,
        pageSize: paginationData.pageSize
      }))
    })
  }

  const getName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : '未知用户';
  };

  const getUserRole = (userId: string) => {
    try {
      const user = users.find(u => (u.id || u._id) === userId)
      if (!user) return '未知'
      
      const roleTexts: Record<string, string> = {
        admin: '管理员',
        product_engineer: '产品工程师',
        project_engineer: '项目工程师',
        developer: '开发者',
        dqe: 'DQE',
        tester: '测试员'
      }
      return roleTexts[user.role] || '未知'
    } catch (err) {
      console.error('获取用户角色错误:', err)
      return '未知'
    }
  }

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
      title: '团队信息',
      key: 'team',
      render: (record: Team) => (
        <Space>
          <Avatar icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.description || '暂无描述'}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '负责人',
      key: 'leader',
      render: (record: Team) => {
        console.log('渲染负责人:', { 
          record, 
          leaderId: record.leader, 
          leaderInfo: record.leaderInfo,
          users: users.map(u => ({ id: u.id, _id: u._id, name: u.name }))
        })
        
        // 优先使用后端返回的leaderInfo
        if (record.leaderInfo && record.leaderInfo.name) {
          return (
            <Space>
              <Avatar icon={<UserOutlined />} size="small" />
              <span>{record.leaderInfo.name}</span>
              <Tag color="gold" icon={<CrownOutlined />}>负责人</Tag>
            </Space>
          )
        }
        
        // 如果没有leaderInfo，则在前端查找
        const leader = users.find(u => {
          const userId = u.id || u._id;
          const leaderId = record.leader;
          return userId === leaderId || 
                 userId === leaderId?.toString() ||
                 userId?.toString() === leaderId ||
                 userId?.toString() === leaderId?.toString();
        });
        
        return leader ? (
          <Space>
            <Avatar icon={<UserOutlined />} size="small" />
            <span>{leader.name}</span>
            <Tag color="gold" icon={<CrownOutlined />}>负责人</Tag>
          </Space>
        ) : (
          <Space>
            <Avatar icon={<UserOutlined />} size="small" />
            <span style={{ color: '#999' }}>未知用户 (ID: {record.leader || '无'})</span>
          </Space>
        )
      }
    },
    {
      title: '成员数量',
      key: 'memberCount',
      render: (record: Team) => (
        <Tag color="blue">{record.members?.length || 0} 人</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Team) => (
        <Space size="small">
          {(hasPermission(
            (currentUser?.permissions || []) as Permission[],
            'team:update'
          ) || record.creator === currentUser?.id || record.creator === currentUser?._id) && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditTeam(record)}
            >
              编辑
            </Button>
          )}
          {canShowDeleteButton(
            (currentUser?.permissions || []) as Permission[],
            currentUser?.id || '',
            record.creator || '',
            'team'
          ) && (
            <Popconfirm
              title="确定要删除这个团队吗？"
              onConfirm={() => handleDeleteTeam(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  const expandedRowRender = (record: Team) => {
    console.log('展开团队详情:', { 
      record, 
      members: record.members, 
      users: users.map(u => ({ id: u.id, _id: u._id, name: u.name }))
    })
    
    // 安全处理members数组
    const members = record.members || []
    
    // 优先使用后端返回的userInfo，如果没有则在前端查找
    const teamMembers = members.map(member => {
      if (member.userInfo && member.userInfo.name) {
        return {
          id: member.userInfo.id,
          name: member.userInfo.name,
          email: member.userInfo.email,
          role: member.userInfo.role,
          department: ''
        }
      } else {
        const user = users.find(u => {
          const userId = u.id || u._id;
          const memberUserId = member.user;
          return userId === memberUserId || userId === memberUserId?.toString();
        });
        return user || null
      }
    }).filter(Boolean)
    
    console.log('过滤后的团队成员:', teamMembers)
    
    return (
      <div style={{ padding: '16px' }}>
        <Descriptions title="团队成员" column={1} size="small">
          <Descriptions.Item label="成员列表">
            {teamMembers.length > 0 ? (
              <List
                size="small"
                dataSource={teamMembers}
                renderItem={(member) => (
                  <List.Item>
                    <Space>
                      <Avatar icon={<UserOutlined />} size="small" />
                      <span>{member.name}</span>
                      <Tag color="blue">{getUserRole(member.id)}</Tag>
                      <Tag color={member.department ? 'green' : 'default'}>
                        {member.department || '未分配部门'}
                      </Tag>
                      {(record.leader === member.id || record.leader === (member as any)._id) && (
                        <Tag color="gold" icon={<CrownOutlined />}>负责人</Tag>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                暂无成员数据 (团队成员ID: {members.map(m => m.user).join(', ')})
              </div>
            )}
          </Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  // 错误边界处理
  if (error) {
    return (
      <div>
        <Card title="团队管理">
          <Alert
            message="加载错误"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={() => {
                clearError()
                fetchTeams(pagination.current, pagination.pageSize, (paginationData) => {
                  setPagination(prev => ({
                    ...prev,
                    total: paginationData.total,
                    current: paginationData.current,
                    pageSize: paginationData.pageSize
                  }))
                })
                fetchUsers()
              }}>
                重试
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 200px)' }}>
      <Card title="团队管理" extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              clearError()
              fetchTeams(pagination.current, pagination.pageSize, (paginationData) => {
                setPagination(prev => ({
                  ...prev,
                  total: paginationData.total,
                  current: paginationData.current,
                  pageSize: paginationData.pageSize
                }))
              })
              fetchUsers()
            }}
            loading={loading}
          >
            刷新
          </Button>
          {(() => {
            const hasCreatePermission = hasPermission(
              (currentUser?.permissions || []) as Permission[],
              'team:create'
            );
            console.log('团队创建权限检查:', {
              currentUser: currentUser ? {
                id: currentUser.id,
                _id: currentUser._id,
                role: currentUser.role,
                permissions: currentUser.permissions
              } : null,
              hasCreatePermission
            });
            return hasCreatePermission;
          })() && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTeam}
            >
              添加团队
            </Button>
          )}
        </Space>
      }>
        {/* 团队表格 */}
        <Table
          columns={columns}
          dataSource={teams || []}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => {
              const newPagination = {
                current: page,
                pageSize: pageSize || pagination.pageSize,
                total: pagination.total
              }
              setPagination(newPagination)
              fetchTeams(newPagination.current, newPagination.pageSize, (paginationData) => {
                setPagination(prev => ({
                  ...prev,
                  total: paginationData.total,
                  current: paginationData.current,
                  pageSize: paginationData.pageSize
                }))
              })
            }
          }}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => {
              const members = record.members || []
              return members.length > 0
            }
          }}
        />
      </Card>

      {/* 添加/编辑团队模态框 */}
      <Modal
        title={editingTeam ? '编辑团队' : '添加团队'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="团队名称"
            rules={[{ required: true, message: '请输入团队名称' }]}
          >
            <Input placeholder="请输入团队名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="团队描述"
          >
            <TextArea
              rows={3}
              placeholder="请输入团队描述"
            />
          </Form.Item>

          <Form.Item
            name="leader"
            label="团队负责人"
            rules={[{ required: true, message: '请选择团队负责人' }]}
          >
            <Select
              placeholder="请选择团队负责人"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              notFoundContent="暂无用户数据"
              optionFilterProp="children"
            >
              {users.map(user => (
                <Option key={user.id || user._id} value={user.id || user._id}>
                  {user.name} ({getUserRole(user.id || user._id)})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="members"
            label="团队成员"
            rules={[{ required: true, message: '请选择团队成员' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择团队成员"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              notFoundContent="暂无用户数据"
              optionFilterProp="children"
            >
              {users.map(user => (
                <Option key={user.id || user._id} value={user.id || user._id}>
                  {user.name} ({getUserRole(user.id || user._id)})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TeamManagementPage 