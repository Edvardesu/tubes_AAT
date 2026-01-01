import {
  prisma,
  ReportStatus,
  Prisma,
} from '@lapor-pakdhe/prisma-client';
import { Errors, logger, redisClient, rabbitmqClient } from '../utils';

export interface UpdateStatusInput {
  status: ReportStatus;
  notes?: string;
}

export interface AssignReportInput {
  assignedToId: string;
}

export interface ForwardReportInput {
  externalSystem: string;
  notes?: string;
}

class StaffService {
  // Get reports for staff (filtered by department if applicable)
  async getStaffReports(
    userId: string,
    roles: string[],
    query: {
      page?: number;
      limit?: number;
      status?: ReportStatus;
      departmentId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.ReportWhereInput = {};

    // Filter by department if staff is not admin
    if (!roles.includes('ADMIN') && !roles.includes('CITY_ADMIN')) {
      // Get staff member's department
      const staffMember = await prisma.staffMember.findUnique({
        where: { userId },
        include: { department: true },
      });

      if (staffMember) {
        where.departmentId = staffMember.departmentId;
      }
    } else if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { referenceNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ReportOrderByWithRelationInput = {};
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    orderBy[sortBy as keyof Prisma.ReportOrderByWithRelationInput] = sortOrder;

    const total = await prisma.report.count({ where });

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
        assignedTo: {
          select: { id: true, fullName: true },
        },
        _count: {
          select: { upvotes: true, media: true },
        },
      },
    });

    return {
      data: reports.map((r) => ({
        ...r,
        upvoteCount: r._count?.upvotes || 0,
        mediaCount: r._count?.media || 0,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update report status
  async updateReportStatus(
    reportId: string,
    userId: string,
    input: UpdateStatusInput
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    const oldStatus = report.status;
    const newStatus = input.status;

    // Update report
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus,
        ...(newStatus === ReportStatus.RESOLVED && {
          resolvedAt: new Date(),
        }),
      },
      include: {
        reporter: {
          select: { id: true, fullName: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        assignedTo: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        reportId,
        oldStatus,
        newStatus,
        changedById: userId,
        notes: input.notes,
      },
    });

    // Invalidate cache
    await redisClient.invalidateReportCache(reportId);

    // Publish event
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
        notes: input.notes,
        changedById: userId,
        reporterId: updated.reporterId || undefined,
      });
    } catch (error) {
      logger.error('Failed to publish status changed event', { error, reportId });
    }

    logger.info('Report status updated', {
      reportId,
      oldStatus,
      newStatus,
      changedBy: userId,
    });

    return updated;
  }

  // Assign report to staff member
  async assignReport(
    reportId: string,
    userId: string,
    input: AssignReportInput
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Verify assignee exists and is staff
    const assignee = await prisma.user.findUnique({
      where: { id: input.assignedToId },
      include: {
        roles: {
          include: { role: true },
        },
        staffProfile: true,
      },
    });

    if (!assignee) {
      throw Errors.notFound('Assignee');
    }

    const isStaff = assignee.roles.some((ur) =>
      ['STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'CITY_ADMIN'].includes(ur.role.name)
    );

    if (!isStaff) {
      throw Errors.badRequest('Assignee must be a staff member');
    }

    // Update report
    const updated = await prisma.report.update({
      where: { id: reportId },
      data: {
        assignedToId: input.assignedToId,
        status: ReportStatus.ASSIGNED,
      },
      include: {
        reporter: {
          select: { id: true, fullName: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        assignedTo: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Create status history if status changed
    if (report.status !== ReportStatus.ASSIGNED) {
      await prisma.statusHistory.create({
        data: {
          reportId,
          oldStatus: report.status,
          newStatus: ReportStatus.ASSIGNED,
          changedById: userId,
          notes: `Ditugaskan ke ${assignee.fullName}`,
        },
      });
    }

    // Invalidate cache
    await redisClient.invalidateReportCache(reportId);

    // Publish event
    try {
      await rabbitmqClient.publishReportAssigned({
        reportId: updated.id,
        referenceNumber: updated.referenceNumber,
        title: updated.title,
        category: updated.category,
        type: updated.type,
        status: updated.status,
        priority: updated.priority,
        assignedToId: input.assignedToId,
        reporterId: updated.reporterId || undefined,
      });
    } catch (error) {
      logger.error('Failed to publish report assigned event', { error, reportId });
    }

    logger.info('Report assigned', {
      reportId,
      assignedTo: input.assignedToId,
      assignedBy: userId,
    });

    return updated;
  }

  // Forward report to external system
  async forwardReport(
    reportId: string,
    userId: string,
    input: ForwardReportInput
  ) {
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        department: true,
        media: true,
      },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Create external forward record
    const forward = await prisma.externalForward.create({
      data: {
        reportId,
        externalSystem: input.externalSystem,
        status: 'PENDING',
        requestPayload: {
          referenceNumber: report.referenceNumber,
          title: report.title,
          description: report.description,
          category: report.category,
          locationAddress: report.locationAddress,
          notes: input.notes,
        },
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        reportId,
        oldStatus: report.status,
        newStatus: report.status,
        changedById: userId,
        notes: `Diteruskan ke ${input.externalSystem}`,
      },
    });

    logger.info('Report forwarded to external system', {
      reportId,
      externalSystem: input.externalSystem,
      forwardId: forward.id,
    });

    return forward;
  }
}

export const staffService = new StaffService();
export default staffService;
