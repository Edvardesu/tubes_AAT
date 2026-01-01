import { Request, Response, NextFunction } from 'express';
import { externalService } from '../services/external.service';
import { logger } from '../utils/logger';

export class ExternalController {
  async forwardReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId, externalSystem, data } = req.body;

      if (!reportId || !externalSystem) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'reportId and externalSystem are required',
          },
        });
        return;
      }

      const result = await externalService.forwardToExternalSystem({
        reportId,
        externalSystem,
        data: data || {},
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { source } = req.params;
      const payload = {
        source,
        event: req.body.event || 'update',
        data: req.body.data || req.body,
        timestamp: req.body.timestamp || new Date().toISOString(),
        signature: req.headers['x-webhook-signature'] as string,
      };

      await externalService.handleWebhook(payload);

      res.json({
        success: true,
        message: 'Webhook processed',
      });
    } catch (error) {
      next(error);
    }
  }

  async getForwardsByReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reportId } = req.params;
      const forwards = await externalService.getForwardsByReport(reportId);

      res.json({
        success: true,
        data: forwards,
      });
    } catch (error) {
      next(error);
    }
  }

  async getForwardStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { forwardId } = req.params;
      const forward = await externalService.getForwardStatus(forwardId);

      if (!forward) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Forward record not found',
          },
        });
        return;
      }

      res.json({
        success: true,
        data: forward,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSystems(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: [
        { id: 'police', name: 'Kepolisian', description: 'Sistem kepolisian untuk laporan keamanan' },
        { id: 'fire', name: 'Pemadam Kebakaran', description: 'Dinas pemadam kebakaran' },
        { id: 'health', name: 'Dinas Kesehatan', description: 'Dinas kesehatan untuk laporan kesehatan' },
      ],
    });
  }
}

export const externalController = new ExternalController();
