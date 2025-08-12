import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Upload,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Typography,
  Spin,
  Tooltip,
  Badge,
  Divider,
  Descriptions,
  Image,
  Drawer
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  DownloadOutlined,
  UserOutlined,
  FileOutlined,
  ReloadOutlined,
  FilterOutlined,
  PictureOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useUserStore } from '../stores/userStore';
import { logSystemActivity } from '../stores/authStore';
import {
  Project,
  ProjectLevel,
  ProjectTrade,
  ProjectStage,
  ProjectStatus,
  ProjectMember,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilters,
  TestResult,
  ProjectVersionInfo
} from '../types/project';
import { UserRole, Permission } from '../types/user';
import { canShowDeleteButton, hasPermission } from '../utils/permissions';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 角色显示映射
const getRoleDisplayName = (role: UserRole) => {
  const roleMap: Record<UserRole, string> = {
    admin: '管理员',
    product_engineer: '产品工程师',
    project_engineer: '项目工程师',
    developer: '开发工程师',
    dqe: 'DQE工程师',
    tester: '测试工程师'
  };
  return roleMap[role] || role;
};

const ProjectManagementPage: React.FC = () => {
  const {
    projects,
    selectedProject,
    loading,
    pagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setSelectedProject,
    canEditProject,
    canDeleteProject
  } = useProjectStore();

  const { user } = useAuthStore();
  const { users, fetchUsers } = useUserStore();

  // 状态管理
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<ProjectFilters>({});

  // 加载数据
  useEffect(() => {
    fetchProjects(filters, pagination.current, pagination.pageSize);
    fetchUsers();
  }, [filters, pagination.current, pagination.pageSize]);

  // 表格列定义
  const columns = [
    {
      title: '编号',
      key: 'index',
      width: 60,
      render: (_: any, record: any) => (
        <Text strong style={{ color: '#666' }}>
          {record.sequenceNumber || '-'}
        </Text>
      )
    },
    {
      title: '三级类目',
      dataIndex: 'categoryLevel3',
      key: 'categoryLevel3',
      width: 120,
      render: (text: string) => <Text strong style={{ color: '#1890ff' }}>{text || '-'}</Text>
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
      width: 120,
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: '产品图片',
      dataIndex: 'productImages',
      key: 'productImages',
      width: 100,
      render: (images: any[]) => {
        if (!images || images.length === 0) {
          return <span style={{ color: '#aaa' }}>无图片</span>;
        }
        return (
          <Image.PreviewGroup>
            {images.slice(0, 3).map((img, idx) => {
              // 处理不同的图片数据格式
              const imageUrl = img.url || img.src || img.data || (typeof img === 'string' ? img : null);
              const imageName = img.name || img.fileName || `产品图片${idx + 1}`;
              
              if (!imageUrl) {
                return (
                  <div key={idx} style={{ display: 'inline-block', marginRight: 4 }}>
                    <div style={{ 
                      width: 40, 
                      height: 40, 
                      backgroundColor: '#f0f0f0', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {imageName}
                    </div>
                  </div>
                );
              }
              
              return (
                <Image
                  key={idx}
                  src={imageUrl}
                  width={40}
                  height={40}
                  style={{ marginRight: 4, objectFit: 'cover' }}
                  alt={imageName}
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                />
              );
            })}
            {images.length > 3 && (
              <span style={{ color: '#1890ff', fontSize: '12px' }}>
                +{images.length - 3}
              </span>
            )}
          </Image.PreviewGroup>
        );
      }
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: ProjectLevel) => {
        const colorMap = { L1: 'red', L2: 'orange', L3: 'green' };
        return <Tag color={colorMap[level]}>{level}</Tag>;
      }
    },
    {
      title: '内/外贸',
      dataIndex: 'trade',
      key: 'trade',
      width: 100,
      render: (trade: ProjectTrade) => {
        const colorMap = { '内贸': 'blue', '外贸': 'purple', '内外贸': 'cyan' };
        return <Tag color={colorMap[trade]}>{trade}</Tag>;
      }
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ProjectStatus) => {
        const colorMap = {
          '研发设计': 'processing',
          'EVT': 'warning',
          'DVT': 'warning',
          'PVT': 'warning',
          'MP': 'success'
        };
        return <Badge status={colorMap[status] as any} text={status} />;
      }
    },
    {
      title: '创建人',
      dataIndex: 'creatorName',
      key: 'creatorName',
      width: 100
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          {(hasPermission(
            (user?.permissions || []) as Permission[],
            'project:update'
          ) || record.creator === user?.id) && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          )}
          {canShowDeleteButton(
            (user?.permissions || []) as Permission[],
            user?.id || '',
            record.creator || '',
            'project'
          ) && (
            <Popconfirm
              title="确定要删除这个项目吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
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
  ];

  // 处理查看详情
  const handleViewDetail = (project: Project) => {
    console.log('查看项目详情:', project); // 调试信息
    
    // 确保项目数据格式正确
    const projectWithFullData = {
      ...project,
      model: project.model || (project as any).name,
      sku: project.sku || project.model || (project as any).name,
      supplier: project.supplier || '-',
      interfaceFeatures: project.interfaceFeatures || '-',
      hardwareSolution: project.hardwareSolution || '-',
      remarks: project.remarks || '-',
      creatorName: project.creatorName || '系统管理员',
      productImages: project.productImages || [],
      members: project.members || [],
      versions: project.versions || [],
      stages: project.stages || []
    };
    
    console.log('处理后的项目详情:', projectWithFullData); // 调试信息
    setSelectedProject(projectWithFullData);
    setDetailVisible(true);
  };

  // 处理编辑
  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      members: project.members.map(member => member.userId),
      stages: project.stages.map(stage => ({
        ...stage,
        key: Math.random().toString(36).substr(2, 9)
      })),
      versions: project.versions || []
    });
    setModalVisible(true);
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      message.success('项目删除成功');
      
      // 记录系统日志
      if (user?.id) {
        logSystemActivity(user.id, 'DELETE_PROJECT', '删除项目');
      }
      
      fetchProjects(filters, pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('删除失败：' + (error as Error).message);
    }
  };

  // 处理新建
  const handleCreate = () => {
    setEditingProject(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      console.log('表单原始数据:', values); // 调试信息
      
      // 处理团队成员数据
      const memberIds = values.members || [];
      const projectMembers: ProjectMember[] = memberIds.map((userId: string) => {
        const user = users.find(u => u.id === userId);
        return {
          userId,
          name: user?.name || '',
          role: user?.role || 'developer'
        };
      });

      // 处理版本信息数据
      const versions = values.versions?.filter((version: any) => 
        version.hardwareVersion && version.softwareVersion
      ) || [];

      // 处理产品图片数据 - 重新启用图片上传功能
      let productImages = [];
      if (values.productImages && values.productImages.length > 0) {
        productImages = values.productImages.map((img: any) => {
          // 只保留必要的图片信息，移除可能导致序列化问题的字段
          const { uid, _id, originFileObj, fileList, ...cleanImg } = img;
          return {
            name: cleanImg.name || '产品图片',
            url: cleanImg.url || '',
            size: cleanImg.size || 0,
            type: cleanImg.type || 'image/jpeg'
          };
        }).filter((img: any) => img.url && img.url.length > 0); // 只保留有效的图片
      }

      // 清理数据，移除所有文件对象和不可序列化的字段
      const cleanValues = { ...values };
      delete cleanValues.productImages; // 移除原始文件对象
      delete cleanValues.originFileObj; // 移除可能的文件对象
      delete cleanValues.fileList; // 移除可能的文件列表

      const formData = {
        model: values.model, // 使用正确的model字段
        sku: values.sku || values.model, // 使用sku或model作为默认值
        categoryLevel3: values.categoryLevel3, // 添加三级类目字段
        interfaceFeatures: values.interfaceFeatures,
        description: values.description,
        level: values.level,
        trade: values.trade,
        status: values.status,
        manager: values.manager,
        startDate: values.startDate,
        endDate: values.endDate,
        budget: values.budget,
        tags: values.tags || [],
        members: projectMembers,
        versions,
        productImages: productImages, // 使用处理后的图片数据
        stages: values.stages?.filter((stage: any) => stage.stage && stage.sampleQuantity) || [],
        supplier: values.supplier, // 确保发送供应商字段
        hardwareSolution: values.hardwareSolution, // 确保发送硬件方案字段
        remarks: values.remarks // 确保发送备注字段
      };

      console.log('发送的项目数据:', formData); // 调试信息
      console.log('图片数据:', productImages); // 调试信息
      console.log('数据类型检查:', {
        model: typeof formData.model,
        level: typeof formData.level,
        trade: typeof formData.trade,
        status: typeof formData.status,
        manager: typeof formData.manager
      }); // 调试信息

      if (editingProject) {
        await updateProject({ id: editingProject.id, ...formData });
        message.success('项目更新成功');
        
        // 记录系统日志
        if (user?.id) {
          logSystemActivity(user.id, 'UPDATE_PROJECT', `更新项目: ${editingProject.model}`);
        }
      } else {
        await createProject(formData);
        message.success('项目创建成功');
        
        // 记录系统日志
        if (user?.id) {
          logSystemActivity(user.id, 'CREATE_PROJECT', `创建项目: ${formData.model}`);
        }
      }

      setModalVisible(false);
      fetchProjects(filters, pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('项目创建失败:', error); // 调试信息
      console.error('错误详情:', error.response?.data); // 调试信息
      message.error('操作失败：' + (error as Error).message);
    }
  };

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    fetchProjects(newFilters, 1, pagination.pageSize);
  };

  // 处理筛选
  const handleFilter = (key: keyof ProjectFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 重置筛选
  const handleResetFilters = () => {
    setFilters({});
    setSearchText('');
  };

  // 分页处理
  const handleTableChange = (pagination: any) => {
    fetchProjects(filters, pagination.current, pagination.pageSize);
  };

  // 处理图片删除
  const handleImageRemove = (file: any) => {
    const fileList = form.getFieldValue('productImages') || [];
    const newFileList = fileList.filter((item: any) => item.uid !== file.uid);
    form.setFieldValue('productImages', newFileList);
    message.success(`图片 "${file.name}" 删除成功`);
  };

  // 处理图片上传
  const handleImageUpload = (files: File[]) => {
    const fileList = form.getFieldValue('productImages') || [];
    let addedCount = 0;
    const newFiles: any[] = [];
    
    files.forEach((file) => {
      // 验证文件类型
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error(`文件 "${file.name}" 不是图片格式！`);
        return;
      }
      
      // 验证文件大小
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error(`图片 "${file.name}" 大小不能超过2MB！`);
        return;
      }
      
      // 检查是否已存在相同文件
      const existingFile = fileList.find((item: any) => item.name === file.name && item.size === file.size);
      if (existingFile) {
        message.warning(`图片 "${file.name}" 已存在`);
        return;
      }
      
      // 检查数量限制
      if (fileList.length >= 5) {
        message.error('最多只能上传5张图片！');
        return;
      }
      
      // 压缩图片
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        // 计算压缩后的尺寸
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 转换为Base64
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const newFile = {
                uid: Date.now() + Math.random(),
                name: file.name,
                status: 'done',
                url: reader.result as string,
                size: blob.size,
                type: file.type,
                originFileObj: file
              };
              
              newFiles.push(newFile);
              addedCount++;
              
              if (addedCount === files.length) {
                const updatedFileList = [...fileList, ...newFiles];
                form.setFieldsValue({ productImages: updatedFileList });
                message.success(`成功上传 ${addedCount} 张图片`);
              }
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.8); // 压缩质量80%
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 处理图片预览
  const handleImagePreview = (file: any) => {
    if (file.url) {
      window.open(file.url, '_blank');
    }
  };

  // 处理文件选择器点击
  const handleImageUploadClick = () => {
    // 使用最简单可靠的方法
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        handleImageUpload(files);
      }
      // 清理临时元素
      if (document.body.contains(input)) {
        document.body.removeChild(input);
      }
    };
    
    // 添加到DOM并触发点击
    document.body.appendChild(input);
    input.click();
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>项目管理</Title>
          </Col>
          <Col>
            {hasPermission(
              (user?.permissions || []) as Permission[],
              'project:create'
            ) && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                新建项目
              </Button>
            )}
          </Col>
        </Row>

        {/* 搜索和筛选区域 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Input
              placeholder="搜索型号、SKU、供应商"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={() => handleSearch(searchText)}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择等级"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => handleFilter('level', value ? [value] : undefined)}
            >
              <Option value="L1">L1</Option>
              <Option value="L2">L2</Option>
              <Option value="L3">L3</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择内/外贸"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => handleFilter('trade', value ? [value] : undefined)}
            >
              <Option value="内贸">内贸</Option>
              <Option value="外贸">外贸</Option>
              <Option value="内外贸">内外贸</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Select
              className="filter-select"
              placeholder="请选择状态"
              style={{ width: '100%' }}
              allowClear
              onChange={(value) => handleFilter('status', value ? [value] : undefined)}
            >
              <Option value="研发设计">研发设计</Option>
              <Option value="EVT">EVT</Option>
              <Option value="DVT">DVT</Option>
              <Option value="PVT">PVT</Option>
              <Option value="MP">MP</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Space>
              <Button
                icon={<FilterOutlined />}
                onClick={() => handleSearch(searchText)}
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

        {/* 项目列表表格 */}
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 新建/编辑项目模态框 */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            level: 'L2',
            trade: '内贸',
            status: '研发设计',
            stages: [],
            versions: [],
            members: []
          }}
        >
                     {/* 第一行：型号/SKU/等级/三级类目 */}
           <Row gutter={16}>
             <Col span={6}>
               <Form.Item
                 name="model"
                 label="型号"
                 rules={[{ required: true, message: '请输入型号' }]}
               >
                 <Input placeholder="请输入型号" />
               </Form.Item>
             </Col>
             <Col span={6}>
               <Form.Item
                 name="sku"
                 label="SKU"
                 rules={[{ required: true, message: '请输入SKU' }]}
               >
                 <Input placeholder="请输入SKU" />
               </Form.Item>
             </Col>
             <Col span={6}>
               <Form.Item
                 name="level"
                 label="等级"
                 rules={[{ required: true, message: '请选择等级' }]}
               >
                 <Select placeholder="请选择等级">
                   <Option value="L1">L1</Option>
                   <Option value="L2">L2</Option>
                   <Option value="L3">L3</Option>
                 </Select>
               </Form.Item>
             </Col>
             <Col span={6}>
               <Form.Item
                 name="categoryLevel3"
                 label="三级类目"
                 rules={[{ required: true, message: '请输入三级类目' }]}
               >
                 <Input placeholder="请输入三级类目" />
               </Form.Item>
             </Col>
           </Row>

           {/* 第二行：内/外贸/供应商/项目状态 */}
           <Row gutter={16}>
             <Col span={8}>
               <Form.Item
                 name="trade"
                 label="内/外贸"
                 rules={[{ required: true, message: '请选择内/外贸' }]}
               >
                 <Select placeholder="请选择内/外贸">
                   <Option value="内贸">内贸</Option>
                   <Option value="外贸">外贸</Option>
                   <Option value="内外贸">内外贸</Option>
                 </Select>
               </Form.Item>
             </Col>
             <Col span={8}>
               <Form.Item name="supplier" label="供应商">
                 <Input placeholder="请输入供应商" />
               </Form.Item>
             </Col>
             <Col span={8}>
               <Form.Item
                 name="status"
                 label="项目状态"
                 rules={[{ required: true, message: '请选择项目状态' }]}
               >
                 <Select placeholder="请选择项目状态">
                   <Option value="研发设计">研发设计</Option>
                   <Option value="EVT">EVT</Option>
                   <Option value="DVT">DVT</Option>
                   <Option value="PVT">PVT</Option>
                   <Option value="MP">MP</Option>
                 </Select>
               </Form.Item>
             </Col>
           </Row>

          <Form.Item name="interfaceFeatures" label="接口特性">
            <TextArea rows={3} placeholder="请输入接口特性" />
          </Form.Item>

          <Form.Item name="hardwareSolution" label="硬件方案">
            <TextArea rows={3} placeholder="请输入硬件方案" />
          </Form.Item>

          {/* 第三行：团队成员和产品图片 */}
          <Row gutter={16}>
            <Col span={9}>
              <Form.Item
                name="members"
                label="团队成员"
                rules={[{ required: true, message: '请选择团队成员' }]}
              >
                <Select
                  mode="multiple"
                  placeholder="请选择团队成员"
                  optionFilterProp="children"
                  showSearch
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.name} ({getRoleDisplayName(user.role)})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={15}>
              <Form.Item name="productImages" label="产品图片">
                <div>
                  {/* 图片上传区域 */}
                  <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    backgroundColor: '#f5f5f5', 
                    border: '1px dashed #d9d9d9',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onClick={handleImageUploadClick}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1890ff';
                    e.currentTarget.style.backgroundColor = '#f0f8ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d9d9d9';
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  >
                    <PictureOutlined style={{ fontSize: '24px', color: '#999', marginBottom: '8px' }} />
                    <div style={{ color: '#666' }}>点击上传图片</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                      支持 JPG、PNG、GIF 格式，单个文件不超过 2MB，最多上传 5 张图片
                    </div>
                  </div>
                  
                  {/* 图片预览区域 */}
                  {form.getFieldValue('productImages') && form.getFieldValue('productImages').length > 0 && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {form.getFieldValue('productImages').map((file: any, index: number) => (
                          <div key={file.uid || index} style={{ position: 'relative' }}>
                            <img
                              src={file.url}
                              alt={file.name}
                              style={{
                                width: '80px',
                                height: '80px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                border: '1px solid #d9d9d9'
                              }}
                            />
                            <Button
                              type="text"
                              size="small"
                              icon={<DeleteOutlined />}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                background: '#ff4d4f',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => handleImageRemove(file)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Form.Item>
            </Col>
          </Row>

           <Form.Item name="remarks" label="备注">
             <TextArea rows={3} placeholder="请输入备注" />
           </Form.Item>

           {/* 版本信息 */}
          <Form.Item label="版本信息">
            <Form.List name="versions">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'hardwareVersion']}
                          label="硬件版本"
                          rules={[{ required: true, message: '请输入硬件版本' }]}
                        >
                          <Input placeholder="请输入硬件版本" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'softwareVersion']}
                          label="软件版本"
                          rules={[{ required: true, message: '请输入软件版本' }]}
                        >
                          <Input placeholder="请输入软件版本" />
                        </Form.Item>
                      </Col>
                      <Col span={7}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="描述"
                        >
                          <Input placeholder="请输入版本描述" />
                        </Form.Item>
                      </Col>
                                             <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                         <Button
                           type="text"
                           danger
                           icon={<DeleteOutlined />}
                           onClick={() => remove(name)}
                           style={{ padding: '4px 8px' }}
                           title="删除版本信息"
                         />
                       </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      添加版本信息
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          

          <Form.List name="stages">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row gutter={16} key={key}>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'stage']}
                        label="阶段"
                        rules={[{ required: true, message: '请选择阶段' }]}
                      >
                        <Select placeholder="请选择阶段">
                          <Option value="EVT">EVT</Option>
                          <Option value="DVT">DVT</Option>
                          <Option value="PVT">PVT</Option>
                          <Option value="MP">MP</Option>
                          <Option value="其他">其他</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'sampleQuantity']}
                        label="送样数量"
                        rules={[{ required: true, message: '请输入送样数量' }]}
                      >
                        <Input type="number" placeholder="数量" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'sampleReason']}
                        label="送样原因"
                        rules={[{ required: true, message: '请输入送样原因' }]}
                      >
                        <Input placeholder="请输入送样原因" />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item
                        {...restField}
                        name={[name, 'testResult']}
                        label="测试结果"
                        rules={[{ required: true, message: '请选择测试结果' }]}
                      >
                        <Select placeholder="测试结果">
                          <Option value="PASS">PASS</Option>
                          <Option value="FAIL">FAIL</Option>
                          <Option value="条件接收">条件接收</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        {...restField}
                        name={[name, 'approvalVersion']}
                        label="承认书版本"
                      >
                        <Input placeholder="请输入承认书版本" />
                      </Form.Item>
                    </Col>
                    <Col span={1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                        style={{ padding: '4px 8px' }}
                        title="删除阶段"
                      />
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加阶段
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingProject ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 项目详情抽屉 */}
      <Drawer
        title="项目详情"
        placement="right"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedProject && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="型号">
              {selectedProject.model}
            </Descriptions.Item>
            <Descriptions.Item label="SKU">
              {selectedProject.sku}
            </Descriptions.Item>
            <Descriptions.Item label="三级类目">
              {selectedProject.categoryLevel3 || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="等级">
              <Tag color="blue">{selectedProject.level}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="内/外贸">
              <Tag color="green">{selectedProject.trade}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="供应商">
              {selectedProject.supplier || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Badge
                status={
                  selectedProject.status === '研发设计'
                    ? 'processing'
                    : selectedProject.status === 'MP'
                    ? 'success'
                    : 'warning'
                }
                text={selectedProject.status}
              />
            </Descriptions.Item>
            <Descriptions.Item label="接口特性">
              {selectedProject.interfaceFeatures || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="硬件方案">
              {selectedProject.hardwareSolution || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="版本信息">
              {selectedProject.versions && selectedProject.versions.length > 0 ? (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {selectedProject.versions.map((version, index) => (
                    <Card key={index} size="small">
                      <Row gutter={16}>
                        <Col span={8}>
                          <Text strong>硬件版本: {version.hardwareVersion}</Text>
                        </Col>
                        <Col span={8}>
                          <Text>软件版本: {version.softwareVersion}</Text>
                        </Col>
                        <Col span={8}>
                          <Text>描述: {version.description || '-'}</Text>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              ) : (
                <span>无</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="产品图片">
              {selectedProject.productImages && selectedProject.productImages.length > 0 ? (
                <Image.PreviewGroup>
                  {selectedProject.productImages.map((img, idx) => {
                    // 处理不同的图片数据格式
                    const imageUrl = img.url || (img as any).src || (img as any).data || (typeof img === 'string' ? img : null);
                    const imageName = img.name || (img as any).fileName || `产品图片${idx + 1}`;
                    
                    if (!imageUrl) {
                      return (
                        <div key={idx} style={{ display: 'inline-block', marginRight: 8, marginBottom: 8 }}>
                          <div style={{ 
                            width: 80, 
                            height: 80, 
                            backgroundColor: '#f0f0f0', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '12px',
                            color: '#999',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px'
                          }}>
                            {imageName}
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <Image
                        key={idx}
                        src={imageUrl}
                        width={80}
                        style={{ marginRight: 8, marginBottom: 8 }}
                        alt={imageName}
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                      />
                    );
                  })}
                </Image.PreviewGroup>
              ) : (
                <span>无</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="样机阶段">
              <Space direction="vertical" style={{ width: '100%' }}>
                {selectedProject.stages.map((stage, index) => (
                  <Card key={index} size="small">
                    <Row gutter={16}>
                      <Col span={4}>
                        <Text strong>{stage.stage}</Text>
                      </Col>
                      <Col span={4}>
                        <Text>数量: {stage.sampleQuantity}</Text>
                      </Col>
                      <Col span={4}>
                        <Text>原因: {stage.sampleReason}</Text>
                      </Col>
                      <Col span={4}>
                        <Text>测试: <Tag color={stage.testResult === 'PASS' ? 'green' : stage.testResult === 'FAIL' ? 'red' : 'orange'}>{stage.testResult}</Tag></Text>
                      </Col>
                      <Col span={4}>
                        <Text>版本: {stage.approvalVersion || '-'}</Text>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="团队成员">
              <Space wrap>
                {selectedProject.members.map((member, index) => (
                  <Tag key={index} icon={<UserOutlined />} color="blue">
                    {member.name} ({getRoleDisplayName(member.role as UserRole)})
                  </Tag>
                ))}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {selectedProject.remarks || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建人">
              {selectedProject.creatorName}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(selectedProject.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(selectedProject.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
};

export default ProjectManagementPage; 