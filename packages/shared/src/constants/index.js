"use strict";
// ==================== SERVICE PORTS ====================
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODES = exports.HTTP_STATUS = exports.REFERENCE_NUMBER = exports.CIRCUIT_BREAKER = exports.RATE_LIMIT = exports.SLA = exports.JWT = exports.PAGINATION = exports.FILE_UPLOAD = exports.API_PATHS = exports.API_PREFIX = exports.SERVICE_PORTS = void 0;
exports.SERVICE_PORTS = {
    API_GATEWAY: 8080,
    USER_SERVICE: 8001,
    REPORT_SERVICE: 8002,
    NOTIFICATION_SERVICE: 8003,
    ANALYTICS_SERVICE: 8004,
    ROUTING_SERVICE: 8005,
    ESCALATION_SERVICE: 8006,
    EXTERNAL_INTEGRATION: 8007,
    WEBSOCKET_SERVER: 8081,
    FRONTEND: 3000,
};
// ==================== API PATHS ====================
exports.API_PREFIX = '/api/v1';
exports.API_PATHS = {
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },
    USERS: {
        ME: '/users/me',
        MY_REPORTS: '/users/me/reports',
        MY_NOTIFICATIONS: '/users/me/notifications',
    },
    REPORTS: {
        BASE: '/reports',
        BY_ID: '/reports/:id',
        UPVOTE: '/reports/:id/upvote',
        TRACK: '/reports/track/:referenceNumber',
    },
    STAFF: {
        REPORTS: '/staff/reports',
        UPDATE_STATUS: '/staff/reports/:id/status',
        ASSIGN: '/staff/reports/:id/assign',
        FORWARD: '/staff/reports/:id/forward',
    },
    ANALYTICS: {
        OVERVIEW: '/analytics/overview',
        TRENDS: '/analytics/trends',
        PERFORMANCE: '/analytics/performance',
    },
    DEPARTMENTS: {
        BASE: '/departments',
        BY_ID: '/departments/:id',
        STAFF: '/departments/:id/staff',
    },
    ADMIN: {
        USERS: '/admin/users',
        SYSTEM_HEALTH: '/admin/system/health',
        SYSTEM_CONFIG: '/admin/system/config',
    },
};
// ==================== FILE UPLOAD ====================
exports.FILE_UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_FILES: 5,
    ALLOWED_MIME_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
};
// ==================== PAGINATION ====================
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
};
// ==================== JWT ====================
exports.JWT = {
    ACCESS_TOKEN_EXPIRY: '24h',
    REFRESH_TOKEN_EXPIRY: '7d',
    ALGORITHM: 'HS256',
};
// ==================== SLA (in hours) ====================
exports.SLA = {
    LEVEL_1_HOURS: 72, // 3 days
    LEVEL_2_HOURS: 168, // 7 days
    // For demo/testing
    DEMO_LEVEL_1_MINUTES: 5,
    DEMO_LEVEL_2_MINUTES: 10,
};
// ==================== RATE LIMITING ====================
exports.RATE_LIMIT = {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 10, // Stricter for auth endpoints
};
// ==================== CIRCUIT BREAKER ====================
exports.CIRCUIT_BREAKER = {
    FAILURE_THRESHOLD: 5,
    RESET_TIMEOUT: 30000, // 30 seconds
    HALF_OPEN_MAX_REQUESTS: 3,
};
// ==================== REFERENCE NUMBER ====================
exports.REFERENCE_NUMBER = {
    PREFIX: 'LP',
    SEPARATOR: '-',
    DIGITS: 6,
};
// ==================== HTTP STATUS CODES ====================
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
};
// ==================== ERROR CODES ====================
exports.ERROR_CODES = {
    // Auth errors
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    // Resource errors
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',
    // Status errors
    INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
    // System errors
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR',
    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    // File errors
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
    FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
};
//# sourceMappingURL=index.js.map