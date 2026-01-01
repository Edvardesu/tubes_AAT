import { z } from 'zod';
import { ReportType, ReportStatus, ReportCategory } from '../types/enums';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    nik: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    fullName: string;
    phone?: string | undefined;
    nik?: string | undefined;
    address?: string | undefined;
}, {
    email: string;
    password: string;
    fullName: string;
    phone?: string | undefined;
    nik?: string | undefined;
    address?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    avatarUrl?: string | undefined;
}, {
    fullName?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    avatarUrl?: string | undefined;
}>;
export declare const createReportSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodNativeEnum<typeof ReportCategory>;
    type: z.ZodDefault<z.ZodNativeEnum<typeof ReportType>>;
    locationLat: z.ZodOptional<z.ZodNumber>;
    locationLng: z.ZodOptional<z.ZodNumber>;
    locationAddress: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: ReportType;
    category: ReportCategory;
    title: string;
    description: string;
    locationLat?: number | undefined;
    locationLng?: number | undefined;
    locationAddress?: string | undefined;
}, {
    category: ReportCategory;
    title: string;
    description: string;
    type?: ReportType | undefined;
    locationLat?: number | undefined;
    locationLng?: number | undefined;
    locationAddress?: string | undefined;
}>;
export declare const updateReportSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | undefined;
}, {
    title?: string | undefined;
    description?: string | undefined;
}>;
export declare const reportQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodNativeEnum<typeof ReportStatus>>;
    category: z.ZodOptional<z.ZodNativeEnum<typeof ReportCategory>>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof ReportType>>;
    departmentId: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "upvoteCount", "viewCount"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortBy: "createdAt" | "upvoteCount" | "viewCount";
    sortOrder: "asc" | "desc";
    type?: ReportType | undefined;
    status?: ReportStatus | undefined;
    category?: ReportCategory | undefined;
    departmentId?: string | undefined;
    search?: string | undefined;
}, {
    type?: ReportType | undefined;
    status?: ReportStatus | undefined;
    category?: ReportCategory | undefined;
    departmentId?: string | undefined;
    search?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: "createdAt" | "upvoteCount" | "viewCount" | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodNativeEnum<typeof ReportStatus>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: ReportStatus;
    notes?: string | undefined;
}, {
    status: ReportStatus;
    notes?: string | undefined;
}>;
export declare const assignReportSchema: z.ZodObject<{
    assignedToId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    assignedToId: string;
}, {
    assignedToId: string;
}>;
export declare const forwardReportSchema: z.ZodObject<{
    externalSystem: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    externalSystem: string;
    notes?: string | undefined;
}, {
    externalSystem: string;
    notes?: string | undefined;
}>;
export declare const notificationQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    isRead: z.ZodOptional<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    isRead?: boolean | undefined;
}, {
    isRead?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const trendsQuerySchema: z.ZodObject<{
    period: z.ZodDefault<z.ZodEnum<["daily", "weekly", "monthly"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    period: "daily" | "weekly" | "monthly";
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    period?: "daily" | "weekly" | "monthly" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const referenceNumberParamSchema: z.ZodObject<{
    referenceNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    referenceNumber: string;
}, {
    referenceNumber: string;
}>;
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
//# sourceMappingURL=index.d.ts.map