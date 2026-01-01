import { Router } from 'express';
import { staffController } from '../controllers';
import {
  authenticate,
  isStaff,
  validate,
  listReportsValidation,
  updateStatusValidation,
  assignReportValidation,
  forwardReportValidation,
} from '../middleware';

const router = Router();

// All staff routes require authentication and staff role
router.use(authenticate);
router.use(isStaff);

// GET /staff/reports - List reports for staff
router.get(
  '/reports',
  validate(listReportsValidation),
  staffController.getStaffReports
);

// PATCH /staff/reports/:id/status - Update report status
router.patch(
  '/reports/:id/status',
  validate(updateStatusValidation),
  staffController.updateReportStatus
);

// POST /staff/reports/:id/assign - Assign report to staff
router.post(
  '/reports/:id/assign',
  validate(assignReportValidation),
  staffController.assignReport
);

// POST /staff/reports/:id/forward - Forward report to external system
router.post(
  '/reports/:id/forward',
  validate(forwardReportValidation),
  staffController.forwardReport
);

export default router;
