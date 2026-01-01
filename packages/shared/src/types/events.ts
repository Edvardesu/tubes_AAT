import { ReportStatus, ReportCategory } from './enums';

// ==================== BASE EVENT ====================

export interface BaseEvent {
  eventId: string;
  timestamp: string;
  source: string;
}

// ==================== REPORT EVENTS ====================

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
    changes: Record<string, { old: unknown; new: unknown }>;
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

// ==================== ROUTING EVENTS ====================

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

// ==================== USER EVENTS ====================

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

// ==================== EXTERNAL INTEGRATION EVENTS ====================

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

// ==================== NOTIFICATION EVENTS ====================

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

// ==================== EVENT UNION TYPES ====================

export type ReportEvent =
  | ReportCreatedEvent
  | ReportUpdatedEvent
  | ReportStatusChangedEvent
  | ReportAssignedEvent
  | ReportEscalatedEvent
  | ReportForwardRequestedEvent;

export type RoutingEvent = RoutingCompletedEvent;

export type UserEvent = UserRegisteredEvent | UserVerifiedEvent;

export type ExternalEvent = ExternalForwardCompletedEvent;

export type NotificationEvent = NotificationCreatedEvent;

export type AppEvent =
  | ReportEvent
  | RoutingEvent
  | UserEvent
  | ExternalEvent
  | NotificationEvent;

// ==================== EXCHANGE & QUEUE NAMES ====================

export const EXCHANGES = {
  REPORT_EVENTS: 'report.events',
  NOTIFICATION_EVENTS: 'notification.events',
  ESCALATION_EVENTS: 'escalation.events',
  USER_EVENTS: 'user.events',
  EXTERNAL_EVENTS: 'external.events',
} as const;

export const ROUTING_KEYS = {
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
} as const;

export const QUEUES = {
  ROUTING_SERVICE: 'routing-service-queue',
  NOTIFICATION_SERVICE: 'notification-service-queue',
  ANALYTICS_SERVICE: 'analytics-service-queue',
  ESCALATION_SERVICE: 'escalation-service-queue',
  EXTERNAL_INTEGRATION: 'external-integration-queue',
  REPORT_SERVICE: 'report-service-queue',
} as const;
