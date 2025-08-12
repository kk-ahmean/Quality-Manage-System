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
import { Permission } from '../types/user';
import { canShowDeleteButton, hasPermission } from '../utils/permissions';

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

const typeOptions: BugType[] = ['电气性能', '可靠性', '环保', '安规', '资料', '兼容性', '复测与确认', '设备特性', '其它'];
const responsibilityOptions: BugResponsibility[] = ['软件', '硬件', '结构', 'ID', '包装', '产品', '项目', '供应商', 'DQE', '实验室'];
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
        return name ? <Space><UserOutlined />{name}</Space> : <span style={{ color: '#aaa' }}>未分配</span>
      },
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100,
      render: (name: string, record: Bug) => {
        return name || record.reporterName || '未知';
      },
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
              { key: 'edit', label: '编辑', icon: <EditOutlined />, onClick: async () => await handleEdit(record) },
              { key: 'comment', label: '评论', icon: <CommentOutlined />, onClick: () => setCommentModal({ visible: true, bug: record }) },
              ...(canShowDeleteButton(
                (currentUser?.permissions || []) as Permission[],
                currentUser?.id || '',
                record.creator || record.reporter || '',
                'bug'
              ) ? [{
                key: 'delete',
                label: (
                  <Popconfirm
                    title="确定要删除这个Bug吗？"
                    description="删除后无法恢复，请谨慎操作。"
                    onConfirm={() => handleDelete(record.id)}
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
          <Button type="link" size="small" icon={<MoreOutlined />}>操作</Button>
        </Dropdown>
      ),
    },
  ];

  // 新建Bug
  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      // 调试信息 - 已隐藏
      
      // 根据assignee用户ID查找对应的用户名
      let assigneeName = '';
      if (values.assignee) {
        const user = users.find((u: any) => u.id === values.assignee);
        assigneeName = user ? user.name : '';
      }
      
      // 添加assigneeName和creator字段
      const bugData = {
        ...values,
        assigneeName: assigneeName,
        creator: currentUser?.id || '',
        creatorName: currentUser?.name || ''
      };
      
      const newBug = await bugStore.createBug(bugData);
      // 调试信息 - 已隐藏
      
      // 记录创建Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'CREATE_BUG', `创建Bug: ${values.title}`)
      }
      
      setModalVisible(false);
      form.resetFields();
      message.success('Bug创建成功');
      
      // 重新获取Bug列表并显示调试信息
      await bugStore.fetchBugs();
      // 调试信息 - 已隐藏
    } catch (e) {
      console.error('Bug创建失败:', e); // 调试信息
      message.error('Bug创建失败: ' + (e as Error).message);
    }
  };

  // 编辑Bug
  // 检查用户是否有编辑Bug核心字段的权限（标题、描述、复现步骤、预期结果、实际结果）
  const canEditBugCoreFields = (bug: Bug | null) => {
    if (!currentUser || !bug) return false;
    
    // 调试信息 - 已隐藏
    
    // 管理员、Bug创建者或报告者可以编辑核心字段
    const canEdit = currentUser.role === 'admin' || 
                   bug.creator === currentUser.id || 
                   bug.creator === currentUser._id ||
                   bug.reporter === currentUser.id || 
                   bug.reporter === currentUser._id;
    
    // 调试信息 - 已隐藏
    return canEdit;
  };

  // 检查用户是否可以编辑Bug（所有用户都可以编辑，但权限不同）
  const canEditBug = (bug: Bug | null) => {
    if (!currentUser || !bug) {
      // 调试信息 - 已隐藏
      return false;
    }
    
    // 所有登录用户都可以编辑Bug
    return true;
  };

  // 创建者可以编辑所有字段
  const canEditAllFields = (bug: Bug | null) => {
    if (!currentUser || !bug) {
      // 调试信息 - 已隐藏
      return false;
    }
    
    // 调试信息 - 已隐藏
    
    // 管理员可以编辑所有Bug
    if (currentUser.role === 'admin') {
      // 调试信息 - 已隐藏
      return true;
    }
    
    // 检查是否为创建者或报告者
    const isCreator = bug.creator && (bug.creator === currentUser.id || bug.creator === currentUser._id);
    const isReporter = bug.reporter && (bug.reporter === currentUser.id || bug.reporter === currentUser._id);
    
    // 调试信息 - 已隐藏
    
    const canEdit = isCreator || isReporter;
    // 调试信息 - 已隐藏
    return canEdit;
  };

  const handleEdit = async (bug: Bug) => {
    // 确保用户数据已加载
    const userStore = useUserStore.getState();
    if (userStore.users.length === 0) {
      await userStore.fetchUsers();
    }
    
    // 重新获取最新的用户列表
    const currentUsers = useUserStore.getState().users;
    
    // 根据assigneeName查找对应的用户ID
    let assigneeId = '';
    
    // 调试信息 - 已隐藏
    
    if (bug.assigneeName) {
      // 如果assigneeName存在，根据姓名查找用户ID
      const user = currentUsers.find((u: any) => u.name === bug.assigneeName.trim());
      assigneeId = user ? user.id : '';
      // 调试信息 - 已隐藏
    } else if (bug.assignee) {
      // 如果assignee存在，直接使用
      assigneeId = Array.isArray(bug.assignee) ? bug.assignee[0] || '' : bug.assignee;
      // 调试信息 - 已隐藏
    }
    
    const formValues = {
      ...bug,
      assignee: assigneeId
    };
    
    // 调试信息 - 已隐藏
    
    editForm.setFieldsValue(formValues);
    setEditModalVisible(true);
    bugStore.setSelectedBug(bug);
  };
  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      
      // 调试信息 - 已隐藏
      
      // 根据assignee用户ID查找对应的用户名
      let assigneeName = '';
      if (values.assignee) {
        const user = users.find((u: any) => u.id === values.assignee);
        assigneeName = user ? user.name : '';
        // 调试信息 - 已隐藏
      }
      
      // 检查权限
      if (bugStore.selectedBug) {
        const canEditCore = canEditBugCoreFields(bugStore.selectedBug);
        // 调试信息 - 已隐藏
        
        // 检查是否尝试编辑核心字段 - 只检查实际修改的字段
        const coreFields = ['title', 'description', 'reproductionSteps', 'expectedResult', 'actualResult'];
        const hasCoreFieldChanges = coreFields.some(field => {
          // 只检查字段值是否真的发生了变化
          const oldValue = bugStore.selectedBug[field];
          const newValue = values[field];
          const hasChanged = oldValue !== newValue;
          // 调试信息 - 已隐藏
          return hasChanged;
        });
        // 调试信息 - 已隐藏
        
        if (hasCoreFieldChanges && !canEditCore) {
          message.error('权限不足，您不能编辑Bug的核心字段');
          return;
        }
      }
      
      // 构建只包含修改字段的数据
      const changedFields: any = {};
      let hasAnyChanges = false;
      
      // 调试信息 - 已隐藏
      
      // 检查每个字段是否发生了变化
      Object.keys(values).forEach(field => {
        const oldValue = bugStore.selectedBug?.[field];
        const newValue = values[field];
        
        // 处理特殊字段
        if (field === 'assignee') {
          // assignee字段需要特殊处理，因为可能是从assigneeName转换来的
          const oldAssigneeId = bugStore.selectedBug?.assignee;
          if (newValue !== oldAssigneeId) {
            changedFields[field] = newValue;
            hasAnyChanges = true;
            // 调试信息 - 已隐藏
          }
        } else if (oldValue !== newValue) {
          changedFields[field] = newValue;
          hasAnyChanges = true;
                      // 调试信息 - 已隐藏
        } else {
          // 调试信息 - 已隐藏
        }
      });
      
      // 调试信息 - 已隐藏
      
      // 如果没有变化，提示用户
      if (!hasAnyChanges) {
        message.warning('没有检测到任何字段变更，请修改后再提交');
        return;
      }
      
      // 添加必要的字段
      const bugData = {
        ...changedFields,
        id: bugStore.selectedBug?.id,
        assigneeName: assigneeName
      };
      
      // 调试信息 - 已隐藏
      
      await bugStore.updateBug(bugData);
      
      // 调试信息 - 已隐藏
      
      // 记录更新Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'UPDATE_BUG', `更新Bug: ${values.title}`)
      }
      
      setEditModalVisible(false);
      message.success('Bug更新成功');
      
      // 确保数据正确刷新
      try {
        // 调试信息 - 已隐藏
        await bugStore.fetchBugs();
                  // 调试信息 - 已隐藏
        
        // 验证更新后的数据
        const updatedBug = bugStore.bugs.find(b => b.id === bugStore.selectedBug?.id);
        if (updatedBug) {
          // 调试信息 - 已隐藏
        } else {
          console.warn('未找到更新后的Bug，可能刷新失败');
        }
      } catch (error) {
        console.error('Bug列表刷新失败:', error);
        // 即使刷新失败，也不影响编辑成功
      }
    } catch (e: any) {
      console.error('Bug更新失败:', e);
      if (e.response) {
        console.error('响应状态:', e.response.status);
        console.error('响应数据:', e.response.data);
        message.error(`Bug更新失败: ${e.response.data?.message || e.message}`);
      } else {
        message.error(`Bug更新失败: ${e.message}`);
      }
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

  // 批量导入处理
  const handleBulkImport = async (data: any[]) => {
    try {
      // 调试信息 - 已隐藏
      
      // 验证数据格式
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('导入数据格式不正确或为空');
      }
      
      // 检查必要字段
      const firstItem = data[0];
              // 调试信息 - 已隐藏
      
      const requiredFields = ['title', 'Bug标题'];
      const hasRequiredField = requiredFields.some(field => firstItem[field]);
      
      if (!hasRequiredField) {
        throw new Error('数据缺少必要字段（标题）。请确保Excel文件包含"标题"或"Bug标题"列');
      }
      
      // 获取系统中最大的编号
      const bugs = bugStore.bugs || [];
      const maxSequenceNumber = Math.max(0, ...bugs.map(bug => bug.sequenceNumber || 0));
              // 调试信息 - 已隐藏
      
      // 转换导入数据格式
      const bugsToCreate = data.map((item, index) => {
        const newSequenceNumber = maxSequenceNumber + index + 1;
                  // 调试信息 - 已隐藏
        
        // 处理负责人字段
        const assigneeName = item.assigneeName || item['负责人'] || '';
        let assigneeId = item.assignee || '';
        
        // 如果assigneeId为空但有assigneeName，则根据姓名查找用户ID
        if (!assigneeId && assigneeName) {
          const user = users.find((u: any) => u.name === assigneeName.trim());
          assigneeId = user ? user.id : '';
        }
        
        // 处理标签字段
        const tags = item.tags || item['标签'] || '';
        
        // 验证必要字段
        const title = item.title || item['Bug标题'];
        if (!title) {
          throw new Error(`第${index + 1}行数据缺少标题字段`);
        }
        
        // 确保所有必填字段都有值，符合后端模型要求
        const bugData = {
          title: title,
          description: item.description || item['Bug描述'] || '批量导入的Bug',
          reproductionSteps: item.reproductionSteps || item['复现步骤'] || '批量导入',
          expectedResult: item.expectedResult || item['预期结果'] || '',
          actualResult: item.actualResult || item['实际结果'] || '批量导入',
          priority: item.priority || item['优先级'] || 'P3',
          severity: item.severity || item['严重程度'] || 'C',
          type: item.type || item['类型'] || '电气性能',
          responsibility: item.responsibility || item['责任归属'] || '软件',
          status: item.status || item['状态'] || '新建',
          assignee: assigneeId || null, // 确保为null而不是空字符串
          assigneeName: assigneeName,
          categoryLevel3: item.categoryLevel3 || item['三级类目'] || '默认类目',
          model: item.model || item['型号'] || '默认型号',
          sku: item.sku || item['SKU'] || '默认SKU',
          hardwareVersion: item.hardwareVersion || item['硬件版本'] || '默认硬件版本',
          softwareVersion: item.softwareVersion || item['软件版本'] || '默认软件版本',
          tags: tags,
          sequenceNumber: newSequenceNumber,
        };
        
        // 调试信息 - 已隐藏
        return bugData;
      });

              // 调试信息 - 已隐藏

      // 批量创建Bug
      for (const bug of bugsToCreate) {
                  // 调试信息 - 已隐藏
        try {
          await bugStore.createBug(bug);
          // 调试信息 - 已隐藏
        } catch (error) {
          console.error('❌ Bug创建失败:', bug.title, error);
          throw new Error(`创建Bug "${bug.title}" 失败: ${error.message}`);
        }
      }
      
      // 记录批量导入Bug日志
      if (currentUser) {
        logSystemActivity(currentUser.id, 'BULK_IMPORT_BUG', `批量导入Bug: ${bugsToCreate.length}个`)
      }
      
      message.success(`成功导入 ${bugsToCreate.length} 个Bug`);
      bugStore.fetchBugs();
    } catch (error) {
      console.error('批量导入失败:', error); // 调试信息
      console.error('错误详情:', {
        message: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
        data: data
      });
      message.error(`批量导入失败：${error instanceof Error ? error.message : '请检查数据格式'}`);
    }
  };

  // 批量导出处理
  const handleBulkExport = async (exportType: 'selected' | 'all') => {
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

      // 按创建时间升序排序，与表格显示顺序完全一致
      const sortedBugsToExport = [...bugsToExport].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

              // 调试信息 - 已隐藏

      // 转换数据格式为Excel
      const excelData: Record<string, string>[] = sortedBugsToExport.map((bug, index) => ({
        '编号': (index + 1).toString(), // 使用导出时的序号，确保与表格显示一致
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
        '三级类目': bug.categoryLevel3 || '-',
        '型号': bug.model || '-',
        'SKU': bug.sku || '-',
        '硬件版本': bug.hardwareVersion || '-',
        '软件版本': bug.softwareVersion || '-',
        '标签': Array.isArray(bug.tags) ? bug.tags.join('，') : (bug.tags || '-'),
        '负责人': bug.assigneeName || '未分配',
        '创建人': bug.reporterName,
        '创建时间': dayjs(bug.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        '更新时间': dayjs(bug.updatedAt).format('YYYY-MM-DD HH:mm:ss')
      }));

      // 动态导入xlsx库
      const XLSX = await import('xlsx');
      
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 创建工作表数据
      const headers = Object.keys(excelData[0]);
      const worksheetData = [headers, ...excelData.map(row => headers.map(header => row[header]))];
      
      // 创建工作表
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // 设置列宽
      const colWidths = [
        { wch: 8 },   // 编号
        { wch: 20 },  // Bug标题
        { wch: 30 },  // Bug描述
        { wch: 35 },  // 复现步骤
        { wch: 20 },  // 预期结果
        { wch: 20 },  // 实际结果
        { wch: 10 },  // 优先级
        { wch: 10 },  // 严重程度
        { wch: 15 },  // 类型
        { wch: 12 },  // 责任归属
        { wch: 12 },  // 状态
        { wch: 15 },  // 三级类目
        { wch: 15 },  // 型号
        { wch: 15 },  // SKU
        { wch: 15 },  // 硬件版本
        { wch: 15 },  // 软件版本
        { wch: 15 },  // 标签
        { wch: 12 },  // 负责人
        { wch: 12 },  // 创建人
        { wch: 20 },  // 创建时间
        { wch: 20 }   // 更新时间
      ];
      worksheet['!cols'] = colWidths;
      
      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bug数据');
      
      // 生成Excel文件并下载
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `bug_export_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success(`成功导出 ${bugsToExport.length} 个Bug`);
    } catch (error) {
      console.error('导出失败:', error);
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
    { title: '三级类目', dataIndex: 'categoryLevel3', key: 'categoryLevel3' },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: '硬件版本', dataIndex: 'hardwareVersion', key: 'hardwareVersion' },
    { title: '软件版本', dataIndex: 'softwareVersion', key: 'softwareVersion' },
    { title: '标签', dataIndex: 'tags', key: 'tags' },
  ];

  // 修复筛选逻辑，确保多选字段和关键词筛选正确传递
  const handleFilter = (_changed: any, all: any) => {
    // 标准化筛选参数格式
    const filters = {
      status: Array.isArray(all.status) ? all.status : all.status ? [all.status] : [],
      priority: Array.isArray(all.priority) ? all.priority : all.priority ? [all.priority] : [],
      severity: Array.isArray(all.severity) ? all.severity : all.severity ? [all.severity] : [],
      type: Array.isArray(all.type) ? all.type : all.type ? [all.type] : [],
      responsibility: Array.isArray(all.responsibility) ? all.responsibility : all.responsibility ? [all.responsibility] : [],
      keyword: all.keyword || ''
    };
    
    // 移除空数组和空字符串
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => 
        Array.isArray(value) ? value.length > 0 : value !== ''
      )
    );
    
    bugStore.setFilters(cleanFilters);
    bugStore.fetchBugs(cleanFilters);
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
        // 评论后刷新Bug列表并保留筛选条件
        bugStore.fetchBugs(bugStore.filters);
      }
    } catch (error) {
      message.error('评论添加失败');
    }
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
        {hasPermission(
          (currentUser?.permissions || []) as Permission[],
          'bug:create'
        ) && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新建Bug</Button>
        )}
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
        {/* 移除handleBatchDelete和相关按钮，不再支持批量删除 */}
      </Space>
      <Form layout="inline" form={form} onValuesChange={handleFilter} style={{ marginBottom: 16 }}>
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
          <Select
            allowClear
            mode="multiple"
            style={{ width: 120 }}
            options={responsibilityOptions.map(r => ({ value: r, label: r }))}
            onChange={value => {
              form.setFieldsValue({ responsibility: value });
              handleFilter({}, form.getFieldsValue());
            }}
          />
        </Form.Item>
        <Form.Item label="关键词" style={{ display: 'flex', alignItems: 'center', marginRight: 0 }}>
          <Form.Item name="keyword" noStyle>
            <Input allowClear placeholder="标题/描述" style={{ width: 160, marginRight: 8 }} />
          </Form.Item>
          <Button type="primary" onClick={() => handleFilter({}, form.getFieldsValue())}>搜索</Button>
        </Form.Item>
      </Form>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={[...bugStore.bugs].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())}
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
          <Form.Item name="expectedResult" label="预期结果">
            <Input />
          </Form.Item>
          <Form.Item name="actualResult" label="实际结果" rules={[{ required: true, message: '请输入实际结果' }]}>
            <Input />
          </Form.Item>
          
          {/* 第一行：状态、指派给、优先级 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态" initialValue="新建" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={statusOptions.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assignee" label="指派给">
                <Select
                  placeholder="请选择指派人员"
                  allowClear
                  options={users.map((u: any) => ({ value: u.id, label: u.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级">
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
          
          {/* 第三行：三级类目、型号、SKU */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="categoryLevel3" label="三级类目" rules={[{ required: true, message: '请输入三级类目' }]}>
                <Input placeholder="请输入三级类目" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="model" label="型号" rules={[{ required: true, message: '请输入型号' }]}>
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入SKU' }]}>
                <Input placeholder="请输入SKU" />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 第四行：硬件版本、软件版本、标签 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="hardwareVersion" label="硬件版本" rules={[{ required: true, message: '请输入硬件版本' }]}>
                <Input placeholder="请输入硬件版本" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="softwareVersion" label="软件版本" rules={[{ required: true, message: '请输入软件版本' }]}>
                <Input placeholder="请输入软件版本" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tags" label="标签">
                <Input 
                  placeholder="请输入标签" 
                  maxLength={50}
                  showCount
                />
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
        {/* 权限提示信息 */}
        {bugStore.selectedBug && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            backgroundColor: canEditBugCoreFields(bugStore.selectedBug) ? '#f6ffed' : '#fff7e6',
            border: `1px solid ${canEditBugCoreFields(bugStore.selectedBug) ? '#b7eb8f' : '#ffd591'}`,
            borderRadius: 6,
            fontSize: 14
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
              {canEditBugCoreFields(bugStore.selectedBug) ? '✅ 完全编辑权限' : '⚠️ 受限编辑权限'}
            </div>
            <div style={{ color: '#666' }}>
              {canEditBugCoreFields(bugStore.selectedBug) 
                ? '您可以编辑Bug的所有字段，包括核心字段（标题、描述、复现步骤、预期结果、实际结果）'
                : '您可以编辑Bug的状态、指派、优先级等字段，但核心字段（标题、描述、复现步骤、预期结果、实际结果）需要管理员或创建者权限'
              }
            </div>
            
            {/* 调试信息 - 已隐藏 */}
          </div>
        )}
        
        <Form form={editForm} layout="vertical">
          <Form.Item name="title" label="Bug标题" rules={[{ required: true, message: '请输入标题' }]}> 
            <Input disabled={!canEditBugCoreFields(bugStore.selectedBug)} />
          </Form.Item>
          <Form.Item name="description" label="Bug描述" rules={[{ required: true, message: '请输入描述' }]}> 
            <Input.TextArea rows={3} disabled={!canEditBugCoreFields(bugStore.selectedBug)} />
          </Form.Item>
          <Form.Item name="reproductionSteps" label="复现步骤" rules={[{ required: true, message: '请输入复现步骤' }]}> 
            <Input.TextArea rows={3} disabled={!canEditBugCoreFields(bugStore.selectedBug)} />
          </Form.Item>
          <Form.Item name="expectedResult" label="预期结果"> 
            <Input disabled={!canEditBugCoreFields(bugStore.selectedBug)} />
          </Form.Item>
          <Form.Item name="actualResult" label="实际结果" rules={[{ required: true, message: '请输入实际结果' }]}> 
            <Input disabled={!canEditBugCoreFields(bugStore.selectedBug)} />
          </Form.Item>
          
          {/* 第一行：状态、指派给、优先级 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select options={statusOptions.map(s => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="assignee" label="指派给">
                <Select
                  placeholder="请选择指派人员"
                  allowClear
                  options={users.map((u: any) => ({ value: u.id, label: u.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级">
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
          
          {/* 第三行：三级类目、型号、SKU */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="categoryLevel3" label="三级类目">
                <Input placeholder="请输入三级类目" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="model" label="型号">
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sku" label="SKU">
                <Input placeholder="请输入SKU" />
              </Form.Item>
            </Col>
          </Row>
          
          {/* 第四行：硬件版本、软件版本、标签 */}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="hardwareVersion" label="硬件版本">
                <Input placeholder="请输入硬件版本" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="softwareVersion" label="软件版本">
                <Input placeholder="请输入软件版本" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tags" label="标签">
                <Input 
                  placeholder="请输入标签" 
                  maxLength={50}
                  showCount
                />
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
            <p><b>三级类目：</b>{detailModal.bug.categoryLevel3}</p>
            <p><b>型号：</b>{detailModal.bug.model}</p>
            <p><b>SKU：</b>{detailModal.bug.sku}</p>
            <p><b>硬件版本：</b>{detailModal.bug.hardwareVersion}</p>
            <p><b>软件版本：</b>{detailModal.bug.softwareVersion}</p>
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
      />
    </div>
  );
};

export default BugManagementPage; 