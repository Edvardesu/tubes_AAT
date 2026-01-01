import { z } from 'zod';
import { ReportType, ReportStatus, ReportCategory } from '../types/enums';

// ==================== AUTH SCHEMAS ====================

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Invalid phone number format')
    .optional(),
  nik: z.string().regex(/^[0-9]{16}$/, 'NIK must be 16 digits').optional(),
  address: z.string().max(500).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ==================== USER SCHEMAS ====================

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
    .optional(),
  address: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
});

// ==================== REPORT SCHEMAS ====================

export const createReportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.nativeEnum(ReportCategory, { errorMap: () => ({ message: 'Invalid category' }) }),
  type: z.nativeEnum(ReportType).default(ReportType.PUBLIC),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  locationAddress: z.string().max(500).optional(),
});

export const updateReportSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
});

export const reportQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.nativeEnum(ReportStatus).optional(),
  category: z.nativeEnum(ReportCategory).optional(),
  type: z.nativeEnum(ReportType).optional(),
  departmentId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['createdAt', 'upvoteCount', 'viewCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== STAFF SCHEMAS ====================

export const updateStatusSchema = z.object({
  status: z.nativeEnum(ReportStatus, { errorMap: () => ({ message: 'Invalid status' }) }),
  notes: z.string().max(1000).optional(),
});

export const assignReportSchema = z.object({
  assignedToId: z.string().uuid('Invalid user ID'),
});

export const forwardReportSchema = z.object({
  externalSystem: z.string().min(1, 'External system is required'),
  notes: z.string().max(1000).optional(),
});

// ==================== NOTIFICATION SCHEMAS ====================

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  isRead: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// ==================== ANALYTICS SCHEMAS ====================

export const trendsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ==================== PAGINATION SCHEMA ====================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ==================== ID PARAM SCHEMA ====================

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const referenceNumberParamSchema = z.object({
  referenceNumber: z
    .string()
    .regex(/^LP-\d{4}-\d{6}$/, 'Invalid reference number format'),
});

// ==================== TYPE EXPORTS ====================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignReportInput = z.infer<typeof assignReportSchema>;
export type ForwardReportInput = z.infer<typeof forwardReportSchema>;
export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
export type TrendsQueryInput = z.infer<typeof trendsQuerySchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
