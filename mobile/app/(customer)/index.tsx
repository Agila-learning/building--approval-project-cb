import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../contexts/AuthContext';
import { Case } from '../../types';

export interface StageItem {
  name: string;
  key: string;
  status: 'Completed' | 'In Progress' | 'Pending';
  startedDate?: string | null;
  completedDate?: string | null;
  remarks?: string;
  responsiblePerson?: string;
  description?: string;
}

const OFFICIAL_STAGES: { key: string; name: string; description: string }[] = [
  { key: 'stage_submitted', name: 'Application Submitted', description: 'Application registered, reviewed by Admin and assigned to worker coordinator.' },
  { key: 'stage_doc_completed', name: 'Document Completed', description: 'Document upload via secure link, worker verification, and official Admin document approval.' },
  { key: 'stage_payment', name: 'Payment', description: 'Statutory fees calculation, customer payment completion, and official receipt confirmation.' },
  { key: 'stage_site_visit', name: 'Site Visit Completed', description: 'Authorized field officer site visit, physical boundary inspection, and geo-verification.' },
  { key: 'stage_final_approval', name: 'Finally Approved', description: 'Executive planning authority final scrutiny, sanction order sanctioned, and completion certificate dispatched.' },
];

const STATUS_TO_STAGE_INDEX: Record<string, number> = {
  'DRAFT': 0,
  'NEW': 0,
  'APPLICATION SUBMITTED': 0,
  'SUBMITTED': 0,
  'INTAKE': 0,
  'DOCUMENT COMPLETED': 1,
  'DOCUMENTS COMPLETED': 1,
  'DOCUMENT VERIFICATION': 1,
  'DOCUMENTS_VERIFICATION': 1,
  'DOCUMENTS_PENDING': 1,
  'DOCUMENTS PENDING': 1,
  'DOCUMENTS_VERIFIED': 1,
  'DOCUMENTS VERIFIED': 1,
  'ACTION REQUIRED': 1,
  'ACTION_NEEDED': 1,
  'UNDER REVIEW': 1,
  'PAYMENT': 2,
  'PAYMENT PROCESS': 2,
  'PAYMENT_PENDING': 2,
  'PAYMENT_COMPLETED': 2,
  'PAYMENT COMPLETED': 2,
  'PAID': 2,
  'SITE VISIT': 3,
  'SITE_VISIT': 3,
  'SITE VISIT COMPLETED': 3,
  'SITE_VISIT_COMPLETED': 3,
  'INSPECTION_SCHEDULED': 3,
  'INSPECTION_DONE': 3,
  'FINAL REVIEW': 4,
  'FINAL_REVIEW': 4,
  'SCRUTINY': 4,
  'FINAL APPROVAL': 4,
  'FINALLY APPROVED': 4,
  'FINALLY_APPROVED': 4,
  'APPLICATION COMPLETED': 4,
  'APPROVED': 4,
  'SANCTIONED': 4,
  'CLOSED': 4,
  'REJECTED': -1,
  'REJECT': -1,
};

const STANDARD_DOCS = [
  { key: 'CUSTOMER PHOTOGRAPH', label: 'Applicant Photograph', isPhoto: true },
  { key: 'CUSTOMER SIGNATURE', label: 'Applicant Signature', isPhoto: true },
  { key: 'AADHAR CARD', label: 'Aadhaar Card' },
  { key: 'PAN CARD', label: 'PAN Card' },
  { key: 'SALE DEED', altKey: 'LAND DOCUMENT', label: 'Sale Deed / Land Document' },
  { key: 'PATTA', label: 'Patta / Chitta' },
  { key: 'BUILDING PLAN', label: 'Proposed Building Plan' },
];

export const getLocationDisplay = (caseData: any): string => {
  if (!caseData) return 'Not Provided';
  const prop = caseData.property || {};
  const pd = caseData.fullData?.propertyDetails || {};
  const rd = caseData.fullData?.residentialAddress || {};

  if (prop.address && typeof prop.address === 'string') {
    const cleanAddr = prop.address.trim();
    if (cleanAddr && !cleanAddr.toLowerCase().includes('unknown') && cleanAddr !== 'Coimbatore, Tamil Nadu') {
      return cleanAddr;
    }
  }

  const propParts = [
    pd.village || pd.panchayat || prop.village,
    pd.taluk || prop.taluk,
    pd.city,
    pd.district || prop.district,
    pd.pincode ? `PIN: ${pd.pincode}` : '',
  ].filter(p => Boolean(p) && p !== 'Unknown' && p !== 'TBD');

  if (propParts.length > 0) return propParts.join(', ');

  const resParts = [
    rd.houseNo ? `D.No ${rd.houseNo}` : (rd.dno ? `D.No ${rd.dno}` : ''),
    rd.streetName || rd.street,
    rd.area,
    rd.village || rd.city,
    rd.taluk,
    rd.district,
    rd.pincode ? `PIN: ${rd.pincode}` : '',
  ].filter(p => Boolean(p) && p !== 'Unknown' && p !== 'TBD');

  if (resParts.length > 0) return resParts.join(', ');

  if (prop.village && prop.village !== 'Unknown' && prop.village !== 'TBD') {
    return `${prop.village}${prop.taluk && prop.taluk !== 'TBD' ? ', ' + prop.taluk : ''}`;
  }

  return 'Tamil Nadu';
};

export const formatDateNice = (dStr?: string | null) => {
  if (!dStr) return 'N/A';
  try {
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return dStr;
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dStr;
  }
};

export default function CustomerDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [appNumberInput, setAppNumberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [customerCases, setCustomerCases] = useState<Case[]>([]);
  const [activeCase, setActiveCase] = useState<Case | null>(null);

  // Upload state
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [activeUploadDoc, setActiveUploadDoc] = useState<{ key: string; label: string } | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const cleanUserPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);

  // Auto-fetch customer's applications using logged-in phone number
  const loadCustomerApplications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const allCases = await applicationService.getCases();
      let matched: Case[] = [];

      if (cleanUserPhone.length === 10) {
        matched = allCases.filter((c: any) => {
          const propPhone = String(c.property?.owner_phone || '').replace(/\D/g, '').slice(-10);
          const fullMobile = String(c.fullData?.mobile || c.fullData?.phone || c.fullData?.owner_phone || '').replace(/\D/g, '').slice(-10);
          const caseMobile = String(c.mobile || '').replace(/\D/g, '').slice(-10);
          return propPhone === cleanUserPhone || fullMobile === cleanUserPhone || caseMobile === cleanUserPhone;
        });
      }

      setCustomerCases(matched);

      if (matched.length > 0) {
        // Keep current selected case if still present, or pick first
        setActiveCase((prev) => {
          if (!prev) return matched[0];
          const found = matched.find((c) => c.id === prev.id || c.applicationNumber === prev.applicationNumber);
          return found || matched[0];
        });
      } else if (allCases.length > 0 && !activeCase) {
        // Fallback: If no phone match, keep activeCase if already searched
      }
    } catch (err: any) {
      console.warn('Error fetching customer applications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cleanUserPhone]);

  useEffect(() => {
    loadCustomerApplications();
  }, [loadCustomerApplications]);

  // Search by reference number
  const handleSearch = async () => {
    const query = appNumberInput.trim().toUpperCase().replace(/^APP-/, '');
    if (!query) {
      Alert.alert('Required', 'Please enter your application reference number.');
      return;
    }

    setLoading(true);
    try {
      const allCases = await applicationService.getCases();
      const match = allCases.find((c: any) => {
        const appNum = (c.applicationNumber || c.application_number || c.id || '').toUpperCase().replace(/^APP-/, '');
        return appNum === query || c.id === query || c._id === query;
      });

      if (match) {
        setActiveCase(match);
      } else {
        // Try direct getById
        const direct = await applicationService.getCaseById(query);
        if (direct) {
          setActiveCase(direct);
        } else {
          Alert.alert('Not Found', `No application found with Reference: ${appNumberInput.trim()}`);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to search application');
    } finally {
      setLoading(false);
    }
  };

  // Compile Documents with real status
  const getCompiledDocs = (caseData: any) => {
    if (!caseData) return [];

    const uploadedFiles = caseData.uploadedFiles || {};
    const fullData = caseData.fullData || {};
    const docVerification = fullData.documentVerification || {};
    const requestedReuploads: string[] = Array.isArray(fullData.requestedReuploads)
      ? fullData.requestedReuploads
      : Array.isArray(caseData.requestedReuploads)
      ? caseData.requestedReuploads
      : [];
    const caseDocs: any[] = Array.isArray(caseData.documents) ? caseData.documents : [];

    const isCaseApproved = ['APPROVED', 'COMPLETED', 'FINALLY APPROVED'].includes((caseData.status || '').toUpperCase());
    const isCaseVerified = isCaseApproved || ['DOCUMENTS_VERIFIED', 'DOCUMENTS VERIFIED'].includes((caseData.status || '').toUpperCase());

    return STANDARD_DOCS.map((doc) => {
      let fileUrl = uploadedFiles[doc.key] || uploadedFiles[doc.label] || (doc.altKey ? uploadedFiles[doc.altKey] : null);

      const dbDoc = caseDocs.find((d: any) =>
        (d.document_type || '').toUpperCase() === doc.key ||
        (d.document_type || '').toUpperCase() === doc.label.toUpperCase() ||
        (doc.altKey && (d.document_type || '').toUpperCase() === doc.altKey)
      );
      if (dbDoc && dbDoc.file_key) fileUrl = dbDoc.file_key;

      const verification = docVerification[doc.key] || (doc.altKey ? docVerification[doc.altKey] : undefined) || {};
      const needsReupload =
        requestedReuploads.includes(doc.key) ||
        (doc.altKey && requestedReuploads.includes(doc.altKey)) ||
        verification.status === 'Re-upload Required' ||
        verification.status === 'Needs Reupload' ||
        dbDoc?.status === 'REJECTED';

      const isVerified =
        isCaseVerified ||
        verification.status === 'Verified' ||
        verification.status === 'Worker Verified' ||
        dbDoc?.verified ||
        dbDoc?.status === 'VERIFIED';

      let status = 'Pending Upload';
      const reason = verification.reuploadReason || verification.rejectionReason || dbDoc?.review_notes || '';

      if (fileUrl) {
        if (needsReupload) {
          status = 'Needs Reupload';
        } else if (isVerified) {
          status = 'Verified';
        } else {
          status = 'Uploaded & Under Review';
        }
      } else if (needsReupload) {
        status = 'Needs Reupload';
      }

      return {
        key: doc.key,
        label: doc.label,
        status,
        reason,
        fileUrl: typeof fileUrl === 'string' && fileUrl.startsWith('http') ? fileUrl : null,
      };
    });
  };

  // Compile 5 Official Stages
  const getCompiledStages = (caseData: any): StageItem[] => {
    if (!caseData) return [];

    const rawStages = caseData.fullData?.stages || caseData.stages;
    const statusUpper = (caseData.status || 'Application Submitted').toUpperCase();
    const currentActiveIndex = STATUS_TO_STAGE_INDEX[statusUpper] !== undefined ? STATUS_TO_STAGE_INDEX[statusUpper] : 0;

    if (Array.isArray(rawStages) && rawStages.length === 5) {
      return rawStages.map((st: any, idx: number) => {
        const config = OFFICIAL_STAGES[idx] || { key: `stage_${idx}`, name: st.name, description: '' };
        return {
          name: st.name || config.name,
          key: st.key || config.key,
          status: st.status || (idx < currentActiveIndex ? 'Completed' : idx === currentActiveIndex ? 'In Progress' : 'Pending'),
          startedDate: st.startedDate || (idx <= currentActiveIndex ? (caseData.created_at || new Date().toISOString()) : null),
          completedDate: st.completedDate || (idx < currentActiveIndex ? (caseData.created_at || new Date().toISOString()) : null),
          remarks: st.remarks || (idx === 0 ? 'Application registered and initial details submitted.' : ''),
          responsiblePerson: st.responsiblePerson || (idx === 0 ? 'Customer' : (caseData.assigned_staff?.name || caseData.fullData?.staff || 'CB Team')),
          description: config.description,
        };
      });
    }

    return OFFICIAL_STAGES.map((cfg, idx) => {
      let stageStatus: 'Completed' | 'In Progress' | 'Pending' = 'Pending';
      if (statusUpper === 'APPLICATION COMPLETED' || statusUpper === 'APPROVED' || statusUpper === 'FINALLY APPROVED') {
        stageStatus = 'Completed';
      } else if (idx < currentActiveIndex) {
        stageStatus = 'Completed';
      } else if (idx === currentActiveIndex) {
        stageStatus = 'In Progress';
      }

      return {
        name: cfg.name,
        key: cfg.key,
        status: stageStatus,
        startedDate: idx <= currentActiveIndex ? (caseData.created_at || new Date().toISOString()) : null,
        completedDate: idx < currentActiveIndex ? (caseData.created_at || new Date().toISOString()) : null,
        remarks: idx === 0 ? 'Application registered and initial details submitted.' : '',
        responsiblePerson: idx === 0 ? 'Customer' : (caseData.assigned_staff?.name || caseData.fullData?.staff || 'CB Team'),
        description: cfg.description,
      };
    });
  };

  // Re-upload execution (Camera or File Picker)
  const executeReupload = async (source: 'camera' | 'file') => {
    if (!activeCase || !activeUploadDoc) return;
    setUploadModalVisible(false);

    const docKey = activeUploadDoc.key;
    const docLabel = activeUploadDoc.label;
    setUploadingDocKey(docKey);

    try {
      let pickedFile: { uri: string; name: string; mimeType?: string } | null = null;

      if (source === 'camera') {
        const photo = await uploadService.takePhoto();
        if (photo) {
          pickedFile = {
            uri: photo.uri,
            name: `${docKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          };
        }
      } else {
        pickedFile = await uploadService.pickDocument();
      }

      if (!pickedFile) {
        setUploadingDocKey(null);
        return;
      }

      // 1. Upload to Cloudinary
      const uploadRes = await uploadService.uploadToCloudinary(
        pickedFile.uri,
        pickedFile.name,
        pickedFile.mimeType
      );

      const cloudinaryUrl = uploadRes.secure_url || uploadRes.url;
      if (!cloudinaryUrl) {
        throw new Error(uploadRes.error || 'Failed to upload document to secure storage.');
      }

      // 2. Prepare payload to sync with backend
      const caseId = activeCase.id || activeCase._id || '';
      const existingUploadedFiles = activeCase.uploadedFiles || {};
      const updatedUploadedFiles = {
        ...existingUploadedFiles,
        [docKey]: cloudinaryUrl,
      };

      const existingFullData = activeCase.fullData || {};
      const existingDocVerification = existingFullData.documentVerification || {};
      const existingRequested = Array.isArray(existingFullData.requestedReuploads) ? existingFullData.requestedReuploads : [];
      const updatedRequested = existingRequested.filter((k: string) => k !== docKey);

      const updatedDocVerification = {
        ...existingDocVerification,
        [docKey]: {
          status: 'Pending Review',
          reuploadReason: '',
          rejectionReason: '',
          verifiedBy: 'Customer (Re-uploaded)',
          verifiedAt: new Date().toISOString(),
          uploadedAt: new Date().toISOString(),
        },
      };

      const updatePayload: Partial<Case> = {
        status: 'DOCUMENTS_VERIFICATION',
        uploadedFiles: updatedUploadedFiles,
        fullData: {
          ...existingFullData,
          documentVerification: updatedDocVerification,
          requestedReuploads: updatedRequested,
        },
      };

      await applicationService.updateCase(caseId, updatePayload);

      // 3. Update local state
      setActiveCase({
        ...activeCase,
        status: 'DOCUMENTS_VERIFICATION',
        uploadedFiles: updatedUploadedFiles,
        fullData: {
          ...existingFullData,
          documentVerification: updatedDocVerification,
          requestedReuploads: updatedRequested,
        },
      });

      Alert.alert(
        'Upload Successful! 🎉',
        `Your updated "${docLabel}" has been submitted successfully. The review team has been notified for expedited verification.`
      );

      // Refresh applications from backend
      loadCustomerApplications(true);
    } catch (err: any) {
      Alert.alert('Upload Error', err.message || 'Failed to re-upload document. Please try again.');
    } finally {
      setUploadingDocKey(null);
      setActiveUploadDoc(null);
    }
  };

  const compiledDocs = activeCase ? getCompiledDocs(activeCase) : [];
  const compiledStages = activeCase ? getCompiledStages(activeCase) : [];
  const reuploadNeededDocs = compiledDocs.filter((d) => d.status === 'Needs Reupload');
  const hasReuploadRequested = reuploadNeededDocs.length > 0;

  const assignedWorkerName =
    activeCase?.assigned_staff?.name ||
    activeCase?.fullData?.staff ||
    activeCase?.assignedTo ||
    'Unassigned';

  const isRejected = (activeCase?.status || '').toUpperCase() === 'REJECTED';

  const getDocBadgeStyle = (status: string) => {
    switch (status) {
      case 'Verified':
        return { bg: '#D1FAE5', color: '#047857', icon: 'checkmark-circle' };
      case 'Needs Reupload':
        return { bg: '#FEE2E2', color: '#B91C1C', icon: 'alert-circle' };
      case 'Uploaded & Under Review':
        return { bg: '#E0F2FE', color: '#0369A1', icon: 'time' };
      default:
        return { bg: '#FEF3C7', color: '#B45309', icon: 'cloud-upload-outline' };
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 30, 50) }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadCustomerApplications(true)} />}
    >
      {/* Search Header Card */}
      <View style={styles.searchCard}>
        <Text style={styles.searchTitle}>Track Building Approval</Text>
        <Text style={styles.searchSub}>
          Real-time municipal approval progress, stage-wise tracking & document status.
        </Text>

        <View style={styles.searchRow}>
          <View style={styles.inputWrapper}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="e.g. 1001 or CBA-1001"
              placeholderTextColor={colors.textMuted}
              value={appNumberInput}
              onChangeText={setAppNumberInput}
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity
            style={styles.trackBtn}
            onPress={handleSearch}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.trackBtnText}>Track</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Customer Applications Quick Switcher */}
        {customerCases.length > 1 && (
          <View style={styles.casesTabRow}>
            <Text style={styles.casesTabLabel}>Your Applications:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              {customerCases.map((c) => {
                const isSelected = activeCase?.id === c.id || activeCase?.applicationNumber === c.applicationNumber;
                return (
                  <TouchableOpacity
                    key={c.id || c._id}
                    style={[styles.caseTabChip, isSelected && styles.caseTabChipActive]}
                    onPress={() => setActiveCase(c)}
                  >
                    <Text style={[styles.caseTabChipText, isSelected && styles.caseTabChipTextActive]}>
                      {c.applicationNumber || c.application_number || `APP-${c.id?.slice(-4)}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Main Tracking Details */}
      {activeCase ? (
        <View style={styles.resultContainer}>
          {/* Header Banner */}
          <View style={[styles.headerBanner, isRejected && { backgroundColor: '#DC2626' }]}>
            <View>
              <Text style={styles.bannerSub}>PROPOSAL REFERENCE</Text>
              <Text style={styles.bannerTitle}>
                {activeCase.applicationNumber || activeCase.application_number || `APP-${activeCase.id?.slice(-6)}`}
              </Text>
            </View>

            <View style={styles.statusPill}>
              <View style={[styles.statusDot, { backgroundColor: isRejected ? '#DC2626' : '#10B981' }]} />
              <Text style={[styles.statusPillText, isRejected && { color: '#DC2626' }]}>
                {(activeCase.status || 'Application Submitted').replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* Action Required: Document Re-upload Alert Box */}
          {hasReuploadRequested && (
            <View style={styles.reuploadAlertCard}>
              <View style={styles.alertHeaderRow}>
                <Ionicons name="warning" size={24} color="#B45309" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.alertTitle}>Action Required: Document Re-upload Requested</Text>
                  <Text style={styles.alertDesc}>
                    The reviewer has requested updated documents:{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {reuploadNeededDocs.map((d) => d.label).join(', ')}
                    </Text>
                    . Please re-upload directly below to expedite approval.
                  </Text>
                </View>
              </View>

              {/* Direct Re-upload Buttons */}
              <View style={styles.reuploadListWrap}>
                {reuploadNeededDocs.map((doc) => (
                  <View key={doc.key} style={styles.reuploadItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reuploadItemTitle}>{doc.label}</Text>
                      {doc.reason ? (
                        <Text style={styles.reuploadItemReason}>Reason: {doc.reason}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      style={styles.reuploadActionBtn}
                      disabled={uploadingDocKey === doc.key}
                      onPress={() => {
                        setActiveUploadDoc(doc);
                        setUploadModalVisible(true);
                      }}
                    >
                      {uploadingDocKey === doc.key ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="camera-outline" size={16} color="#fff" />
                          <Text style={styles.reuploadActionBtnText}>Re-upload</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Key Information Card */}
          <View style={styles.infoCard}>
            <Text style={styles.sectionHeader}>Application Information</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>APPLICANT NAME</Text>
                <Text style={styles.infoValue}>
                  {activeCase.property?.owner_name ||
                    activeCase.clientName ||
                    activeCase.fullData?.customerName ||
                    user?.name ||
                    'Applicant'}
                </Text>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>PRODUCT / APPROVAL TYPE</Text>
                <View style={styles.inlineIconRow}>
                  <Ionicons name="business-outline" size={15} color={colors.primary} />
                  <Text style={styles.infoValue}>
                    {(activeCase.approval_type || 'Building Plan Approval').replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>PROPERTY LOCATION</Text>
                <View style={styles.inlineIconRow}>
                  <Ionicons name="location-outline" size={15} color={colors.primary} />
                  <Text style={styles.infoValue}>{getLocationDisplay(activeCase)}</Text>
                </View>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>SUBMISSION DATE</Text>
                <View style={styles.inlineIconRow}>
                  <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                  <Text style={styles.infoValue}>{formatDateNice(activeCase.created_at)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>ASSIGNED OFFICER / WORKER</Text>
                <View style={styles.inlineIconRow}>
                  <Ionicons name="person-circle-outline" size={16} color="#047857" />
                  <Text style={[styles.infoValue, { color: '#047857', fontWeight: '700' }]}>
                    {assignedWorkerName}
                  </Text>
                </View>
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>REGISTERED CONTACT</Text>
                <Text style={styles.infoValue}>
                  {activeCase.property?.owner_phone || activeCase.fullData?.mobile || user?.phone || '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* 5 Official Stages Timeline */}
          <View style={styles.card}>
            <Text style={styles.sectionHeader}>Stage-Wise Approval Progress</Text>

            <View style={styles.timelineList}>
              {compiledStages.map((stage, idx) => {
                const isCompleted = stage.status === 'Completed';
                const isInProgress = stage.status === 'In Progress';

                return (
                  <View key={stage.key} style={styles.stageItem}>
                    <View style={styles.stageIndicatorCol}>
                      <View
                        style={[
                          styles.stageCircle,
                          isCompleted && { backgroundColor: '#10B981' },
                          isInProgress && { backgroundColor: colors.primary, borderColor: '#93C5FD' },
                        ]}
                      >
                        <Ionicons
                          name={isCompleted ? 'checkmark' : isInProgress ? 'refresh' : 'ellipse'}
                          size={isCompleted ? 14 : isInProgress ? 12 : 8}
                          color={isCompleted || isInProgress ? '#fff' : colors.textMuted}
                        />
                      </View>
                      {idx < compiledStages.length - 1 && (
                        <View
                          style={[
                            styles.stageLine,
                            isCompleted && { backgroundColor: '#10B981' },
                          ]}
                        />
                      )}
                    </View>

                    <View style={styles.stageContent}>
                      <View style={styles.stageTitleRow}>
                        <Text style={[styles.stageName, (isCompleted || isInProgress) && { color: colors.text, fontWeight: '700' }]}>
                          {stage.name}
                        </Text>
                        <View
                          style={[
                            styles.stageBadge,
                            isCompleted && { backgroundColor: '#D1FAE5' },
                            isInProgress && { backgroundColor: '#DBEAFE' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stageBadgeText,
                              isCompleted && { color: '#047857' },
                              isInProgress && { color: colors.primary },
                            ]}
                          >
                            {stage.status}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.stageDesc}>{stage.description}</Text>

                      <View style={styles.stageMetaRow}>
                        {stage.completedDate ? (
                          <Text style={styles.stageMetaText}>
                            Completed: {formatDateNice(stage.completedDate)}
                          </Text>
                        ) : stage.startedDate ? (
                          <Text style={styles.stageMetaText}>
                            Started: {formatDateNice(stage.startedDate)}
                          </Text>
                        ) : null}

                        {stage.responsiblePerson ? (
                          <Text style={styles.stageMetaText}>
                            Officer: {stage.responsiblePerson}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Document Verification Checklist */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.sectionHeader}>Document Verification Status</Text>
              <Text style={styles.docCountBadge}>{compiledDocs.length} Total</Text>
            </View>

            <View style={styles.docList}>
              {compiledDocs.map((doc) => {
                const badge = getDocBadgeStyle(doc.status);
                const isNeedsReupload = doc.status === 'Needs Reupload';

                return (
                  <View key={doc.key} style={[styles.docItemCard, isNeedsReupload && styles.docItemAlertBorder]}>
                    <View style={styles.docItemTop}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.docItemTitle}>{doc.label}</Text>
                        {doc.reason ? (
                          <Text style={styles.docReasonText}>Note: {doc.reason}</Text>
                        ) : null}
                      </View>

                      <View style={[styles.docBadge, { backgroundColor: badge.bg }]}>
                        <Ionicons name={badge.icon as any} size={12} color={badge.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.docBadgeText, { color: badge.color }]}>{doc.status}</Text>
                      </View>
                    </View>

                    <View style={styles.docActionRow}>
                      {/* View document if URL exists */}
                      {doc.fileUrl ? (
                        <TouchableOpacity
                          style={styles.viewDocBtn}
                          onPress={() => {
                            if (doc.fileUrl) Linking.openURL(doc.fileUrl);
                          }}
                        >
                          <Ionicons name="eye-outline" size={15} color={colors.primary} />
                          <Text style={styles.viewDocBtnText}>View File</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.noFileText}>No file attached</Text>
                      )}

                      {/* Re-upload button if requested or pending */}
                      <TouchableOpacity
                        style={[
                          styles.uploadDocBtn,
                          isNeedsReupload && { backgroundColor: '#DC2626' },
                        ]}
                        disabled={uploadingDocKey === doc.key}
                        onPress={() => {
                          setActiveUploadDoc(doc);
                          setUploadModalVisible(true);
                        }}
                      >
                        {uploadingDocKey === doc.key ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name={isNeedsReupload ? 'refresh' : 'cloud-upload-outline'} size={14} color="#fff" />
                            <Text style={styles.uploadDocBtnText}>
                              {isNeedsReupload ? 'Re-upload' : 'Upload File'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyStateCard}>
          <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>No Applications Loaded</Text>
          <Text style={styles.emptyStateDesc}>
            Enter your Application Reference Number above to check real-time status, or ensure your registered mobile number is associated with your proposal.
          </Text>
        </View>
      )}

      {/* Upload Choice Modal (Camera vs Document) */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setUploadModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload {activeUploadDoc?.label}</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Choose how you would like to submit your photo or document:
            </Text>

            <TouchableOpacity
              style={styles.modalChoiceBtn}
              onPress={() => executeReupload('camera')}
            >
              <View style={[styles.modalChoiceIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalChoiceTitle}>Take Photo (Camera)</Text>
                <Text style={styles.modalChoiceDesc}>Use phone camera to capture clear picture</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalChoiceBtn}
              onPress={() => executeReupload('file')}
            >
              <View style={[styles.modalChoiceIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-attach" size={24} color="#B45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalChoiceTitle}>Choose from Files / Gallery</Text>
                <Text style={styles.modalChoiceDesc}>Upload PDF or image from your device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setUploadModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: spacing.md,
  },
  searchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  searchSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  trackBtn: {
    backgroundColor: colors.primary,
    height: 48,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  casesTabRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  casesTabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  caseTabChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  caseTabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  caseTabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  caseTabChipTextActive: {
    color: '#FFFFFF',
  },
  resultContainer: {
    marginTop: spacing.xs,
  },
  headerBanner: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerSub: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  reuploadAlertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: spacing.md,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  alertDesc: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
    lineHeight: 16,
  },
  reuploadListWrap: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
    paddingTop: spacing.sm,
  },
  reuploadItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  reuploadItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350F',
  },
  reuploadItemReason: {
    fontSize: 11,
    color: '#B45309',
    fontStyle: 'italic',
    marginTop: 2,
  },
  reuploadActionBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  reuploadActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  inlineIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: spacing.md,
  },
  timelineList: {
    paddingLeft: 4,
  },
  stageItem: {
    flexDirection: 'row',
    minHeight: 70,
  },
  stageIndicatorCol: {
    alignItems: 'center',
    width: 28,
  },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  stageLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  stageContent: {
    flex: 1,
    paddingLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  stageTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  stageBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stageDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
  },
  stageMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: 6,
  },
  stageMetaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  docCountBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  docList: {
    gap: spacing.sm,
  },
  docItemCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docItemAlertBorder: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  docItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docReasonText: {
    fontSize: 11,
    color: '#B91C1C',
    fontStyle: 'italic',
    marginTop: 2,
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  docBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  docActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDocBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  noFileText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  uploadDocBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  uploadDocBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: spacing.md,
  },
  emptyStateDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: spacing.lg,
  },
  modalChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.sm,
  },
  modalChoiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalChoiceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalChoiceDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCancelBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});
