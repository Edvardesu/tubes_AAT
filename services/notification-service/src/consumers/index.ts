import { rabbitmqClient, logger } from '../utils';
import { notificationService } from '../services';

export async function startConsumers(): Promise<void> {
  logger.info('Starting notification consumers...');

  // Consume report.created events
  await rabbitmqClient.consumeReportCreated(async (event) => {
    await notificationService.handleReportCreated(event);
  });

  // Consume report.status_changed events
  await rabbitmqClient.consumeReportStatusChanged(async (event) => {
    await notificationService.handleReportStatusChanged(event);
  });

  // Consume report.assigned events
  await rabbitmqClient.consumeReportAssigned(async (event) => {
    await notificationService.handleReportAssigned(event);
  });

  // Consume report.escalated events
  await rabbitmqClient.consumeReportEscalated(async (event) => {
    await notificationService.handleReportEscalated(event);
  });

  // Consume routing.completed events
  await rabbitmqClient.consumeRoutingCompleted(async (event) => {
    await notificationService.handleRoutingCompleted(event);
  });

  logger.info('All notification consumers started successfully');
}
