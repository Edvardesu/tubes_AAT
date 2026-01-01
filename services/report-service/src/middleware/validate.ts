import { Request, Response, NextFunction } from 'express';
import { validationResult, body, query, param, ValidationChain } from 'express-validator';
import { Errors } from '../utils/errors';
import { ReportCategory, ReportType, ReportStatus } from '@lapor-pakdhe/prisma-client';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
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

// Create report validation
export const createReportValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 10, max: 200 }).withMessage('Title must be 10-200 characters'),
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(Object.values(ReportCategory)).withMessage('Invalid category'),
  body('type')
    .optional()
    .isIn(Object.values(ReportType)).withMessage('Invalid report type'),
  body('locationLat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('locationLng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('locationAddress')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Address must be max 500 characters'),
];

// Update report validation
export const updateReportValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 }).withMessage('Title must be 10-200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 }).withMessage('Description must be 20-5000 characters'),
];

// List reports query validation
export const listReportsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status')
    .optional()
    .isIn(Object.values(ReportStatus)).withMessage('Invalid status'),
  query('category')
    .optional()
    .isIn(Object.values(ReportCategory)).withMessage('Invalid category'),
  query('type')
    .optional()
    .isIn(Object.values(ReportType)).withMessage('Invalid type'),
  query('departmentId')
    .optional()
    .isUUID().withMessage('Invalid department ID'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'upvoteCount', 'priority']).withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Invalid sort order'),
];

// Report ID param validation
export const reportIdValidation = [
  param('id')
    .isUUID().withMessage('Invalid report ID'),
];

// Track report validation
export const trackReportValidation = [
  param('referenceNumber')
    .matches(/^LP-\d{4}-\d{6}$/).withMessage('Invalid reference number format'),
  query('token')
    .optional()
    .isLength({ min: 10, max: 20 }).withMessage('Invalid tracking token'),
];

// Update status validation (staff)
export const updateStatusValidation = [
  param('id')
    .isUUID().withMessage('Invalid report ID'),
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(Object.values(ReportStatus)).withMessage('Invalid status'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
];

// Assign report validation (staff)
export const assignReportValidation = [
  param('id')
    .isUUID().withMessage('Invalid report ID'),
  body('assignedToId')
    .notEmpty().withMessage('Assignee ID is required')
    .isUUID().withMessage('Invalid assignee ID'),
];

// Forward report validation (staff)
export const forwardReportValidation = [
  param('id')
    .isUUID().withMessage('Invalid report ID'),
  body('externalSystem')
    .notEmpty().withMessage('External system is required')
    .isIn(['POLRI_SYSTEM', 'DAMKAR_SYSTEM', 'DINKES_SYSTEM', 'PLN_SYSTEM']).withMessage('Invalid external system'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
];

export default validate;
