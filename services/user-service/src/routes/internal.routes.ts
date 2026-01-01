import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /internal/users/validate - Validate token (for API Gateway)
router.post(
  '/users/validate',
  authenticate,
  userController.validateToken
);

// GET /internal/users/:id - Get user by ID (for other services)
router.get(
  '/users/:id',
  userController.getUserById
);

export default router;
