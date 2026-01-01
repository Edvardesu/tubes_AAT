import { PrismaClient } from '@lapor-pakdhe/prisma-client';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../utils/logger';
import { publishMessage, EXCHANGES } from '../utils/rabbitmq';

const prisma = new PrismaClient();

export interface ForwardRequest {
  reportId: string;
  externalSystem: string;
  data: Record<string, unknown>;
}

export interface ForwardResult {
  id: string;
  externalRefId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  response?: Record<string, unknown>;
  error?: string;
}

export interface WebhookPayload {
  source: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  signature?: string;
}

class ExternalIntegrationService {
  // Mock external system responses
  private mockExternalResponse(system: string, data: Record<string, unknown>): Record<string, unknown> {
    const refId = `${system.toUpperCase()}-${Date.now()}-${uuidv4().slice(0, 8)}`;

    return {
      success: true,
      referenceId: refId,
      message: `Report received by ${system}`,
      timestamp: new Date().toISOString(),
      estimatedResponseTime: '24-48 hours',
      data: {
        ...data,
        status: 'RECEIVED',
        priority: data.priority || 'NORMAL',
      },
    };
  }

  async forwardToExternalSystem(request: ForwardRequest): Promise<ForwardResult> {
    const { reportId, externalSystem, data } = request;

    logger.info(`Forwarding report ${reportId} to ${externalSystem}`);

    try {
      let response: Record<string, unknown>;

      if (config.mockMode) {
        // Mock mode - simulate external API call
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        response = this.mockExternalResponse(externalSystem, data);
      } else {
        // Real API call (for production)
        const systemConfig = this.getSystemConfig(externalSystem);
        const result = await axios.post(systemConfig.url, data, {
          headers: {
            'Authorization': `Bearer ${systemConfig.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        });
        response = result.data;
      }

      // Save to database
      const forward = await prisma.externalForward.create({
        data: {
          reportId,
          externalSystem,
          externalRefId: (response.referenceId as string) || uuidv4(),
          status: 'SENT',
          requestPayload: data as any,
          responsePayload: response as any,
          forwardedAt: new Date(),
        },
      });

      // Publish success event
      await publishMessage(EXCHANGES.EXTERNAL, 'external.forward.success', {
        forwardId: forward.id,
        reportId,
        externalSystem,
        externalRefId: forward.externalRefId,
        timestamp: new Date().toISOString(),
      });

      return {
        id: forward.id,
        externalRefId: forward.externalRefId,
        status: 'SUCCESS',
        response,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed to forward report ${reportId} to ${externalSystem}:`, error);

      // Save failed forward
      const forward = await prisma.externalForward.create({
        data: {
          reportId,
          externalSystem,
          externalRefId: '',
          status: 'FAILED',
          requestPayload: data as any,
          responsePayload: { error: errorMessage } as any,
          forwardedAt: new Date(),
        },
      });

      // Publish failure event
      await publishMessage(EXCHANGES.EXTERNAL, 'external.forward.failed', {
        forwardId: forward.id,
        reportId,
        externalSystem,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      return {
        id: forward.id,
        externalRefId: '',
        status: 'FAILED',
        error: errorMessage,
      };
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    logger.info(`Received webhook from ${payload.source}:`, payload.event);

    try {
      // Find the forward record by external reference
      const externalRefId = payload.data.referenceId as string;
      if (externalRefId) {
        const forward = await prisma.externalForward.findFirst({
          where: { externalRefId },
        });

        if (forward) {
          // Update forward status based on webhook
          const newStatus = this.mapWebhookEventToStatus(payload.event);
          await prisma.externalForward.update({
            where: { id: forward.id },
            data: {
              status: newStatus,
              responsePayload: {
                ...(forward.responsePayload as object || {}),
                webhookUpdate: payload,
              } as any,
              updatedAt: new Date(),
            },
          });

          // Publish webhook event for other services
          await publishMessage(EXCHANGES.EXTERNAL, `webhook.${payload.source}`, {
            forwardId: forward.id,
            reportId: forward.reportId,
            event: payload.event,
            data: payload.data,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  async getForwardsByReport(reportId: string) {
    return prisma.externalForward.findMany({
      where: { reportId },
      orderBy: { forwardedAt: 'desc' },
    });
  }

  async getForwardStatus(forwardId: string) {
    return prisma.externalForward.findUnique({
      where: { id: forwardId },
    });
  }

  private getSystemConfig(system: string): { url: string; apiKey: string } {
    switch (system.toLowerCase()) {
      case 'police':
        return config.externalSystems.policeApi;
      case 'fire':
        return config.externalSystems.fireApi;
      case 'health':
        return config.externalSystems.healthApi;
      default:
        throw new Error(`Unknown external system: ${system}`);
    }
  }

  private mapWebhookEventToStatus(event: string): string {
    switch (event.toLowerCase()) {
      case 'received':
      case 'acknowledged':
        return 'ACKNOWLEDGED';
      case 'processing':
      case 'in_progress':
        return 'PROCESSING';
      case 'completed':
      case 'resolved':
        return 'COMPLETED';
      case 'rejected':
      case 'failed':
        return 'FAILED';
      default:
        return 'SENT';
    }
  }
}

export const externalService = new ExternalIntegrationService();
