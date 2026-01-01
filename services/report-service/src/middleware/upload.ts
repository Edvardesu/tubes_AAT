import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { config } from '../config';
import { Errors } from '../utils';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  // Check if file type is allowed
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: config.upload.maxFiles,
  },
});

// Middleware to handle upload errors
export const handleUploadError = (err: Error, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(Errors.fileTooLarge(config.upload.maxFileSize));
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return next(Errors.tooManyFiles(config.upload.maxFiles));
    }
    return next(Errors.fileUploadError(err.message));
  }

  if (err.message.startsWith('Invalid file type')) {
    return next(Errors.invalidFileType(config.upload.allowedMimeTypes));
  }

  next(err);
};

export default upload;
