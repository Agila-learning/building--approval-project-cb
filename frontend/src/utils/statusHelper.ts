export const getApplicationStatus = (id: string, defaultStatus: string, caseData?: any): string => {
  // Check Rejection
  const savedRejection = localStorage.getItem(`rejection_${id}`);
  if (savedRejection) {
    try {
      if (JSON.parse(savedRejection).isRejected) return 'Rejected';
    } catch (e) {}
  }

  // Check if case has documents uploaded either from local storage or case object
  const savedDocs = localStorage.getItem(`customerDocs_${id}`);
  const docs = savedDocs ? JSON.parse(savedDocs) : [];
  
  // Also check caseData uploadedFiles or documents
  const uploadedFiles = caseData?.uploadedFiles || {};
  const hasUploadedFilesInCase = Object.keys(uploadedFiles).filter(k => !['username', 'password', 'receiptNumber'].includes(k) && Boolean(uploadedFiles[k])).length > 0;
  
  const customerDocIds = ['aadhar', 'pan', 'sale_deed', 'tax_receipt', 'patta', 'ec'];
  const customerDocs = docs.filter((d: any) => customerDocIds.includes(d.id));
  
  // Need Reupload?
  if (customerDocs.some((d: any) => d.status === 'Needs Reupload')) return 'DOCUMENTS_PENDING';

  const hasUploadedDocs = customerDocs.some((d: any) => d.fileName || d.file) || hasUploadedFilesInCase;
  const allCustomerDocsReceived = customerDocs.length > 0 && customerDocs.every((d: any) => d.fileName || d.file || d.status !== 'Missing');
  const allCustomerDocsVerified = customerDocs.length > 0 && customerDocs.every((d: any) => d.status === 'Verified');
  
  const buildingPlan = docs.find((d: any) => d.id === 'building_plan');
  const buildingPlanUploaded = (buildingPlan && buildingPlan.status !== 'Missing') || Boolean(uploadedFiles['BUILDING PLAN']);
  
  const govtTrackingNumber = localStorage.getItem(`tracking_${id}`) || caseData?.linkTracking?.sent;
  
  const siteInspection = docs.find((d: any) => d.id === 'site_inspection_report');
  const siteInspectionUploaded = siteInspection && siteInspection.status !== 'Missing';
  
  const govtApproval = docs.find((d: any) => d.id === 'govt_approval') || Boolean(uploadedFiles['FINAL_APPROVAL']);
  const govtApprovalUploaded = (govtApproval && (typeof govtApproval === 'boolean' || govtApproval.status !== 'Missing'));
  
  if (govtApprovalUploaded) return 'Approved';
  if (siteInspectionUploaded && govtTrackingNumber) return 'Site Inspection';
  if (govtTrackingNumber) return 'Gov Verification';
  if (allCustomerDocsVerified && buildingPlanUploaded) return 'Submitted';
  if (allCustomerDocsVerified) return 'Under Review';
  if (allCustomerDocsReceived) return 'Verification';
  if (hasUploadedDocs) return 'DOCUMENTS_VERIFICATION';

  // If defaultStatus is 'INTAKE', convert to 'DOCUMENTS_PENDING' (or 'DOCUMENTS_VERIFICATION' if docs exist)
  if (!defaultStatus || defaultStatus.toUpperCase() === 'INTAKE') {
    return hasUploadedDocs ? 'DOCUMENTS_VERIFICATION' : 'DOCUMENTS_PENDING';
  }
  
  return defaultStatus;
};
