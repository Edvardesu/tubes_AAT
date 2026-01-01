import { Router } from 'express';
import { reportController } from '../controllers';
import { authenticate, validate, listReportsValidation } from '../middleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /users/me/reports - Get current user's reports
router.get(
  '/me/reports',
  validate(listReportsValidation),
  reportController.getMyReports
);

export default router;
