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
import { taskAPI } from '../services/api'

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

const mockStatistics: TaskStatistics = {
  total: 0,
  todo: 0,
  inProgress: 0,
  review: 0,
  completed: 0,
  cancelled: 0,
  overdue: 0,
  dueToday: 0,
  dueThisWeek: 0
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
      // 调用真实API
      const response = await taskAPI.getTasks({
        ...filters,
        page,
        pageSize
      })
      
      if (response.data && response.data.success) {
        const { tasks, pagination } = response.data.data
        
        set({
          tasks,
          pagination: {
            page: pagination.page || page,
            pageSize: pagination.pageSize || pageSize,
            total: pagination.total || tasks.length
          },
          loading: false
        })
      } else {
        throw new Error(response.data?.message || '获取任务列表失败')
      }
    } catch (error: any) {
      console.error('获取任务列表失败:', error)
      set({ loading: false })
    }
  },

  // 创建任务
  createTask: async (taskData: CreateTaskRequest) => {
    set({ loading: true })
    
    try {
      // 调用真实API
      const response = await taskAPI.createTask(taskData)
      
      if (response.data && response.data.success) {
        const newTask = response.data.data
        
        set(state => ({
          tasks: [...state.tasks, newTask],
          loading: false
        }))
        
        return newTask
      } else {
        throw new Error(response.data?.message || '创建任务失败')
      }
    } catch (error: any) {
      console.error('创建任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 更新任务
  updateTask: async (taskId: string, updates: UpdateTaskRequest) => {
    set({ loading: true })
    
    try {
      // 调用真实API
      const response = await taskAPI.updateTask(taskId, updates)
      
      if (response.data && response.data.success) {
        const updatedTask = response.data.data
        
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === taskId ? updatedTask : task
          ),
          currentTask: state.currentTask?.id === taskId ? updatedTask : state.currentTask,
          loading: false
        }))
        
        return updatedTask
      } else {
        throw new Error(response.data?.message || '更新任务失败')
      }
    } catch (error: any) {
      console.error('更新任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 删除任务
  deleteTask: async (taskId: string) => {
    set({ loading: true })
    
    try {
      // 调用真实API
      const response = await taskAPI.deleteTask(taskId)
      
      if (response.data && response.data.success) {
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== taskId),
          currentTask: state.currentTask?.id === taskId ? null : state.currentTask,
          loading: false
        }))
      } else {
        throw new Error(response.data?.message || '删除任务失败')
      }
    } catch (error: any) {
      console.error('删除任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 分配任务
  assignTask: async (request: AssignTaskRequest) => {
    set({ loading: true })
    
    try {
      // 调用真实API
      const response = await taskAPI.assignTask(request.taskId, request.assignee)
      
      if (response.data && response.data.success) {
        const updatedTask = response.data.data
        
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === request.taskId ? updatedTask : task
          ),
          currentTask: state.currentTask?.id === request.taskId ? updatedTask : state.currentTask,
          loading: false
        }))
        
        return updatedTask
      } else {
        throw new Error(response.data?.message || '分配任务失败')
      }
    } catch (error: any) {
      console.error('分配任务失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 更新任务进度
  updateTaskProgress: async (request: UpdateTaskProgressRequest) => {
    set({ loading: true })
    
    try {
      // 调用真实API - 这里需要后端提供进度更新API
      // 暂时使用更新任务API
      const response = await taskAPI.updateTask(request.taskId, {
        progress: request.progress,
        status: request.progress >= 100 ? 'completed' : 
                request.progress > 0 ? 'in_progress' : 'todo'
      })
      
      if (response.data && response.data.success) {
        const updatedTask = response.data.data
        
        set(state => ({
          tasks: state.tasks.map(task => 
            task.id === request.taskId ? updatedTask : task
          ),
          currentTask: state.currentTask?.id === request.taskId ? updatedTask : state.currentTask,
          loading: false
        }))
        
        return updatedTask
      } else {
        throw new Error(response.data?.message || '更新任务进度失败')
      }
    } catch (error: any) {
      console.error('更新任务进度失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 批量操作
  batchOperation: async (operation: BatchTaskOperation) => {
    set({ loading: true })
    
    try {
      // 根据操作类型调用相应的API
      switch (operation.operation) {
        case 'assign':
          // 批量分配 - 逐个调用API
          for (const taskId of operation.taskIds) {
            if (operation.assignee) {
              await taskAPI.assignTask(taskId, operation.assignee)
            }
          }
          break
        case 'changeStatus':
          // 批量更改状态 - 逐个调用API
          for (const taskId of operation.taskIds) {
            if (operation.status) {
              await taskAPI.updateTask(taskId, { status: operation.status })
            }
          }
          break
        case 'changePriority':
          // 批量更改优先级 - 逐个调用API
          for (const taskId of operation.taskIds) {
            if (operation.priority) {
              await taskAPI.updateTask(taskId, { priority: operation.priority })
            }
          }
          break
        case 'delete':
          // 批量删除 - 逐个调用API
          for (const taskId of operation.taskIds) {
            await taskAPI.deleteTask(taskId)
          }
          break
      }
      
      // 重新获取任务列表
      await get().fetchTasks(get().filters, get().pagination.page, get().pagination.pageSize)
      
      set({ loading: false })
    } catch (error: any) {
      console.error('批量操作失败:', error)
      set({ loading: false })
      throw error
    }
  },

  // 根据ID获取任务
  getTaskById: (taskId: string) => {
    return get().tasks.find(task => task.id === taskId) || null
  },

  // 获取统计信息
  getStatistics: async () => {
    try {
      // 调用真实API - 这里需要后端提供统计API
      // 暂时使用模拟数据，等待后端实现
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const statistics: TaskStatistics = {
        total: get().tasks.length,
        todo: get().tasks.filter(task => task.status === 'todo').length,
        inProgress: get().tasks.filter(task => task.status === 'in_progress').length,
        review: get().tasks.filter(task => task.status === 'review').length,
        completed: get().tasks.filter(task => task.status === 'completed').length,
        cancelled: get().tasks.filter(task => task.status === 'cancelled').length,
        overdue: get().tasks.filter(task => {
          const today = new Date()
          const dueDate = new Date(task.dueDate)
          return dueDate < today && task.status !== 'completed'
        }).length,
        dueToday: get().tasks.filter(task => {
          const today = new Date()
          const dueDate = new Date(task.dueDate)
          return dueDate.toDateString() === today.toDateString()
        }).length,
        dueThisWeek: get().tasks.filter(task => {
          const today = new Date()
          const thisWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          const dueDate = new Date(task.dueDate)
          return dueDate >= today && dueDate <= thisWeek
        }).length
      }
      
      set({ statistics })
      return statistics
    } catch (error: any) {
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