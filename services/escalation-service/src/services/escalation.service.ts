import axios from 'axios';
import { prisma, ReportStatus } from '@lapor-pakdhe/prisma-client';
import { config } from '../config';
import { logger, rabbitmqClient } from '../utils';

interface EscalationResult {
  reportId: string;
  referenceNumber: string;
  oldLevel: number;
  newLevel: number;
  success: boolean;
  error?: string;
}

class EscalationService {
  // Check all reports for SLA violations and escalate if needed
  async checkAndEscalate(): Promise<EscalationResult[]> {
    const results: EscalationResult[] = [];
    const now = new Date();

    logger.info('Starting escalation check', { timestamp: now.toISOString() });

    try {
      // Find all reports that:
      // 1. Have passed their SLA deadline
      // 2. Are not in final states (RESOLVED, REJECTED, CLOSED)
      // 3. Have not reached max escalation level
      const reportsToEscalate = await prisma.report.findMany({
        where: {
          slaDeadline: { lt: now },
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
          escalationLevel: { lt: config.sla.maxEscalationLevel },
        },
        include: {
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      });

      logger.info(`Found ${reportsToEscalate.length} reports to escalate`);

      for (const report of reportsToEscalate) {
        const result = await this.escalateReport(report);
        results.push(result);
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      logger.info('Escalation check completed', {
        total: reportsToEscalate.length,
        success: successCount,
        failed: failCount,
      });

      return results;
    } catch (error) {
      logger.error('Error during escalation check', { error });
      throw error;
    }
  }

  // Escalate a single report
  private async escalateReport(report: any): Promise<EscalationResult> {
    const oldLevel = report.escalationLevel;
    const newLevel = oldLevel + 1;

    try {
      // Calculate new SLA deadline based on new level
      const newDeadline = this.calculateNewDeadline(newLevel);

      // Call report-service internal API to escalate
      await axios.patch(
        `${config.reportServiceUrl}/api/v1/internal/reports/${report.id}/escalate`,
        {
          escalationLevel: newLevel,
          notes: `Eskalasi otomatis dari level ${oldLevel} ke level ${newLevel} karena melewati batas waktu SLA.`,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      // Update SLA deadline in database
      await prisma.report.update({
        where: { id: report.id },
        data: {
          slaDeadline: newDeadline,
        },
      });

      // Publish escalation event
      await rabbitmqClient.publishReportEscalated({
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        title: report.title,
        category: report.category,
        type: report.type,
        status: report.status,
        priority: report.priority,
        escalationLevel: newLevel,
        previousLevel: oldLevel,
        departmentId: report.departmentId,
        reporterId: report.reporterId,
        reason: 'SLA deadline exceeded',
      });

      logger.info('Report escalated successfully', {
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        oldLevel,
        newLevel,
      });

      return {
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        oldLevel,
        newLevel,
        success: true,
      };
    } catch (error: any) {
      logger.error('Failed to escalate report', {
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        error: error.message,
      });

      return {
        reportId: report.id,
        referenceNumber: report.referenceNumber,
        oldLevel,
        newLevel,
        success: false,
        error: error.message,
      };
    }
  }

  // Calculate new SLA deadline based on escalation level
  private calculateNewDeadline(level: number): Date {
    const hours = level === 1 ? config.sla.level1Hours : config.sla.level2Hours;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  // Get escalation statistics
  async getEscalationStats(): Promise<{
    pendingEscalation: number;
    escalatedToday: number;
    byLevel: Record<number, number>;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [pendingEscalation, escalatedToday, byLevel] = await Promise.all([
      // Reports that will be escalated soon (within 1 hour of SLA deadline)
      prisma.report.count({
        where: {
          slaDeadline: {
            gte: now,
            lte: new Date(now.getTime() + 60 * 60 * 1000),
          },
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
        },
      }),
      // Reports escalated today
      prisma.report.count({
        where: {
          lastEscalatedAt: { gte: startOfDay },
        },
      }),
      // Count by escalation level
      prisma.report.groupBy({
        by: ['escalationLevel'],
        where: {
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
        },
        _count: true,
      }),
    ]);

    const levelCounts: Record<number, number> = {};
    for (const item of byLevel) {
      levelCounts[item.escalationLevel] = item._count;
    }

    return {
      pendingEscalation,
      escalatedToday,
      byLevel: levelCounts,
    };
  }

  // Generate hourly escalation report
  async generateHourlyReport(): Promise<{
    timestamp: Date;
    summary: {
      totalActive: number;
      pendingEscalation: number;
      escalatedLastHour: number;
      criticalReports: number;
    };
    byDepartment: Array<{
      departmentId: string;
      departmentName: string;
      activeCount: number;
      escalatedCount: number;
      avgEscalationLevel: number;
    }>;
    criticalReports: Array<{
      reportId: string;
      referenceNumber: string;
      title: string;
      escalationLevel: number;
      hoursOverdue: number;
    }>;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    logger.info('Generating hourly escalation report', { timestamp: now.toISOString() });

    try {
      // Get total active reports (not resolved, rejected, or closed)
      const totalActive = await prisma.report.count({
        where: {
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
        },
      });

      // Get reports pending escalation (SLA deadline approaching within 1 hour)
      const pendingEscalation = await prisma.report.count({
        where: {
          slaDeadline: {
            gte: now,
            lte: new Date(now.getTime() + 60 * 60 * 1000),
          },
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
          escalationLevel: { lt: config.sla.maxEscalationLevel },
        },
      });

      // Get reports escalated in the last hour
      const escalatedLastHour = await prisma.report.count({
        where: {
          lastEscalatedAt: { gte: oneHourAgo },
        },
      });

      // Get critical reports (escalation level >= 2 and overdue)
      const criticalReportsData = await prisma.report.findMany({
        where: {
          escalationLevel: { gte: 2 },
          slaDeadline: { lt: now },
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
        },
        select: {
          id: true,
          referenceNumber: true,
          title: true,
          escalationLevel: true,
          slaDeadline: true,
        },
        orderBy: { escalationLevel: 'desc' },
        take: 10,
      });

      const criticalReports = criticalReportsData.map((r) => ({
        reportId: r.id,
        referenceNumber: r.referenceNumber,
        title: r.title,
        escalationLevel: r.escalationLevel,
        hoursOverdue: r.slaDeadline
          ? Math.round((now.getTime() - r.slaDeadline.getTime()) / (60 * 60 * 1000))
          : 0,
      }));

      // Get stats by department
      const departmentStats = await prisma.report.groupBy({
        by: ['departmentId'],
        where: {
          departmentId: { not: null },
          status: {
            notIn: [ReportStatus.RESOLVED, ReportStatus.REJECTED, ReportStatus.CLOSED],
          },
        },
        _count: true,
        _avg: { escalationLevel: true },
      });

      // Get escalated counts by department
      const escalatedByDept = await prisma.report.groupBy({
        by: ['departmentId'],
        where: {
          departmentId: { not: null },
          status: ReportStatus.ESCALATED,
        },
        _count: true,
      });

      const escalatedMap = new Map(
        escalatedByDept.map((d) => [d.departmentId, d._count])
      );

      // Get department names
      const departmentIds = departmentStats
        .map((d) => d.departmentId)
        .filter((id): id is string => id !== null);

      const departments = await prisma.department.findMany({
        where: { id: { in: departmentIds } },
        select: { id: true, name: true },
      });

      const deptNameMap = new Map(departments.map((d) => [d.id, d.name]));

      const byDepartment = departmentStats
        .filter((d) => d.departmentId !== null)
        .map((d) => ({
          departmentId: d.departmentId!,
          departmentName: deptNameMap.get(d.departmentId!) || 'Unknown',
          activeCount: d._count,
          escalatedCount: escalatedMap.get(d.departmentId!) || 0,
          avgEscalationLevel: Math.round((d._avg.escalationLevel || 1) * 10) / 10,
        }))
        .sort((a, b) => b.escalatedCount - a.escalatedCount);

      const report = {
        timestamp: now,
        summary: {
          totalActive,
          pendingEscalation,
          escalatedLastHour,
          criticalReports: criticalReports.length,
        },
        byDepartment,
        criticalReports,
      };

      logger.info('Hourly escalation report generated', {
        timestamp: now.toISOString(),
        totalActive,
        pendingEscalation,
        escalatedLastHour,
        criticalCount: criticalReports.length,
      });

      return report;
    } catch (error) {
      logger.error('Failed to generate hourly report', { error });
      throw error;
    }
  }
}

export const escalationService = new EscalationService();
export default escalationService;
