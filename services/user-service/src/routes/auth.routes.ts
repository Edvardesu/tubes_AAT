import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
} from '../middleware/validate';

const router = Router();

// POST /auth/register - Register new user
router.post(
  '/register',
  validate(registerValidation),
  authController.register
);

// POST /auth/login - Login
router.post(
  '/login',
  validate(loginValidation),
  authController.login
);

// POST /auth/refresh - Refresh access token
router.post(
  '/refresh',
  validate(refreshTokenValidation),
  authController.refreshToken
);

// POST /auth/logout - Logout (invalidate refresh token)
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// POST /auth/logout-all - Logout from all devices
router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

export default router;
