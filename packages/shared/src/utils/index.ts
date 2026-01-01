import { REFERENCE_NUMBER } from '../constants';
import { v4 as uuidv4 } from 'uuid';

// ==================== REFERENCE NUMBER GENERATOR ====================

/**
 * Generate a unique reference number for reports
 * Format: LP-YYYY-XXXXXX (e.g., LP-2025-000001)
 */
export function generateReferenceNumber(sequence?: number): string {
  const year = new Date().getFullYear();
  const sequenceNum = sequence ?? Math.floor(Math.random() * 999999) + 1;
  const paddedSequence = sequenceNum.toString().padStart(REFERENCE_NUMBER.DIGITS, '0');
  return `${REFERENCE_NUMBER.PREFIX}${REFERENCE_NUMBER.SEPARATOR}${year}${REFERENCE_NUMBER.SEPARATOR}${paddedSequence}`;
}

// ==================== DATE UTILITIES ====================

/**
 * Calculate SLA deadline from creation date
 */
export function calculateSLADeadline(createdAt: Date, hoursToAdd: number): Date {
  const deadline = new Date(createdAt);
  deadline.setHours(deadline.getHours() + hoursToAdd);
  return deadline;
}

/**
 * Check if a deadline has passed
 */
export function isDeadlinePassed(deadline: Date): boolean {
  return new Date() > deadline;
}

/**
 * Get time remaining until deadline in hours
 */
export function getTimeRemainingHours(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return diff / (1000 * 60 * 60);
}

/**
 * Format date to ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Format date to readable string (Indonesian locale)
 */
export function formatDateId(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date);
}

// ==================== STRING UTILITIES ====================

/**
 * Sanitize string for safe display
 */
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 10000);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ==================== OBJECT UTILITIES ====================

/**
 * Remove undefined values from object
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * Pick specific keys from object
 */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  return keys.reduce(
    (acc, key) => {
      if (key in obj) {
        acc[key] = obj[key];
      }
      return acc;
    },
    {} as Pick<T, K>
  );
}

/**
 * Omit specific keys from object
 */
export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

// ==================== ID UTILITIES ====================

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate event ID
 */
export function generateEventId(): string {
  return `evt_${uuidv4().replace(/-/g, '')}`;
}

/**
 * Generate tracking token for anonymous reports
 */
export function generateTrackingToken(): string {
  return `trk_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
}

// ==================== VALIDATION UTILITIES ====================

/**
 * Check if string is valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid phone (Indonesian format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Check if string is valid NIK (Indonesian ID number)
 */
export function isValidNIK(nik: string): boolean {
  const nikRegex = /^[0-9]{16}$/;
  return nikRegex.test(nik);
}

/**
 * Check if password meets requirements
 */
export function isValidPassword(password: string): boolean {
  // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// ==================== ASYNC UTILITIES ====================

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await sleep(baseDelayMs * Math.pow(2, i));
      }
    }
  }
  throw lastError;
}

// ==================== PAGINATION UTILITIES ====================

/**
 * Calculate pagination offset
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Calculate total pages
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

/**
 * Build pagination meta object
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): { page: number; limit: number; total: number; totalPages: number } {
  return {
    page,
    limit,
    total,
    totalPages: calculateTotalPages(total, limit),
  };
}
