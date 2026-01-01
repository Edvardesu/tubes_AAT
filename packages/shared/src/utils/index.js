"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferenceNumber = generateReferenceNumber;
exports.calculateSLADeadline = calculateSLADeadline;
exports.isDeadlinePassed = isDeadlinePassed;
exports.getTimeRemainingHours = getTimeRemainingHours;
exports.toISOString = toISOString;
exports.formatDateId = formatDateId;
exports.sanitizeString = sanitizeString;
exports.truncate = truncate;
exports.slugify = slugify;
exports.removeUndefined = removeUndefined;
exports.pick = pick;
exports.omit = omit;
exports.generateId = generateId;
exports.generateEventId = generateEventId;
exports.generateTrackingToken = generateTrackingToken;
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.isValidNIK = isValidNIK;
exports.isValidPassword = isValidPassword;
exports.sleep = sleep;
exports.retry = retry;
exports.calculateOffset = calculateOffset;
exports.calculateTotalPages = calculateTotalPages;
exports.buildPaginationMeta = buildPaginationMeta;
const constants_1 = require("../constants");
const uuid_1 = require("uuid");
// ==================== REFERENCE NUMBER GENERATOR ====================
/**
 * Generate a unique reference number for reports
 * Format: LP-YYYY-XXXXXX (e.g., LP-2025-000001)
 */
function generateReferenceNumber(sequence) {
    const year = new Date().getFullYear();
    const sequenceNum = sequence ?? Math.floor(Math.random() * 999999) + 1;
    const paddedSequence = sequenceNum.toString().padStart(constants_1.REFERENCE_NUMBER.DIGITS, '0');
    return `${constants_1.REFERENCE_NUMBER.PREFIX}${constants_1.REFERENCE_NUMBER.SEPARATOR}${year}${constants_1.REFERENCE_NUMBER.SEPARATOR}${paddedSequence}`;
}
// ==================== DATE UTILITIES ====================
/**
 * Calculate SLA deadline from creation date
 */
function calculateSLADeadline(createdAt, hoursToAdd) {
    const deadline = new Date(createdAt);
    deadline.setHours(deadline.getHours() + hoursToAdd);
    return deadline;
}
/**
 * Check if a deadline has passed
 */
function isDeadlinePassed(deadline) {
    return new Date() > deadline;
}
/**
 * Get time remaining until deadline in hours
 */
function getTimeRemainingHours(deadline) {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return diff / (1000 * 60 * 60);
}
/**
 * Format date to ISO string
 */
function toISOString(date) {
    return date.toISOString();
}
/**
 * Format date to readable string (Indonesian locale)
 */
function formatDateId(date) {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'short',
    }).format(date);
}
// ==================== STRING UTILITIES ====================
/**
 * Sanitize string for safe display
 */
function sanitizeString(str) {
    return str
        .trim()
        .replace(/[<>]/g, '')
        .substring(0, 10000);
}
/**
 * Truncate string with ellipsis
 */
function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.substring(0, maxLength - 3) + '...';
}
/**
 * Slugify a string
 */
function slugify(str) {
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
function removeUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
/**
 * Pick specific keys from object
 */
function pick(obj, keys) {
    return keys.reduce((acc, key) => {
        if (key in obj) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
}
/**
 * Omit specific keys from object
 */
function omit(obj, keys) {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
}
// ==================== ID UTILITIES ====================
/**
 * Generate UUID v4
 */
function generateId() {
    return (0, uuid_1.v4)();
}
/**
 * Generate event ID
 */
function generateEventId() {
    return `evt_${(0, uuid_1.v4)().replace(/-/g, '')}`;
}
/**
 * Generate tracking token for anonymous reports
 */
function generateTrackingToken() {
    return `trk_${(0, uuid_1.v4)().replace(/-/g, '').substring(0, 16)}`;
}
// ==================== VALIDATION UTILITIES ====================
/**
 * Check if string is valid email
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Check if string is valid phone (Indonesian format)
 */
function isValidPhone(phone) {
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}
/**
 * Check if string is valid NIK (Indonesian ID number)
 */
function isValidNIK(nik) {
    const nikRegex = /^[0-9]{16}$/;
    return nikRegex.test(nik);
}
/**
 * Check if password meets requirements
 */
function isValidPassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}
// ==================== ASYNC UTILITIES ====================
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Retry async function with exponential backoff
 */
async function retry(fn, maxRetries = 3, baseDelayMs = 1000) {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
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
function calculateOffset(page, limit) {
    return (page - 1) * limit;
}
/**
 * Calculate total pages
 */
function calculateTotalPages(total, limit) {
    return Math.ceil(total / limit);
}
/**
 * Build pagination meta object
 */
function buildPaginationMeta(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: calculateTotalPages(total, limit),
    };
}
//# sourceMappingURL=index.js.map