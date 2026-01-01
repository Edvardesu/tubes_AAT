// ==================== REPORT ENUMS ====================

export enum ReportType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  ANONYMOUS = 'ANONYMOUS',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  IN_REVIEW = 'IN_REVIEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FEEDBACK = 'WAITING_FEEDBACK',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

export enum ReportCategory {
  SECURITY = 'SECURITY',
  CLEANLINESS = 'CLEANLINESS',
  HEALTH = 'HEALTH',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  SOCIAL = 'SOCIAL',
  PERMITS = 'PERMITS',
}

// ==================== USER ENUMS ====================

export enum UserRole {
  CITIZEN = 'CITIZEN',
  STAFF_L1 = 'STAFF_L1',
  STAFF_L2 = 'STAFF_L2',
  STAFF_L3 = 'STAFF_L3',
  ADMIN = 'ADMIN',
}

export enum StaffLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
}

// ==================== NOTIFICATION ENUMS ====================

export enum NotificationType {
  REPORT_CREATED = 'REPORT_CREATED',
  REPORT_ASSIGNED = 'REPORT_ASSIGNED',
  STATUS_UPDATED = 'STATUS_UPDATED',
  REPORT_ESCALATED = 'REPORT_ESCALATED',
  REPORT_RESOLVED = 'REPORT_RESOLVED',
  REPORT_COMMENTED = 'REPORT_COMMENTED',
  UPVOTE_RECEIVED = 'UPVOTE_RECEIVED',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

// ==================== DEPARTMENT CODES ====================

export enum DepartmentCode {
  KEAMANAN = 'KEAMANAN',
  KEBERSIHAN = 'KEBERSIHAN',
  KESEHATAN = 'KESEHATAN',
  INFRASTRUKTUR = 'INFRASTRUKTUR',
  SOSIAL = 'SOSIAL',
  PERIZINAN = 'PERIZINAN',
}

// ==================== EXTERNAL SYSTEM ENUMS ====================

export enum ExternalSystem {
  POLRI_SYSTEM = 'POLRI_SYSTEM',
  DAMKAR_SYSTEM = 'DAMKAR_SYSTEM',
  DINKES_SYSTEM = 'DINKES_SYSTEM',
  PLN_SYSTEM = 'PLN_SYSTEM',
}

export enum ExternalForwardStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ==================== ROLE LEVELS ====================

export const ROLE_LEVELS: Record<UserRole, number> = {
  [UserRole.CITIZEN]: 0,
  [UserRole.STAFF_L1]: 1,
  [UserRole.STAFF_L2]: 2,
  [UserRole.STAFF_L3]: 3,
  [UserRole.ADMIN]: 99,
};

// ==================== STATUS TRANSITIONS ====================

export const VALID_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  [ReportStatus.PENDING]: [ReportStatus.RECEIVED, ReportStatus.REJECTED],
  [ReportStatus.RECEIVED]: [ReportStatus.IN_REVIEW, ReportStatus.REJECTED],
  [ReportStatus.IN_REVIEW]: [ReportStatus.ASSIGNED, ReportStatus.REJECTED],
  [ReportStatus.ASSIGNED]: [ReportStatus.IN_PROGRESS, ReportStatus.ESCALATED],
  [ReportStatus.IN_PROGRESS]: [
    ReportStatus.WAITING_FEEDBACK,
    ReportStatus.RESOLVED,
    ReportStatus.ESCALATED,
  ],
  [ReportStatus.WAITING_FEEDBACK]: [
    ReportStatus.IN_PROGRESS,
    ReportStatus.RESOLVED,
  ],
  [ReportStatus.RESOLVED]: [ReportStatus.CLOSED],
  [ReportStatus.CLOSED]: [],
  [ReportStatus.REJECTED]: [],
  [ReportStatus.ESCALATED]: [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS],
};
