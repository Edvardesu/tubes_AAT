export declare enum ReportType {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    ANONYMOUS = "ANONYMOUS"
}
export declare enum ReportStatus {
    PENDING = "PENDING",
    RECEIVED = "RECEIVED",
    IN_REVIEW = "IN_REVIEW",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    WAITING_FEEDBACK = "WAITING_FEEDBACK",
    RESOLVED = "RESOLVED",
    CLOSED = "CLOSED",
    REJECTED = "REJECTED",
    ESCALATED = "ESCALATED"
}
export declare enum ReportCategory {
    SECURITY = "SECURITY",
    CLEANLINESS = "CLEANLINESS",
    HEALTH = "HEALTH",
    INFRASTRUCTURE = "INFRASTRUCTURE",
    SOCIAL = "SOCIAL",
    PERMITS = "PERMITS"
}
export declare enum UserRole {
    CITIZEN = "CITIZEN",
    STAFF_L1 = "STAFF_L1",
    STAFF_L2 = "STAFF_L2",
    STAFF_L3 = "STAFF_L3",
    ADMIN = "ADMIN"
}
export declare enum StaffLevel {
    LEVEL_1 = "LEVEL_1",
    LEVEL_2 = "LEVEL_2",
    LEVEL_3 = "LEVEL_3"
}
export declare enum NotificationType {
    REPORT_CREATED = "REPORT_CREATED",
    REPORT_ASSIGNED = "REPORT_ASSIGNED",
    STATUS_UPDATED = "STATUS_UPDATED",
    REPORT_ESCALATED = "REPORT_ESCALATED",
    REPORT_RESOLVED = "REPORT_RESOLVED",
    REPORT_COMMENTED = "REPORT_COMMENTED",
    UPVOTE_RECEIVED = "UPVOTE_RECEIVED",
    SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT"
}
export declare enum DepartmentCode {
    KEAMANAN = "KEAMANAN",
    KEBERSIHAN = "KEBERSIHAN",
    KESEHATAN = "KESEHATAN",
    INFRASTRUKTUR = "INFRASTRUKTUR",
    SOSIAL = "SOSIAL",
    PERIZINAN = "PERIZINAN"
}
export declare enum ExternalSystem {
    POLRI_SYSTEM = "POLRI_SYSTEM",
    DAMKAR_SYSTEM = "DAMKAR_SYSTEM",
    DINKES_SYSTEM = "DINKES_SYSTEM",
    PLN_SYSTEM = "PLN_SYSTEM"
}
export declare enum ExternalForwardStatus {
    PENDING = "PENDING",
    SENT = "SENT",
    ACKNOWLEDGED = "ACKNOWLEDGED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare const ROLE_LEVELS: Record<UserRole, number>;
export declare const VALID_STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]>;
//# sourceMappingURL=enums.d.ts.map