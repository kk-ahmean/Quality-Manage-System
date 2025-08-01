import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Space, Modal, Form, Input, Select, DatePicker, Dropdown, Progress, message, Tooltip, Popconfirm, Row, Col, Descriptions, Card, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined, BugOutlined, UserOutlined, CommentOutlined, ExclamationCircleOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useBugStore } from '../stores/bugStore';
import { Bug, BugPriority, BugSeverity, BugType, BugStatus, BugResponsibility, CreateBugRequest, UpdateBugRequest } from '../types/bug';
import { logSystemActivity } from '../stores/authStore';
import { useAuthStore } from '../stores/authStore';
import BulkImportModal from '../components/common/BulkImportModal';
import { useUserStore } from '../stores/userStore';

const { Option } = Select;

const priorityColors = {
  P0: 'red',
  P1: 'volcano',
  P2: 'orange',
  P3: 'gold',
};
const severityColors = {
  S: 'red',
  A: 'volcano',
  B: 'orange',
  C: 'blue',
};
const statusColors = {
  新建: 'blue',
  处理中: 'orange',
  待验证: 'purple',
  已解决: 'green',
  已关闭: 'default',
  重新打开: 'red',
};

const typeOptions: BugType[] = ['功能缺陷', '性能问题', '界面问题', '兼容性问题', '安全问题', '其他'];
const responsibilityOptions: BugResponsibility[] = ['软件', '硬件', '结构', 'ID', '包装', '产品', '项目', '供应商'];
const priorityOptions: BugPriority[] = ['P0', 'P1', 'P2', 'P3'];
const severityOptions: BugSeverity[] = ['S', 'A', 'B', 'C'];
const statusOptions: BugStatus[] = ['新建', '处理中', '待验证', '已解决', '已关闭', '重新打开'];

const BugManagementPage: React.FC = () => {
  const bugStore = useBugStore();
  const { users } = useUserStore(); // 从useUserStore获取用户数据
  const { user: currentUser } = useAuthStore();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Bug[]>([]);
  const [detailModal, setDetailModal] = useState<{ visible: boolean; bug: Bug | null }>({ visible: false, bug: null });
  const [commentModal, setCommentModal] = useState<{ visible: boolean; bug: Bug | null }>({ visible: false, bug: null });
  const [commentContent, setCommentContent] = useState('');
  const [importModalVisible, setImportModalVisible] = useState(false);

  useEffect(() => {
    bugStore.fetchBugs();
    bugStore.fetchStatistics();
    // 确保获取用户数据
    const userStore = useUserStore.getState()
    if (userStore.users.length === 0) {
      userStore.fetchUsers()
    }
  }, []);

  // 计算Bug统计数据
  const bugStatistics = {
    total: bugStore.bugs.length,
    new: bugStore.bugs.filter(bug => bug.status === '新建').length,
    inProgress: bugStore.bugs.filter(bug => bug.status === '处理中').length,
    resolved: bugStore.bugs.filter(bug => bug.status === '已解决').length,
    critical: bugStore.bugs.filter(bug => bug.severity === 'S').length,
    high: bugStore.bugs.filter(bug => bug.severity === 'A').length,
    medium: bugStore.bugs.filter(bug => bug.severity === 'B').length,
    low: bugStore.bugs.filter(bug => bug.severity === 'C').length,
  };

  // 列表列定义
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
      title: 'Bug标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text: string, record: Bug) => (
        <a onClick={() => setDetailModal({ visible: true, bug: record })} style={{ fontWeight: 'bold' }}>{text}</a>
      ),
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: BugPriority) => <Tag color={priorityColors[priority]}>{priority}</Tag>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 80,
      render: (severity: BugSeverity) => <Tag color={severityColors[severity]}>{severity}</Tag>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: BugType) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '责任归属',
      dataIndex: 'responsibility',
      key: 'responsibility',
      width: 100,
      render: (r: BugResponsibility) => <Tag color="purple">{r}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: BugStatus) => <Tag color={statusColors[status]}>{status}</Tag>,
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assigneeName',
      width: 100,
      render: (name: string, record: Bug) => {
        // 支持多用户展示
        if (Array.isArray(record.assignee)) {
          const userNames = record.assignee.map((id: string) => {
            const user = users.find((u: any) => u.id === id)
            return user ? user.name : id
          }).join('，')
          return userNames ? <Space><UserOutlined />{userNames}</Space> : <span style={{ color: '#aaa' }}>未分配</span>
        }
        return name ? <Space><UserOutlined />{name}</Space> : <span style={{ color: '#aaa' }}>未分配</span>
      },
    },
    {
      title: '创建人',
      dataIndex: 'reporterName',
      key: 'reporterName',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => <span>{dayjs(date).format('YYYY-MM-DD')}</span>,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Bug) => (
        <Dropdown
          menu={{
            items: [
              { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: () => handleEdit(record) },
              { key: 'comment', label: '评论', icon: <CommentOutlined />, onClick: () => setCommentModal({ visible: true, bug: record }) },
              { type: 'divider' },
              { key: 'delete', label: '删除', icon: <DeleteOutlined />, danger: true, onClick: () => handleDelete(record.id) },
            ]
          }}
        >
          <Button type="link" size="small" icon={<MoreOutlined />}>操作</Button>
        </Dropdown>
      ),
    },
  ];

  // 新建Bug
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await bugStore.createBug(values);
      
      // 记录创建Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'CREATE_BUG', `创建Bug: ${values.title}`)
      }
      
      setModalVisible(false);
      form.resetFields();
      message.success('Bug创建成功');
      bugStore.fetchBugs();
    } catch (e) {
      message.error('Bug创建失败');
    }
  };

  // 编辑Bug
  const handleEdit = (bug: Bug) => {
    editForm.setFieldsValue(bug);
    setEditModalVisible(true);
    bugStore.setSelectedBug(bug);
  };
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      await bugStore.updateBug({ ...values, id: bugStore.selectedBug?.id });
      
      // 记录更新Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'UPDATE_BUG', `更新Bug: ${values.title}`)
      }
      
      setEditModalVisible(false);
      message.success('Bug更新成功');
      bugStore.fetchBugs();
    } catch (e) {
      message.error('Bug更新失败');
    }
  };

  // 删除Bug
  const handleDelete = async (id: string) => {
    try {
      const bugToDelete = bugStore.bugs.find(bug => bug.id === id);
      await bugStore.deleteBug(id);
      
      // 记录删除Bug日志
      if (currentUser && bugToDelete) {
        logSystemActivity(currentUser.id, 'DELETE_BUG', `删除Bug: ${bugToDelete.title}`)
      }
      
      message.success('Bug删除成功');
      bugStore.fetchBugs();
    } catch (error) {
      message.error('Bug删除失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) {
      message.warning('请选择要删除的Bug');
      return;
    }

    try {
      await Promise.all(selectedRows.map(bug => bugStore.deleteBug(bug.id)));
      
      // 记录批量删除Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'BATCH_DELETE_BUG', `批量删除Bug: ${selectedRows.length}个`)
      }
      
      setSelectedRows([]);
      message.success(`成功删除${selectedRows.length}个Bug`);
      bugStore.fetchBugs();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  // 添加评论
  const handleAddComment = async () => {
    if (!commentContent.trim() || !commentModal.bug) {
      message.warning('请输入评论内容');
      return;
    }

    try {
      if (commentModal.bug) {
        await bugStore.addBugComment({ bugId: commentModal.bug.id, content: commentContent });
        
        // 记录添加评论日志
        if (currentUser) {
          logSystemActivity(currentUser.id, 'ADD_COMMENT', `为Bug添加评论: ${commentModal.bug.title}`)
        }
        
        message.success('评论添加成功');
        setCommentContent('');
        setCommentModal({ visible: false, bug: null });
      }
    } catch (error) {
      message.error('评论添加失败');
    }
  };

  // 批量导入处理
  const handleBulkImport = async (data: any[]) => {
    try {
      // 转换导入数据格式
      const bugsToCreate = data.map(item => ({
        title: item.title || item['Bug标题'],
        description: item.description || item['Bug描述'],
        reproductionSteps: item.reproductionSteps || item['复现步骤'],
        expectedResult: item.expectedResult || item['预期结果'],
        actualResult: item.actualResult || item['实际结果'],
        priority: item.priority || item['优先级'],
        severity: item.severity || item['严重程度'],
        type: item.type || item['类型'],
        responsibility: item.responsibility || item['责任归属'],
      }));

      // 批量创建Bug
      for (const bug of bugsToCreate) {
        await bugStore.createBug(bug);
      }
      
      // 记录批量导入Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'BULK_IMPORT_BUG', `批量导入Bug: ${bugsToCreate.length}个`)
      }
      
      message.success(`成功导入 ${bugsToCreate.length} 个Bug`);
      bugStore.fetchBugs();
    } catch (error) {
      message.error('批量导入失败，请检查数据格式');
    }
  };

  // 批量导出处理
  const handleBulkExport = (exportType: 'selected' | 'all') => {
    try {
      let bugsToExport: Bug[] = [];
      
      if (exportType === 'selected') {
        if (selectedRows.length === 0) {
          message.warning('请先选择要导出的Bug');
          return;
        }
        bugsToExport = selectedRows;
      } else {
        bugsToExport = bugStore.bugs;
      }

      // 转换数据格式为CSV
      const csvData: Record<string, string>[] = bugsToExport.map(bug => ({
        'Bug标题': bug.title,
        'Bug描述': bug.description,
        '复现步骤': bug.reproductionSteps,
        '预期结果': bug.expectedResult,
        '实际结果': bug.actualResult,
        '优先级': bug.priority,
        '严重程度': bug.severity,
        '类型': bug.type,
        '责任归属': bug.responsibility,
        '状态': bug.status,
        '负责人': Array.isArray(bug.assignee) 
          ? bug.assignee.map((id: string) => {
              const user = users.find((u: any) => u.id === id);
              return user ? user.name : id;
            }).join('，')
          : (bug.assigneeName || '未分配'),
        '创建人': bug.reporterName,
        '创建时间': dayjs(bug.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        '更新时间': dayjs(bug.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }));

      // 生成CSV内容
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // 处理包含逗号、引号或换行符的值
            if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      // 创建并下载文件
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bug_export_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`成功导出 ${bugsToExport.length} 个Bug`);
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 导入列定义
  const importColumns = [
    { title: 'Bug标题', dataIndex: 'title', key: 'title' },
    { title: 'Bug描述', dataIndex: 'description', key: 'description' },
    { title: '复现步骤', dataIndex: 'reproductionSteps', key: 'reproductionSteps' },
    { title: '预期结果', dataIndex: 'expectedResult', key: 'expectedResult' },
    { title: '实际结果', dataIndex: 'actualResult', key: 'actualResult' },
    { title: '优先级', dataIndex: 'priority', key: 'priority' },
    { title: '严重程度', dataIndex: 'severity', key: 'severity' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '责任归属', dataIndex: 'responsibility', key: 'responsibility' },
  ];

  // 筛选
  const handleFilter = (changed: any, all: any) => {
    bugStore.setFilters(all);
    bugStore.fetchBugs(all);
  };

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Bug总数"
              value={bugStatistics.total}
              prefix={<BugOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="新建Bug"
              value={bugStatistics.new}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="处理中"
              value={bugStatistics.inProgress}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已解决"
              value={bugStatistics.resolved}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建Bug</Button>
        <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>批量导入</Button>
        <Dropdown
          menu={{
            items: [
              {
                key: 'export-selected',
                label: '导出选中Bug',
                icon: <ExportOutlined />,
                onClick: () => handleBulkExport('selected'),
                disabled: selectedRows.length === 0
              },
              {
                key: 'export-all',
                label: '导出所有Bug',
                icon: <ExportOutlined />,
                onClick: () => handleBulkExport('all')
              }
            ]
          }}
        >
          <Button icon={<ExportOutlined />}>
            批量导出
          </Button>
        </Dropdown>
        <Button danger disabled={selectedRows.length === 0} onClick={handleBatchDelete}>批量删除</Button>
      </Space>
      <Form layout="inline" onValuesChange={handleFilter} style={{ marginBottom: 16 }}>
        <Form.Item name="status" label="状态">
          <Select allowClear mode="multiple" style={{ width: 120 }} options={statusOptions.map(s => ({ value: s, label: s }))} />
        </Form.Item>
        <Form.Item name="priority" label="优先级">
          <Select allowClear mode="multiple" style={{ width: 120 }} options={priorityOptions.map(p => ({ value: p, label: p }))} />
        </Form.Item>
        <Form.Item name="severity" label="严重程度">
          <Select allowClear mode="multiple" style={{ width: 120 }} options={severityOptions.map(s => ({ value: s, label: s }))} />
        </Form.Item>
        <Form.Item name="type" label="类型">
          <Select allowClear mode="multiple" style={{ width: 120 }} options={typeOptions.map(t => ({ value: t, label: t }))} />
        </Form.Item>
        <Form.Item name="responsibility" label="责任归属">
          <Select allowClear mode="multiple" style={{ width: 120 }} options={responsibilityOptions.map(r => ({ value: r, label: r }))} />
        </Form.Item>
        <Form.Item name="keyword" label="关键词">
          <Input allowClear placeholder="标题/描述" style={{ width: 160 }} />
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={bugStore.bugs}
        loading={bugStore.loading}
        rowSelection={{ selectedRowKeys: selectedRows.map(r => r.id), onChange: (_, rows) => setSelectedRows(rows) }}
        pagination={{
          current: bugStore.pagination.current,
          pageSize: bugStore.pagination.pageSize,
          total: bugStore.pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          onChange: (page, pageSize) => bugStore.fetchBugs(bugStore.filters, page, pageSize)
        }}
        scroll={{ x: 1200 }}
      />
      {/* 新建Bug弹窗 */}
      <Modal
        title="新建Bug"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleCreate}
        okText="确定"
        cancelText="取消"
        width={900}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Bug标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Bug描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="reproductionSteps" label="复现步骤" rules={[{ required: true, message: '请输入复现步骤' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="expectedResult" label="预期结果" rules={[{ required: true, message: '请输入预期结果' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="actualResult" label="实际结果" rules={[{ required: true, message: '请输入实际结果' }]}>
            <Input />
          </Form.Item>
          
          {/* 第一行：状态、指派给、优先级 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="新建">
                <Select options={statusOptions.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assignee" label="指派给">
                <Select
                  mode="multiple"
                  placeholder="请选择指派人员"
                  allowClear
                  options={users.map((u: any) => ({ value: u.id, label: u.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select options={priorityOptions.map(p => ({ value: p, label: p }))} />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 第二行：严重程度、类型、责任归属 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true, message: '请选择严重程度' }]}>
                <Select options={severityOptions.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select options={typeOptions.map(t => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="responsibility" label="责任归属" rules={[{ required: true, message: '请选择责任归属' }]}>
                <Select options={responsibilityOptions.map(r => ({ value: r, label: r }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      {/* 编辑Bug弹窗 */}
      <Modal
        title="编辑Bug"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleEditSubmit}
        okText="确定"
        cancelText="取消"
        width={900}
        style={{ top: 20 }}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Bug标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Bug描述" rules={[{ required: true, message: '请输入描述' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="reproductionSteps" label="复现步骤" rules={[{ required: true, message: '请输入复现步骤' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="expectedResult" label="预期结果" rules={[{ required: true, message: '请输入预期结果' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="actualResult" label="实际结果" rules={[{ required: true, message: '请输入实际结果' }]}>
            <Input />
          </Form.Item>
          
          {/* 第一行：状态、指派给、优先级 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select options={statusOptions.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assignee" label="指派给">
                <Select
                  mode="multiple"
                  placeholder="请选择指派人员"
                  allowClear
                  options={users.map((u: any) => ({ value: u.id, label: u.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select options={priorityOptions.map(p => ({ value: p, label: p }))} />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 第二行：严重程度、类型、责任归属 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="severity" label="严重程度" rules={[{ required: true, message: '请选择严重程度' }]}>
                <Select options={severityOptions.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select options={typeOptions.map(t => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="responsibility" label="责任归属" rules={[{ required: true, message: '请选择责任归属' }]}>
                <Select options={responsibilityOptions.map(r => ({ value: r, label: r }))} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
      {/* Bug详情弹窗 */}
      <Modal
        title="Bug详情"
        open={detailModal.visible}
        onCancel={() => setDetailModal({ visible: false, bug: null })}
        footer={null}
        width={600}
      >
        {detailModal.bug && (
          <div>
            <h3>{detailModal.bug.title}</h3>
            <p><b>描述：</b>{detailModal.bug.description}</p>
            <p><b>复现步骤：</b>{detailModal.bug.reproductionSteps}</p>
            <p><b>预期结果：</b>{detailModal.bug.expectedResult}</p>
            <p><b>实际结果：</b>{detailModal.bug.actualResult}</p>
            <Space>
              <Tag color={priorityColors[detailModal.bug.priority]}>优先级: {detailModal.bug.priority}</Tag>
              <Tag color={severityColors[detailModal.bug.severity]}>严重度: {detailModal.bug.severity}</Tag>
              <Tag color="blue">类型: {detailModal.bug.type}</Tag>
              <Tag color="purple">归属: {detailModal.bug.responsibility}</Tag>
              <Tag color={statusColors[detailModal.bug.status]}>状态: {detailModal.bug.status}</Tag>
            </Space>
            <p style={{ marginTop: 8 }}>
              <b>指派给：</b>
              {Array.isArray(detailModal.bug.assignee)
                ? detailModal.bug.assignee.map((id: string) => {
                    const user = users.find((u: any) => u.id === id)
                    return user ? user.name : id
                  }).join('，')
                : (detailModal.bug.assigneeName || '未分配')}
            </p>
            <p><b>创建人：</b>{detailModal.bug.reporterName}</p>
            <p><b>创建时间：</b>{dayjs(detailModal.bug.createdAt).format('YYYY-MM-DD HH:mm')}</p>
            <div style={{ marginTop: 16 }}>
              <b>评论：</b>
              {detailModal.bug.comments && detailModal.bug.comments.length > 0 ? (
                detailModal.bug.comments.map(c => (
                  <div key={c.id} style={{ borderBottom: '1px solid #f0f0f0', marginBottom: 4, paddingBottom: 4 }}>
                    <Space><UserOutlined />{c.authorName}</Space>
                    <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>{dayjs(c.createdAt).format('MM-DD HH:mm')}</span>
                    <div style={{ marginTop: 2 }}>{c.content}</div>
                  </div>
                ))
              ) : <div style={{ color: '#aaa' }}>暂无评论</div>}
            </div>
          </div>
        )}
      </Modal>
      {/* 评论弹窗 */}
      <Modal
        title="添加评论"
        open={commentModal.visible}
        onCancel={() => setCommentModal({ visible: false, bug: null })}
        onOk={handleAddComment}
        okText="确定"
        cancelText="取消"
      >
        <Input.TextArea rows={3} value={commentContent} onChange={e => setCommentContent(e.target.value)} placeholder="请输入评论内容" />
      </Modal>
      {/* 批量导入弹窗 */}
      <BulkImportModal
        open={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onConfirm={handleBulkImport}
        columns={importColumns}
        title="批量导入Bug"
        templateUrl="/templates/bug-import-template.xlsx"
      />
    </div>
  );
};

export default BugManagementPage; 