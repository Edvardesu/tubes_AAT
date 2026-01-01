import { Router, Request, Response, NextFunction } from 'express';
import { prisma, ReportStatus } from '@lapor-pakdhe/prisma-client';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';
import { Errors, logger, redisClient, rabbitmqClient } from '../utils';

const router = Router();

// GET /internal/reports/:id - Get report by ID (for other services)
router.get('/reports/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await prisma.report.findUnique({
      where: { id: req.params.id },
      include: {
        reporter: {
          select: { id: true, fullName: true, email: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        assignedTo: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /internal/reports/:id/escalate - Escalate report (for escalation service)
router.patch('/reports/:id/escalate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { escalationLevel, notes } = req.body;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    const oldLevel = report.escalationLevel;

    // Update report
    const updated = await prisma.report.update({
      where: { id },
      data: {
        escalationLevel,
        status: ReportStatus.ESCALATED,
        lastEscalatedAt: new Date(),
      },
      include: {
        reporter: {
          select: { id: true, fullName: true },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        reportId: id,
        oldStatus: report.status,
        newStatus: ReportStatus.ESCALATED,
        notes: notes || `Eskalasi dari level ${oldLevel} ke level ${escalationLevel}`,
      },
    });

    // Invalidate cache
    await redisClient.invalidateReportCache(id);

    // Publish event
    try {
      await rabbitmqClient.publishReportEscalated({
        reportId: updated.id,
        referenceNumber: updated.referenceNumber,
        title: updated.title,
        category: updated.category,
        type: updated.type,
        status: updated.status,
        priority: updated.priority,
        reporterId: updated.reporterId || undefined,
        departmentId: updated.departmentId || undefined,
      });
    } catch (error) {
      logger.error('Failed to publish escalation event', { error, reportId: id });
    }

    logger.info('Report escalated', {
      reportId: id,
      oldLevel,
      newLevel: escalationLevel,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: 'Report escalated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /internal/reports/:id/assign-department - Assign department (for routing service)
router.patch('/reports/:id/assign-department', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { departmentId, priority } = req.body;

    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw Errors.notFound('Report');
    }

    // Update report
    const updated = await prisma.report.update({
      where: { id },
      data: {
        departmentId,
        priority: priority || report.priority,
        status: ReportStatus.RECEIVED,
      },
      include: {
        department: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        reportId: id,
        oldStatus: report.status,
        newStatus: ReportStatus.RECEIVED,
        notes: `Diteruskan ke ${updated.department?.name || 'departemen'}`,
      },
    });

    // Invalidate cache
    await redisClient.invalidateReportCache(id);

    logger.info('Report assigned to department', {
      reportId: id,
      departmentId,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: 'Department assigned successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
