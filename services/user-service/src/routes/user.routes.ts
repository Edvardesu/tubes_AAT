import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { validate, updateProfileValidation } from '../middleware/validate';

const router = Router();

// GET /users/me - Get current user profile
router.get(
  '/me',
  authenticate,
  userController.getProfile
);

// PATCH /users/me - Update current user profile
router.patch(
  '/me',
  authenticate,
  validate(updateProfileValidation),
  userController.updateProfile
);

export default router;
