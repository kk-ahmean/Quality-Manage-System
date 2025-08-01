export interface Task {
  id: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  assignee: string // 负责人ID
  assigneeName?: string // 负责人姓名
  creator: string // 创建者ID
  creatorName?: string // 创建者姓名
  dueDate: string // 截止日期
  relatedBugs?: string[] // 关联的Bug ID数组
  tags?: string[] // 标签
  attachments?: TaskAttachment[] // 附件
  comments?: TaskComment[] // 评论
  progress: number // 进度百分比 0-100
  estimatedHours?: number // 预估工时
  actualHours?: number // 实际工时
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled'

export interface TaskAttachment {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploadedBy: string
  uploadedAt: string
}

export interface TaskComment {
  id: string
  content: string
  author: string
  authorName?: string
  createdAt: string
  mentions?: string[] // @用户ID数组
}

export interface CreateTaskRequest {
  title: string
  description: string
  priority: TaskPriority
  assignee: string
  dueDate: string
  relatedBugs?: string[]
  tags?: string[]
  estimatedHours?: number
}

export interface UpdateTaskRequest {
  id: string
  title?: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  assignee?: string
  dueDate?: string
  relatedBugs?: string[]
  tags?: string[]
  progress?: number
  estimatedHours?: number
  actualHours?: number
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string
  creator?: string
  dueDateRange?: {
    start: string
    end: string
  }
  keyword?: string
  tags?: string[]
}

export interface TaskListResponse {
  tasks: Task[]
  total: number
  page: number
  pageSize: number
}

export interface TaskStatistics {
  total: number
  todo: number
  inProgress: number
  review: number
  completed: number
  cancelled: number
  overdue: number
  dueToday: number
  dueThisWeek: number
}

// 任务分配请求
export interface AssignTaskRequest {
  taskId: string
  assignee: string
  reason?: string
}

// 任务进度更新请求
export interface UpdateTaskProgressRequest {
  taskId: string
  progress: number
  comment?: string
  attachments?: File[]
}

// 批量操作请求
export interface BatchTaskOperation {
  taskIds: string[]
  operation: 'assign' | 'changeStatus' | 'changePriority' | 'delete'
  assignee?: string
  status?: TaskStatus
  priority?: TaskPriority
}

// 任务模板
export interface TaskTemplate {
  id: string
  name: string
  description: string
  priority: TaskPriority
  estimatedHours: number
  tags: string[]
  checklist?: string[] // 检查清单
  createdAt: string
  updatedAt: string
} 