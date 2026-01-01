import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { prisma } from '@lapor-pakdhe/prisma-client';
import { minioClient, logger, Errors } from '../utils';
import { config } from '../config';

export interface UploadedMedia {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  url: string;
}

class MediaService {
  // Generate unique file path
  private generateFilePath(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const uniqueId = uuidv4();

    return `reports/${year}/${month}/${day}/${uniqueId}${ext}`;
  }

  // Validate file
  private validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > config.upload.maxFileSize) {
      throw Errors.fileTooLarge(config.upload.maxFileSize);
    }

    // Check mime type
    if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
      throw Errors.invalidFileType(config.upload.allowedMimeTypes);
    }
  }

  // Upload a single file
  async uploadFile(file: Express.Multer.File): Promise<UploadedMedia> {
    this.validateFile(file);

    const filePath = this.generateFilePath(file.originalname);

    // Upload to MinIO
    await minioClient.uploadFile(filePath, file.buffer, file.mimetype);

    logger.info('File uploaded', {
      filePath,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    });

    return {
      id: uuidv4(),
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      filePath,
      url: this.getMediaUrl(filePath),
    };
  }

  // Upload multiple files for a report
  async uploadReportMedia(
    reportId: string,
    files: Express.Multer.File[]
  ): Promise<UploadedMedia[]> {
    // Validate file count
    if (files.length > config.upload.maxFiles) {
      throw Errors.tooManyFiles(config.upload.maxFiles);
    }

    const uploadedMedia: UploadedMedia[] = [];

    for (const file of files) {
      try {
        const uploaded = await this.uploadFile(file);

        // Save to database
        const media = await prisma.reportMedia.create({
          data: {
            reportId,
            fileName: uploaded.fileName,
            fileType: uploaded.fileType,
            fileSize: uploaded.fileSize,
            filePath: uploaded.filePath,
          },
        });

        uploadedMedia.push({
          ...uploaded,
          id: media.id,
        });
      } catch (error) {
        logger.error('Failed to upload file', {
          error,
          fileName: file.originalname,
          reportId,
        });
        // Continue with other files even if one fails
      }
    }

    logger.info('Report media uploaded', {
      reportId,
      count: uploadedMedia.length,
    });

    return uploadedMedia;
  }

  // Get media URL
  getMediaUrl(filePath: string): string {
    return minioClient.getPublicUrl(filePath);
  }

  // Get presigned URL for secure access
  async getPresignedUrl(filePath: string, expirySeconds: number = 3600): Promise<string> {
    return minioClient.getFileUrl(filePath, expirySeconds);
  }

  // Delete media file
  async deleteMedia(filePath: string): Promise<void> {
    try {
      await minioClient.deleteFile(filePath);
      logger.info('File deleted from storage', { filePath });
    } catch (error) {
      logger.error('Failed to delete file from storage', { error, filePath });
      // Don't throw - file might not exist
    }
  }

  // Delete all media for a report
  async deleteReportMedia(reportId: string): Promise<void> {
    const mediaFiles = await prisma.reportMedia.findMany({
      where: { reportId },
    });

    for (const media of mediaFiles) {
      await this.deleteMedia(media.filePath);
    }

    // Database records will be deleted by cascade
    logger.info('Report media deleted', { reportId, count: mediaFiles.length });
  }

  // Get report media with URLs
  async getReportMedia(reportId: string): Promise<UploadedMedia[]> {
    const mediaFiles = await prisma.reportMedia.findMany({
      where: { reportId },
      orderBy: { uploadedAt: 'asc' },
    });

    return mediaFiles.map((media) => ({
      id: media.id,
      fileName: media.fileName,
      fileType: media.fileType,
      fileSize: media.fileSize,
      filePath: media.filePath,
      url: this.getMediaUrl(media.filePath),
    }));
  }
}

export const mediaService = new MediaService();
export default mediaService;
