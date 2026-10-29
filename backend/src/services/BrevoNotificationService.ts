import prisma from '../prisma';
import { CaseStatus, NotificationService } from './CaseStateService';
import nodemailer, { Transporter } from 'nodemailer';

function generateEmailTemplate({
  eyebrow,
  headline,
  customerName,
  bodyParagraphs,
  referenceCard,
  cta
}: {
  eyebrow: string;
  headline: string;
  customerName: string;
  bodyParagraphs: string[];
  referenceCard?: { label: string; value: string }[];
  cta?: { text: string; url: string };
}) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${eyebrow}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #efe9df; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #efe9df;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 20px; background-color: #ffffff;">
              <div style="display: inline-block; background-color: #1c3d2e; color: #ffffff; width: 32px; height: 32px; line-height: 32px; text-align: center; font-weight: bold; font-size: 20px; border-radius: 4px; margin-bottom: 10px;">B</div>
              <div style="color: #1c3d2e; font-size: 24px; font-weight: bold; letter-spacing: 1px;">CB BUILDING APPROVALS</div>
              <div style="color: #8a8578; font-size: 12px; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px;">Building Approval & Documentation</div>
            </td>
          </tr>
          
          <!-- Hero Strip -->
          <tr>
            <td align="center" style="padding: 40px 30px; background-color: #1c3d2e;">
              <div style="color: #c96f4a; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px;">${eyebrow}</div>
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; line-height: 1.3;">${headline}</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              <p style="color: #1c3d2e; font-size: 18px; font-weight: bold; margin-top: 0; margin-bottom: 20px;">Hello ${customerName},</p>
              
              ${bodyParagraphs.map(p => `<p style="color: #5c5a52; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px;">${p}</p>`).join('')}
              
              ${referenceCard && referenceCard.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f4ec; border-radius: 6px; margin-top: 30px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    ${referenceCard.map(item => `
                    <div style="margin-bottom: 10px;">
                      <span style="color: #8a8578; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">${item.label}</span>
                      <strong style="color: #1c3d2e; font-size: 16px;">${item.value}</strong>
                    </div>
                    `).join('')}
                  </td>
                </tr>
              </table>
              ` : ''}
              
              ${cta ? `
              <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
                <a href="${cta.url}" style="display: inline-block; background-color: #c96f4a; color: #ffffff; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 4px;">${cta.text}</a>
              </div>
              ` : ''}
              
              <p style="color: #1c3d2e; font-size: 16px; margin-top: 40px; margin-bottom: 0;">Best regards,<br><strong>The CB Building Approvals Team</strong></p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 30px; background-color: #f7f4ec; border-top: 1px solid #ece6da;">
              <p style="color: #8a8578; font-size: 12px; line-height: 1.5; margin-top: 0; margin-bottom: 10px;">
                This is an automated message, please do not reply to this email. If you need assistance, please contact our support team.
              </p>
              <p style="margin: 0;">
                <a href="#" style="color: #8a8578; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export class BrevoNotificationService implements NotificationService {
  private apiKey: string;
  private sender: { name: string; email: string };
  private transporter: Transporter | null = null;

  constructor() {
    this.apiKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || '';
    this.sender = { 
      name: process.env.BREVO_SENDER_NAME || 'CB Builders', 
      email: process.env.BREVO_SENDER_EMAIL || 'cbbuilders2026@gmail.com' 
    };

    const smtpHost = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
    const smtpUser = process.env.BREVO_SMTP_LOGIN || 'c07bc4001@smtp-brevo.com';
    const smtpPass = process.env.BREVO_SMTP_KEY || process.env.BREVO_API_KEY || '';

    if (smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  public async verifyConnection(): Promise<{ success: boolean; message: string }> {
    if (this.transporter) {
      try {
        await this.transporter.verify();
        return { success: true, message: 'Brevo SMTP Relay connected successfully' };
      } catch (err: any) {
        return { success: false, message: `Brevo SMTP verification failed: ${err.message}` };
      }
    }
    return { success: false, message: 'Brevo transporter not configured' };
  }

  private async sendEmail(toEmail: string, toName: string, subject: string, htmlContent: string) {
    try {
      // 1. Try Brevo SMTP relay via nodemailer
      if (this.transporter) {
        const info = await this.transporter.sendMail({
          from: `"${this.sender.name}" <${this.sender.email}>`,
          to: `"${toName}" <${toEmail}>`,
          subject: subject,
          html: htmlContent,
        });
        console.log(`[Brevo SMTP] Email "${subject}" sent to ${toEmail} (ID: ${info.messageId})`);
        return;
      }

      // 2. Fallback to Brevo REST API (only if xkeysib key is used)
      if (this.apiKey) {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: this.sender,
            to: [{ email: toEmail, name: toName }],
            subject: subject,
            htmlContent: htmlContent
          })
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('Brevo API Error:', error);
        } else {
          console.log(`[Brevo REST] Email "${subject}" sent to ${toEmail}`);
        }
      }
    } catch (error) {
      console.error('Failed to send email via Brevo:', error);
    }
  }

  private async getCustomerDetails(caseId: string) {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        property: true
      }
    });

    if (!caseData || !caseData.property) return null;

    // Look up the customer User by the property's owner_phone
    const customer = await prisma.user.findUnique({
      where: { phone: caseData.property.owner_phone }
    });

    return { caseData, customer };
  }

  async notifyStatusChange(caseId: string, oldStatus: CaseStatus, newStatus: CaseStatus): Promise<void> {
    const result = await this.getCustomerDetails(caseId);
    if (!result || !result.customer || !result.customer.email) return;

    const { caseData, customer } = result;

    const subject = `Update on your Building Application (${caseId.substring(0,8)})`;
    const htmlContent = generateEmailTemplate({
      eyebrow: 'Status Update',
      headline: 'Your Application. Now Moving Forward.',
      customerName: customer.name,
      bodyParagraphs: [
        'The status of your building application has officially advanced. Our team is actively processing your documents and ensuring everything aligns with government requirements.'
      ],
      referenceCard: [
        { label: 'Application ID', value: caseId.substring(0,8) },
        { label: 'Property Address', value: caseData.property?.address || 'N/A' },
        { label: 'Previous Status', value: oldStatus.replace(/_/g, ' ') },
        { label: 'Current Status', value: newStatus.replace(/_/g, ' ') }
      ],
      cta: {
        text: 'Track Application Status',
        url: 'https://building-approval.vercel.app/track-application'
      }
    });

    await this.sendEmail(customer.email as string, customer.name, subject, htmlContent);
  }

  async notifyInspectionScheduled(caseId: string, date?: string): Promise<void> {
    const result = await this.getCustomerDetails(caseId);
    if (!result || !result.customer || !result.customer.email) return;

    const { caseData, customer } = result;

    const subject = `Inspection Scheduled - Application (${caseId.substring(0,8)})`;
    const htmlContent = generateEmailTemplate({
      eyebrow: 'Inspection Scheduled',
      headline: 'Site Verification. Ready to Proceed.',
      customerName: customer.name,
      bodyParagraphs: [
        'An official inspection has been scheduled for your property. This is a critical step in verifying your structural and boundary details for government approval.',
        'Please ensure that you or an authorized representative are available at the site during the inspection to facilitate the process.'
      ],
      referenceCard: [
        { label: 'Application ID', value: caseId.substring(0,8) },
        { label: 'Property Address', value: caseData.property?.address || 'N/A' },
        ...(date ? [{ label: 'Scheduled Date', value: date }] : [])
      ],
      cta: {
        text: 'View Inspection Details',
        url: 'https://building-approval.vercel.app/track-application'
      }
    });

    await this.sendEmail(customer.email as string, customer.name, subject, htmlContent);
  }

  async notifyApproved(caseId: string, approvalNumber: string): Promise<void> {
    const result = await this.getCustomerDetails(caseId);
    if (!result || !result.customer || !result.customer.email) return;

    const { caseData, customer } = result;

    const subject = `Congratulations! Your Application is Approved (${caseId.substring(0,8)})`;
    const htmlContent = generateEmailTemplate({
      eyebrow: 'Application Approved',
      headline: 'Your Building. Officially Approved.',
      customerName: customer.name,
      bodyParagraphs: [
        'We are thrilled to inform you that your building application has been successfully processed and officially approved by the government authorities.',
        'Your official documents and structural approval certificates are now ready for secure download.'
      ],
      referenceCard: [
        { label: 'Application ID', value: caseId.substring(0,8) },
        { label: 'Property Address', value: caseData.property?.address || 'N/A' },
        { label: 'Official Approval No.', value: approvalNumber }
      ],
      cta: {
        text: 'Download Approval Documents',
        url: 'https://building-approval.vercel.app/track-application'
      }
    });

    await this.sendEmail(customer.email as string, customer.name, subject, htmlContent);
  }

  async notifyLeadThanks(email: string, name: string): Promise<void> {
    const subject = `We received your enquiry - CB Building Approvals`;
    const htmlContent = generateEmailTemplate({
      eyebrow: 'Enquiry Received',
      headline: 'Your Project. Our Priority.',
      customerName: name,
      bodyParagraphs: [
        'Thank you for reaching out to CB Building Approvals. We have successfully received your enquiry regarding building approval and documentation.',
        'One of our expert consultants will review your details and get in touch with you shortly to discuss your project requirements.'
      ],
      cta: {
        text: 'Explore Our Services',
        url: 'https://building-approval.vercel.app/#services'
      }
    });
    await this.sendEmail(email, name, subject, htmlContent);
  }

  async notifyUploadLink(email: string, name: string, uploadLink: string): Promise<void> {
    const subject = `Document Upload Required - CB Building Approvals`;
    const htmlContent = generateEmailTemplate({
      eyebrow: 'Action Required',
      headline: 'Missing Documents. Upload Needed.',
      customerName: name,
      bodyParagraphs: [
        'To continue processing your building application smoothly, we require a few additional documents from your side.',
        'Please use the secure link below to upload the requested files directly to your application file.'
      ],
      cta: {
        text: 'Upload Documents Securely',
        url: uploadLink
      }
    });
    await this.sendEmail(email, name, subject, htmlContent);
  }
}
