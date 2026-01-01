"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUEUES = exports.ROUTING_KEYS = exports.EXCHANGES = void 0;
// ==================== EXCHANGE & QUEUE NAMES ====================
exports.EXCHANGES = {
    REPORT_EVENTS: 'report.events',
    NOTIFICATION_EVENTS: 'notification.events',
    ESCALATION_EVENTS: 'escalation.events',
    USER_EVENTS: 'user.events',
    EXTERNAL_EVENTS: 'external.events',
};
exports.ROUTING_KEYS = {
    REPORT_CREATED: 'report.created',
    REPORT_UPDATED: 'report.updated',
    REPORT_STATUS_CHANGED: 'report.status_changed',
    REPORT_ASSIGNED: 'report.assigned',
    REPORT_ESCALATED: 'report.escalated',
    REPORT_FORWARD_REQUESTED: 'report.forward_requested',
    ROUTING_COMPLETED: 'routing.completed',
    USER_REGISTERED: 'user.registered',
    USER_VERIFIED: 'user.verified',
    EXTERNAL_FORWARD_COMPLETED: 'external.forward_completed',
    NOTIFICATION_CREATED: 'notification.created',
};
exports.QUEUES = {
    ROUTING_SERVICE: 'routing-service-queue',
    NOTIFICATION_SERVICE: 'notification-service-queue',
    ANALYTICS_SERVICE: 'analytics-service-queue',
    ESCALATION_SERVICE: 'escalation-service-queue',
    EXTERNAL_INTEGRATION: 'external-integration-queue',
    REPORT_SERVICE: 'report-service-queue',
};
//# sourceMappingURL=events.js.map