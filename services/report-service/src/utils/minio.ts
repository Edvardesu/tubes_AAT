import * as Minio from 'minio';
import { config } from '../config';
import { logger } from './logger';

class MinioClient {
  private client: Minio.Client | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    try {
      this.client = new Minio.Client({
        endPoint: config.minio.endpoint,
        port: config.minio.port,
        useSSL: config.minio.useSSL,
        accessKey: config.minio.accessKey,
        secretKey: config.minio.secretKey,
      });

      // Check if bucket exists, create if not
      const bucketExists = await this.client.bucketExists(config.minio.bucket);
      if (!bucketExists) {
        await this.client.makeBucket(config.minio.bucket);
        logger.info(`Bucket ${config.minio.bucket} created`);
      }

      this.isConnected = true;
      logger.info('MinIO connected', {
        endpoint: config.minio.endpoint,
        bucket: config.minio.bucket,
      });
    } catch (error) {
      logger.error('MinIO connection failed', { error });
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  getClient(): Minio.Client {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }
    return this.client;
  }

  async uploadFile(
    objectName: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    const metaData = {
      'Content-Type': contentType,
    };

    await this.client.putObject(
      config.minio.bucket,
      objectName,
      buffer,
      buffer.length,
      metaData
    );

    logger.info('File uploaded to MinIO', { objectName, contentType, size: buffer.length });

    return objectName;
  }

  async deleteFile(objectName: string): Promise<void> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    await this.client.removeObject(config.minio.bucket, objectName);
    logger.info('File deleted from MinIO', { objectName });
  }

  async getFileUrl(objectName: string, expirySeconds: number = 3600): Promise<string> {
    if (!this.client) {
      throw new Error('MinIO client not initialized');
    }

    // Generate presigned URL
    return this.client.presignedGetObject(config.minio.bucket, objectName, expirySeconds);
  }

  getPublicUrl(objectName: string): string {
    const protocol = config.minio.useSSL ? 'https' : 'http';
    return `${protocol}://${config.minio.endpoint}:${config.minio.port}/${config.minio.bucket}/${objectName}`;
  }

  async fileExists(objectName: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.statObject(config.minio.bucket, objectName);
      return true;
    } catch {
      return false;
    }
  }
}

export const minioClient = new MinioClient();
export default minioClient;
