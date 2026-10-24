import React from 'react';

type BadgeType = 'status' | 'priority' | 'payment';

interface StatusBadgeProps {
  type: BadgeType;
  value: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value }) => {
  let bgColor = '#f1f5f9';
  let color = '#64748b';

  let formattedValue = value;
  if (type === 'status') {
    const s = value ? value.toUpperCase().replace(/\s+/g, '_') : '';
    switch (s) {
      case 'NEW':
      case 'INTAKE':
      case 'DOCUMENTS_PENDING':
      case 'PENDING_DOCUMENTS':
      case 'DOCUMENT_COLLECTION':
        bgColor = '#fef3c7'; color = 'var(--warning-gold)'; 
        formattedValue = 'DOCUMENTS PENDING';
        break;
      case 'DOCUMENTS_VERIFICATION':
      case 'VERIFICATION':
      case 'GOV_VERIFICATION':
      case 'UNDER_REVIEW':
        bgColor = '#eff6ff'; color = 'var(--primary)'; 
        if (s === 'DOCUMENTS_VERIFICATION') formattedValue = 'DOCUMENTS VERIFICATION';
        else formattedValue = value.replace(/_/g, ' ');
        break;
      case 'ACTION_REQUIRED':
      case 'ACTION_NEEDED':
        bgColor = '#fef3c7'; color = 'var(--warning-gold)'; 
        formattedValue = value.replace(/_/g, ' ');
        break;
      case 'SITE_INSPECTION':
        bgColor = '#ffedd5'; color = 'var(--accent)'; 
        formattedValue = value.replace(/_/g, ' ');
        break;
      case 'SUBMITTED':
        bgColor = '#f3e8ff'; color = '#7e22ce'; 
        formattedValue = value.replace(/_/g, ' ');
        break;
      case 'APPROVAL_PENDING':
        bgColor = '#fef08a'; color = 'var(--warning-gold)'; 
        formattedValue = value.replace(/_/g, ' ');
        break;
      case 'APPROVED':
      case 'COMPLETED':
        bgColor = 'rgba(34, 160, 107, 0.1)'; color = 'var(--success-green)'; 
        formattedValue = value.replace(/_/g, ' ');
        break;
      case 'REJECTED':
        bgColor = '#fee2e2'; color = 'var(--error-red)'; 
        formattedValue = value.replace(/_/g, ' ');
        break;
      default:
        formattedValue = value ? value.replace(/_/g, ' ') : '';
        break;
    }
  } else if (type === 'priority') {
    switch (value.toLowerCase()) {
      case 'high':
        bgColor = '#fee2e2'; color = 'var(--error-red)'; break;
      case 'medium':
        bgColor = '#fef3c7'; color = 'var(--warning-gold)'; break;
      case 'low':
        bgColor = 'rgba(34, 160, 107, 0.1)'; color = 'var(--success-green)'; break;
    }
  } else if (type === 'payment') {
    switch (value.toLowerCase()) {
      case 'paid':
        bgColor = 'rgba(34, 160, 107, 0.1)'; color = 'var(--success-green)'; break;
      case 'partial':
      case 'pending':
        bgColor = '#fef3c7'; color = 'var(--warning-gold)'; break;
    }
  }

  return (
    <span style={{ 
      padding: '0.25rem 0.75rem', 
      borderRadius: '1rem', 
      backgroundColor: bgColor, 
      color: color, 
      fontSize: '0.75rem', 
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      whiteSpace: 'nowrap'
    }}>
      {formattedValue}
    </span>
  );
};

export default StatusBadge;
