// Bug管理模块类型定义

export type BugPriority = 'P0' | 'P1' | 'P2' | 'P3';
export type BugSeverity = 'S' | 'A' | 'B' | 'C';
export type BugType = '电气性能' | '可靠性' | '环保' | '安规' | '资料' | '兼容性' | '复测与确认' | '设备特性' | '其它';
export type BugStatus = '新建' | '处理中' | '待验证' | '已解决' | '已关闭' | '重新打开';
export type BugResponsibility = '软件' | '硬件' | '结构' | 'ID' | '包装' | '产品' | '项目' | '供应商' | 'DQE' | '实验室';

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
  sequenceNumber?: number; // 添加编号字段
  title: string;
  description: string;
  reproductionSteps: string;
  expectedResult?: string;
  actualResult: string;
  priority?: BugPriority;
  severity: BugSeverity;
  type: BugType;
  responsibility: BugResponsibility;
  status: BugStatus;
  assignee?: string;
  assigneeName?: string;
  reporter: string;
  reporterName: string;
  creator: string; // 创建者ID
  creatorName?: string; // 创建者姓名
  categoryLevel3: string;
  model: string;
  sku: string;
  hardwareVersion: string;
  softwareVersion: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string;
  attachments: BugAttachment[];
  comments: BugComment[];
  relatedBugs?: string[];
  relatedTasks?: string[];
}

export interface CreateBugRequest {
  title: string;
  description: string;
  reproductionSteps: string;
  expectedResult?: string;
  actualResult: string;
  priority?: BugPriority;
  severity: BugSeverity;
  type: BugType;
  responsibility: BugResponsibility;
  status: BugStatus;
  assignee?: string;
  dueDate?: string;
  categoryLevel3: string;
  model: string;
  sku: string;
  hardwareVersion: string;
  softwareVersion: string;
  tags?: string;
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
  categoryLevel3?: string;
  model?: string;
  sku?: string;
  hardwareVersion?: string;
  softwareVersion?: string;
  tags?: string;
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
  tags?: string;
} 