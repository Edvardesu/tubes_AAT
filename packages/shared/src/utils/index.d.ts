/**
 * Generate a unique reference number for reports
 * Format: LP-YYYY-XXXXXX (e.g., LP-2025-000001)
 */
export declare function generateReferenceNumber(sequence?: number): string;
/**
 * Calculate SLA deadline from creation date
 */
export declare function calculateSLADeadline(createdAt: Date, hoursToAdd: number): Date;
/**
 * Check if a deadline has passed
 */
export declare function isDeadlinePassed(deadline: Date): boolean;
/**
 * Get time remaining until deadline in hours
 */
export declare function getTimeRemainingHours(deadline: Date): number;
/**
 * Format date to ISO string
 */
export declare function toISOString(date: Date): string;
/**
 * Format date to readable string (Indonesian locale)
 */
export declare function formatDateId(date: Date): string;
/**
 * Sanitize string for safe display
 */
export declare function sanitizeString(str: string): string;
/**
 * Truncate string with ellipsis
 */
export declare function truncate(str: string, maxLength: number): string;
/**
 * Slugify a string
 */
export declare function slugify(str: string): string;
/**
 * Remove undefined values from object
 */
export declare function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T>;
/**
 * Pick specific keys from object
 */
export declare function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/**
 * Omit specific keys from object
 */
export declare function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
/**
 * Generate UUID v4
 */
export declare function generateId(): string;
/**
 * Generate event ID
 */
export declare function generateEventId(): string;
/**
 * Generate tracking token for anonymous reports
 */
export declare function generateTrackingToken(): string;
/**
 * Check if string is valid email
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Check if string is valid phone (Indonesian format)
 */
export declare function isValidPhone(phone: string): boolean;
/**
 * Check if string is valid NIK (Indonesian ID number)
 */
export declare function isValidNIK(nik: string): boolean;
/**
 * Check if password meets requirements
 */
export declare function isValidPassword(password: string): boolean;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Retry async function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, maxRetries?: number, baseDelayMs?: number): Promise<T>;
/**
 * Calculate pagination offset
 */
export declare function calculateOffset(page: number, limit: number): number;
/**
 * Calculate total pages
 */
export declare function calculateTotalPages(total: number, limit: number): number;
/**
 * Build pagination meta object
 */
export declare function buildPaginationMeta(page: number, limit: number, total: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
//# sourceMappingURL=index.d.ts.map