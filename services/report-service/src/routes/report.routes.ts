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

export default router;
