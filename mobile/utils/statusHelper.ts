/**
 * Synchronized status calculation matching frontend/src/utils/statusHelper.ts exactly.
 */
export const getApplicationStatus = (id: string, defaultStatus?: string, caseData?: any): string => {
  if (!id && !defaultStatus && !caseData) return 'DOCUMENTS PENDING';

  // Check Rejection
  const normDefault = (defaultStatus || '').toUpperCase().trim();
  if (normDefault.includes('REJECT')) {
    return 'Rejected';
  }

  // Also check caseData uploadedFiles or documents
  const uploadedFiles = caseData?.uploadedFiles || {};
  const hasUploadedFilesInCase = Object.keys(uploadedFiles).filter(
    (k) => !['username', 'password', 'receiptNumber'].includes(k) && Boolean(uploadedFiles[k])
  ).length > 0;

  const docs = Array.isArray(caseData?.documents) ? caseData.documents : [];
  const hasDocsArray = docs.length > 0;
  const hasUploadedDocs = hasUploadedFilesInCase || hasDocsArray;

  const govtApprovalUploaded = Boolean(
    uploadedFiles['GOVT APPROVAL'] ||
    uploadedFiles['APPROVAL ORDER'] ||
    uploadedFiles['govt_approval'] ||
    docs.some((d: any) => (d.name || d.id || '').toUpperCase().includes('APPROVAL'))
  );

  // Check Final Approval Completion from stage data or status
  const stages = caseData?.fullData?.stages || caseData?.stages || [];
  const isFinalStageDone =
    (stages.length >= 5 && stages[4]?.status === 'Completed') ||
    (Array.isArray(stages) && stages.length > 0 && stages.every((s: any) => s.status === 'Completed'));

  if (
    normDefault === 'FINALLY APPROVED' ||
    normDefault === 'FINAL APPROVAL' ||
    normDefault === 'APPROVED' ||
    normDefault === 'COMPLETED' ||
    isFinalStageDone ||
    govtApprovalUploaded
  ) {
    return 'Finally Approved';
  }

  const govtTrackingNumber = caseData?.linkTracking?.sent || caseData?.fullData?.trackingNumber;
  if (govtTrackingNumber) {
    return 'Gov Verification';
  }

  if (normDefault === 'SITE_INSPECTION' || normDefault === 'SITE INSPECTION') {
    return 'Site Inspection';
  }

  if (normDefault === 'SUBMITTED' || normDefault === 'SUBMITTED_TO_GOVT') {
    return 'Submitted';
  }

  if (normDefault === 'UNDER_REVIEW' || normDefault === 'UNDER REVIEW') {
    return 'Under Review';
  }

  if (normDefault === 'DOCUMENTS_VERIFICATION' || normDefault === 'VERIFICATION') {
    return 'DOCUMENTS VERIFICATION';
  }

  // If status is INTAKE, NEW, or empty
  if (!defaultStatus || normDefault === 'INTAKE' || normDefault === 'NEW') {
    return hasUploadedDocs ? 'DOCUMENTS VERIFICATION' : 'DOCUMENTS PENDING';
  }

  return defaultStatus;
};

