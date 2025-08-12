// 项目管理模块类型定义

import { UserRole } from './user';

export type ProjectLevel = 'L1' | 'L2' | 'L3';
export type ProjectTrade = '内贸' | '外贸' | '内外贸';
export type ProjectStage = 'EVT' | 'DVT' | 'PVT' | 'MP' | '其他';
export type ProjectStatus = '研发设计' | 'EVT' | 'DVT' | 'PVT' | 'MP';
export type TestResult = 'PASS' | 'FAIL' | '条件接收';

export interface ProjectMember {
  userId: string;
  name: string;
  role: UserRole;
}

export interface ProjectAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface ProjectVersionInfo {
  id: string;
  hardwareVersion: string;
  softwareVersion: string;
  description?: string;
  createdAt: string;
}

export interface ProjectStageInfo {
  stage: ProjectStage;
  sampleQuantity: number;
  sampleReason: string;
  testResult: TestResult; // 新增测试结果字段
  approvalVersion?: string; // 承认书版本移到阶段内
}

export interface Project {
  id: string;
  model: string; // 型号
  sku: string; // SKU
  categoryLevel3: string; // 三级类目
  interfaceFeatures?: string; // 接口特性
  productImages?: ProjectAttachment[]; // 产品图片
  level: ProjectLevel; // 等级
  trade: ProjectTrade; // 内/外贸
  supplier?: string; // 供应商
  stages: ProjectStageInfo[]; // 样机阶段
  hardwareSolution?: string; // 硬件方案
  versions: ProjectVersionInfo[]; // 版本信息（支持多个）
  remarks?: string; // 备注
  members: ProjectMember[]; // 团队成员
  status: ProjectStatus; // 项目状态
  creator: string; // 创建人ID
  creatorName: string; // 创建人姓名
  createdAt: string;
  updatedAt: string;
  sequenceNumber?: number; // 添加序号字段，用于表格显示
}

export interface CreateProjectRequest {
  model: string;
  sku: string;
  categoryLevel3: string;
  interfaceFeatures?: string;
  productImages?: File[];
  level: ProjectLevel;
  trade: ProjectTrade;
  supplier?: string;
  stages: ProjectStageInfo[];
  hardwareSolution?: string;
  versions: Omit<ProjectVersionInfo, 'id' | 'createdAt'>[];
  remarks?: string;
  members: ProjectMember[];
  status?: ProjectStatus;
}

export interface UpdateProjectRequest {
  id: string;
  model?: string;
  sku?: string;
  categoryLevel3?: string;
  interfaceFeatures?: string;
  productImages?: File[];
  level?: ProjectLevel;
  trade?: ProjectTrade;
  supplier?: string;
  stages?: ProjectStageInfo[];
  hardwareSolution?: string;
  versions?: Omit<ProjectVersionInfo, 'id' | 'createdAt'>[];
  remarks?: string;
  members?: ProjectMember[];
  status?: ProjectStatus;
}

export interface ProjectFilters {
  model?: string;
  sku?: string;
  level?: ProjectLevel[];
  trade?: ProjectTrade[];
  supplier?: string;
  stage?: ProjectStage[];
  status?: ProjectStatus[];
  member?: string;
  creator?: string;
  dateRange?: [string, string];
  keyword?: string;
}

export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProjectStatistics {
  total: number;
  byStatus: Record<ProjectStatus, number>;
  byLevel: Record<ProjectLevel, number>;
  byTrade: Record<ProjectTrade, number>;
  byStage: Record<ProjectStage, number>;
} 