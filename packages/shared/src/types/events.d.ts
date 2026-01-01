import { ReportStatus, ReportCategory } from './enums';
export interface BaseEvent {
    eventId: string;
    timestamp: string;
    source: string;
}
export interface ReportCreatedEvent extends BaseEvent {
    type: 'report.created';
    payload: {
        reportId: string;
        referenceNumber: string;
        title: string;
        description: string;
        category: ReportCategory;
        reporterId?: string;
        isAnonymous: boolean;
    };
}
export interface ReportUpdatedEvent extends BaseEvent {
    type: 'report.updated';
    payload: {
        reportId: string;
        referenceNumber: string;
        changes: Record<string, {
            old: unknown;
            new: unknown;
        }>;
        updatedBy?: string;
    };
}
export interface ReportStatusChangedEvent extends BaseEvent {
    type: 'report.status_changed';
    payload: {
        reportId: string;
        referenceNumber: string;
        oldStatus: ReportStatus;
        newStatus: ReportStatus;
        changedBy?: string;
        notes?: string;
        reporterId?: string;
    };
}
export interface ReportAssignedEvent extends BaseEvent {
    type: 'report.assigned';
    payload: {
        reportId: string;
        referenceNumber: string;
        assignedToId: string;
        assignedToName: string;
        departmentId: string;
        departmentName: string;
        assignedBy?: string;
        reporterId?: string;
    };
}
export interface ReportEscalatedEvent extends BaseEvent {
    type: 'report.escalated';
    payload: {
        reportId: string;
        referenceNumber: string;
        previousLevel: number;
        newLevel: number;
        previousAssigneeId?: string;
        newAssigneeId?: string;
        reason: string;
        reporterId?: string;
    };
}
export interface ReportForwardRequestedEvent extends BaseEvent {
    type: 'report.forward_requested';
    payload: {
        reportId: string;
        referenceNumber: string;
        externalSystem: string;
        requestedBy: string;
        notes?: string;
    };
}
export interface RoutingCompletedEvent extends BaseEvent {
    type: 'routing.completed';
    payload: {
        reportId: string;
        referenceNumber: string;
        departmentId: string;
        departmentCode: string;
        departmentName: string;
        priority: number;
        routingReason: string;
    };
}
export interface UserRegisteredEvent extends BaseEvent {
    type: 'user.registered';
    payload: {
        userId: string;
        email: string;
        fullName: string;
    };
}
export interface UserVerifiedEvent extends BaseEvent {
    type: 'user.verified';
    payload: {
        userId: string;
        email: string;
    };
}
export interface ExternalForwardCompletedEvent extends BaseEvent {
    type: 'external.forward_completed';
    payload: {
        reportId: string;
        referenceNumber: string;
        externalSystem: string;
        externalRefId?: string;
        status: 'SUCCESS' | 'FAILED';
        responseMessage?: string;
    };
}
export interface NotificationCreatedEvent extends BaseEvent {
    type: 'notification.created';
    payload: {
        notificationId: string;
        userId: string;
        title: string;
        message: string;
        type: string;
        data?: Record<string, unknown>;
    };
}
export type ReportEvent = ReportCreatedEvent | ReportUpdatedEvent | ReportStatusChangedEvent | ReportAssignedEvent | ReportEscalatedEvent | ReportForwardRequestedEvent;
export type RoutingEvent = RoutingCompletedEvent;
export type UserEvent = UserRegisteredEvent | UserVerifiedEvent;
export type ExternalEvent = ExternalForwardCompletedEvent;
export type NotificationEvent = NotificationCreatedEvent;
export type AppEvent = ReportEvent | RoutingEvent | UserEvent | ExternalEvent | NotificationEvent;
export declare const EXCHANGES: {
    readonly REPORT_EVENTS: "report.events";
    readonly NOTIFICATION_EVENTS: "notification.events";
    readonly ESCALATION_EVENTS: "escalation.events";
    readonly USER_EVENTS: "user.events";
    readonly EXTERNAL_EVENTS: "external.events";
};
export declare const ROUTING_KEYS: {
    readonly REPORT_CREATED: "report.created";
    readonly REPORT_UPDATED: "report.updated";
    readonly REPORT_STATUS_CHANGED: "report.status_changed";
    readonly REPORT_ASSIGNED: "report.assigned";
    readonly REPORT_ESCALATED: "report.escalated";
    readonly REPORT_FORWARD_REQUESTED: "report.forward_requested";
    readonly ROUTING_COMPLETED: "routing.completed";
    readonly USER_REGISTERED: "user.registered";
    readonly USER_VERIFIED: "user.verified";
    readonly EXTERNAL_FORWARD_COMPLETED: "external.forward_completed";
    readonly NOTIFICATION_CREATED: "notification.created";
};
export declare const QUEUES: {
    readonly ROUTING_SERVICE: "routing-service-queue";
    readonly NOTIFICATION_SERVICE: "notification-service-queue";
    readonly ANALYTICS_SERVICE: "analytics-service-queue";
    readonly ESCALATION_SERVICE: "escalation-service-queue";
    readonly EXTERNAL_INTEGRATION: "external-integration-queue";
    readonly REPORT_SERVICE: "report-service-queue";
};
//# sourceMappingURL=events.d.ts.map