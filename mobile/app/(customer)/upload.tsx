import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../contexts/AuthContext';
import { Case } from '../../types';

const REQUIRED_DOC_TYPES = [
  { key: 'CUSTOMER PHOTOGRAPH', label: 'Passport Size Photograph', desc: 'Recent clear applicant portrait photograph' },
  { key: 'CUSTOMER SIGNATURE', label: 'Customer Signature', desc: 'Applicant specimen signature' },
  { key: 'AADHAR CARD', label: 'Aadhaar Card', desc: 'Government Aadhaar identity document' },
  { key: 'PAN CARD', label: 'PAN Card', desc: 'Income tax permanent account number' },
  { key: 'SALE DEED', label: 'Sale Deed / Land Document', desc: 'Registered title deed or parent document' },
  { key: 'PATTA', label: 'Patta / Chitta', desc: 'Latest Patta extract in applicant name' },
  { key: 'BUILDING PLAN', label: 'Proposed Building Plan', desc: 'Architectural blueprint / plan drawings' },
];

export default function CustomerUploadScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [appNumber, setAppNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [targetCase, setTargetCase] = useState<Case | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);

  // Modal choice for camera vs file
  const [selectedDoc, setSelectedDoc] = useState<{ key: string; label: string } | null>(null);
  const [choiceModalVisible, setChoiceModalVisible] = useState(false);

  // Auto-detect application for logged-in user
  useEffect(() => {
    async function autoLoadCase() {
      const cleanPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length === 10) {
        try {
          const cases = await applicationService.getCases();
          const match = cases.find((c: any) => {
            const pPhone = String(c.property?.owner_phone || '').replace(/\D/g, '').slice(-10);
            const fdPhone = String(c.fullData?.mobile || c.fullData?.phone || '').replace(/\D/g, '').slice(-10);
            return pPhone === cleanPhone || fdPhone === cleanPhone;
          });
          if (match) {
            setTargetCase(match);
            setAppNumber(match.applicationNumber || match.application_number || match.id);
          }
        } catch (_) {}
      }
    }
    autoLoadCase();
  }, [user]);

  const handleFindCase = async () => {
    const query = appNumber.trim().toUpperCase().replace(/^APP-/, '');
    if (!query) {
      Alert.alert('Required', 'Please enter your application reference number');
      return;
    }

    setSearching(true);
    setTargetCase(null);
    try {
      const cases = await applicationService.getCases();
      const match = cases.find(
        (c: any) => {
          const appNum = (c.applicationNumber || c.application_number || c.id || '').toUpperCase().replace(/^APP-/, '');
          return appNum === query || c.id === query || c._id === query;
        }
      );

      if (match) {
        setTargetCase(match);
      } else {
        const direct = await applicationService.getCaseById(query);
        if (direct) {
          setTargetCase(direct);
        } else {
          Alert.alert('Not Found', 'No application found with this reference number.');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to search application');
    } finally {
      setSearching(false);
    }
  };

  const handleUploadDoc = async (source: 'camera' | 'file') => {
    if (!targetCase || !selectedDoc) return;
    setChoiceModalVisible(false);

    const docKey = selectedDoc.key;
    const docLabel = selectedDoc.label;
    setUploading(true);
    setUploadingDocKey(docKey);

    try {
      let fileRes: { uri: string; name: string; mimeType?: string } | null = null;

      if (source === 'camera') {
        const photo = await uploadService.takePhoto();
        if (photo) {
          fileRes = {
            uri: photo.uri,
            name: `${docKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}.jpg`,
            mimeType: 'image/jpeg',
          };
        }
      } else {
        fileRes = await uploadService.pickDocument();
      }

      if (!fileRes) {
        setUploading(false);
        setUploadingDocKey(null);
        return;
      }

      // 1. Upload to Cloudinary
      const uploadRes = await uploadService.uploadToCloudinary(
        fileRes.uri,
        fileRes.name,
        fileRes.mimeType
      );
      const docUrl = uploadRes.secure_url || uploadRes.url;
      if (!docUrl) {
        throw new Error(uploadRes.error || 'Failed to upload document.');
      }

      // 2. Sync to MongoDB case
      const existingUploadedFiles = targetCase.uploadedFiles || {};
      const updatedUploadedFiles = {
        ...existingUploadedFiles,
        [docKey]: docUrl,
      };

      const existingFullData = targetCase.fullData || {};
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

      const caseId = targetCase.id || targetCase._id || '';
      await applicationService.updateCase(caseId, {
        status: targetCase.status === 'SUBMITTED' ? 'DOCUMENTS_VERIFICATION' : targetCase.status,
        uploadedFiles: updatedUploadedFiles,
        fullData: {
          ...existingFullData,
          documentVerification: updatedDocVerification,
          requestedReuploads: updatedRequested,
        },
      });

      setTargetCase({
        ...targetCase,
        uploadedFiles: updatedUploadedFiles,
        fullData: {
          ...existingFullData,
          documentVerification: updatedDocVerification,
          requestedReuploads: updatedRequested,
        },
      });

      Alert.alert('Upload Successful! 🎉', `${docLabel} was uploaded and attached to your application.`);
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload file');
    } finally {
      setUploading(false);
      setUploadingDocKey(null);
      setSelectedDoc(null);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Upload Application Documents</Text>
        <Text style={styles.headerSub}>
          Submit required municipal clearance documents directly to your application file.
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Application ID (e.g. 1001 or APP-1001)"
            placeholderTextColor={colors.textMuted}
            value={appNumber}
            onChangeText={setAppNumber}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={styles.findBtn}
            onPress={handleFindCase}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.findBtnText}>Find</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {targetCase && (
        <View style={styles.caseContainer}>
          <View style={styles.caseInfoCard}>
            <View>
              <Text style={styles.caseAppNo}>
                {targetCase.applicationNumber || targetCase.application_number || `APP-${targetCase.id?.slice(-4)}`}
              </Text>
              <Text style={styles.caseClient}>
                {targetCase.property?.owner_name || targetCase.clientName || 'Applicant'}
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{(targetCase.status || 'SUBMITTED').replace(/_/g, ' ')}</Text>
            </View>
          </View>

          <Text style={styles.sectionHeading}>Mandatory & Supporting Documents</Text>

          {REQUIRED_DOC_TYPES.map((doc) => {
            const uploadedUrl = targetCase.uploadedFiles?.[doc.key];
            const requestedReuploads = targetCase.fullData?.requestedReuploads || [];
            const isReuploadRequested = requestedReuploads.includes(doc.key);

            return (
              <View key={doc.key} style={[styles.docRow, isReuploadRequested && styles.docRowAlert]}>
                <View style={styles.docLeft}>
                  <Ionicons
                    name={uploadedUrl ? 'checkmark-circle' : isReuploadRequested ? 'alert-circle' : 'document-text-outline'}
                    size={22}
                    color={isReuploadRequested ? '#DC2626' : uploadedUrl ? colors.success : colors.textMuted}
                  />
                  <View style={styles.docTextWrap}>
                    <Text style={styles.docName}>{doc.label}</Text>
                    <Text style={[styles.docStatus, isReuploadRequested && { color: '#DC2626', fontWeight: '700' }]}>
                      {isReuploadRequested
                        ? 'Re-upload Requested by Reviewer'
                        : uploadedUrl
                        ? 'Uploaded & Under Review'
                        : 'Pending Upload'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.uploadBtn,
                    uploadedUrl && styles.reuploadBtn,
                    isReuploadRequested && { backgroundColor: '#DC2626' },
                  ]}
                  onPress={() => {
                    setSelectedDoc(doc);
                    setChoiceModalVisible(true);
                  }}
                  disabled={uploading}
                >
                  {uploadingDocKey === doc.key ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={isReuploadRequested ? 'camera-outline' : uploadedUrl ? 'refresh-outline' : 'cloud-upload-outline'}
                        size={15}
                        color={uploadedUrl && !isReuploadRequested ? colors.text : '#fff'}
                      />
                      <Text style={[styles.uploadBtnText, uploadedUrl && !isReuploadRequested && { color: colors.text }]}>
                        {isReuploadRequested ? 'Re-upload' : uploadedUrl ? 'Replace' : 'Upload'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {uploading && (
            <View style={styles.uploadingBanner}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.uploadingText}>Uploading securely to Cloudinary...</Text>
            </View>
          )}
        </View>
      )}

      {/* Choice Modal */}
      <Modal
        visible={choiceModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChoiceModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setChoiceModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload {selectedDoc?.label}</Text>
              <TouchableOpacity onPress={() => setChoiceModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select upload source:</Text>

            <TouchableOpacity
              style={styles.modalChoiceBtn}
              onPress={() => handleUploadDoc('camera')}
            >
              <View style={[styles.modalChoiceIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalChoiceTitle}>Take Photo (Camera)</Text>
                <Text style={styles.modalChoiceDesc}>Take picture with your camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalChoiceBtn}
              onPress={() => handleUploadDoc('file')}
            >
              <View style={[styles.modalChoiceIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="document-attach" size={24} color="#B45309" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalChoiceTitle}>Choose from Files / Gallery</Text>
                <Text style={styles.modalChoiceDesc}>Select image or PDF from device</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setChoiceModalVisible(false)}
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
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  findBtn: {
    backgroundColor: colors.primary,
    height: '100%',
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
  },
  findBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  caseContainer: {
    marginTop: spacing.xs,
  },
  caseInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  caseAppNo: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  caseClient: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: spacing.sm,
  },
  docRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docRowAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF5F5',
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  docTextWrap: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  docName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docStatus: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  reuploadBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  uploadingBanner: {
    backgroundColor: '#EFF6FF',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
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
