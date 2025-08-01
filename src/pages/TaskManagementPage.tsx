import React, { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Tag,
  Progress,
  Dropdown,
  Checkbox,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popconfirm,
  Upload,
  List,
  Avatar,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  MoreOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  UploadOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { useTaskStore } from '../stores/taskStore'
import { useUserStore } from '../stores/userStore'
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '../types/task'
import { User } from '../types/user'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

const TaskManagementPage: React.FC = () => {
  const {
    tasks,
    loading,
    statistics,
    pagination,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    assignTask,
    updateTaskProgress,
    batchOperation,
    getStatistics,
    setFilters,
    resetFilters
  } = useTaskStore()

  const { users } = useUserStore()

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [progressModalVisible, setProgressModalVisible] = useState(false)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | ''>('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const [createForm] = Form.useForm()
  const [editForm] = Form.useForm()
  const [assignForm] = Form.useForm()
  const [progressForm] = Form.useForm()

  useEffect(() => {
    fetchTasks()
    getStatistics()
    // 确保获取用户数据
    const userStore = useUserStore.getState()
    if (userStore.users.length === 0) {
      userStore.fetchUsers()
    }
  }, [])

  // 获取用户名称的辅助函数
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.name : userId
  }

  // 状态映射
  const statusMap = {
    todo: { text: '待处理', color: 'default' },
    in_progress: { text: '进行中', color: 'processing' },
    review: { text: '待审核', color: 'warning' },
    completed: { text: '已完成', color: 'success' },
    cancelled: { text: '已取消', color: 'error' }
  }

  // 优先级映射
  const priorityMap = {
    P0: { text: 'P0', color: 'red' },
    P1: { text: 'P1', color: 'orange' },
    P2: { text: 'P2', color: 'blue' },
    P3: { text: 'P3', color: 'green' }
  }

  // 表格列定义
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
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      width: 350,
      render: (title: string, record: Task) => (
        <div style={{ maxWidth: 350 }}>
          <div style={{ 
            fontWeight: 'bold', 
            marginBottom: 4, 
            fontSize: '14px',
            color: record.status === 'completed' ? '#52c41a' : 
                   record.status === 'cancelled' ? '#999' : '#000'
          }}>
            {title}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: '#666',
            lineHeight: '1.4',
            marginBottom: '4px'
          }}>
            {record.description.length > 80 
              ? `${record.description.substring(0, 80)}...` 
              : record.description
            }
          </div>
          {record.tags && record.tags.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              {record.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} color="blue" style={{ margin: '0 2px 0 0', fontSize: '11px' }}>
                  {tag}
                </Tag>
              ))}
              {record.tags.length > 3 && (
                <Tag color="default" style={{ fontSize: '11px' }}>+{record.tags.length - 3}</Tag>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: TaskPriority) => (
        <Tag color={priorityMap[priority].color}>
          {priorityMap[priority].text}
        </Tag>
      )
    },
    {
      title: '负责人',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 100,
      render: (assignee: string, record: Task) => {
        // 通过 assignee ID 查找用户名
        const displayName = assignee ? getUserName(assignee) : '未分配'
        return (
          <div style={{ textAlign: 'center' }}>
            <Avatar 
              size="small" 
              icon={<UserOutlined />}
              style={{ backgroundColor: record.status === 'completed' ? '#52c41a' : '#1890ff' }}
            />
            <div style={{ fontSize: '12px', marginTop: '2px' }}>{displayName}</div>
          </div>
        )
      }
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 100,
      render: (progress: number, record: Task) => (
        <div style={{ textAlign: 'center' }}>
          <Progress 
            percent={progress} 
            size="small" 
            status={progress >= 100 ? 'success' : undefined}
            strokeColor={record.status === 'completed' ? '#52c41a' : '#1890ff'}
            showInfo={false}
          />
          <div style={{ 
            fontSize: '11px', 
            color: '#666', 
            marginTop: '2px'
          }}>
            {progress}%
          </div>
        </div>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 100,
      render: (dueDate: string, record: Task) => {
        const isOverdue = dayjs(dueDate).isBefore(dayjs(), 'day')
        const isCompleted = record.status === 'completed'
        return (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              color: isCompleted ? '#52c41a' : isOverdue ? '#ff4d4f' : 'inherit',
              fontSize: '13px',
              fontWeight: 'bold'
            }}>
              {dayjs(dueDate).format('MM-DD')}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#999',
              marginTop: '2px'
            }}>
              {dayjs(dueDate).format('YYYY')}
            </div>
          </div>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (createdAt: string) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
            {dayjs(createdAt).format('MM-DD')}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#999',
            marginTop: '2px'
          }}>
            {dayjs(createdAt).format('YYYY')}
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Task) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Dropdown
            menu={{
              items: [
                {
                  key: 'assign',
                  label: '分配任务',
                  icon: <UserOutlined />,
                  onClick: () => handleAssign(record)
                },
                {
                  key: 'progress',
                  label: '更新进度',
                  icon: <Progress />,
                  onClick: () => handleUpdateProgress(record)
                },
                ...(record.status === 'review' ? [{
                  key: 'review',
                  label: '任务验收',
                  icon: <EyeOutlined />,
                  onClick: () => handleReview(record)
                }] : []),
                {
                  type: 'divider'
                },
                {
                  key: 'delete',
                  label: '删除任务',
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleDelete(record)
                }
              ]
            }}
          >
            <Button type="link" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ]

  // 处理创建任务
  const handleCreate = () => {
    setCreateModalVisible(true)
    createForm.resetFields()
  }

  const handleCreateSubmit = async (values: any) => {
    try {
      const taskData: CreateTaskRequest = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        assignee: values.assignee,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        tags: values.tags || [],
        estimatedHours: values.estimatedHours
      }
      
      await createTask(taskData)
      message.success('任务创建成功')
      setCreateModalVisible(false)
      fetchTasks()
      getStatistics()
    } catch (error) {
      message.error('任务创建失败')
    }
  }

  // 处理编辑任务
  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setEditModalVisible(true)
    editForm.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      progress: task.progress, // 添加进度字段
      assignee: task.assignee,
      dueDate: dayjs(task.dueDate),
      tags: task.tags,
      estimatedHours: task.estimatedHours
    })
  }

  const handleEditSubmit = async (values: any) => {
    if (!selectedTask) return
    
    try {
      const updateData: UpdateTaskRequest = {
        id: selectedTask.id,
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        progress: values.progress, // 添加进度字段
        assignee: values.assignee,
        dueDate: values.dueDate.format('YYYY-MM-DD'),
        tags: values.tags,
        estimatedHours: values.estimatedHours
      }
      
      await updateTask(selectedTask.id, updateData)
      message.success('任务更新成功')
      setEditModalVisible(false)
      setSelectedTask(null)
      fetchTasks() // 刷新任务列表，确保进度列更新
      getStatistics()
    } catch (error) {
      message.error('任务更新失败')
    }
  }

  // 处理删除任务
  const handleDelete = (task: Task) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除任务"${task.title}"吗？`,
      onOk: async () => {
        try {
          await deleteTask(task.id)
          message.success('任务删除成功')
          fetchTasks()
          getStatistics()
        } catch (error) {
          message.error('任务删除失败')
        }
      }
    })
  }

  // 处理查看详情
  const handleViewDetail = (task: Task) => {
    setSelectedTask(task)
    setDetailModalVisible(true)
  }

  // 处理分配任务
  const handleAssign = (task: Task) => {
    setSelectedTask(task)
    setAssignModalVisible(true)
    assignForm.setFieldsValue({
      assignee: task.assignee,
      reason: ''
    })
  }

  const handleAssignSubmit = async (values: any) => {
    if (!selectedTask) return
    
    try {
      await assignTask({
        taskId: selectedTask.id,
        assignee: values.assignee,
        reason: values.reason
      })
      message.success('任务分配成功')
      setAssignModalVisible(false)
      setSelectedTask(null)
      fetchTasks()
    } catch (error) {
      message.error('任务分配失败')
    }
  }

  // 处理更新进度
  const handleUpdateProgress = (task: Task) => {
    setSelectedTask(task)
    setProgressModalVisible(true)
    progressForm.setFieldsValue({
      progress: task.progress,
      comment: ''
    })
  }

  const handleProgressSubmit = async (values: any) => {
    if (!selectedTask) return
    
    try {
      await updateTaskProgress({
        taskId: selectedTask.id,
        progress: values.progress,
        comment: values.comment
      })
      message.success('进度更新成功')
      setProgressModalVisible(false)
      setSelectedTask(null)
      fetchTasks()
    } catch (error) {
      message.error('进度更新失败')
    }
  }

  // 处理任务验收
  const handleReview = (task: Task) => {
    setSelectedTask(task)
    setReviewModalVisible(true)
  }

  const handleReviewSubmit = async (values: any) => {
    if (!selectedTask) return
    
    try {
      const newStatus = values.approved ? 'completed' : 'in_progress'
      await updateTask(selectedTask.id, {
        id: selectedTask.id,
        status: newStatus,
        progress: values.approved ? 100 : selectedTask.progress
      })
      message.success(values.approved ? '任务验收通过' : '任务验收不通过，已返回修改')
      setReviewModalVisible(false)
      setSelectedTask(null)
      fetchTasks()
      getStatistics()
    } catch (error) {
      message.error('验收操作失败')
    }
  }

  // 处理搜索
  const handleSearch = () => {
    const filters: any = {}
    if (searchKeyword) filters.keyword = searchKeyword
    if (statusFilter) filters.status = statusFilter
    if (priorityFilter) filters.priority = priorityFilter
    if (assigneeFilter) filters.assignee = assigneeFilter
    
    setFilters(filters)
    fetchTasks(filters)
  }

  // 处理重置筛选
  const handleResetFilters = () => {
    setSearchKeyword('')
    setStatusFilter('')
    setPriorityFilter('')
    setAssigneeFilter('')
    resetFilters()
    fetchTasks()
  }

  // 处理批量操作
  const handleBatchOperation = (operation: string) => {
    if (selectedTaskIds.length === 0) {
      message.warning('请选择要操作的任务')
      return
    }

    Modal.confirm({
      title: '确认批量操作',
      content: `确定要对选中的 ${selectedTaskIds.length} 个任务执行${operation}操作吗？`,
      onOk: async () => {
        try {
          await batchOperation({
            taskIds: selectedTaskIds,
            operation: operation as any
          })
          message.success('批量操作成功')
          setSelectedTaskIds([])
          fetchTasks()
          getStatistics()
        } catch (error) {
          message.error('批量操作失败')
        }
      }
    })
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={statistics.total}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={statistics.inProgress}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={statistics.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期任务"
              value={statistics.overdue}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索任务标题或描述"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={handleSearch}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.text}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="优先级"
              value={priorityFilter}
              onChange={setPriorityFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {Object.entries(priorityMap).map(([key, value]) => (
                <Option key={key} value={key}>
                  {value.text}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              placeholder="负责人"
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleResetFilters} icon={<ReloadOutlined />}>
                重置
              </Button>
              <Button onClick={() => fetchTasks()} icon={<ReloadOutlined />}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 批量操作 */}
      {selectedTaskIds.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedTaskIds.length} 个任务：</span>
            <Button size="small" onClick={() => handleBatchOperation('changeStatus')}>
              批量修改状态
            </Button>
            <Button size="small" onClick={() => handleBatchOperation('assign')}>
              批量分配
            </Button>
            <Button size="small" danger onClick={() => handleBatchOperation('delete')}>
              批量删除
            </Button>
            <Button size="small" onClick={() => setSelectedTaskIds([])}>
              取消选择
            </Button>
          </Space>
        </Card>
      )}

      {/* 任务列表 */}
      <Card
        title="任务列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            创建任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={(pagination) => {
            fetchTasks({}, pagination.current || 1, pagination.pageSize || 10)
          }}
        />
      </Card>

      {/* 创建任务模态框 */}
      <Modal
        title="创建任务"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="任务描述"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <TextArea rows={4} placeholder="请输入任务描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  {Object.entries(priorityMap).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="assignee"
                label="负责人"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select placeholder="请选择负责人">
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="截止日期"
                rules={[{ required: true, message: '请选择截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="estimatedHours"
                label="预估工时"
              >
                <Input placeholder="请输入预估工时" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select mode="tags" placeholder="请输入标签">
              <Option value="前端">前端</Option>
              <Option value="后端">后端</Option>
              <Option value="测试">测试</Option>
              <Option value="部署">部署</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑任务模态框 */}
      <Modal
        title="编辑任务"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="任务描述"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <TextArea rows={4} placeholder="请输入任务描述" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  {Object.entries(priorityMap).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  {Object.entries(statusMap).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.text}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="progress"
                label="进度(%)"
                rules={[{ required: true, message: '请输入进度' }]}
              >
                <Input type="number" min={0} max={100} step={1} placeholder="请输入进度百分比" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="assignee"
                label="负责人"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select placeholder="请选择负责人">
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dueDate"
                label="截止日期"
                rules={[{ required: true, message: '请选择截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="estimatedHours"
                label="预估工时"
              >
                <Input type="number" min={0} step={0.5} placeholder="请输入预估工时" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select mode="tags" placeholder="请输入标签">
              <Option value="前端">前端</Option>
              <Option value="后端">后端</Option>
              <Option value="测试">测试</Option>
              <Option value="部署">部署</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务详情模态框 */}
      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedTask && (
          <div>
            <Row gutter={16}>
              <Col span={16}>
                <h3>{selectedTask.title}</h3>
                <p style={{ color: '#666', marginBottom: 16 }}>
                  {selectedTask.description}
                </p>
              </Col>
              <Col span={8}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <strong>状态：</strong>
                    <Tag color={statusMap[selectedTask.status].color}>
                      {statusMap[selectedTask.status].text}
                    </Tag>
                  </div>
                  <div>
                    <strong>优先级：</strong>
                    <Tag color={priorityMap[selectedTask.priority].color}>
                      {priorityMap[selectedTask.priority].text}
                    </Tag>
                  </div>
                  <div>
                    <strong>负责人：</strong>
                    {selectedTask.assigneeName}
                  </div>
                  <div>
                    <strong>创建者：</strong>
                    {selectedTask.creatorName}
                  </div>
                  <div>
                    <strong>截止日期：</strong>
                    {dayjs(selectedTask.dueDate).format('YYYY-MM-DD')}
                  </div>
                  <div>
                    <strong>进度：</strong>
                    <Progress percent={selectedTask.progress} size="small" />
                  </div>
                </Space>
              </Col>
            </Row>
            
            {selectedTask.tags && selectedTask.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <strong>标签：</strong>
                <Space>
                  {selectedTask.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
            
            <Divider />
            
            <div>
              <strong>时间信息：</strong>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}>
                  <div>创建时间：{dayjs(selectedTask.createdAt).format('YYYY-MM-DD HH:mm')}</div>
                </Col>
                <Col span={8}>
                  <div>更新时间：{dayjs(selectedTask.updatedAt).format('YYYY-MM-DD HH:mm')}</div>
                </Col>
                {selectedTask.completedAt && (
                  <Col span={8}>
                    <div>完成时间：{dayjs(selectedTask.completedAt).format('YYYY-MM-DD HH:mm')}</div>
                  </Col>
                )}
              </Row>
            </div>
            
            {selectedTask.estimatedHours && (
              <div style={{ marginTop: 16 }}>
                <strong>工时信息：</strong>
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={8}>
                    <div>预估工时：{selectedTask.estimatedHours}小时</div>
                  </Col>
                  {selectedTask.actualHours && (
                    <Col span={8}>
                      <div>实际工时：{selectedTask.actualHours}小时</div>
                    </Col>
                  )}
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 分配任务模态框 */}
      <Modal
        title="分配任务"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
        >
          <Form.Item
            name="assignee"
            label="新负责人"
            rules={[{ required: true, message: '请选择新负责人' }]}
          >
            <Select placeholder="请选择新负责人">
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="reason"
            label="分配原因"
          >
            <TextArea rows={3} placeholder="请输入分配原因（可选）" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认分配
              </Button>
              <Button onClick={() => setAssignModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 更新进度模态框 */}
      <Modal
        title="更新进度"
        open={progressModalVisible}
        onCancel={() => setProgressModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={progressForm}
          layout="vertical"
          onFinish={handleProgressSubmit}
        >
          <Form.Item
            name="progress"
            label="进度百分比"
            rules={[{ required: true, message: '请输入进度百分比' }]}
          >
            <Input type="number" min={0} max={100} placeholder="请输入进度百分比" />
          </Form.Item>
          
          <Form.Item
            name="comment"
            label="进度说明"
          >
            <TextArea rows={3} placeholder="请输入进度说明（可选）" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                更新进度
              </Button>
              <Button onClick={() => setProgressModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 任务验收模态框 */}
      <Modal
        title="任务验收"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedTask && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4>任务信息</h4>
              <p><strong>任务标题：</strong>{selectedTask.title}</p>
              <p><strong>任务描述：</strong>{selectedTask.description}</p>
              <p><strong>当前进度：</strong>{selectedTask.progress}%</p>
            </div>
            
            <Form
              layout="vertical"
              onFinish={handleReviewSubmit}
            >
              <Form.Item
                name="approved"
                label="验收结果"
                rules={[{ required: true, message: '请选择验收结果' }]}
              >
                <Select placeholder="请选择验收结果">
                  <Option value={true}>验收通过</Option>
                  <Option value={false}>验收不通过</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="comment"
                label="验收意见"
              >
                <TextArea rows={3} placeholder="请输入验收意见（可选）" />
              </Form.Item>
              
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    确认验收
                  </Button>
                  <Button onClick={() => setReviewModalVisible(false)}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TaskManagementPage 