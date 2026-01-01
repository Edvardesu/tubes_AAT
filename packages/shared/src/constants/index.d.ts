export declare const SERVICE_PORTS: {
    readonly API_GATEWAY: 8080;
    readonly USER_SERVICE: 8001;
    readonly REPORT_SERVICE: 8002;
    readonly NOTIFICATION_SERVICE: 8003;
    readonly ANALYTICS_SERVICE: 8004;
    readonly ROUTING_SERVICE: 8005;
    readonly ESCALATION_SERVICE: 8006;
    readonly EXTERNAL_INTEGRATION: 8007;
    readonly WEBSOCKET_SERVER: 8081;
    readonly FRONTEND: 3000;
};
export declare const API_PREFIX = "/api/v1";
export declare const API_PATHS: {
    readonly AUTH: {
        readonly REGISTER: "/auth/register";
        readonly LOGIN: "/auth/login";
        readonly REFRESH: "/auth/refresh";
        readonly LOGOUT: "/auth/logout";
    };
    readonly USERS: {
        readonly ME: "/users/me";
        readonly MY_REPORTS: "/users/me/reports";
        readonly MY_NOTIFICATIONS: "/users/me/notifications";
    };
    readonly REPORTS: {
        readonly BASE: "/reports";
        readonly BY_ID: "/reports/:id";
        readonly UPVOTE: "/reports/:id/upvote";
        readonly TRACK: "/reports/track/:referenceNumber";
    };
    readonly STAFF: {
        readonly REPORTS: "/staff/reports";
        readonly UPDATE_STATUS: "/staff/reports/:id/status";
        readonly ASSIGN: "/staff/reports/:id/assign";
        readonly FORWARD: "/staff/reports/:id/forward";
    };
    readonly ANALYTICS: {
        readonly OVERVIEW: "/analytics/overview";
        readonly TRENDS: "/analytics/trends";
        readonly PERFORMANCE: "/analytics/performance";
    };
    readonly DEPARTMENTS: {
        readonly BASE: "/departments";
        readonly BY_ID: "/departments/:id";
        readonly STAFF: "/departments/:id/staff";
    };
    readonly ADMIN: {
        readonly USERS: "/admin/users";
        readonly SYSTEM_HEALTH: "/admin/system/health";
        readonly SYSTEM_CONFIG: "/admin/system/config";
    };
};
export declare const FILE_UPLOAD: {
    readonly MAX_FILE_SIZE: number;
    readonly MAX_FILES: 5;
    readonly ALLOWED_MIME_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp"];
    readonly ALLOWED_EXTENSIONS: readonly [".jpg", ".jpeg", ".png", ".gif", ".webp"];
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 10;
    readonly MAX_LIMIT: 50;
};
export declare const JWT: {
    readonly ACCESS_TOKEN_EXPIRY: "24h";
    readonly REFRESH_TOKEN_EXPIRY: "7d";
    readonly ALGORITHM: "HS256";
};
export declare const SLA: {
    readonly LEVEL_1_HOURS: 72;
    readonly LEVEL_2_HOURS: 168;
    readonly DEMO_LEVEL_1_MINUTES: 5;
    readonly DEMO_LEVEL_2_MINUTES: 10;
};
export declare const RATE_LIMIT: {
    readonly WINDOW_MS: number;
    readonly MAX_REQUESTS: 100;
    readonly AUTH_MAX_REQUESTS: 10;
};
export declare const CIRCUIT_BREAKER: {
    readonly FAILURE_THRESHOLD: 5;
    readonly RESET_TIMEOUT: 30000;
    readonly HALF_OPEN_MAX_REQUESTS: 3;
};
export declare const REFERENCE_NUMBER: {
    readonly PREFIX: "LP";
    readonly SEPARATOR: "-";
    readonly DIGITS: 6;
};
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare const ERROR_CODES: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly TOKEN_INVALID: "TOKEN_INVALID";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly ALREADY_EXISTS: "ALREADY_EXISTS";
    readonly CONFLICT: "CONFLICT";
    readonly INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly FILE_TOO_LARGE: "FILE_TOO_LARGE";
    readonly INVALID_FILE_TYPE: "INVALID_FILE_TYPE";
    readonly FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR";
};
//# sourceMappingURL=index.d.ts.map