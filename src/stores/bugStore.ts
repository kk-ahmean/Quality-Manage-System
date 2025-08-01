import { create } from 'zustand';
import { 
  Bug, 
  BugPriority, 
  BugSeverity, 
  BugType, 
  BugStatus, 
  BugResponsibility,
  CreateBugRequest, 
  UpdateBugRequest, 
  BugFilters, 
  BugListResponse, 
  BugStatistics,
  AssignBugRequest,
  UpdateBugStatusRequest,
  AddBugCommentRequest,
  BatchBugOperation,
  BugComment,
  BugAttachment
} from '../types/bug';

interface BugStore {
  // 状态
  bugs: Bug[];
  selectedBug: Bug | null;
  loading: boolean;
  statistics: BugStatistics | null;
  filters: BugFilters;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };

  // 操作
  fetchBugs: (filters?: BugFilters, page?: number, pageSize?: number) => Promise<void>;
  createBug: (bug: CreateBugRequest) => Promise<Bug>;
  updateBug: (bug: UpdateBugRequest) => Promise<Bug>;
  deleteBug: (id: string) => Promise<void>;
  assignBug: (request: AssignBugRequest) => Promise<void>;
  updateBugStatus: (request: UpdateBugStatusRequest) => Promise<void>;
  addBugComment: (request: AddBugCommentRequest) => Promise<void>;
  batchOperation: (operation: BatchBugOperation) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  getUnresolvedBugsByDate: () => Array<{date: string, value: number, type: string}>;
  setSelectedBug: (bug: Bug | null) => void;
  setFilters: (filters: BugFilters) => void;
  resetFilters: () => void;
}

// 模拟数据
const mockBugs: Bug[] = [
  {
    id: '1',
    title: '登录页面无法正常显示验证码',
    description: '用户反馈登录页面的验证码图片无法正常显示，导致无法完成登录操作。',
    reproductionSteps: '1. 打开登录页面\n2. 输入用户名和密码\n3. 验证码图片显示异常',
    expectedResult: '验证码图片应该正常显示',
    actualResult: '验证码图片显示为空白或错误图片',
    priority: 'P1' as BugPriority,
    severity: 'A' as BugSeverity,
    type: '功能缺陷' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '新建' as BugStatus,
    reporter: 'user1',
    reporterName: '张三',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    tags: ['登录', '验证码', 'UI'],
    attachments: [],
    comments: []
  },
  {
    id: '2',
    title: '系统响应速度过慢',
    description: '用户反馈系统在处理大量数据时响应速度明显变慢，影响工作效率。',
    reproductionSteps: '1. 登录系统\n2. 打开包含大量数据的页面\n3. 执行查询操作',
    expectedResult: '页面应该在3秒内完成加载',
    actualResult: '页面加载时间超过10秒',
    priority: 'P2' as BugPriority,
    severity: 'B' as BugSeverity,
    type: '性能问题' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '处理中' as BugStatus,
    assignee: 'user2',
    assigneeName: '李四',
    reporter: 'user3',
    reporterName: '王五',
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-16T09:15:00Z',
    dueDate: '2024-01-20T00:00:00Z',
    tags: ['性能', '数据库'],
    attachments: [],
    comments: [
      {
        id: '1',
        content: '正在分析性能瓶颈，初步怀疑是数据库查询优化问题',
        author: 'user2',
        authorName: '李四',
        createdAt: '2024-01-16T09:15:00Z',
        updatedAt: '2024-01-16T09:15:00Z'
      }
    ]
  },
  {
    id: '3',
    title: '移动端界面显示异常',
    description: '在移动设备上访问系统时，部分界面元素显示不正确。',
    reproductionSteps: '1. 使用手机浏览器访问系统\n2. 查看用户管理页面\n3. 观察界面布局',
    expectedResult: '界面应该适配移动端，元素排列整齐',
    actualResult: '表格内容溢出，按钮位置错乱',
    priority: 'P2' as BugPriority,
    severity: 'B' as BugSeverity,
    type: '界面问题' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '待验证' as BugStatus,
    assignee: 'user4',
    assigneeName: '赵六',
    reporter: 'user1',
    reporterName: '张三',
    createdAt: '2024-01-13T16:45:00Z',
    updatedAt: '2024-01-17T11:30:00Z',
    dueDate: '2024-01-25T00:00:00Z',
    tags: ['移动端', '响应式'],
    attachments: [],
    comments: [
      {
        id: '2',
        content: '已完成移动端适配修复，请测试验证',
        author: 'user4',
        authorName: '赵六',
        createdAt: '2024-01-17T11:30:00Z',
        updatedAt: '2024-01-17T11:30:00Z'
      }
    ]
  },
  {
    id: '4',
    title: '数据导出功能异常',
    description: '用户在使用数据导出功能时，导出的文件格式不正确。',
    reproductionSteps: '1. 进入任务管理页面\n2. 选择要导出的数据\n3. 点击导出按钮\n4. 下载文件并打开',
    expectedResult: '导出的文件应该是正确的Excel格式',
    actualResult: '导出的文件无法正常打开或格式错误',
    priority: 'P1' as BugPriority,
    severity: 'A' as BugSeverity,
    type: '功能缺陷' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '已解决' as BugStatus,
    assignee: 'user2',
    assigneeName: '李四',
    reporter: 'user5',
    reporterName: '钱七',
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-18T15:20:00Z',
    tags: ['导出', 'Excel'],
    attachments: [],
    comments: [
      {
        id: '3',
        content: '已修复导出功能，现在可以正常导出Excel文件',
        author: 'user2',
        authorName: '李四',
        createdAt: '2024-01-18T15:20:00Z',
        updatedAt: '2024-01-18T15:20:00Z'
      }
    ]
  },
  {
    id: '5',
    title: '权限验证逻辑错误',
    description: '系统在某些情况下没有正确验证用户权限，可能导致越权访问。',
    reproductionSteps: '1. 使用普通用户账号登录\n2. 尝试访问管理员功能\n3. 观察是否能够访问',
    expectedResult: '应该被拒绝访问并显示权限不足提示',
    actualResult: '可以访问管理员功能',
    priority: 'P0' as BugPriority,
    severity: 'S' as BugSeverity,
    type: '安全问题' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '处理中' as BugStatus,
    assignee: 'user6',
    assigneeName: '孙八',
    reporter: 'user7',
    reporterName: '周九',
    createdAt: '2024-01-11T13:15:00Z',
    updatedAt: '2024-01-19T08:45:00Z',
    dueDate: '2024-01-22T00:00:00Z',
    tags: ['安全', '权限'],
    attachments: [],
    comments: [
      {
        id: '4',
        content: '正在紧急修复权限验证逻辑，预计今天完成',
        author: 'user6',
        authorName: '孙八',
        createdAt: '2024-01-19T08:45:00Z',
        updatedAt: '2024-01-19T08:45:00Z'
      }
    ]
  },
  {
    id: '6',
    title: '数据库连接超时',
    description: '系统在高并发情况下出现数据库连接超时问题。',
    reproductionSteps: '1. 模拟高并发访问\n2. 观察数据库连接状态\n3. 检查错误日志',
    expectedResult: '数据库连接应该稳定，不会出现超时',
    actualResult: '出现连接超时错误',
    priority: 'P1' as BugPriority,
    severity: 'A' as BugSeverity,
    type: '性能问题' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '处理中' as BugStatus,
    assignee: 'user2',
    assigneeName: '李四',
    reporter: 'user8',
    reporterName: '吴十',
    createdAt: '2024-01-14T08:30:00Z',
    updatedAt: '2024-01-16T14:20:00Z',
    tags: ['数据库', '性能'],
    attachments: [],
    comments: []
  },
  {
    id: '7',
    title: '用户权限配置错误',
    description: '新用户的权限配置不正确，导致无法访问必要功能。',
    reproductionSteps: '1. 创建新用户账号\n2. 配置用户权限\n3. 测试功能访问',
    expectedResult: '用户应该能够正常访问配置的功能',
    actualResult: '用户无法访问部分功能',
    priority: 'P2' as BugPriority,
    severity: 'B' as BugSeverity,
    type: '功能缺陷' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '新建' as BugStatus,
    reporter: 'user9',
    reporterName: '郑十一',
    createdAt: '2024-01-13T11:45:00Z',
    updatedAt: '2024-01-13T11:45:00Z',
    tags: ['权限', '配置'],
    attachments: [],
    comments: []
  },
  {
    id: '8',
    title: 'API接口响应超时',
    description: '第三方API接口在高峰期出现响应超时问题。',
    reproductionSteps: '1. 在高峰期调用第三方API\n2. 观察响应时间\n3. 检查超时错误',
    expectedResult: 'API应该在5秒内响应',
    actualResult: 'API响应时间超过30秒',
    priority: 'P1' as BugPriority,
    severity: 'A' as BugSeverity,
    type: '性能问题' as BugType,
    responsibility: '软件' as BugResponsibility,
    status: '待验证' as BugStatus,
    assignee: 'user3',
    assigneeName: '王五',
    reporter: 'user10',
    reporterName: '孙十二',
    createdAt: '2024-01-14T16:30:00Z',
    updatedAt: '2024-01-14T16:30:00Z',
    tags: ['API', '超时'],
    attachments: [],
    comments: []
  }
];

const mockStatistics: BugStatistics = {
  total: 8,
  byStatus: {
    '新建': 2,
    '处理中': 3,
    '待验证': 2,
    '已解决': 1,
    '已关闭': 0,
    '重新打开': 0
  },
  byPriority: {
    'P0': 1,
    'P1': 4,
    'P2': 3,
    'P3': 0
  },
  bySeverity: {
    'S': 1,
    'A': 4,
    'B': 3,
    'C': 0
  },
  byType: {
    '功能缺陷': 3,
    '性能问题': 3,
    '界面问题': 1,
    '兼容性问题': 0,
    '安全问题': 1,
    '其他': 0
  },
  byResponsibility: {
    '软件': 8,
    '硬件': 0,
    '结构': 0,
    'ID': 0,
    '包装': 0,
    '产品': 0,
    '项目': 0,
    '供应商': 0
  },
  resolutionRate: 12,
  averageResolutionTime: 3.5
};

export const useBugStore = create<BugStore>((set, get) => ({
  // 初始状态
  bugs: [],
  selectedBug: null,
  loading: false,
  statistics: null,
  filters: {},
  pagination: {
    current: 1,
    pageSize: 20,
    total: 0
  },

  // 获取Bug列表
  fetchBugs: async (filters = {}, page = 1, pageSize = 20) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredBugs = [...mockBugs];
      
      // 应用过滤器
      if (filters.status && filters.status.length > 0) {
        filteredBugs = filteredBugs.filter(bug => filters.status!.includes(bug.status));
      }
      if (filters.priority && filters.priority.length > 0) {
        filteredBugs = filteredBugs.filter(bug => filters.priority!.includes(bug.priority));
      }
      if (filters.severity && filters.severity.length > 0) {
        filteredBugs = filteredBugs.filter(bug => filters.severity!.includes(bug.severity));
      }
      if (filters.type && filters.type.length > 0) {
        filteredBugs = filteredBugs.filter(bug => filters.type!.includes(bug.type));
      }
      if (filters.responsibility && filters.responsibility.length > 0) {
        filteredBugs = filteredBugs.filter(bug => filters.responsibility!.includes(bug.responsibility));
      }
      if (filters.assignee) {
        filteredBugs = filteredBugs.filter(bug => bug.assignee === filters.assignee);
      }
      if (filters.reporter) {
        filteredBugs = filteredBugs.filter(bug => bug.reporter === filters.reporter);
      }
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filteredBugs = filteredBugs.filter(bug => 
          bug.title.toLowerCase().includes(keyword) ||
          bug.description.toLowerCase().includes(keyword)
        );
      }

      const total = filteredBugs.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedBugs = filteredBugs.slice(start, end);

      set({
        bugs: paginatedBugs,
        pagination: {
          current: page,
          pageSize,
          total
        },
        loading: false
      });
    } catch (error) {
      console.error('获取Bug列表失败:', error);
      set({ loading: false });
    }
  },

  // 创建Bug
  createBug: async (bugData: CreateBugRequest) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newBug: Bug = {
        id: Date.now().toString(),
        ...bugData,
        status: bugData.status || '新建' as BugStatus,
        reporter: 'currentUser', // 应该从认证状态获取
        reporterName: '当前用户',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments: [],
        comments: []
      };

      mockBugs.push(newBug);
      
      set(state => ({
        bugs: [...state.bugs, newBug],
        loading: false
      }));

      return newBug;
    } catch (error) {
      console.error('创建Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 更新Bug
  updateBug: async (bugData: UpdateBugRequest) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const bugIndex = mockBugs.findIndex(bug => bug.id === bugData.id);
      if (bugIndex === -1) {
        throw new Error('Bug不存在');
      }

      const updatedBug = {
        ...mockBugs[bugIndex],
        ...bugData,
        updatedAt: new Date().toISOString()
      };

      mockBugs[bugIndex] = updatedBug;
      
      set(state => ({
        bugs: state.bugs.map(bug => bug.id === bugData.id ? updatedBug : bug),
        selectedBug: state.selectedBug?.id === bugData.id ? updatedBug : state.selectedBug,
        loading: false
      }));

      return updatedBug;
    } catch (error) {
      console.error('更新Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 删除Bug
  deleteBug: async (id: string) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const bugIndex = mockBugs.findIndex(bug => bug.id === id);
      if (bugIndex === -1) {
        throw new Error('Bug不存在');
      }

      mockBugs.splice(bugIndex, 1);
      
      set(state => ({
        bugs: state.bugs.filter(bug => bug.id !== id),
        selectedBug: state.selectedBug?.id === id ? null : state.selectedBug,
        loading: false
      }));
    } catch (error) {
      console.error('删除Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 分配Bug
  assignBug: async (request: AssignBugRequest) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const bugIndex = mockBugs.findIndex(bug => bug.id === request.bugId);
      if (bugIndex === -1) {
        throw new Error('Bug不存在');
      }

      const updatedBug = {
        ...mockBugs[bugIndex],
        assignee: request.assignee,
        assigneeName: '被分配用户', // 应该根据用户ID获取用户名
        dueDate: request.dueDate,
        status: '处理中' as BugStatus,
        updatedAt: new Date().toISOString()
      };

      mockBugs[bugIndex] = updatedBug;
      
      set(state => ({
        bugs: state.bugs.map(bug => bug.id === request.bugId ? updatedBug : bug),
        selectedBug: state.selectedBug?.id === request.bugId ? updatedBug : state.selectedBug,
        loading: false
      }));
    } catch (error) {
      console.error('分配Bug失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 更新Bug状态
  updateBugStatus: async (request: UpdateBugStatusRequest) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const bugIndex = mockBugs.findIndex(bug => bug.id === request.bugId);
      if (bugIndex === -1) {
        throw new Error('Bug不存在');
      }

      const updatedBug = {
        ...mockBugs[bugIndex],
        status: request.status,
        updatedAt: new Date().toISOString()
      };

      mockBugs[bugIndex] = updatedBug;
      
      set(state => ({
        bugs: state.bugs.map(bug => bug.id === request.bugId ? updatedBug : bug),
        selectedBug: state.selectedBug?.id === request.bugId ? updatedBug : state.selectedBug,
        loading: false
      }));
    } catch (error) {
      console.error('更新Bug状态失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 添加Bug评论
  addBugComment: async (request: AddBugCommentRequest) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const bugIndex = mockBugs.findIndex(bug => bug.id === request.bugId);
      if (bugIndex === -1) {
        throw new Error('Bug不存在');
      }

      const newComment: BugComment = {
        id: Date.now().toString(),
        content: request.content,
        author: 'currentUser',
        authorName: '当前用户',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mentions: request.mentions
      };

      const updatedBug = {
        ...mockBugs[bugIndex],
        comments: [...mockBugs[bugIndex].comments, newComment],
        updatedAt: new Date().toISOString()
      };

      mockBugs[bugIndex] = updatedBug;
      
      set(state => ({
        bugs: state.bugs.map(bug => bug.id === request.bugId ? updatedBug : bug),
        selectedBug: state.selectedBug?.id === request.bugId ? updatedBug : state.selectedBug,
        loading: false
      }));
    } catch (error) {
      console.error('添加Bug评论失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 批量操作
  batchOperation: async (operation: BatchBugOperation) => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      switch (operation.operation) {
        case 'assign':
          for (const bugId of operation.bugIds) {
            const bugIndex = mockBugs.findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
              mockBugs[bugIndex] = {
                ...mockBugs[bugIndex],
                assignee: operation.data.assignee,
                assigneeName: '被分配用户',
                status: '处理中' as BugStatus,
                updatedAt: new Date().toISOString()
              };
            }
          }
          break;
        case 'updateStatus':
          for (const bugId of operation.bugIds) {
            const bugIndex = mockBugs.findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
              mockBugs[bugIndex] = {
                ...mockBugs[bugIndex],
                status: operation.data.status,
                updatedAt: new Date().toISOString()
              };
            }
          }
          break;
        case 'delete':
          for (const bugId of operation.bugIds) {
            const bugIndex = mockBugs.findIndex(bug => bug.id === bugId);
            if (bugIndex !== -1) {
              mockBugs.splice(bugIndex, 1);
            }
          }
          break;
      }

      // 重新获取当前页面的数据
      const { filters, pagination } = get();
      get().fetchBugs(filters, pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('批量操作失败:', error);
      set({ loading: false });
      throw error;
    }
  },

  // 获取统计数据
  fetchStatistics: async () => {
    set({ loading: true });
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 基于真实Bug数据计算统计数据
      const bugs = mockBugs;
      
      // 按状态统计
      const byStatus: Record<BugStatus, number> = {
        '新建': 0,
        '处理中': 0,
        '待验证': 0,
        '已解决': 0,
        '已关闭': 0,
        '重新打开': 0
      };
      
      // 按优先级统计
      const byPriority: Record<BugPriority, number> = {
        'P0': 0,
        'P1': 0,
        'P2': 0,
        'P3': 0
      };
      
      // 按严重程度统计
      const bySeverity: Record<BugSeverity, number> = {
        'S': 0,
        'A': 0,
        'B': 0,
        'C': 0
      };
      
      // 按类型统计
      const byType: Record<BugType, number> = {
        '功能缺陷': 0,
        '性能问题': 0,
        '界面问题': 0,
        '兼容性问题': 0,
        '安全问题': 0,
        '其他': 0
      };
      
      // 按责任归属统计
      const byResponsibility: Record<BugResponsibility, number> = {
        '软件': 0,
        '硬件': 0,
        '结构': 0,
        'ID': 0,
        '包装': 0,
        '产品': 0,
        '项目': 0,
        '供应商': 0
      };
      
      // 统计各个维度的数据
      bugs.forEach(bug => {
        byStatus[bug.status]++;
        byPriority[bug.priority]++;
        bySeverity[bug.severity]++;
        byType[bug.type]++;
        byResponsibility[bug.responsibility]++;
      });
      
      // 计算解决率
      const resolvedCount = byStatus['已解决'] + byStatus['已关闭'];
      const resolutionRate = bugs.length > 0 ? Math.round((resolvedCount / bugs.length) * 100) : 0;
      
      // 计算平均解决时间（模拟数据）
      const averageResolutionTime = 3.5;
      
      const statistics: BugStatistics = {
        total: bugs.length,
        byStatus,
        byPriority,
        bySeverity,
        byType,
        byResponsibility,
        resolutionRate,
        averageResolutionTime
      };
      
      set({
        statistics,
        loading: false
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      set({ loading: false });
    }
  },

  // 获取按日期统计的未解决Bug数据
  getUnresolvedBugsByDate: () => {
    const bugs = mockBugs;
    
    // 按创建日期分组统计Bug总数和未解决数
    const bugsByDate: Record<string, { total: number; unresolved: number }> = {};
    
    bugs.forEach(bug => {
      const date = new Date(bug.createdAt).toISOString().split('T')[0]; // 获取YYYY-MM-DD格式
      if (!bugsByDate[date]) {
        bugsByDate[date] = { total: 0, unresolved: 0 };
      }
      bugsByDate[date].total++;
      
      // 统计未解决的Bug：只要状态不是"已解决"的都算作未解决
      if (bug.status !== '已解决') {
        bugsByDate[date].unresolved++;
      }
    });
    
    // 转换为图表数据格式，按日期排序
    const sortedDates = Object.keys(bugsByDate).sort();
    return sortedDates.map(date => ({
      date,
      value: bugsByDate[date].unresolved, // 直接使用未解决数
      type: '未解决Bug'
    }));
  },

  // 设置选中的Bug
  setSelectedBug: (bug: Bug | null) => {
    set({ selectedBug: bug });
  },

  // 设置过滤器
  setFilters: (filters: BugFilters) => {
    set({ filters });
  },

  // 重置过滤器
  resetFilters: () => {
    set({ filters: {} });
  }
})); 