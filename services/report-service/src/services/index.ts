export { reportService } from './report.service';
export type {
  CreateReportInput,
  UpdateReportInput,
  ListReportsQuery,
  ReportWithDetails,
} from './report.service';

export { mediaService } from './media.service';
export type { UploadedMedia } from './media.service';

export { staffService } from './staff.service';
export type {
  UpdateStatusInput,
  AssignReportInput,
  ForwardReportInput,
} from './staff.service';
