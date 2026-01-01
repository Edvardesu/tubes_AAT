import { Request, Response, NextFunction } from 'express';
import { reportService, mediaService } from '../services';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';
import { Errors } from '../utils';

// GET /reports - List reports
export const listReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await reportService.listReports(
      {
        page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
        status: req.query.status as any,
        category: req.query.category as any,
        type: req.query.type as any,
        departmentId: req.query.departmentId as string,
        search: req.query.search as string,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any,
      },
      req.user?.userId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
};

// POST /reports - Create report
export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || null;
    const files = req.files as Express.Multer.File[] | undefined;

    const report = await reportService.createReport(userId, req.body, files);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        id: report.id,
        referenceNumber: report.referenceNumber,
        title: report.title,
        status: report.status,
        trackingToken: (report as any).trackingToken,
      },
      message: 'Laporan berhasil dibuat',
    });
  } catch (error) {
    next(error);
  }
};

// GET /reports/:id - Get report detail
export const getReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.getReportById(
      req.params.id,
      req.user?.userId
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /reports/:id - Update report
export const updateReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const report = await reportService.updateReport(
      req.params.id,
      userId,
      req.body
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: report,
      message: 'Laporan berhasil diperbarui',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /reports/:id - Delete report
export const deleteReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    await reportService.deleteReport(req.params.id, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Laporan berhasil dihapus',
    });
  } catch (error) {
    next(error);
  }
};

// POST /reports/:id/upvote - Toggle upvote
export const toggleUpvote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const result = await reportService.toggleUpvote(req.params.id, userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// GET /reports/track/:referenceNumber - Track report
export const trackReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await reportService.trackReport(
      req.params.referenceNumber,
      req.query.token as string
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        referenceNumber: report.referenceNumber,
        status: report.status,
        category: report.category,
        department: report.department,
        statusHistory: report.statusHistory,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /users/me/reports - Get current user's reports
export const getMyReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const result = await reportService.getUserReports(userId, {
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      status: req.query.status as any,
      category: req.query.category as any,
      sortBy: req.query.sortBy as any,
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

// GET /reports/:id/media - Get report media
export const getReportMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const media = await mediaService.getReportMedia(req.params.id);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: media,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listReports,
  createReport,
  getReport,
  updateReport,
  deleteReport,
  toggleUpvote,
  trackReport,
  getMyReports,
  getReportMedia,
};
