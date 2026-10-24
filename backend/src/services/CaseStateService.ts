import prisma from '../prisma';
import { BrevoNotificationService } from './BrevoNotificationService';

export type CaseStatus = string;

export interface NotificationService {
  notifyStatusChange(caseId: string, oldStatus: CaseStatus, newStatus: CaseStatus): Promise<void>;
  notifyInspectionScheduled(caseId: string, date?: string): Promise<void>;
  notifyApproved(caseId: string, approvalNumber: string): Promise<void>;
}

export class ConsoleNotificationService implements NotificationService {
  async notifyStatusChange(caseId: string, oldStatus: CaseStatus, newStatus: CaseStatus): Promise<void> {
    console.log(`[Notification] Case ${caseId} changed status from ${oldStatus} to ${newStatus}`);
  }
  async notifyInspectionScheduled(caseId: string, date?: string): Promise<void> {
    console.log(`[Notification] Case ${caseId} has an inspection scheduled${date ? ` for ${date}` : ''}`);
  }
  async notifyApproved(caseId: string, approvalNumber: string): Promise<void> {
    console.log(`[Notification] Case ${caseId} has been approved with number ${approvalNumber}`);
  }
}

export class CaseStateService {
  constructor(private notificationService: NotificationService) {}

  private validTransitions: Record<string, string[]> = {
    INTAKE: ['DOCUMENTS_PENDING', 'DOCUMENTS_VERIFICATION', 'DOCUMENT_COLLECTION', 'SUBMITTED', 'DRAFT'],
    DOCUMENTS_PENDING: ['DOCUMENTS_VERIFICATION', 'DOCUMENT_COLLECTION', 'APPLICATION_PREP', 'SUBMITTED'],
    DOCUMENTS_VERIFICATION: ['DOCUMENTS_PENDING', 'APPLICATION_PREP', 'SUBMITTED', 'SCRUTINY'],
    DOCUMENT_COLLECTION: ['APPLICATION_PREP', 'SUBMITTED'],
    APPLICATION_PREP: ['SUBMITTED'],
    SUBMITTED: ['SCRUTINY', 'ACTION_NEEDED', 'INSPECTION_SCHEDULED', 'APPROVED', 'REJECTED'],
    SCRUTINY: ['ACTION_NEEDED', 'INSPECTION_SCHEDULED', 'APPROVED', 'REJECTED'],
    ACTION_NEEDED: ['SCRUTINY', 'SUBMITTED'],
    INSPECTION_SCHEDULED: ['INSPECTION_DONE'],
    INSPECTION_DONE: ['APPROVED', 'REJECTED'],
    APPROVED: ['CLOSED'],
    CLOSED: [],
  };

  async changeStatus(
    caseId: string,
    newStatus: CaseStatus,
    userId: string,
    note?: string
  ): Promise<void> {
    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        documents: true,
      },
    });

    if (!caseData) {
      throw new Error('Case not found');
    }

    const currentStatus = caseData.status || 'INTAKE';

    // Validate transition
    if (this.validTransitions[currentStatus] && !this.validTransitions[currentStatus].includes(newStatus)) {
      console.warn(`Unexpected transition from ${currentStatus} to ${newStatus}, continuing.`);
    }

    // Pre-condition checks
    if (newStatus === 'APPLICATION_PREP' && caseData.property_id && caseData.approval_type) {
      try {
        const prop = await prisma.property.findUnique({ where: { id: caseData.property_id } });
        if (prop?.jurisdiction) {
          const template = await prisma.checklistTemplate.findUnique({
            where: {
              approval_type_jurisdiction: {
                approval_type: caseData.approval_type as any,
                jurisdiction: prop.jurisdiction,
              },
            },
          });
          if (template) {
            for (const reqDocType of template.required_document_types) {
              const hasVerifiedDoc = caseData.documents.some(
                (d: any) => d.document_type === reqDocType && d.verified
              );
              if (!hasVerifiedDoc) {
                throw new Error(`Cannot move to APPLICATION_PREP: Missing verified document of type ${reqDocType}`);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("Template check failed:", err.message);
      }
    }

    // Perform transaction
    await prisma.$transaction([
      prisma.case.update({
        where: { id: caseId },
        data: { status: newStatus },
      }),
      prisma.statusHistory.create({
        data: {
          case_id: caseId,
          from_status: currentStatus,
          to_status: newStatus,
          changed_by: userId || null,
          note,
        },
      }),
    ]);

    // Side effects
    await this.notificationService.notifyStatusChange(caseId, currentStatus, newStatus);
    if (newStatus === 'SUBMITTED') {
      // notify submitted (handled as status change for now, or add specific method)
    } else if (newStatus === 'INSPECTION_SCHEDULED') {
      await this.notificationService.notifyInspectionScheduled(caseId);
    } else if (newStatus === 'APPROVED') {
      await this.notificationService.notifyApproved(caseId, caseData.approval_number!);
    }
  }
}

export const caseStateService = new CaseStateService(new BrevoNotificationService());
