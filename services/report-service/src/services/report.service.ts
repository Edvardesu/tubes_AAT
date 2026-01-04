import {
  prisma,
  ReportType,
  ReportStatus,
  ReportCategory,
  Report,
  Prisma,
} from '@lapor-pakdhe/prisma-client';
import { config } from '../config';
import {
  Errors,
  logger,
  redisClient,
  rabbitmqClient,
  encryptionService,
} from '../utils';
import { mediaService } from './media.service';

export interface CreateReportInput {
  title: string;
  description: string;
  category: ReportCategory;
  type?: ReportType;
  locationLat?: number;
  locationLng?: number;
  locationAddress?: string;
}

export interface UpdateReportInput {
  title?: string;
  description?: string;
}

export interface ListReportsQuery {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  category?: ReportCategory;
  type?: ReportType;
  departmentId?: string;
  reporterId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'upvoteCount' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Category to department code mapping
const CATEGORY_TO_DEPARTMENT: Record<string, string> = {
  INFRASTRUCTURE: 'INFRASTRUKTUR',
  PUBLIC_SERVICE: 'SOSIAL',
  ENVIRONMENT: 'KEBERSIHAN',
  SECURITY: 'KEAMANAN',
  SOCIAL: 'SOSIAL',
  HEALTH: 'KESEHATAN',
  EDUCATION: 'SOSIAL', // No education dept, fallback to social
  TRANSPORTATION: 'INFRASTRUKTUR', // Fallback to infrastructure
  OTHER: 'INFRASTRUKTUR', // Default fallback
};

export interface ReportWithDetails extends Report {
  reporter?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  department?: {
    id: string;
    name: string;
    code: string;
  } | null;
  assignedTo?: {
    id: string;
    fullName: string;
  } | null;
  media?: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
  }[];
  statusHistory?: {
    id: string;
    oldStatus: ReportStatus;
    newStatus: ReportStatus;
    changedBy?: { fullName: string } | null;
    notes?: string | null;
    createdAt: Date;
  }[];
  _count?: {
    upvotes: number;
  };
  hasUpvoted?: boolean;
}

class ReportService {
  // Generate reference number: LP-YYYY-XXXXXX
  private async generateReferenceNumber(): Promise<string> {
    const year = new Date().getFullYear();

    // Get or create sequence for current year
    const sequence = await prisma.reportSequence.upsert({
      where: { year },
      update: { sequence: { increment: 1 } },
      create: { year, sequence: 1 },
    });

    const paddedSequence = sequence.sequence.toString().padStart(6, '0');
    return `LP-${year}-${paddedSequence}`;
  }

  // Calculate SLA deadline based on priority
  private calculateSlaDeadline(priority: number): Date {
    const hoursToAdd = priority <= 2 ? config.sla.level1Hours : config.sla.level2Hours;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hoursToAdd);
    return deadline;
  }

  // Create a new report
  async createReport(
    userId: string | null,
    input: CreateReportInput,
    files?: Express.Multer.File[]
  ): Promise<ReportWithDetails> {
    const referenceNumber = await this.generateReferenceNumber();
    const reportType = input.type || ReportType.PUBLIC;
    const isAnonymous = reportType === ReportType.ANONYMOUS;

    // Default priority (will be updated by routing service)
    const priority = 3;
    const slaDeadline = this.calculateSlaDeadline(priority);

    // Parse location coordinates to float (they may come as strings from form data)
    const locationLat = input.locationLat ? parseFloat(String(input.locationLat)) : null;
    const locationLng = input.locationLng ? parseFloat(String(input.locationLng)) : null;

    // Look up department based on category
    const departmentCode = CATEGORY_TO_DEPARTMENT[input.category] || 'INFRASTRUKTUR';
    const department = await prisma.department.findFirst({
      where: { code: departmentCode },
      select: { id: true },
    });

    if (!department) {
      logger.warn('Department not found for category', { category: input.category, departmentCode });
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        referenceNumber,
        title: input.title,
        description: input.description,
        category: input.category,
        type: reportType,
        status: ReportStatus.PENDING,
        priority,
        locationLat: locationLat && !isNaN(locationLat) ? locationLat : null,
        locationLng: locationLng && !isNaN(locationLng) ? locationLng : null,
        locationAddress: input.locationAddress,
        reporterId: isAnonymous ? null : userId,
        isAnonymous,
        slaDeadline,
        escalationLevel: 1,
        departmentId: department?.id || null,
      },
      include: {
        reporter: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Handle anonymous report encryption
    let trackingToken: string | undefined;
    if (isAnonymous && userId) {
      const encrypted = encryptionService.encryptUserId(userId);
      await prisma.anonymousReport.create({
        data: {
          reportId: report.id,
          encryptedUserId: encrypted.encryptedUserId,
          encryptionKeyId: encrypted.encryptionKeyId,
          trackingToken: encrypted.trackingToken,
        },
      });
      trackingToken = encrypted.trackingToken;
    }

    // Upload media files if provided
    if (files && files.length > 0) {
      await mediaService.uploadReportMedia(report.id, files);
    }

    // Create initial status history
    await prisma.statusHistory.create({
      data: {
        reportId: report.id,
        oldStatus: ReportStatus.PENDING,
        newStatus: ReportStatus.PENDING,
        notes: 'Laporan dibuat',
      },
    });

    // Publish event to RabbitMQ
    try {
      await rabbitmqClient.publishReportCreated({
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        title: report.title,
        category: report.category,
        type: report.type,
        status: report.status,
        priority: report.priority,
        reporterId: report.reporterId || undefined,
      });
    } catch (error) {
      logger.error('Failed to publish report created event', { error, reportId: report.id });
    }

    logger.info('Report created', {
      reportId: report.id,
      referenceNumber,
      category: input.category,
      type: reportType,
    });

    return {
      ...report,
      trackingToken,
    } as ReportWithDetails;
  }

  // Get report by ID
  async getReportById(
    reportId: string,
    userId?: string
  ): Promise<ReportWithDetails> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        reporter: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        assignedTo: {
          select: { id: true, fullName: true },
        },
        media: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            filePath: true,
          },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { upvotes: true },
        },
      },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Check if user has upvoted
    let hasUpvoted = false;
    if (userId) {
      const upvote = await prisma.reportUpvote.findUnique({
        where: {
          reportId_userId: { reportId, userId },
        },
      });
      hasUpvoted = !!upvote;
    }

    // Increment view count
    await redisClient.incrementViewCount(reportId);
    const viewCount = await redisClient.getViewCount(reportId);

    // Add media URLs
    const mediaWithUrls = await Promise.all(
      (report.media || []).map(async (m) => ({
        ...m,
        url: mediaService.getMediaUrl(m.filePath),
      }))
    );

    return {
      ...report,
      viewCount: report.viewCount + viewCount,
      hasUpvoted,
      media: mediaWithUrls,
      upvoteCount: report._count?.upvotes || 0,
    } as ReportWithDetails;
  }

  // List reports with filtering and pagination
  async listReports(
    query: ListReportsQuery,
    userId?: string
  ): Promise<{ data: ReportWithDetails[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ReportWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.type) {
      where.type = query.type;
    } else if (!userId) {
      // Non-authenticated users can only see PUBLIC reports
      where.type = ReportType.PUBLIC;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.reporterId) {
      where.reporterId = query.reporterId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build order by
    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy] = sortOrder;

    // Get total count
    const total = await prisma.report.count({ where });

    // Get reports
    const reports = await prisma.report.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        reporter: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { upvotes: true, media: true },
        },
      },
    });

    // Check if user has upvoted each report
    let userUpvotes: Set<string> = new Set();
    if (userId) {
      const upvotes = await prisma.reportUpvote.findMany({
        where: {
          userId,
          reportId: { in: reports.map((r) => r.id) },
        },
        select: { reportId: true },
      });
      userUpvotes = new Set(upvotes.map((u) => u.reportId));
    }

    const data = reports.map((report) => ({
      ...report,
      upvoteCount: report._count?.upvotes || 0,
      mediaCount: report._count?.media || 0,
      hasUpvoted: userUpvotes.has(report.id),
    })) as ReportWithDetails[];

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update report (only by reporter, only when PENDING)
  async updateReport(
    reportId: string,
    userId: string,
    input: UpdateReportInput
  ): Promise<ReportWithDetails> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Check ownership
    if (report.reporterId !== userId) {
      throw Errors.forbidden('You can only edit your own reports');
    }

    // Check status
    if (report.status !== ReportStatus.PENDING) {
      throw Errors.reportNotEditable();
    }

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
      },
      include: {
        reporter: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Invalidate cache
    await redisClient.invalidateReportCache(reportId);

    // Publish event
    try {
      await rabbitmqClient.publishReportUpdated({
        reportId: updated.id,
        referenceNumber: updated.referenceNumber,
        title: updated.title,
        category: updated.category,
        type: updated.type,
        status: updated.status,
        priority: updated.priority,
      });
    } catch (error) {
      logger.error('Failed to publish report updated event', { error, reportId });
    }

    return updated as ReportWithDetails;
  }

  // Delete report (only by reporter, only when PENDING)
  async deleteReport(reportId: string, userId: string): Promise<void> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { media: true },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Check ownership
    if (report.reporterId !== userId) {
      throw Errors.forbidden('You can only delete your own reports');
    }

    // Check status
    if (report.status !== ReportStatus.PENDING) {
      throw Errors.reportNotDeletable();
    }

    // Delete media files
    for (const media of report.media) {
      await mediaService.deleteMedia(media.filePath);
    }

    // Delete report (cascade will handle related records)
    await prisma.report.delete({
      where: { id: reportId },
    });

    // Invalidate cache
    await redisClient.invalidateReportCache(reportId);

    logger.info('Report deleted', { reportId, userId });
  }

  // Toggle upvote
  async toggleUpvote(
    reportId: string,
    userId: string
  ): Promise<{ upvoted: boolean; upvoteCount: number }> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Cannot upvote own report
    if (report.reporterId === userId) {
      throw Errors.cannotUpvoteOwnReport();
    }

    // Check if already upvoted
    const existingUpvote = await prisma.reportUpvote.findUnique({
      where: {
        reportId_userId: { reportId, userId },
      },
    });

    let upvoted: boolean;

    if (existingUpvote) {
      // Remove upvote
      await prisma.reportUpvote.delete({
        where: { id: existingUpvote.id },
      });
      await prisma.report.update({
        where: { id: reportId },
        data: { upvoteCount: { decrement: 1 } },
      });
      upvoted = false;
    } else {
      // Add upvote
      await prisma.reportUpvote.create({
        data: { reportId, userId },
      });
      await prisma.report.update({
        where: { id: reportId },
        data: { upvoteCount: { increment: 1 } },
      });
      upvoted = true;
    }

    // Get updated count
    const updatedReport = await prisma.report.findUnique({
      where: { id: reportId },
      select: { upvoteCount: true },
    });

    return {
      upvoted,
      upvoteCount: updatedReport?.upvoteCount || 0,
    };
  }

  // Track report by reference number
  async trackReport(
    referenceNumber: string,
    trackingToken?: string
  ): Promise<ReportWithDetails> {
    const report = await prisma.report.findUnique({
      where: { referenceNumber },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
        statusHistory: {
          include: {
            changedBy: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        anonymousData: true,
      },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // For anonymous reports, verify tracking token
    if (report.isAnonymous && report.anonymousData) {
      if (!trackingToken || report.anonymousData.trackingToken !== trackingToken) {
        throw Errors.invalidTrackingToken();
      }
    }

    return report as ReportWithDetails;
  }

  // Get user's reports
  async getUserReports(
    userId: string,
    query: ListReportsQuery
  ): Promise<{ data: ReportWithDetails[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    return this.listReports({
      ...query,
      reporterId: userId,
    }, userId);
  }

  // Get user's report statistics
  async getUserReportStats(userId: string): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
  }> {
    const [total, pending, inProgress, resolved, rejected] = await Promise.all([
      prisma.report.count({ where: { reporterId: userId } }),
      prisma.report.count({
        where: {
          reporterId: userId,
          status: { in: [ReportStatus.PENDING, ReportStatus.RECEIVED, ReportStatus.IN_REVIEW] },
        },
      }),
      prisma.report.count({
        where: {
          reporterId: userId,
          status: { in: [ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS] },
        },
      }),
      prisma.report.count({
        where: { reporterId: userId, status: ReportStatus.RESOLVED },
      }),
      prisma.report.count({
        where: { reporterId: userId, status: ReportStatus.REJECTED },
      }),
    ]);

    return { total, pending, inProgress, resolved, rejected };
  }

  // Update report status (for staff)
  async updateReportStatus(
    reportId: string,
    staffId: string,
    newStatus: ReportStatus,
    notes?: string
  ): Promise<ReportWithDetails> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { assignedTo: true },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    const oldStatus = report.status;

    // Update report
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        resolvedAt: newStatus === ReportStatus.RESOLVED ? new Date() : report.resolvedAt,
      },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
        department: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    // Create status history with staff ID
    await prisma.statusHistory.create({
      data: {
        reportId,
        oldStatus,
        newStatus,
        changedById: staffId,
        notes,
      },
    });

    // Invalidate cache
    await redisClient.invalidateReportCache(reportId);

    // Publish status updated event
    try {
      await rabbitmqClient.publishReportStatusChanged({
        reportId: updated.id,
        referenceNumber: updated.referenceNumber,
        title: updated.title,
        category: updated.category,
        type: updated.type,
        status: updated.status,
        priority: updated.priority,
        oldStatus,
        newStatus,
        changedById: staffId,
        reporterId: updated.reporterId || undefined,
      });
    } catch (error) {
      logger.error('Failed to publish status updated event', { error, reportId });
    }

    logger.info('Report status updated', {
      reportId,
      oldStatus,
      newStatus,
      staffId,
    });

    return updated as ReportWithDetails;
  }

  // Assign report to staff member
  async assignReport(
    reportId: string,
    staffId: string,
    assignedToId: string,
    notes?: string
  ): Promise<ReportWithDetails> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    const oldStatus = report.status;
    const newStatus = ReportStatus.ASSIGNED;

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        assignedToId,
        status: newStatus,
      },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
        department: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        reportId,
        oldStatus,
        newStatus,
        changedById: staffId,
        notes: notes || 'Laporan ditugaskan ke petugas',
      },
    });

    await redisClient.invalidateReportCache(reportId);

    logger.info('Report assigned', {
      reportId,
      assignedToId,
      staffId,
    });

    return updated as ReportWithDetails;
  }

  // Escalate report to superior (Pejabat Utama)
  async escalateReport(
    reportId: string,
    staffId: string,
    notes?: string
  ): Promise<ReportWithDetails> {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Get staff member and their superior
    const staffMember = await prisma.staffMember.findUnique({
      where: { userId: staffId },
      include: { superior: { include: { user: true } } },
    });

    if (!staffMember) {
      throw Errors.forbidden('Only staff members can escalate reports');
    }

    const oldStatus = report.status;
    const newStatus = ReportStatus.ESCALATED;

    // Update report with escalation info
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        escalationLevel: report.escalationLevel + 1,
        lastEscalatedAt: new Date(),
        // Reassign to superior if available
        assignedToId: staffMember.superior?.userId || report.assignedToId,
      },
      include: {
        reporter: { select: { id: true, fullName: true, avatarUrl: true } },
        department: { select: { id: true, name: true, code: true } },
        assignedTo: { select: { id: true, fullName: true } },
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        reportId,
        oldStatus,
        newStatus,
        changedById: staffId,
        notes: notes || 'Laporan dieskalasi ke Pejabat Utama',
      },
    });

    // Create notification for superior if exists
    if (staffMember.superior) {
      await prisma.notification.create({
        data: {
          userId: staffMember.superior.userId,
          type: 'REPORT_ESCALATED',
          title: 'Laporan Dieskalasi',
          message: `Laporan ${report.referenceNumber} dieskalasi oleh bawahan Anda`,
          data: { reportId, referenceNumber: report.referenceNumber },
        },
      });
    }

    await redisClient.invalidateReportCache(reportId);

    // Publish escalation event
    try {
      await rabbitmqClient.publishReportEscalated({
        reportId: updated.id,
        referenceNumber: updated.referenceNumber,
        title: updated.title,
        category: updated.category,
        type: updated.type,
        status: updated.status,
        priority: updated.priority,
        oldStatus,
        newStatus,
        changedById: staffId,
        reporterId: updated.reporterId || undefined,
        departmentId: updated.departmentId || undefined,
        escalationLevel: updated.escalationLevel,
      });
    } catch (error) {
      logger.error('Failed to publish report escalated event', { error, reportId });
    }

    logger.info('Report escalated', {
      reportId,
      escalationLevel: updated.escalationLevel,
      staffId,
      superiorId: staffMember.superior?.userId,
    });

    return updated as ReportWithDetails;
  }

  // Get reports assigned to staff member
  async getAssignedReports(
    staffId: string,
    query: ListReportsQuery
  ): Promise<{ data: ReportWithDetails[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    return this.listReports({
      ...query,
    }, staffId);
  }

  // Get reports for staff's department
  async getDepartmentReports(
    staffId: string,
    query: ListReportsQuery
  ): Promise<{ data: ReportWithDetails[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    // Get staff member's department
    const staffMember = await prisma.staffMember.findUnique({
      where: { userId: staffId },
      select: { departmentId: true },
    });

    if (!staffMember) {
      throw Errors.forbidden('Staff member not found');
    }

    return this.listReports({
      ...query,
      departmentId: staffMember.departmentId,
    }, staffId);
  }

  // Get staff performance metrics (for Pejabat Utama)
  async getStaffPerformance(
    superiorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    subordinates: Array<{
      staffId: string;
      fullName: string;
      totalAssigned: number;
      resolved: number;
      escalated: number;
      avgResolutionTime: number;
      statusChanges: Array<{
        date: string;
        count: number;
      }>;
    }>;
    summary: {
      totalReports: number;
      totalResolved: number;
      totalEscalated: number;
      avgResolutionTime: number;
    };
  }> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate || new Date();

    // Get subordinates
    const subordinates = await prisma.staffMember.findMany({
      where: { superiorId: await this.getStaffMemberId(superiorId) },
      include: { user: { select: { id: true, fullName: true } } },
    });

    const performanceData = await Promise.all(
      subordinates.map(async (sub) => {
        // Get reports handled by this staff member
        const [totalAssigned, resolved, escalated] = await Promise.all([
          prisma.statusHistory.count({
            where: {
              changedById: sub.userId,
              createdAt: { gte: start, lte: end },
            },
          }),
          prisma.statusHistory.count({
            where: {
              changedById: sub.userId,
              newStatus: ReportStatus.RESOLVED,
              createdAt: { gte: start, lte: end },
            },
          }),
          prisma.statusHistory.count({
            where: {
              changedById: sub.userId,
              newStatus: ReportStatus.ESCALATED,
              createdAt: { gte: start, lte: end },
            },
          }),
        ]);

        // Get average resolution time for resolved reports
        const resolvedReports = await prisma.report.findMany({
          where: {
            assignedToId: sub.userId,
            status: ReportStatus.RESOLVED,
            resolvedAt: { not: null },
            createdAt: { gte: start, lte: end },
          },
          select: { createdAt: true, resolvedAt: true },
        });

        const avgResolutionTime = resolvedReports.length > 0
          ? resolvedReports.reduce((acc, r) => {
              return acc + (r.resolvedAt!.getTime() - r.createdAt.getTime());
            }, 0) / resolvedReports.length / (1000 * 60 * 60) // in hours
          : 0;

        // Get daily status change counts for chart
        const statusChanges = await prisma.statusHistory.groupBy({
          by: ['createdAt'],
          where: {
            changedById: sub.userId,
            createdAt: { gte: start, lte: end },
          },
          _count: true,
        });

        // Aggregate by date
        const changesByDate = new Map<string, number>();
        statusChanges.forEach((sc) => {
          const dateKey = sc.createdAt.toISOString().split('T')[0];
          changesByDate.set(dateKey, (changesByDate.get(dateKey) || 0) + sc._count);
        });

        return {
          staffId: sub.userId,
          fullName: sub.user.fullName,
          totalAssigned,
          resolved,
          escalated,
          avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
          statusChanges: Array.from(changesByDate.entries()).map(([date, count]) => ({
            date,
            count,
          })),
        };
      })
    );

    // Calculate summary
    const summary = {
      totalReports: performanceData.reduce((acc, p) => acc + p.totalAssigned, 0),
      totalResolved: performanceData.reduce((acc, p) => acc + p.resolved, 0),
      totalEscalated: performanceData.reduce((acc, p) => acc + p.escalated, 0),
      avgResolutionTime:
        performanceData.length > 0
          ? performanceData.reduce((acc, p) => acc + p.avgResolutionTime, 0) / performanceData.length
          : 0,
    };

    return { subordinates: performanceData, summary };
  }

  // Helper to get staff member ID from user ID
  private async getStaffMemberId(userId: string): Promise<string | undefined> {
    const staffMember = await prisma.staffMember.findUnique({
      where: { userId },
      select: { id: true },
    });
    return staffMember?.id;
  }

  // Get escalated reports for Pejabat Utama
  async getEscalatedReports(
    superiorId: string,
    query: ListReportsQuery
  ): Promise<{ data: ReportWithDetails[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    // Get staff member's department
    const staffMember = await prisma.staffMember.findUnique({
      where: { userId: superiorId },
      select: { departmentId: true },
    });

    if (!staffMember) {
      throw Errors.forbidden('Staff member not found');
    }

    return this.listReports({
      ...query,
      status: ReportStatus.ESCALATED,
      departmentId: staffMember.departmentId,
    }, superiorId);
  }
}

export const reportService = new ReportService();
export default reportService;
