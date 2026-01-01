"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referenceNumberParamSchema = exports.idParamSchema = exports.paginationSchema = exports.trendsQuerySchema = exports.notificationQuerySchema = exports.forwardReportSchema = exports.assignReportSchema = exports.updateStatusSchema = exports.reportQuerySchema = exports.updateReportSchema = exports.createReportSchema = exports.updateProfileSchema = exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../types/enums");
// ==================== AUTH SCHEMAS ====================
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Password must contain uppercase, lowercase, number, and special character'),
    fullName: zod_1.z.string().min(2, 'Full name must be at least 2 characters').max(100),
    phone: zod_1.z
        .string()
        .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Invalid phone number format')
        .optional(),
    nik: zod_1.z.string().regex(/^[0-9]{16}$/, 'NIK must be 16 digits').optional(),
    address: zod_1.z.string().max(500).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
// ==================== USER SCHEMAS ====================
exports.updateProfileSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(2).max(100).optional(),
    phone: zod_1.z
        .string()
        .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
        .optional(),
    address: zod_1.z.string().max(500).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
});
// ==================== REPORT SCHEMAS ====================
exports.createReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: zod_1.z.string().min(20, 'Description must be at least 20 characters').max(5000),
    category: zod_1.z.nativeEnum(enums_1.ReportCategory, { errorMap: () => ({ message: 'Invalid category' }) }),
    type: zod_1.z.nativeEnum(enums_1.ReportType).default(enums_1.ReportType.PUBLIC),
    locationLat: zod_1.z.number().min(-90).max(90).optional(),
    locationLng: zod_1.z.number().min(-180).max(180).optional(),
    locationAddress: zod_1.z.string().max(500).optional(),
});
exports.updateReportSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(200).optional(),
    description: zod_1.z.string().min(20).max(5000).optional(),
});
exports.reportQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    status: zod_1.z.nativeEnum(enums_1.ReportStatus).optional(),
    category: zod_1.z.nativeEnum(enums_1.ReportCategory).optional(),
    type: zod_1.z.nativeEnum(enums_1.ReportType).optional(),
    departmentId: zod_1.z.string().uuid().optional(),
    search: zod_1.z.string().max(100).optional(),
    sortBy: zod_1.z.enum(['createdAt', 'upvoteCount', 'viewCount']).default('createdAt'),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// ==================== STAFF SCHEMAS ====================
exports.updateStatusSchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(enums_1.ReportStatus, { errorMap: () => ({ message: 'Invalid status' }) }),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.assignReportSchema = zod_1.z.object({
    assignedToId: zod_1.z.string().uuid('Invalid user ID'),
});
exports.forwardReportSchema = zod_1.z.object({
    externalSystem: zod_1.z.string().min(1, 'External system is required'),
    notes: zod_1.z.string().max(1000).optional(),
});
// ==================== NOTIFICATION SCHEMAS ====================
exports.notificationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    isRead: zod_1.z
        .string()
        .transform((val) => val === 'true')
        .optional(),
});
// ==================== ANALYTICS SCHEMAS ====================
exports.trendsQuerySchema = zod_1.z.object({
    period: zod_1.z.enum(['daily', 'weekly', 'monthly']).default('daily'),
    startDate: zod_1.z.string().datetime().optional(),
    endDate: zod_1.z.string().datetime().optional(),
});
// ==================== PAGINATION SCHEMA ====================
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(50).default(10),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// ==================== ID PARAM SCHEMA ====================
exports.idParamSchema = zod_1.z.object({
    id: zod_1.z.string().uuid('Invalid ID format'),
});
exports.referenceNumberParamSchema = zod_1.z.object({
    referenceNumber: zod_1.z
        .string()
        .regex(/^LP-\d{4}-\d{6}$/, 'Invalid reference number format'),
});
//# sourceMappingURL=index.js.map