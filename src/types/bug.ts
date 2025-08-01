// Bug管理模块类型定义

export type BugPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type BugSeverity = 'S' | 'A' | 'B' | 'C';
export type BugType = '功能缺陷' | '性能问题' | '界面问题' | '兼容性问题' | '安全问题' | '其他';
export type BugStatus = '新建' | '处理中' | '待验证' | '已解决' | '已关闭' | '重新打开';
export type BugResponsibility = '软件' | '硬件' | '结构' | 'ID' | '包装' | '产品' | '项目' | '供应商';

export interface BugAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface BugComment {
  id: string;
  content: string;
  author: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  mentions?: string[]; // @用户列表
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  reproductionSteps: string;
  expectedResult: string;
  actualResult: string;
  priority: BugPriority;
  severity: BugSeverity;
  type: BugType;
  responsibility: BugResponsibility;
  status: BugStatus;
  assignee?: string;
  assigneeName?: string;
  reporter: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string[];
  attachments: BugAttachment[];
  comments: BugComment[];
  relatedBugs?: string[];
  relatedTasks?: string[];
}

export interface CreateBugRequest {
  title: string;
  description: string;
  reproductionSteps: string;
  expectedResult: string;
  actualResult: string;
  priority: BugPriority;
  severity: BugSeverity;
  type: BugType;
  responsibility: BugResponsibility;
  status?: BugStatus;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  attachments?: File[];
}

export interface UpdateBugRequest {
  id: string;
  title?: string;
  description?: string;
  reproductionSteps?: string;
  expectedResult?: string;
  actualResult?: string;
  priority?: BugPriority;
  severity?: BugSeverity;
  type?: BugType;
  responsibility?: BugResponsibility;
  status?: BugStatus;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
}

export interface BugFilters {
  status?: BugStatus[];
  priority?: BugPriority[];
  severity?: BugSeverity[];
  type?: BugType[];
  responsibility?: BugResponsibility[];
  assignee?: string;
  reporter?: string;
  dateRange?: [string, string];
  keyword?: string;
}

export interface BugListResponse {
  bugs: Bug[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BugStatistics {
  total: number;
  byStatus: Record<BugStatus, number>;
  byPriority: Record<BugPriority, number>;
  bySeverity: Record<BugSeverity, number>;
  byType: Record<BugType, number>;
  byResponsibility: Record<BugResponsibility, number>;
  resolutionRate: number;
  averageResolutionTime: number;
}

export interface AssignBugRequest {
  bugId: string;
  assignee: string;
  dueDate?: string;
  comment?: string;
}

export interface UpdateBugStatusRequest {
  bugId: string;
  status: BugStatus;
  comment?: string;
}

export interface AddBugCommentRequest {
  bugId: string;
  content: string;
  mentions?: string[];
}

export interface BatchBugOperation {
  bugIds: string[];
  operation: 'assign' | 'updateStatus' | 'delete';
  data?: any;
}

export interface BugTemplate {
  id: string;
  name: string;
  description: string;
  priority: BugPriority;
  severity: BugSeverity;
  type: BugType;
  responsibility: BugResponsibility;
  tags?: string[];
} 