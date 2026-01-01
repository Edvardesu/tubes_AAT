import cron from 'node-cron';
import { config } from '../config';
import { logger } from '../utils';
import { escalationService } from '../services';

let isEscalationRunning = false;
let isReportRunning = false;

export function startEscalationJob(): void {
  logger.info('Starting escalation cron jobs', {
    escalationSchedule: config.escalationCheckCron,
    reportSchedule: config.escalationReportCron,
  });

  // Escalation check job - every 5 minutes
  cron.schedule(config.escalationCheckCron, async () => {
    // Prevent overlapping runs
    if (isEscalationRunning) {
      logger.warn('Escalation check already running, skipping...');
      return;
    }

    isEscalationRunning = true;

    try {
      const results = await escalationService.checkAndEscalate();

      if (results.length > 0) {
        const success = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        logger.info('Escalation job completed', {
          processed: results.length,
          success,
          failed,
        });
      }
    } catch (error) {
      logger.error('Escalation job failed', { error });
    } finally {
      isEscalationRunning = false;
    }
  });

  // Hourly report job - every hour
  cron.schedule(config.escalationReportCron, async () => {
    // Prevent overlapping runs
    if (isReportRunning) {
      logger.warn('Escalation report already running, skipping...');
      return;
    }

    isReportRunning = true;

    try {
      const report = await escalationService.generateHourlyReport();

      logger.info('Hourly escalation report completed', {
        timestamp: report.timestamp.toISOString(),
        totalActive: report.summary.totalActive,
        pendingEscalation: report.summary.pendingEscalation,
        escalatedLastHour: report.summary.escalatedLastHour,
        criticalReports: report.summary.criticalReports,
        departmentsWithIssues: report.byDepartment.filter((d) => d.escalatedCount > 0).length,
      });

      // Log critical reports if any
      if (report.criticalReports.length > 0) {
        logger.warn('Critical reports requiring attention:', {
          count: report.criticalReports.length,
          reports: report.criticalReports.map((r) => ({
            ref: r.referenceNumber,
            level: r.escalationLevel,
            overdue: `${r.hoursOverdue}h`,
          })),
        });
      }
    } catch (error) {
      logger.error('Hourly report job failed', { error });
    } finally {
      isReportRunning = false;
    }
  });

  logger.info('Escalation cron jobs started');
}

export function stopEscalationJob(): void {
  // Note: node-cron doesn't provide a built-in way to stop specific jobs
  // In a production environment, you'd want to track the scheduled task
  // and call task.stop()
  logger.info('Escalation cron jobs stopping...');
}
