import axios from 'axios';
import { config } from '../config';
import { logger, rabbitmqClient, ReportCreatedEvent } from '../utils';
import { routingRulesService, RoutingResult } from './routing-rules.service';

class RoutingService {
  // Process a report.created event
  async processReportCreated(event: ReportCreatedEvent): Promise<void> {
    const { reportId, title, category } = event.data;
    const description = event.data.description || '';

    logger.info('Processing report for routing', {
      reportId,
      title,
      category,
    });

    try {
      // Step 1: Determine routing (department + priority)
      const routingResult = await routingRulesService.routeReport(
        reportId,
        title,
        description,
        category
      );

      // Step 2: Update report via internal API
      await this.updateReportDepartment(reportId, routingResult);

      // Step 3: Publish routing.completed event
      await rabbitmqClient.publishRoutingCompleted({
        reportId,
        departmentId: routingResult.departmentId,
        departmentCode: routingResult.departmentCode,
        departmentName: routingResult.departmentName,
        priority: routingResult.priority,
        routingReason: routingResult.routingReason,
      });

      logger.info('Report routing completed', {
        reportId,
        departmentCode: routingResult.departmentCode,
        priority: routingResult.priority,
      });
    } catch (error) {
      logger.error('Failed to route report', { error, reportId });
      throw error;
    }
  }

  // Update report department via internal API
  private async updateReportDepartment(
    reportId: string,
    routingResult: RoutingResult
  ): Promise<void> {
    try {
      const response = await axios.patch(
        `${config.reportServiceUrl}/api/v1/internal/reports/${reportId}/assign-department`,
        {
          departmentId: routingResult.departmentId,
          priority: routingResult.priority,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status !== 200) {
        throw new Error(`Failed to update report: ${response.status}`);
      }

      logger.info('Report department updated via internal API', {
        reportId,
        departmentId: routingResult.departmentId,
      });
    } catch (error) {
      logger.error('Failed to update report department', { error, reportId });
      throw error;
    }
  }
}

export const routingService = new RoutingService();
export default routingService;
