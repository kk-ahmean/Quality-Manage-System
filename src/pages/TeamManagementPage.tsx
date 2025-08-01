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
  Descriptions
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
import { Team, User } from '../types/user'
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
    clearError
  } = useUserStore()

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTeams()
    fetchUsers()
    clearError()
  }, [fetchTeams, fetchUsers, clearError])

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
    form.setFieldsValue({
      name: team.name,
      description: team.description,
      members: team.members,
      leader: team.leader
    })
    setIsModalVisible(true)
  }

  const handleDeleteTeam = async (teamId: string) => {
    try {
      await deleteTeam(teamId)
      message.success('团队删除成功')
    } catch (err) {
      // 错误已在store中处理
    }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingTeam) {
        // 更新团队
        await updateTeam(editingTeam.id, values)
        message.success('团队更新成功')
      } else {
        // 创建团队
        await createTeam(values)
        message.success('团队创建成功')
      }
      
      setIsModalVisible(false)
      form.resetFields()
    } catch (err) {
      // 表单验证错误或API错误已在store中处理
    }
  }

  const handleModalCancel = () => {
    setIsModalVisible(false)
    form.resetFields()
    setEditingTeam(null)
  }

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : '未知用户'
  }

  const getUserRole = (userId: string) => {
    const user = users.find(u => u.id === userId)
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
  }

  const columns = [
    {
      title: '编号',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <span style={{ color: '#666', fontWeight: 'bold' }}>
          {index + 1}
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
        const leader = users.find(u => u.id === record.leader)
        return leader ? (
          <Space>
            <Avatar icon={<UserOutlined />} size="small" />
            <span>{leader.name}</span>
            <Tag color="gold" icon={<CrownOutlined />}>负责人</Tag>
          </Space>
        ) : '未知'
      }
    },
    {
      title: '成员数量',
      key: 'memberCount',
      render: (record: Team) => (
        <Tag color="blue">{record.members.length} 人</Tag>
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
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTeam(record)}
          >
            编辑
          </Button>
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
        </Space>
      )
    }
  ]

  const expandedRowRender = (record: Team) => {
    const teamMembers = users.filter(user => record.members.includes(user.id))
    
    return (
      <div style={{ padding: '16px' }}>
        <Descriptions title="团队成员" column={1} size="small">
          <Descriptions.Item label="成员列表">
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
                    {record.leader === member.id && (
                      <Tag color="gold" icon={<CrownOutlined />}>负责人</Tag>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </Descriptions.Item>
        </Descriptions>
      </div>
    )
  }

  return (
    <div>
      <Card title="团队管理" extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchTeams()}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddTeam}
          >
            添加团队
          </Button>
        </Space>
      }>
        {/* 团队表格 */}
        <Table
          columns={columns}
          dataSource={teams}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.members.length > 0
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
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({getUserRole(user.id)})
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
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({getUserRole(user.id)})
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