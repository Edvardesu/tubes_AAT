// ==================== User Types ====================
export interface User {
  id: string;
  email: string;
  fullName: string;
  name?: string; // Alias for fullName for backwards compatibility
  phone?: string;
  nik?: string;
  address?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  role?: string; // Simplified role
  roles: UserRole[];
  staffProfile?: StaffMember;
  createdAt: string;
  updatedAt: string;
}

export interface UserRole {
  id: string;
  role: Role;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  level: number;
  permissions: string[];
}

export interface StaffMember {
  id: string;
  departmentId: string;
  department: Department;
  position: string;
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
}

// ==================== Department Types ====================
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  email?: string;
  phone?: string;
  parentId?: string;
  isActive: boolean;
}

// ==================== Report Types ====================
export type ReportType = 'PUBLIC' | 'PRIVATE' | 'ANONYMOUS';
export type ReportStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'IN_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FEEDBACK'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'ESCALATED';

export type ReportCategory =
  | 'INFRASTRUCTURE'
  | 'PUBLIC_SERVICE'
  | 'ENVIRONMENT'
  | 'SECURITY'
  | 'SOCIAL'
  | 'HEALTH'
  | 'EDUCATION'
  | 'TRANSPORTATION'
  | 'OTHER';

export interface Report {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  status: ReportStatus;
  priority: number;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  reporterId?: string;
  reporter?: User;
  departmentId?: string;
  department?: Department;
  assignedToId?: string;
  assignedTo?: User;
  isAnonymous: boolean;
  upvoteCount: number;
  viewCount: number;
  slaDeadline?: string;
  escalationLevel: number;
  media: ReportMedia[];
  statusHistory: StatusHistory[];
  comments?: ReportComment[];
  hasUpvoted?: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface ReportMedia {
  id: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string; // Public URL for viewing
  uploadedAt: string;
}

export interface ReportComment {
  id: string;
  content: string;
  author?: User;
  isAdmin: boolean;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  oldStatus: ReportStatus;
  newStatus: ReportStatus;
  changedById?: string;
  changedBy?: User;
  notes?: string;
  createdAt: string;
}

// ==================== Notification Types ====================
export type NotificationType =
  | 'REPORT_CREATED'
  | 'REPORT_ASSIGNED'
  | 'STATUS_UPDATED'
  | 'REPORT_ESCALATED'
  | 'REPORT_RESOLVED'
  | 'REPORT_COMMENTED'
  | 'UPVOTE_RECEIVED'
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reportId?: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ==================== Auth Types ====================
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nik?: string;
  address?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==================== Analytics Types ====================
export interface AnalyticsSummary {
  totalReports: number;
  reportsByStatus: Record<ReportStatus, number>;
  reportsByCategory: Record<ReportCategory, number>;
  reportsByDepartment: Array<{
    departmentId: string;
    departmentName: string;
    count: number;
  }>;
  resolutionRate: number;
  averageResolutionTime: number;
  trends: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
  };
}

// ==================== Form Types ====================
export interface CreateReportData {
  title: string;
  description: string;
  category: ReportCategory;
  type: ReportType;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
  media?: File[];
}

export interface UpdateReportStatusData {
  status: ReportStatus;
  notes?: string;
}
