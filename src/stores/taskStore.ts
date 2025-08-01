import { create } from 'zustand'
import { 
  Task, 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  TaskFilters, 
  TaskListResponse,
  TaskStatistics,
  AssignTaskRequest,
  UpdateTaskProgressRequest,
  BatchTaskOperation,
  TaskTemplate,
  TaskStatus
} from '../types/task'
import { User } from '../types/user'

interface TaskStore {
  // 状态
  tasks: Task[]
  currentTask: Task | null
  loading: boolean
  statistics: TaskStatistics
  filters: TaskFilters
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  
  // 操作
  fetchTasks: (filters?: TaskFilters, page?: number, pageSize?: number) => Promise<void>
  createTask: (task: CreateTaskRequest) => Promise<Task>
  updateTask: (taskId: string, updates: UpdateTaskRequest) => Promise<Task>
  deleteTask: (taskId: string) => Promise<void>
  assignTask: (request: AssignTaskRequest) => Promise<Task>
  updateTaskProgress: (request: UpdateTaskProgressRequest) => Promise<Task>
  batchOperation: (operation: BatchTaskOperation) => Promise<void>
  getTaskById: (taskId: string) => Task | null
  getStatistics: () => Promise<TaskStatistics>
  setFilters: (filters: TaskFilters) => void
  setCurrentTask: (task: Task | null) => void
  resetFilters: () => void
}

// 模拟数据
const mockTasks: Task[] = [
  {
    id: '1',
    title: '修复登录页面Bug',
    description: '用户反馈登录页面在某些浏览器下无法正常显示验证码',
    priority: 'P1',
    status: 'in_progress',
    assignee: '2',
    assigneeName: '开发工程师',
    creator: '1',
    creatorName: '系统管理员',
    dueDate: '2025-08-05',
    relatedBugs: ['bug-001'],
    tags: ['前端', '登录'],
    progress: 60,
    estimatedHours: 8,
    actualHours: 5,
    createdAt: '2025-07-25T10:00:00Z',
    updatedAt: '2025-07-29T14:30:00Z'
  },
  {
    id: '2',
    title: '优化数据库查询性能',
    description: '用户列表页面加载速度较慢，需要优化数据库查询语句',
    priority: 'P2',
    status: 'todo',
    assignee: '2',
    assigneeName: '开发工程师',
    creator: '1',
    creatorName: '系统管理员',
    dueDate: '2025-08-10',
    tags: ['后端', '性能优化'],
    progress: 0,
    estimatedHours: 16,
    createdAt: '2025-07-26T09:00:00Z',
    updatedAt: '2025-07-26T09:00:00Z'
  },
  {
    id: '3',
    title: '编写用户管理模块测试用例',
    description: '为用户管理模块编写完整的单元测试和集成测试用例',
    priority: 'P2',
    status: 'review',
    assignee: '3',
    assigneeName: '测试工程师',
    creator: '1',
    creatorName: '系统管理员',
    dueDate: '2025-08-03',
    tags: ['测试', '用户管理'],
    progress: 90,
    estimatedHours: 12,
    actualHours: 10,
    createdAt: '2025-07-27T11:00:00Z',
    updatedAt: '2025-07-29T16:00:00Z'
  },
  {
    id: '4',
    title: '设计新的UI组件库',
    description: '设计一套统一的UI组件库，提升开发效率和用户体验',
    priority: 'P3',
    status: 'completed',
    assignee: '2',
    assigneeName: '开发工程师',
    creator: '1',
    creatorName: '系统管理员',
    dueDate: '2025-07-28',
    tags: ['前端', 'UI设计'],
    progress: 100,
    estimatedHours: 24,
    actualHours: 20,
    createdAt: '2025-07-20T08:00:00Z',
    updatedAt: '2025-07-28T18:00:00Z',
    completedAt: '2025-07-28T18:00:00Z'
  },
  {
    id: '5',
    title: '部署生产环境',
    description: '将系统部署到生产环境，确保系统稳定运行',
    priority: 'P0',
    status: 'todo',
    assignee: '2',
    assigneeName: '开发工程师',
    creator: '1',
    creatorName: '系统管理员',
    dueDate: '2025-08-01',
    tags: ['部署', '运维'],
    progress: 0,
    estimatedHours: 8,
    createdAt: '2025-07-29T10:00:00Z',
    updatedAt: '2025-07-29T10:00:00Z'
  }
]

const mockStatistics: TaskStatistics = {
  total: 5,
  todo: 2,
  inProgress: 1,
  review: 1,
  completed: 1,
  cancelled: 0,
  overdue: 0,
  dueToday: 0,
  dueThisWeek: 2
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // 初始状态
  tasks: [],
  currentTask: null,
  loading: false,
  statistics: mockStatistics,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0
  },

  // 获取任务列表
  fetchTasks: async (filters = {}, page = 1, pageSize = 10) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      let filteredTasks = [...mockTasks]
      
      // 应用筛选条件
      if (filters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status)
      }
      
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filters.priority)
      }
      
      if (filters.assignee) {
        filteredTasks = filteredTasks.filter(task => task.assignee === filters.assignee)
      }
      
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(keyword) ||
          task.description.toLowerCase().includes(keyword)
        )
      }
      
      // 分页
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const paginatedTasks = filteredTasks.slice(start, end)
      
      set({
        tasks: paginatedTasks,
        pagination: {
          page,
          pageSize,
          total: filteredTasks.length
        },
        loading: false
      })
    } catch (error) {
      console.error('获取任务列表失败:', error)
      set({ loading: false })
    }
  },

  // 创建任务
  createTask: async (taskData: CreateTaskRequest) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const newTask: Task = {
        id: Date.now().toString(),
        ...taskData,
        status: 'todo',
        progress: 0,
        creator: '1', // 当前用户ID
        creatorName: '系统管理员',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      mockTasks.push(newTask)
      
      set(state => ({
        tasks: [...state.tasks, newTask],
        loading: false
      }))
      
      return newTask
    } catch (error) {
      console.error('创建任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 更新任务
  updateTask: async (taskId: string, updates: UpdateTaskRequest) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const taskIndex = mockTasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      // 如果更新了负责人，需要同时更新负责人姓名
      let assigneeName = mockTasks[taskIndex].assigneeName
      if (updates.assignee && updates.assignee !== mockTasks[taskIndex].assignee) {
        // 根据用户ID查找用户名
        const userMap: Record<string, string> = {
          '1': '系统管理员',
          '2': '开发工程师',
          '3': '测试工程师',
          '4': '产品经理',
          '5': '项目经理',
          '6': '质量工程师'
        }
        assigneeName = userMap[updates.assignee] || '未知用户'
      }
      
      const updatedTask = {
        ...mockTasks[taskIndex],
        ...updates,
        assigneeName, // 确保负责人姓名也被更新
        updatedAt: new Date().toISOString()
      }
      
      mockTasks[taskIndex] = updatedTask
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === taskId ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
        loading: false
      }))
      
      return updatedTask
    } catch (error) {
      console.error('更新任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 删除任务
  deleteTask: async (taskId: string) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const taskIndex = mockTasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      mockTasks.splice(taskIndex, 1)
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== taskId),
        currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
        loading: false
      }))
    } catch (error) {
      console.error('删除任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 分配任务
  assignTask: async (request: AssignTaskRequest) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const taskIndex = mockTasks.findIndex(task => task.id === request.taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      // 根据用户ID查找用户名
      const userMap: Record<string, string> = {
        '1': '系统管理员',
        '2': '开发工程师',
        '3': '测试工程师',
        '4': '产品经理',
        '5': '项目经理',
        '6': '质量工程师'
      }
      const assigneeName = userMap[request.assignee] || '未知用户'
      
      const updatedTask: Task = {
        ...mockTasks[taskIndex],
        assignee: request.assignee,
        assigneeName, // 确保负责人姓名也被更新
        status: 'todo' as TaskStatus,
        updatedAt: new Date().toISOString()
      }
      
      mockTasks[taskIndex] = updatedTask
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === request.taskId ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === request.taskId ? updatedTask : state.currentTask,
        loading: false
      }))
      
      return updatedTask
    } catch (error) {
      console.error('分配任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 更新任务进度
  updateTaskProgress: async (request: UpdateTaskProgressRequest) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 600))
      
      const taskIndex = mockTasks.findIndex(task => task.id === request.taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      const updatedTask: Task = {
        ...mockTasks[taskIndex],
        progress: request.progress,
        status: request.progress >= 100 ? 'completed' as TaskStatus : 
                request.progress > 0 ? 'in_progress' as TaskStatus : 'todo' as TaskStatus,
        updatedAt: new Date().toISOString(),
        completedAt: request.progress >= 100 ? new Date().toISOString() : undefined
      }
      
      mockTasks[taskIndex] = updatedTask
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === request.taskId ? updatedTask : task
        ),
        currentTask: state.currentTask?.id === request.taskId ? updatedTask : state.currentTask,
        loading: false
      }))
      
      return updatedTask
    } catch (error) {
      console.error('更新任务进度失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 批量操作
  batchOperation: async (operation: BatchTaskOperation) => {
    set({ loading: true })
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      operation.taskIds.forEach(taskId => {
        const taskIndex = mockTasks.findIndex(task => task.id === taskId)
        if (taskIndex !== -1) {
          const task = mockTasks[taskIndex]
          
          switch (operation.operation) {
            case 'assign':
              if (operation.assignee) {
                task.assignee = operation.assignee
              }
              break
            case 'changeStatus':
              if (operation.status) {
                task.status = operation.status
              }
              break
            case 'changePriority':
              if (operation.priority) {
                task.priority = operation.priority
              }
              break
            case 'delete':
              mockTasks.splice(taskIndex, 1)
              break
          }
          
          if (operation.operation !== 'delete') {
            task.updatedAt = new Date().toISOString()
          }
        }
      })
      
      set(state => ({
        tasks: state.tasks.filter(task => !operation.taskIds.includes(task.id)),
        loading: false
      }))
    } catch (error) {
      console.error('批量操作失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 根据ID获取任务
  getTaskById: (taskId: string) => {
    return mockTasks.find(task => task.id === taskId) || null
  },

  // 获取统计信息
  getStatistics: async () => {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const today = new Date()
      const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const statistics: TaskStatistics = {
        total: mockTasks.length,
        todo: mockTasks.filter(task => task.status === 'todo').length,
        inProgress: mockTasks.filter(task => task.status === 'in_progress').length,
        review: mockTasks.filter(task => task.status === 'review').length,
        completed: mockTasks.filter(task => task.status === 'completed').length,
        cancelled: mockTasks.filter(task => task.status === 'cancelled').length,
        overdue: mockTasks.filter(task => new Date(task.dueDate) < today && task.status !== 'completed').length,
        dueToday: mockTasks.filter(task => {
          const dueDate = new Date(task.dueDate)
          return dueDate.toDateString() === today.toDateString()
        }).length,
        dueThisWeek: mockTasks.filter(task => {
          const dueDate = new Date(task.dueDate)
          return dueDate >= today && dueDate <= thisWeek
        }).length
      }
      
      set({ statistics })
      return statistics
    } catch (error) {
      console.error('获取统计信息失败:', error)
      throw error
    }
  },

  // 设置筛选条件
  setFilters: (filters: TaskFilters) => {
    set({ filters })
  },

  // 设置当前任务
  setCurrentTask: (task: Task | null) => {
    set({ currentTask: task })
  },

  // 重置筛选条件
  resetFilters: () => {
    set({ filters: {} })
  }
})) 