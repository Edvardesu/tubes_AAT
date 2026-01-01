import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { HTTP_STATUS } from '@lapor-pakdhe/shared';
import { Errors } from '../utils/errors';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const profile = await userService.getProfile(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    const profile = await userService.updateProfile(userId, req.body);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint for service-to-service communication
export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    if (!user) {
      throw Errors.notFound('User');
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Internal endpoint for token validation
export const validateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token is already validated by auth middleware
    const userId = req.user?.userId;

    if (!userId) {
      throw Errors.unauthorized();
    }

    // Verify user still exists and is active
    const isValid = await userService.validateUserExists(userId);

    if (!isValid) {
      throw Errors.unauthorized('User not found or inactive');
    }

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        valid: true,
        userId: req.user?.userId,
        email: req.user?.email,
        roles: req.user?.roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getProfile,
  updateProfile,
  getUserById,
  validateToken,
};
