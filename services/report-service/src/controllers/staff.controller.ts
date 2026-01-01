import { Request, Response, NextFunction } from 'express';
import { staffService } from '../services';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';
import { Errors } from '../utils';

// GET /staff/reports - List reports for staff
export const getStaffReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const roles = req.user?.roles || [];

    if (!userId) {
      throw Errors.unauthorized();
    }

    const result = await staffService.getStaffReports(userId, roles, {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      status: req.query.status as any,
      departmentId: req.query.departmentId as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as any,
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /staff/reports/:id/status - Update report status
export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const report = await staffService.updateReportStatus(
      req.params.id,
      userId,
      req.body
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
      message: 'Status laporan berhasil diperbarui',
    });
  } catch (error) {
    next(error);
  }
};

// POST /staff/reports/:id/assign - Assign report to staff
export const assignReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const report = await staffService.assignReport(
      req.params.id,
      userId,
      req.body
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
      message: 'Laporan berhasil ditugaskan',
    });
  } catch (error) {
    next(error);
  }
};

// POST /staff/reports/:id/forward - Forward report to external system
export const forwardReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const forward = await staffService.forwardReport(
      req.params.id,
      userId,
      req.body
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: forward,
      message: 'Laporan berhasil diteruskan ke sistem eksternal',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getStaffReports,
  updateReportStatus,
  assignReport,
  forwardReport,
};
