"use strict";
// ==================== REPORT ENUMS ====================
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_STATUS_TRANSITIONS = exports.ROLE_LEVELS = exports.ExternalForwardStatus = exports.ExternalSystem = exports.DepartmentCode = exports.NotificationType = exports.StaffLevel = exports.UserRole = exports.ReportCategory = exports.ReportStatus = exports.ReportType = void 0;
var ReportType;
(function (ReportType) {
    ReportType["PUBLIC"] = "PUBLIC";
    ReportType["PRIVATE"] = "PRIVATE";
    ReportType["ANONYMOUS"] = "ANONYMOUS";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "PENDING";
    ReportStatus["RECEIVED"] = "RECEIVED";
    ReportStatus["IN_REVIEW"] = "IN_REVIEW";
    ReportStatus["ASSIGNED"] = "ASSIGNED";
    ReportStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ReportStatus["WAITING_FEEDBACK"] = "WAITING_FEEDBACK";
    ReportStatus["RESOLVED"] = "RESOLVED";
    ReportStatus["CLOSED"] = "CLOSED";
    ReportStatus["REJECTED"] = "REJECTED";
    ReportStatus["ESCALATED"] = "ESCALATED";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var ReportCategory;
(function (ReportCategory) {
    ReportCategory["SECURITY"] = "SECURITY";
    ReportCategory["CLEANLINESS"] = "CLEANLINESS";
    ReportCategory["HEALTH"] = "HEALTH";
    ReportCategory["INFRASTRUCTURE"] = "INFRASTRUCTURE";
    ReportCategory["SOCIAL"] = "SOCIAL";
    ReportCategory["PERMITS"] = "PERMITS";
})(ReportCategory || (exports.ReportCategory = ReportCategory = {}));
// ==================== USER ENUMS ====================
var UserRole;
(function (UserRole) {
    UserRole["CITIZEN"] = "CITIZEN";
    UserRole["STAFF_L1"] = "STAFF_L1";
    UserRole["STAFF_L2"] = "STAFF_L2";
    UserRole["STAFF_L3"] = "STAFF_L3";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var StaffLevel;
(function (StaffLevel) {
    StaffLevel["LEVEL_1"] = "LEVEL_1";
    StaffLevel["LEVEL_2"] = "LEVEL_2";
    StaffLevel["LEVEL_3"] = "LEVEL_3";
})(StaffLevel || (exports.StaffLevel = StaffLevel = {}));
// ==================== NOTIFICATION ENUMS ====================
var NotificationType;
(function (NotificationType) {
    NotificationType["REPORT_CREATED"] = "REPORT_CREATED";
    NotificationType["REPORT_ASSIGNED"] = "REPORT_ASSIGNED";
    NotificationType["STATUS_UPDATED"] = "STATUS_UPDATED";
    NotificationType["REPORT_ESCALATED"] = "REPORT_ESCALATED";
    NotificationType["REPORT_RESOLVED"] = "REPORT_RESOLVED";
    NotificationType["REPORT_COMMENTED"] = "REPORT_COMMENTED";
    NotificationType["UPVOTE_RECEIVED"] = "UPVOTE_RECEIVED";
    NotificationType["SYSTEM_ANNOUNCEMENT"] = "SYSTEM_ANNOUNCEMENT";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
// ==================== DEPARTMENT CODES ====================
var DepartmentCode;
(function (DepartmentCode) {
    DepartmentCode["KEAMANAN"] = "KEAMANAN";
    DepartmentCode["KEBERSIHAN"] = "KEBERSIHAN";
    DepartmentCode["KESEHATAN"] = "KESEHATAN";
    DepartmentCode["INFRASTRUKTUR"] = "INFRASTRUKTUR";
    DepartmentCode["SOSIAL"] = "SOSIAL";
    DepartmentCode["PERIZINAN"] = "PERIZINAN";
})(DepartmentCode || (exports.DepartmentCode = DepartmentCode = {}));
// ==================== EXTERNAL SYSTEM ENUMS ====================
var ExternalSystem;
(function (ExternalSystem) {
    ExternalSystem["POLRI_SYSTEM"] = "POLRI_SYSTEM";
    ExternalSystem["DAMKAR_SYSTEM"] = "DAMKAR_SYSTEM";
    ExternalSystem["DINKES_SYSTEM"] = "DINKES_SYSTEM";
    ExternalSystem["PLN_SYSTEM"] = "PLN_SYSTEM";
})(ExternalSystem || (exports.ExternalSystem = ExternalSystem = {}));
var ExternalForwardStatus;
(function (ExternalForwardStatus) {
    ExternalForwardStatus["PENDING"] = "PENDING";
    ExternalForwardStatus["SENT"] = "SENT";
    ExternalForwardStatus["ACKNOWLEDGED"] = "ACKNOWLEDGED";
    ExternalForwardStatus["PROCESSING"] = "PROCESSING";
    ExternalForwardStatus["COMPLETED"] = "COMPLETED";
    ExternalForwardStatus["FAILED"] = "FAILED";
})(ExternalForwardStatus || (exports.ExternalForwardStatus = ExternalForwardStatus = {}));
// ==================== ROLE LEVELS ====================
exports.ROLE_LEVELS = {
    [UserRole.CITIZEN]: 0,
    [UserRole.STAFF_L1]: 1,
    [UserRole.STAFF_L2]: 2,
    [UserRole.STAFF_L3]: 3,
    [UserRole.ADMIN]: 99,
};
// ==================== STATUS TRANSITIONS ====================
exports.VALID_STATUS_TRANSITIONS = {
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
//# sourceMappingURL=enums.js.map