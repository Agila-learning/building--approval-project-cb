import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { uploadService } from '../../services/uploadService';
import { Case } from '../../types';

export default function CustomerUploadScreen() {
  const insets = useSafeAreaInsets();
  const [appNumber, setAppNumber] = useState('');
  const [searching, setSearching] = useState(false);
  const [targetCase, setTargetCase] = useState<Case | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFindCase = async () => {
    if (!appNumber.trim()) {
      Alert.alert('Required', 'Please enter your application reference number');
      return;
    }

    setSearching(true);
    setTargetCase(null);
    try {
      const cases = await applicationService.getCases();
      const match = cases.find(
        (c) =>
          c.applicationNumber?.toLowerCase() === appNumber.trim().toLowerCase() ||
          c.id === appNumber.trim() ||
          c._id === appNumber.trim()
      );

      if (match) {
        setTargetCase(match);
      } else {
        Alert.alert('Not Found', 'No application found with this reference number.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to search application');
    } finally {
      setSearching(false);
    }
  };

  const handleUploadDoc = async (type: string) => {
    if (!targetCase) return;

    try {
      setUploading(true);
      const res = await uploadService.pickDocument();
      if (!res) {
        setUploading(false);
        return;
      }

      const uploadRes = await uploadService.uploadToCloudinary(res.uri, res.name, res.mimeType);
      const docUrl = uploadRes.secure_url || uploadRes.url || '';

      const updatedDocs = [
        ...(targetCase.documents || []),
        {
          name: res.name,
          url: docUrl,
          type: type,
          uploadedAt: new Date().toISOString(),
        },
      ];

      await applicationService.updateCase(targetCase.id || targetCase._id || '', {
        documents: updatedDocs,
        status: targetCase.status === 'SUBMITTED' ? 'DOCUMENTS_SUBMITTED' : targetCase.status,
      });

      setTargetCase({
        ...targetCase,
        documents: updatedDocs,
      });

      Alert.alert('Success', `${type} uploaded and attached to application!`);
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message || 'Could not upload file');
    } finally {
      setUploading(false);
    }
  };

  const requiredDocTypes = [
    'Sale Deed / Patta Copy',
    'Aadhaar / ID Proof',
    'Site Plan / FMB Sketch',
    'Encumbrance Certificate (EC)',
    'Existing Building Plan (if modification)',
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
    >
      <View style={styles.headerCard}>
        <Text style={styles.headerTitle}>Upload Application Documents</Text>
        <Text style={styles.headerSub}>
          Submit required civil clearance documents directly to your application file.
        </Text>

        <View style={styles.inputWrapper}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Application ID (e.g. CBA-2024-001)"
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
            <Text style={styles.caseAppNo}>{targetCase.applicationNumber}</Text>
            <Text style={styles.caseClient}>{targetCase.clientName}</Text>
            <Text style={styles.caseStatus}>Status: {targetCase.status.replace('_', ' ')}</Text>
          </View>

          <Text style={styles.sectionHeading}>Mandatory & Supporting Documents</Text>

          {requiredDocTypes.map((docType) => {
            const uploaded = targetCase.documents?.find((d) => d.type === docType || d.name?.includes(docType));

            return (
              <View key={docType} style={styles.docRow}>
                <View style={styles.docLeft}>
                  <Ionicons
                    name={uploaded ? 'checkmark-circle' : 'document-text-outline'}
                    size={22}
                    color={uploaded ? colors.success : colors.textMuted}
                  />
                  <View style={styles.docTextWrap}>
                    <Text style={styles.docName}>{docType}</Text>
                    <Text style={styles.docStatus}>
                      {uploaded ? 'Uploaded & Verified' : 'Pending Upload'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.uploadBtn, uploaded && styles.reuploadBtn]}
                  onPress={() => handleUploadDoc(docType)}
                  disabled={uploading}
                >
                  <Ionicons
                    name={uploaded ? 'refresh-outline' : 'cloud-upload-outline'}
                    size={16}
                    color={uploaded ? colors.text : '#fff'}
                  />
                  <Text style={[styles.uploadBtnText, uploaded && { color: colors.text }]}>
                    {uploaded ? 'Replace' : 'Upload'}
                  </Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingLeft: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.text,
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
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  caseContainer: {
    marginTop: spacing.xs,
  },
  caseInfoCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  caseAppNo: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  caseClient: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  caseStatus: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  docRow: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  docTextWrap: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  docStatus: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  uploadBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  reuploadBtn: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadingText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
});
