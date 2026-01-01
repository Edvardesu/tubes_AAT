import { rabbitmqClient, ReportCreatedEvent, logger } from '../utils';
import { routingService } from '../services';

export async function startReportCreatedConsumer(): Promise<void> {
  logger.info('Starting report.created consumer...');

  await rabbitmqClient.consumeReportCreated(async (event: ReportCreatedEvent) => {
    try {
      await routingService.processReportCreated(event);
    } catch (error) {
      logger.error('Error in report.created consumer', {
        error,
        reportId: event.data.reportId,
      });
      // Error is logged but not re-thrown to prevent message requeue
      // In production, you might want to send to a dead letter queue
    }
  });

  logger.info('Report.created consumer started successfully');
}
