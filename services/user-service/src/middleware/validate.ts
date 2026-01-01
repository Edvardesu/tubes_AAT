import { Request, Response, NextFunction } from 'express';
import { validationResult, body, ValidationChain } from 'express-validator';
import { Errors } from '../utils/errors';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const formattedErrors = errors.array().reduce((acc: Record<string, string>, error) => {
      if ('path' in error) {
        acc[error.path] = error.msg;
      }
      return acc;
    }, {});

    return next(Errors.validationError(formattedErrors));
  };
};

// Auth validations
export const registerValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/).withMessage('Invalid phone number format'),
  body('nik')
    .optional()
    .trim()
    .matches(/^[0-9]{16}$/).withMessage('NIK must be 16 digits'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be max 500 characters'),
];

export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required'),
];

export const updateProfileValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters'),
  body('phone')
    .optional()
    .trim()
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/).withMessage('Invalid phone number format'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be max 500 characters'),
  body('avatarUrl')
    .optional()
    .trim()
    .isURL().withMessage('Invalid URL format'),
];

export default validate;
