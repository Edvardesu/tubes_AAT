import { config } from '../config';
import { logger } from '../utils';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Email templates
const EMAIL_TEMPLATES = {
  REPORT_CREATED: (data: { title: string; referenceNumber: string; userName?: string }) => ({
    subject: `[Lapor Pakdhe] Laporan Baru: ${data.referenceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Lapor Pakdhe</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Laporan Baru Diterima</h2>
          ${data.userName ? `<p>Halo ${data.userName},</p>` : ''}
          <p>Laporan baru telah dibuat dengan detail:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nomor Referensi:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Judul:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Laporan akan segera diproses oleh tim kami.</p>
        </div>
        <div style="padding: 15px; background: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; 2024 Lapor Pakdhe - Sistem Pelaporan Warga</p>
        </div>
      </div>
    `,
    text: `Lapor Pakdhe - Laporan Baru\n\nNomor Referensi: ${data.referenceNumber}\nJudul: ${data.title}\n\nLaporan akan segera diproses.`,
  }),

  STATUS_UPDATED: (data: { title: string; referenceNumber: string; oldStatus: string; newStatus: string; userName?: string }) => ({
    subject: `[Lapor Pakdhe] Status Laporan Berubah: ${data.referenceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Lapor Pakdhe</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Status Laporan Berubah</h2>
          ${data.userName ? `<p>Halo ${data.userName},</p>` : ''}
          <p>Status laporan Anda telah diperbarui:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nomor Referensi:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Judul:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status Lama:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.oldStatus}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Status Baru:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: bold;">${data.newStatus}</td>
            </tr>
          </table>
        </div>
        <div style="padding: 15px; background: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; 2024 Lapor Pakdhe - Sistem Pelaporan Warga</p>
        </div>
      </div>
    `,
    text: `Lapor Pakdhe - Status Laporan Berubah\n\nNomor: ${data.referenceNumber}\nJudul: ${data.title}\nStatus: ${data.oldStatus} → ${data.newStatus}`,
  }),

  REPORT_ASSIGNED: (data: { title: string; referenceNumber: string; userName?: string }) => ({
    subject: `[Lapor Pakdhe] Anda Ditugaskan: ${data.referenceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Lapor Pakdhe</h1>
        </div>
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Penugasan Baru</h2>
          ${data.userName ? `<p>Halo ${data.userName},</p>` : ''}
          <p>Anda telah ditugaskan untuk menangani laporan berikut:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nomor Referensi:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Judul:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${data.title}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Mohon segera ditindaklanjuti.</p>
        </div>
        <div style="padding: 15px; background: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; 2024 Lapor Pakdhe - Sistem Pelaporan Warga</p>
        </div>
      </div>
    `,
    text: `Lapor Pakdhe - Penugasan Baru\n\nAnda ditugaskan untuk menangani:\nNomor: ${data.referenceNumber}\nJudul: ${data.title}`,
  }),

  REPORT_ESCALATED: (data: { title: string; referenceNumber: string; escalationLevel: number; userName?: string }) => ({
    subject: `[URGENT] Laporan Dieskalasi: ${data.referenceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Lapor Pakdhe - ESKALASI</h1>
        </div>
        <div style="padding: 20px; background: #fef2f2;">
          <h2 style="color: #dc2626;">Laporan Dieskalasi ke Level ${data.escalationLevel}</h2>
          ${data.userName ? `<p>Halo ${data.userName},</p>` : ''}
          <p>Laporan berikut telah dieskalasi karena melewati batas waktu SLA:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Nomor Referensi:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${data.referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Judul:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fecaca;">${data.title}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #fecaca;"><strong>Level Eskalasi:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #fecaca; color: #dc2626; font-weight: bold;">Level ${data.escalationLevel}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; color: #dc2626; font-weight: bold;">Mohon segera ditangani!</p>
        </div>
        <div style="padding: 15px; background: #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; 2024 Lapor Pakdhe - Sistem Pelaporan Warga</p>
        </div>
      </div>
    `,
    text: `[URGENT] Lapor Pakdhe - Eskalasi Level ${data.escalationLevel}\n\nNomor: ${data.referenceNumber}\nJudul: ${data.title}\n\nMohon segera ditangani!`,
  }),
};

class EmailService {
  // Send email (mock mode logs instead of sending)
  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    const { to, subject, html, text } = options;

    if (config.smtp.mockMode) {
      // Mock mode - just log the email
      const mockMessageId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      logger.info('📧 [MOCK EMAIL] Email would be sent:', {
        messageId: mockMessageId,
        to,
        subject,
        from: config.smtp.from,
        preview: text?.substring(0, 100) || html.substring(0, 100),
      });

      return {
        success: true,
        messageId: mockMessageId,
      };
    }

    // Real email sending would go here using nodemailer
    // For PoC, we'll just use mock mode
    try {
      // In production, use nodemailer:
      // const transporter = nodemailer.createTransport({...});
      // const info = await transporter.sendMail({...});

      logger.warn('Real email sending not implemented, using mock mode');
      return {
        success: true,
        messageId: `mock-${Date.now()}`,
      };
    } catch (error: any) {
      logger.error('Failed to send email', { error: error.message, to, subject });
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Send report created notification email
  async sendReportCreatedEmail(
    to: string,
    data: { title: string; referenceNumber: string; userName?: string }
  ): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.REPORT_CREATED(data);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send status updated notification email
  async sendStatusUpdatedEmail(
    to: string,
    data: { title: string; referenceNumber: string; oldStatus: string; newStatus: string; userName?: string }
  ): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.STATUS_UPDATED(data);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send report assigned notification email
  async sendReportAssignedEmail(
    to: string,
    data: { title: string; referenceNumber: string; userName?: string }
  ): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.REPORT_ASSIGNED(data);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send report escalated notification email
  async sendReportEscalatedEmail(
    to: string,
    data: { title: string; referenceNumber: string; escalationLevel: number; userName?: string }
  ): Promise<EmailResult> {
    const template = EMAIL_TEMPLATES.REPORT_ESCALATED(data);
    return this.sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }
}

export const emailService = new EmailService();
export default emailService;
