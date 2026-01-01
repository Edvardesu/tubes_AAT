import {
  ReportType,
  ReportStatus,
  ReportCategory,
  NotificationType,
} from './enums';

// ==================== BASE RESPONSE ====================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== AUTH ====================

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nik?: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: UserProfile;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ==================== USER ====================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  nik?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  roles: string[];
  department?: DepartmentSummary;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

// ==================== DEPARTMENT ====================

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
}

export interface DepartmentDetail extends DepartmentSummary {
  description?: string;
  email?: string;
  phone?: string;
  staffCount?: number;
  activeReportsCount?: number;
}

// ==================== REPORT ====================

export interface CreateReportRequest {
  title: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
}

export interface UpdateReportRequest {
  title?: string;
  description?: string;
}

export interface ReportLocation {
  lat?: number;
  lng?: number;
  address?: string;
}

export interface ReportMedia {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface ReporterInfo {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

export interface AssigneeInfo {
  id: string;
  fullName: string;
  position: string;
  avatarUrl?: string;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  changedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface ReportSummary {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  status: ReportStatus;
  priority: number;
  location?: ReportLocation;
  reporter?: ReporterInfo;
  department?: DepartmentSummary;
  upvoteCount: number;
  viewCount: number;
  hasUpvoted?: boolean;
  mediaCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetail extends ReportSummary {
  assignedTo?: AssigneeInfo;
  media: ReportMedia[];
  statusHistory: StatusHistoryItem[];
  slaDeadline?: string;
  escalationLevel: number;
  trackingToken?: string;
  resolvedAt?: string;
}

export interface ReportListQuery extends PaginationQuery {
  status?: ReportStatus;
  category?: ReportCategory;
  departmentId?: string;
  type?: ReportType;
  search?: string;
  reporterId?: string;
}

// ==================== STAFF ACTIONS ====================

export interface UpdateStatusRequest {
  status: ReportStatus;
  notes?: string;
}

export interface AssignReportRequest {
  assignedToId: string;
}

export interface ForwardReportRequest {
  externalSystem: string;
  notes?: string;
}

// ==================== UPVOTE ====================

export interface UpvoteResponse {
  upvoted: boolean;
  upvoteCount: number;
}

// ==================== NOTIFICATION ====================

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListQuery extends PaginationQuery {
  isRead?: boolean;
}

// ==================== ANALYTICS ====================

export interface AnalyticsOverview {
  totalReports: number;
  reportsByStatus: Record<ReportStatus, number>;
  reportsByCategory: Record<ReportCategory, number>;
  reportsByDepartment: Array<{
    department: string;
    departmentCode: string;
    count: number;
  }>;
  averageResolutionTime: number;
  resolutionRate: number;
}

export interface TrendDataPoint {
  date: string;
  count: number;
  category?: ReportCategory;
}

export interface AnalyticsTrends {
  period: 'daily' | 'weekly' | 'monthly';
  data: TrendDataPoint[];
}

export interface DepartmentPerformance {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
}

export interface AnalyticsPerformance {
  departments: DepartmentPerformance[];
  overall: {
    totalReports: number;
    resolvedReports: number;
    averageResolutionTime: number;
    slaComplianceRate: number;
  };
}

// ==================== TRACKING ====================

export interface TrackReportQuery {
  token?: string;
}

export interface TrackReportResponse {
  referenceNumber: string;
  status: ReportStatus;
  category: ReportCategory;
  department?: DepartmentSummary;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  updatedAt: string;
}
