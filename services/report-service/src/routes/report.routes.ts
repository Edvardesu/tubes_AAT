import { Router } from 'express';
import { reportController } from '../controllers';
import {
  authenticate,
  optionalAuth,
  validate,
  createReportValidation,
  updateReportValidation,
  listReportsValidation,
  reportIdValidation,
  trackReportValidation,
  upload,
  handleUploadError,
} from '../middleware';

const router = Router();

// GET /reports/my/stats - Get current user's report statistics (must be before /my to avoid conflict)
router.get(
  '/my/stats',
  authenticate,
  reportController.getMyReportStats
);

// GET /reports/my - Get current user's reports (must be before /:id to avoid conflict)
router.get(
  '/my',
  authenticate,
  validate(listReportsValidation),
  reportController.getMyReports
);

// GET /reports/public - Get public reports
router.get(
  '/public',
  optionalAuth,
  validate(listReportsValidation),
  reportController.listPublicReports
);

// GET /reports/department - Get reports for staff's department
router.get(
  '/department',
  authenticate,
  validate(listReportsValidation),
  reportController.getDepartmentReports
);

// GET /reports/escalated - Get escalated reports (for Pejabat Utama)
router.get(
  '/escalated',
  authenticate,
  validate(listReportsValidation),
  reportController.getEscalatedReports
);

// GET /reports/staff/performance - Get staff performance metrics (for Pejabat Utama)
router.get(
  '/staff/performance',
  authenticate,
  reportController.getStaffPerformance
);

// GET /reports - List reports (optional auth for public access)
router.get(
  '/',
  optionalAuth,
  validate(listReportsValidation),
  reportController.listReports
);

// GET /reports/track/:referenceNumber - Track report by reference number
router.get(
  '/track/:referenceNumber',
  validate(trackReportValidation),
  reportController.trackReport
);

// POST /reports - Create report (optional auth for anonymous reports)
router.post(
  '/',
  optionalAuth,
  upload.array('media', 5),
  handleUploadError,
  validate(createReportValidation),
  reportController.createReport
);

// GET /reports/:id - Get report detail
router.get(
  '/:id',
  optionalAuth,
  validate(reportIdValidation),
  reportController.getReport
);

// PATCH /reports/:id - Update report (auth required)
router.patch(
  '/:id',
  authenticate,
  validate(reportIdValidation),
  validate(updateReportValidation),
  reportController.updateReport
);

// DELETE /reports/:id - Delete report (auth required)
router.delete(
  '/:id',
  authenticate,
  validate(reportIdValidation),
  reportController.deleteReport
);

// POST /reports/:id/upvote - Toggle upvote (auth required)
router.post(
  '/:id/upvote',
  authenticate,
  validate(reportIdValidation),
  reportController.toggleUpvote
);

// GET /reports/:id/media - Get report media
router.get(
  '/:id/media',
  validate(reportIdValidation),
  reportController.getReportMedia
);

// PATCH /reports/:id/status - Update report status (for staff)
router.patch(
  '/:id/status',
  authenticate,
  validate(reportIdValidation),
  reportController.updateReportStatus
);

// POST /reports/:id/assign - Assign report to staff (for admin/supervisor)
router.post(
  '/:id/assign',
  authenticate,
  validate(reportIdValidation),
  reportController.assignReport
);

// POST /reports/:id/escalate - Escalate report to superior (for Pejabat Muda)
router.post(
  '/:id/escalate',
  authenticate,
  validate(reportIdValidation),
  reportController.escalateReport
);

export default router;
