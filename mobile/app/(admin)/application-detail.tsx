import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Share,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { MobileHeader } from '../../components/MobileHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { uploadToCloudinary } from '../../services/uploadService';
import { Case } from '../../types';
import { Ionicons } from '@expo/vector-icons';

const REQUIRED_DOCS = [
  'SALE DEED',
  'PATTA',
  'FMB',
  'PAN CARD',
  'AADHAR CARD',
  'CUSTOMER PHOTOGRAPH',
  'CUSTOMER SIGNATURE',
  'BUILDING PLAN',
  'RECEIPT',
  'FINAL_APPROVAL',
];

const WEB_BASE_URL = 'https://building-approval.vercel.app';

// Workflow Stages matching Web App
type WorkflowStage =
  | 'PENDING_DOCUMENTS'
  | 'DOCUMENTS_VERIFICATION'
  | 'DOCUMENTS_VERIFIED'
  | 'SUBMITTED_FOR_APPROVAL'
  | 'COMPLETED';

const STAGES: { key: WorkflowStage; label: string; stepNum: number }[] = [
  { key: 'PENDING_DOCUMENTS', label: '1. Docs', stepNum: 1 },
  { key: 'DOCUMENTS_VERIFICATION', label: '2. Verify', stepNum: 2 },
  { key: 'DOCUMENTS_VERIFIED', label: '3. Receipt', stepNum: 3 },
  { key: 'SUBMITTED_FOR_APPROVAL', label: '4. Approval', stepNum: 4 },
  { key: 'COMPLETED', label: '5. Done', stepNum: 5 },
];

export default function ApplicationDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // View Mode: 'workflow' shows active auto-advancing step screen, 'overview' shows full details
  const [activeViewTab, setActiveViewTab] = useState<'workflow' | 'overview'>('workflow');

  // Edit Application Modal
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editTab, setEditTab] = useState<'applicant' | 'property'>('applicant');

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editFatherName, setEditFatherName] = useState('');
  const [editAltMobile, setEditAltMobile] = useState('');
  const [editAadhar, setEditAadhar] = useState('');
  const [editPan, setEditPan] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editServiceType, setEditServiceType] = useState('BUILDING_PLAN_APPROVAL');
  const [editResHouseNo, setEditResHouseNo] = useState('');
  const [editResStreet, setEditResStreet] = useState('');
  const [editResCity, setEditResCity] = useState('');
  const [editResTaluk, setEditResTaluk] = useState('');
  const [editResPincode, setEditResPincode] = useState('');

  // Edit Property Fields
  const [editSurveyNo, setEditSurveyNo] = useState('');
  const [editPattaNo, setEditPattaNo] = useState('');
  const [editDno, setEditDno] = useState('');
  const [editStreetName, setEditStreetName] = useState('');
  const [editVillage, setEditVillage] = useState('');
  const [editPanchayat, setEditPanchayat] = useState('');
  const [editTaluk, setEditTaluk] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editJurisdiction, setEditJurisdiction] = useState('DTCP');

  // Payment / Fees Modal
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const [savingFee, setSavingFee] = useState(false);
  const [feeTotal, setFeeTotal] = useState('');
  const [feePaid, setFeePaid] = useState('');
  const [feeNotes, setFeeNotes] = useState('');
  const [newChargeAmount, setNewChargeAmount] = useState('');
  const [newChargeDesc, setNewChargeDesc] = useState('');
  const [newChargeMode, setNewChargeMode] = useState('UPI');

  // Stage 3: Receipt & Credentials Form Fields
  const [receiptNumber, setReceiptNumber] = useState('');
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Stage 4: Final Approval Fields
  const [approvalCertNumber, setApprovalCertNumber] = useState('');

  // Document Viewer Modal
  const [viewerModalVisible, setViewerModalVisible] = useState(false);
  const [viewingDocKey, setViewingDocKey] = useState<string>('');
  const [viewingDocUrl, setViewingDocUrl] = useState<string>('');

  // Re-upload Request Modal
  const [reuploadModalVisible, setReuploadModalVisible] = useState(false);
  const [selectedForReupload, setSelectedForReupload] = useState<string[]>([]);
  const [sendingReupload, setSendingReupload] = useState(false);

  // Normalize status to workflow stage
  const getStageFromStatus = (st: string | undefined): WorkflowStage => {
    const s = (st || '').toUpperCase();
    if (s === 'DOCUMENTS_VERIFICATION') return 'DOCUMENTS_VERIFICATION';
    if (s === 'DOCUMENTS_VERIFIED') return 'DOCUMENTS_VERIFIED';
    if (s === 'SUBMITTED_FOR_APPROVAL') return 'SUBMITTED_FOR_APPROVAL';
    if (s.includes('APPROV') || s.includes('COMPLET')) return 'COMPLETED';
    return 'PENDING_DOCUMENTS';
  };

  const populateFields = (c: Case) => {
    const full = c.fullData || {};
    const prop = c.property || {};
    const propDet = full.propertyDetails || {};
    const resAddr = full.residentialAddress || {};
    const upFiles = c.uploadedFiles || {};

    setEditName(prop.owner_name || full.customerName || '');
    setEditPhone(prop.owner_phone || full.mobile || '');
    setEditEmail(prop.owner_email || full.email || '');
    setEditFatherName(full.fatherName || '');
    setEditAltMobile(full.altMobile || '');
    setEditAadhar(full.aadhar || '');
    setEditPan(full.pan || '');
    setEditDob(full.dob || '');
    setEditServiceType(c.approval_type || full.serviceType || 'BUILDING_PLAN_APPROVAL');

    setEditResHouseNo(resAddr.houseNo || '');
    setEditResStreet(resAddr.streetName || '');
    setEditResCity(resAddr.city || '');
    setEditResTaluk(resAddr.taluk || '');
    setEditResPincode(resAddr.pincode || '');

    setEditSurveyNo(prop.survey_number || propDet.surveyNo || '');
    setEditPattaNo(propDet.pattaNo || '');
    setEditDno(propDet.dno || '');
    setEditStreetName(propDet.streetName || '');
    setEditVillage(prop.village || propDet.village || '');
    setEditPanchayat(propDet.panchayat || '');
    setEditTaluk(prop.taluk || propDet.taluk || '');
    setEditCity(propDet.city || '');
    setEditPincode(propDet.pincode || '');
    setEditJurisdiction(prop.jurisdiction || propDet.jurisdiction || 'DTCP');

    // Populate fee fields
    const fTotal = c.fees?.total ?? full.fees?.total ?? (full.feesAmount ? parseFloat(full.feesAmount) : 0);
    const fPaid = c.fees?.paid ?? full.fees?.paid ?? (full.paidAmount ? parseFloat(full.paidAmount) : 0);
    const fNotes = c.fees?.notes || full.feeNotes || '';
    setFeeTotal(fTotal ? fTotal.toString() : '');
    setFeePaid(fPaid ? fPaid.toString() : '');
    setFeeNotes(fNotes);

    // Populate Receipt & Credentials
    setReceiptNumber(upFiles.receiptNumber || full.receiptNumber || '');
    setPortalUsername(upFiles.username || full.portalUsername || '');
    setPortalPassword(upFiles.password || full.portalPassword || '');
    setApprovalCertNumber(c.approval_number || full.approvalNumber || '');
  };

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      const res = await applicationService.getById(id);
      if (res.data) {
        setCaseData(res.data);
        populateFields(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Upload Document Helper (Camera, Gallery, PDF)
  const handlePickDocument = async (docType: string) => {
    Alert.alert(
      `Upload ${docType}`,
      'Choose source to attach document:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission Denied', 'Camera access is required to take document photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (!result.canceled && result.assets[0]) {
              processUpload(docType, result.assets[0].uri, `${docType.toLowerCase().replace(/ /g, '_')}.jpg`);
            }
          },
        },
        {
          text: 'Gallery / Photos',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
              Alert.alert('Permission Denied', 'Photo library access is required.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
            if (!result.canceled && result.assets[0]) {
              processUpload(docType, result.assets[0].uri, `${docType.toLowerCase().replace(/ /g, '_')}.jpg`);
            }
          },
        },
        {
          text: 'Browse PDF / File',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
              processUpload(docType, result.assets[0].uri, result.assets[0].name);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const processUpload = async (docType: string, fileUri: string, fileName: string) => {
    if (!caseData) return;
    setUploadingDoc(docType);

    try {
      const uploadRes = await uploadToCloudinary(fileUri, fileName);
      if (!uploadRes.url) {
        Alert.alert('Upload Failed', uploadRes.error || 'Could not upload file to Cloudinary.');
        return;
      }

      const updatedFiles = {
        ...(caseData.uploadedFiles || {}),
        [docType]: uploadRes.url,
      };

      const updateRes = await applicationService.update(caseData.id, {
        uploadedFiles: updatedFiles,
      });

      if (updateRes.data) {
        setCaseData(updateRes.data);
        populateFields(updateRes.data);
        Alert.alert('File Uploaded', `${docType} attached and saved successfully!`);
      } else {
        Alert.alert('Save Error', updateRes.error || 'Failed to update case in MongoDB.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error occurred while saving file.');
    } finally {
      setUploadingDoc(null);
    }
  };

  // ==========================================
  // AUTOMATED STATUS & SCREEN TRANSITIONS
  // ==========================================

  // Step 1 -> Step 2: Auto-Update to DOCUMENTS_VERIFICATION & Change Screen
  const handleProceedToVerification = async () => {
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await applicationService.update(caseData.id, {
        status: 'DOCUMENTS_VERIFICATION',
      });
      if (res.data) {
        setCaseData(res.data);
        setActiveViewTab('workflow');
        Alert.alert('Stage 2: Verification', 'Status auto-updated to DOCUMENTS_VERIFICATION. Switched to Verification Screen.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Step 2 -> Step 3: Confirm Verification & Auto-Update to DOCUMENTS_VERIFIED
  const handleConfirmVerification = async () => {
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await applicationService.update(caseData.id, {
        status: 'DOCUMENTS_VERIFIED',
      });
      if (res.data) {
        setCaseData(res.data);
        setActiveViewTab('workflow');
        Alert.alert('Stage 3: Payment & Receipt', 'Documents verified! Status auto-updated to DOCUMENTS_VERIFIED. Switched to Receipt Screen.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Step 3 -> Step 4: Submit Payment & Receipt -> Auto-Update to SUBMITTED_FOR_APPROVAL
  const handleSubmitReceiptAndCredentials = async () => {
    if (!caseData) return;
    if (!receiptNumber.trim()) {
      Alert.alert('Required Field', 'Please enter the Receipt Number.');
      return;
    }
    if (!caseData.uploadedFiles?.['RECEIPT']) {
      Alert.alert('Receipt File Missing', 'Please upload the Receipt document before submitting.');
      return;
    }

    setActionInProgress(true);
    try {
      const updatedFiles = {
        ...(caseData.uploadedFiles || {}),
        receiptNumber: receiptNumber.trim(),
        username: portalUsername.trim(),
        password: portalPassword.trim(),
      };

      const res = await applicationService.update(caseData.id, {
        status: 'SUBMITTED_FOR_APPROVAL',
        uploadedFiles: updatedFiles,
        fullData: {
          ...(caseData.fullData || {}),
          receiptNumber: receiptNumber.trim(),
          portalUsername: portalUsername.trim(),
          portalPassword: portalPassword.trim(),
        },
      });

      if (res.data) {
        setCaseData(res.data);
        setActiveViewTab('workflow');
        Alert.alert('Stage 4: Government Approval', 'Payment & Receipt submitted! Status auto-updated to SUBMITTED_FOR_APPROVAL.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Step 4 -> Step 5: Final Approval Upload -> Auto-Update to COMPLETED
  const handleCompleteApplication = async () => {
    if (!caseData) return;
    if (!caseData.uploadedFiles?.['FINAL_APPROVAL']) {
      Alert.alert('Approval Document Missing', 'Please upload the signed Final Approval document to complete.');
      return;
    }

    setActionInProgress(true);
    try {
      const res = await applicationService.update(caseData.id, {
        status: 'COMPLETED',
        approval_number: approvalCertNumber.trim() || undefined,
        fullData: {
          ...(caseData.fullData || {}),
          approvalNumber: approvalCertNumber.trim(),
          completedAt: new Date().toISOString(),
        },
      });

      if (res.data) {
        setCaseData(res.data);
        setActiveViewTab('workflow');
        Alert.alert('Application Completed!', 'Congratulations! Application is officially approved and finalized.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Change stage backwards or navigate between stages
  const handleSetStage = async (newStage: WorkflowStage) => {
    if (!caseData) return;
    setActionInProgress(true);
    try {
      const res = await applicationService.update(caseData.id, { status: newStage });
      if (res.data) {
        setCaseData(res.data);
        setActiveViewTab('workflow');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  // Save Application Details (Edit Option)
  const handleSaveApplicationEdit = async () => {
    if (!caseData) return;
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Required Fields', 'Applicant Name and Mobile Number are required.');
      return;
    }

    setSavingEdit(true);
    try {
      const payload: Partial<Case> = {
        approval_type: editServiceType,
        property: {
          ...(caseData.property || {}),
          owner_name: editName.trim(),
          owner_phone: editPhone.trim(),
          owner_email: editEmail.trim() || undefined,
          address: `${editDno ? editDno + ', ' : ''}${editStreetName ? editStreetName + ', ' : ''}${editVillage || ''}`.trim() || caseData.property?.address || 'Site Address',
          village: editVillage.trim() || caseData.property?.village || '',
          taluk: editTaluk.trim() || editCity.trim() || caseData.property?.taluk || '',
          survey_number: editSurveyNo.trim() || caseData.property?.survey_number || 'TBD',
          jurisdiction: editJurisdiction,
        },
        fullData: {
          ...(caseData.fullData || {}),
          customerName: editName.trim(),
          fatherName: editFatherName.trim(),
          dob: editDob.trim(),
          mobile: editPhone.trim(),
          altMobile: editAltMobile.trim(),
          email: editEmail.trim(),
          aadhar: editAadhar.trim(),
          pan: editPan.trim(),
          serviceType: editServiceType,
          residentialAddress: {
            houseNo: editResHouseNo.trim(),
            streetName: editResStreet.trim(),
            city: editResCity.trim(),
            taluk: editResTaluk.trim(),
            pincode: editResPincode.trim(),
            state: 'Tamil Nadu',
            country: 'INDIA',
          },
          propertyDetails: {
            surveyNo: editSurveyNo.trim(),
            pattaNo: editPattaNo.trim(),
            dno: editDno.trim(),
            streetName: editStreetName.trim(),
            village: editVillage.trim(),
            panchayat: editPanchayat.trim(),
            taluk: editTaluk.trim(),
            city: editCity.trim(),
            pincode: editPincode.trim(),
            jurisdiction: editJurisdiction,
          },
        },
      };

      const res = await applicationService.update(caseData.id, payload);
      if (res.data) {
        setCaseData(res.data);
        populateFields(res.data);
        setEditModalVisible(false);
        Alert.alert('Saved', 'Application details updated successfully!');
      } else {
        Alert.alert('Update Error', res.error || 'Failed to update application.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setSavingEdit(false);
    }
  };

  // WhatsApp Share Upload Link
  const handleShareUploadLink = async () => {
    if (!caseData) return;
    const appNum = caseData.application_number || caseData.id;
    const uploadLink = `${WEB_BASE_URL}/upload/${appNum}`;
    const custName = caseData.property?.owner_name || caseData.fullData?.customerName || 'Customer';
    const rawPhone = caseData.property?.owner_phone || caseData.fullData?.mobile || '';

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const message = `Hello ${custName},\n\nPlease use the following secure link to upload your required documents for building approval application ${appNum}:\n${uploadLink}\n\nThank you,\nCB Building Approval Team`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(waUrl);

      // Update link tracking on MongoDB
      const updatedTracking = {
        ...(caseData.linkTracking || {}),
        sent: true,
        sendStatus: 'success',
        sentDate: new Date().toISOString(),
      };

      const res = await applicationService.update(caseData.id, {
        linkTracking: updatedTracking,
      });
      if (res.data) {
        setCaseData(res.data);
      }
    } catch {
      Share.share({
        title: `Upload Documents - ${appNum}`,
        message,
      });
    }
  };

  // Download / Print Application PDF
  const handleDownloadApplication = async () => {
    if (!caseData) return;
    const appNum = caseData.application_number || caseData.id;
    const printUrl = `${WEB_BASE_URL}/print/application/${appNum}`;

    Alert.alert(
      'Download & Print Application',
      `Application Number: ${appNum}\n\nChoose an option:`,
      [
        {
          text: 'Open PDF / Print View',
          onPress: () => Linking.openURL(printUrl),
        },
        {
          text: 'Share Summary',
          onPress: () => {
            const custName = caseData.property?.owner_name || caseData.fullData?.customerName || 'N/A';
            const phone = caseData.property?.owner_phone || caseData.fullData?.mobile || 'N/A';
            const srv = caseData.approval_type || 'Building Plan Approval';
            const village = caseData.property?.village || caseData.property?.address || 'Tamil Nadu';
            const survey = caseData.property?.survey_number || 'N/A';
            const status = caseData.status;
            const totalFee = caseData.fees?.total ?? caseData.fullData?.fees?.total ?? (caseData.fullData?.feesAmount || 0);

            const summary = `CB BUILDING APPROVAL - APPLICATION SUMMARY\n---------------------------------------\nApp Number: ${appNum}\nApplicant: ${custName}\nPhone: ${phone}\nService: ${srv}\nStatus: ${status}\nVillage/Site: ${village}\nSurvey No: ${survey}\nTotal Charges: ₹${totalFee}\nPrint/View Link: ${printUrl}\n`;

            Share.share({
              title: `Application Summary - ${appNum}`,
              message: summary,
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Save / Update Payment Charges
  const handleSavePaymentCharges = async () => {
    if (!caseData) return;
    setSavingFee(true);

    try {
      const totalNum = parseFloat(feeTotal) || 0;
      let paidNum = parseFloat(feePaid) || 0;

      const existingCharges = caseData.fees?.charges || caseData.fullData?.fees?.charges || [];
      const updatedCharges = [...existingCharges];

      if (newChargeAmount.trim()) {
        const addedAmt = parseFloat(newChargeAmount) || 0;
        if (addedAmt > 0) {
          updatedCharges.push({
            id: `chg-${Date.now()}`,
            description: newChargeDesc.trim() || `Payment via ${newChargeMode}`,
            amount: addedAmt,
            date: new Date().toISOString(),
          });
          paidNum += addedAmt;
        }
      }

      const pendingNum = Math.max(0, totalNum - paidNum);

      const updatedFees = {
        total: totalNum,
        paid: paidNum,
        pending: pendingNum,
        notes: feeNotes.trim(),
        charges: updatedCharges,
      };

      const payload: Partial<Case> = {
        fees: updatedFees,
        fullData: {
          ...(caseData.fullData || {}),
          feesAmount: totalNum.toString(),
          paidAmount: paidNum.toString(),
          feeNotes: feeNotes.trim(),
          fees: updatedFees,
        },
      };

      const res = await applicationService.update(caseData.id, payload);
      if (res.data) {
        setCaseData(res.data);
        populateFields(res.data);
        setNewChargeAmount('');
        setNewChargeDesc('');
        setFeeModalVisible(false);
        Alert.alert('Success', 'Payment charges updated successfully!');
      } else {
        Alert.alert('Update Failed', res.error || 'Could not update payment details.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save payments.');
    } finally {
      setSavingFee(false);
    }
  };

  // Send Re-upload Request via WhatsApp
  const handleSendReuploadRequest = async () => {
    if (!caseData || selectedForReupload.length === 0) {
      Alert.alert('Select Documents', 'Please select at least one document to request re-upload.');
      return;
    }

    setSendingReupload(true);
    const appNum = caseData.application_number || caseData.id;
    const uploadLink = `${WEB_BASE_URL}/upload/${appNum}`;
    const custName = caseData.property?.owner_name || caseData.fullData?.customerName || 'Customer';
    const rawPhone = caseData.property?.owner_phone || caseData.fullData?.mobile || '';

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const docList = selectedForReupload.map(d => `• ${d}`).join('\n');
    const message = `Hello ${custName},\n\nPlease note that the following document(s) require re-upload for application ${appNum}:\n${docList}\n\nPlease click here to upload them directly:\n${uploadLink}\n\nCB Building Approval`;

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    try {
      await Linking.openURL(waUrl);

      const updatedTracking = {
        ...(caseData.linkTracking || {}),
        requestedReuploads: selectedForReupload,
      };

      await applicationService.update(caseData.id, {
        linkTracking: updatedTracking,
      });

      setReuploadModalVisible(false);
      setSelectedForReupload([]);
      Alert.alert('Success', 'Re-upload request sent via WhatsApp!');
    } catch {
      Share.share({
        title: `Re-upload Request - ${appNum}`,
        message,
      });
      setReuploadModalVisible(false);
    } finally {
      setSendingReupload(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!caseData) {
    return (
      <View style={styles.container}>
        <MobileHeader title="Application Details" showBack />
        <View style={[styles.center, { padding: 20 }]}>
          <Text style={{ color: Colors.textSecondary }}>Application not found.</Text>
        </View>
      </View>
    );
  }

  const currentStage = getStageFromStatus(caseData.status);
  const currentStageIndex = STAGES.findIndex(s => s.key === currentStage);
  const uploadedFiles = caseData.uploadedFiles || {};
  const currentTotal = caseData.fees?.total ?? caseData.fullData?.fees?.total ?? (caseData.fullData?.feesAmount ? parseFloat(caseData.fullData.feesAmount) : 0);
  const currentPaid = caseData.fees?.paid ?? caseData.fullData?.fees?.paid ?? (caseData.fullData?.paidAmount ? parseFloat(caseData.fullData.paidAmount) : 0);
  const currentPending = caseData.fees?.pending ?? Math.max(0, currentTotal - currentPaid);
  const feeRemarks = caseData.fees?.notes || caseData.fullData?.feeNotes || '';
  const recordedCharges = caseData.fees?.charges || caseData.fullData?.fees?.charges || [];
  const linkTracking = caseData.linkTracking || {};

  // Count uploaded docs excluding receipt & final approval
  const coreDocsUploaded = Object.keys(uploadedFiles).filter(
    k => !['receiptNumber', 'username', 'password', 'RECEIPT', 'FINAL_APPROVAL'].includes(k)
  ).length;

  return (
    <View style={styles.container}>
      <MobileHeader
        title={caseData.application_number || caseData.id}
        showBack
        rightAction={
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => setEditModalVisible(true)}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.headerEditBtnText}>Edit</Text>
          </TouchableOpacity>
        }
      />

      {/* STAGE PIPELINE PROGRESS TRACKER */}
      <View style={styles.pipelineBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pipelineContent}>
          {STAGES.map((st, idx) => {
            const isCompleted = currentStageIndex > idx || currentStage === 'COMPLETED';
            const isActive = currentStage === st.key;
            return (
              <React.Fragment key={st.key}>
                <TouchableOpacity
                  style={[
                    styles.pipelineStep,
                    isActive && styles.pipelineStepActive,
                    isCompleted && styles.pipelineStepCompleted,
                  ]}
                  onPress={() => {
                    handleSetStage(st.key);
                  }}
                >
                  <View
                    style={[
                      styles.pipelineBadge,
                      isActive && styles.pipelineBadgeActive,
                      isCompleted && styles.pipelineBadgeCompleted,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.pipelineBadgeText,
                          isActive && styles.pipelineBadgeTextActive,
                        ]}
                      >
                        {st.stepNum}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.pipelineStepLabel,
                      isActive && styles.pipelineStepLabelActive,
                      isCompleted && styles.pipelineStepLabelCompleted,
                    ]}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>

                {idx < STAGES.length - 1 && (
                  <View
                    style={[
                      styles.pipelineConnector,
                      currentStageIndex > idx && styles.pipelineConnectorDone,
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>

      {/* VIEW SWITCHER TABS: Workflow Step vs Full Overview */}
      <View style={styles.viewTabContainer}>
        <TouchableOpacity
          style={[styles.viewTab, activeViewTab === 'workflow' && styles.viewTabActive]}
          onPress={() => setActiveViewTab('workflow')}
        >
          <Ionicons
            name="git-commit-outline"
            size={16}
            color={activeViewTab === 'workflow' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.viewTabText, activeViewTab === 'workflow' && styles.viewTabTextActive]}>
            Active Step View ({currentStage.replace(/_/g, ' ')})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.viewTab, activeViewTab === 'overview' && styles.viewTabActive]}
          onPress={() => setActiveViewTab('overview')}
        >
          <Ionicons
            name="layers-outline"
            size={16}
            color={activeViewTab === 'overview' ? Colors.primary : Colors.textSecondary}
          />
          <Text style={[styles.viewTabText, activeViewTab === 'overview' && styles.viewTabTextActive]}>
            Full Overview
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 30, 48) }]}>
        {/* ======================================================== */}
        {/* VIEW 1: ACTIVE WORKFLOW STAGE AUTO-TRANSITION SCREENS   */}
        {/* ======================================================== */}
        {activeViewTab === 'workflow' && (
          <View>
            {/* ---------------------------------------------------- */}
            {/* STAGE 1: DOCUMENTS COLLECTION SCREEN                */}
            {/* ---------------------------------------------------- */}
            {currentStage === 'PENDING_DOCUMENTS' && (
              <View>
                <View style={styles.stageCard}>
                  <View style={styles.stageCardHeader}>
                    <View style={styles.stageIconWrap}>
                      <Ionicons name="documents-outline" size={22} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stageTitle}>Stage 1: Documents Collection</Text>
                      <Text style={styles.stageSub}>
                        Collect customer documents or share WhatsApp upload link.
                      </Text>
                    </View>
                  </View>

                  {/* WhatsApp Quick Action Banner */}
                  <View style={styles.stageInnerBox}>
                    <Text style={styles.stageInnerTitle}>Customer Upload Link:</Text>
                    <Text style={styles.stageInnerSub}>
                      Send the magic upload link to the customer so they can directly upload documents from mobile.
                    </Text>
                    <TouchableOpacity style={styles.stageWaBtn} onPress={handleShareUploadLink}>
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                      <Text style={styles.stageWaBtnText}>Share Upload Link on WhatsApp</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Checklist Summary */}
                  <View style={styles.stageChecklistRow}>
                    <Text style={styles.stageChecklistCount}>
                      {coreDocsUploaded} of 8 Key Documents Uploaded
                    </Text>
                    <TouchableOpacity onPress={() => setActiveViewTab('overview')}>
                      <Text style={styles.stageChecklistViewAll}>View Checklist →</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Auto-Advance Button */}
                  <TouchableOpacity
                    style={styles.stagePrimaryBtn}
                    onPress={handleProceedToVerification}
                    disabled={actionInProgress}
                  >
                    {actionInProgress ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={styles.stagePrimaryBtnText}>Proceed to Document Verification</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ---------------------------------------------------- */}
            {/* STAGE 2: DOCUMENT VERIFICATION SCREEN               */}
            {/* ---------------------------------------------------- */}
            {currentStage === 'DOCUMENTS_VERIFICATION' && (
              <View style={styles.stageCard}>
                <View style={styles.stageCardHeader}>
                  <View style={[styles.stageIconWrap, { backgroundColor: '#EFF6FF' }]}>
                    <Ionicons name="checkmark-done-circle" size={24} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageTitle}>Stage 2: Document Verification</Text>
                    <Text style={styles.stageSub}>
                      Please review the uploaded customer documents and confirm verification.
                    </Text>
                  </View>
                </View>

                {/* Uploaded Documents Grid */}
                <View style={styles.verifyGrid}>
                  {REQUIRED_DOCS.filter(d => !['RECEIPT', 'FINAL_APPROVAL'].includes(d)).map(doc => {
                    const isUploaded = !!uploadedFiles[doc];
                    const url = uploadedFiles[doc] as string | undefined;
                    return (
                      <View key={doc} style={styles.verifyItem}>
                        <Ionicons
                          name={isUploaded ? 'checkmark-circle' : 'alert-circle-outline'}
                          size={18}
                          color={isUploaded ? Colors.successGreen : Colors.warningGold}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.verifyItemName} numberOfLines={1}>{doc}</Text>
                          <Text style={styles.verifyItemStatus}>
                            {isUploaded ? 'Uploaded' : 'Pending'}
                          </Text>
                        </View>
                        {isUploaded ? (
                          <TouchableOpacity
                            style={styles.verifyViewBtn}
                            onPress={() => {
                              setViewingDocKey(doc);
                              setViewingDocUrl(url!);
                              setViewerModalVisible(true);
                            }}
                          >
                            <Text style={styles.verifyViewBtnText}>View</Text>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={styles.verifyUploadBtn}
                            onPress={() => handlePickDocument(doc)}
                          >
                            <Text style={styles.verifyUploadBtnText}>Attach</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>

                {/* Auto-Advance Button to DOCUMENTS_VERIFIED */}
                <TouchableOpacity
                  style={[styles.stagePrimaryBtn, { backgroundColor: Colors.successGreen }]}
                  onPress={handleConfirmVerification}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.stagePrimaryBtnText}>Confirm Verification & Proceed to Receipt</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stageBackBtn}
                  onPress={() => handleSetStage('PENDING_DOCUMENTS')}
                >
                  <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                  <Text style={styles.stageBackBtnText}>Back to Documents Collection</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ---------------------------------------------------- */}
            {/* STAGE 3: PAYMENT & RECEIPT UPLOAD SCREEN             */}
            {/* ---------------------------------------------------- */}
            {currentStage === 'DOCUMENTS_VERIFIED' && (
              <View style={styles.stageCard}>
                <View style={styles.stageCardHeader}>
                  <View style={[styles.stageIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="receipt-outline" size={24} color="#D97706" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageTitle}>Stage 3: Upload Receipt & Payment Info</Text>
                    <Text style={styles.stageSub}>
                      Enter government receipt details and portal login credentials.
                    </Text>
                  </View>
                </View>

                {/* Receipt Fields */}
                <View style={styles.stageForm}>
                  <Text style={styles.inputLabel}>Receipt Number *</Text>
                  <TextInput
                    style={styles.stageInput}
                    placeholder="Enter Government Receipt Number"
                    value={receiptNumber}
                    onChangeText={setReceiptNumber}
                  />

                  <Text style={styles.inputLabel}>Government Portal Username</Text>
                  <TextInput
                    style={styles.stageInput}
                    placeholder="e.g. TN_DTCP_USR_982"
                    value={portalUsername}
                    onChangeText={setPortalUsername}
                    autoCapitalize="none"
                  />

                  <Text style={styles.inputLabel}>Government Portal Password</Text>
                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      style={[styles.stageInput, { flex: 1, borderWidth: 0 }]}
                      placeholder="Portal Password"
                      secureTextEntry={!showPassword}
                      value={portalPassword}
                      onChangeText={setPortalPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ paddingHorizontal: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={Colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Receipt Document File *</Text>
                  {uploadedFiles['RECEIPT'] ? (
                    <View style={styles.uploadedReceiptBox}>
                      <Ionicons name="checkmark-circle" size={22} color={Colors.successGreen} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.uploadedReceiptTitle}>Receipt File Attached</Text>
                        <Text style={styles.uploadedReceiptSub}>Ready for approval submission</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.verifyViewBtn}
                        onPress={() => {
                          setViewingDocKey('RECEIPT');
                          setViewingDocUrl(uploadedFiles['RECEIPT'] as string);
                          setViewerModalVisible(true);
                        }}
                      >
                        <Text style={styles.verifyViewBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.verifyUploadBtn, { marginLeft: 4 }]}
                        onPress={() => handlePickDocument('RECEIPT')}
                      >
                        <Text style={styles.verifyUploadBtnText}>Replace</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadDropZone}
                      onPress={() => handlePickDocument('RECEIPT')}
                    >
                      <Ionicons name="cloud-upload-outline" size={32} color={Colors.primary} />
                      <Text style={styles.uploadDropZoneTitle}>Upload Official Receipt File</Text>
                      <Text style={styles.uploadDropZoneSub}>Take camera photo or pick PDF / file</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Auto-Advance Button to SUBMITTED_FOR_APPROVAL */}
                <TouchableOpacity
                  style={styles.stagePrimaryBtn}
                  onPress={handleSubmitReceiptAndCredentials}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.stagePrimaryBtnText}>Submit Receipt & Proceed to Final Approval</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stageBackBtn}
                  onPress={() => handleSetStage('DOCUMENTS_VERIFICATION')}
                >
                  <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                  <Text style={styles.stageBackBtnText}>Back to Verification Screen</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ---------------------------------------------------- */}
            {/* STAGE 4: FINAL APPROVAL UPLOAD SCREEN               */}
            {/* ---------------------------------------------------- */}
            {currentStage === 'SUBMITTED_FOR_APPROVAL' && (
              <View style={styles.stageCard}>
                <View style={styles.stageCardHeader}>
                  <View style={[styles.stageIconWrap, { backgroundColor: '#F0FDF4' }]}>
                    <Ionicons name="ribbon-outline" size={24} color={Colors.successGreen} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stageTitle}>Stage 4: Final Approval Upload</Text>
                    <Text style={styles.stageSub}>
                      Upload the signed and approved building plan certificate to complete.
                    </Text>
                  </View>
                </View>

                <View style={styles.stageForm}>
                  <Text style={styles.inputLabel}>Approval / Order Certificate Number</Text>
                  <TextInput
                    style={styles.stageInput}
                    placeholder="e.g. DTCP/BLD/2026/894"
                    value={approvalCertNumber}
                    onChangeText={setApprovalCertNumber}
                  />

                  <Text style={[styles.inputLabel, { marginTop: 12 }]}>Final Approval Certificate Document *</Text>
                  {uploadedFiles['FINAL_APPROVAL'] ? (
                    <View style={styles.uploadedReceiptBox}>
                      <Ionicons name="checkmark-circle" size={22} color={Colors.successGreen} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.uploadedReceiptTitle}>Approval Certificate Uploaded</Text>
                        <Text style={styles.uploadedReceiptSub}>Ready to finalize application</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.verifyViewBtn}
                        onPress={() => {
                          setViewingDocKey('FINAL_APPROVAL');
                          setViewingDocUrl(uploadedFiles['FINAL_APPROVAL'] as string);
                          setViewerModalVisible(true);
                        }}
                      >
                        <Text style={styles.verifyViewBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.verifyUploadBtn, { marginLeft: 4 }]}
                        onPress={() => handlePickDocument('FINAL_APPROVAL')}
                      >
                        <Text style={styles.verifyUploadBtnText}>Replace</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadDropZone}
                      onPress={() => handlePickDocument('FINAL_APPROVAL')}
                    >
                      <Ionicons name="ribbon-outline" size={36} color={Colors.successGreen} />
                      <Text style={[styles.uploadDropZoneTitle, { color: Colors.successGreen }]}>
                        Upload Final Government Approval File
                      </Text>
                      <Text style={styles.uploadDropZoneSub}>Take camera photo or pick signed PDF</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Complete Application Auto-Update */}
                <TouchableOpacity
                  style={[styles.stagePrimaryBtn, { backgroundColor: Colors.successGreen }]}
                  onPress={handleCompleteApplication}
                  disabled={actionInProgress}
                >
                  {actionInProgress ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
                      <Text style={styles.stagePrimaryBtnText}>Upload Approval & Complete Application</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stageBackBtn}
                  onPress={() => handleSetStage('DOCUMENTS_VERIFIED')}
                >
                  <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                  <Text style={styles.stageBackBtnText}>Back to Receipt Screen</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ---------------------------------------------------- */}
            {/* STAGE 5: COMPLETED CELEBRATION SCREEN                */}
            {/* ---------------------------------------------------- */}
            {currentStage === 'COMPLETED' && (
              <View style={styles.completedCard}>
                <Ionicons name="checkmark-circle" size={56} color={Colors.successGreen} />
                <Text style={styles.completedTitle}>Application Officially Completed!</Text>
                <Text style={styles.completedSub}>
                  This application process has been completely verified, paid, and officially approved.
                </Text>

                <View style={styles.completedActionsRow}>
                  {uploadedFiles['FINAL_APPROVAL'] && (
                    <TouchableOpacity
                      style={styles.completedBtn}
                      onPress={() => {
                        setViewingDocKey('FINAL_APPROVAL');
                        setViewingDocUrl(uploadedFiles['FINAL_APPROVAL'] as string);
                        setViewerModalVisible(true);
                      }}
                    >
                      <Ionicons name="ribbon" size={16} color="#FFFFFF" />
                      <Text style={styles.completedBtnText}>View Certificate</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.completedBtn, { backgroundColor: Colors.primary }]}
                    onPress={handleDownloadApplication}
                  >
                    <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.completedBtnText}>Print PDF</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.completedOverviewBtn}
                  onPress={() => setActiveViewTab('overview')}
                >
                  <Text style={styles.completedOverviewBtnText}>View All Application Details →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ======================================================== */}
        {/* VIEW 2: FULL APPLICATION DETAILS & OVERVIEW             */}
        {/* ======================================================== */}
        {(activeViewTab === 'overview' || currentStage === 'COMPLETED') && (
          <View>
            {/* Status & Quick Action Toolbar */}
            <View style={styles.statusBanner}>
              <View>
                <Text style={styles.bannerLabel}>Current Status</Text>
                <View style={{ marginTop: 4 }}>
                  <StatusBadge status={caseData.status} />
                </View>
              </View>

              <TouchableOpacity
                style={styles.pipelineSwitchBtn}
                onPress={() => setActiveViewTab('workflow')}
              >
                <Ionicons name="git-pull-request-outline" size={14} color="#FFFFFF" />
                <Text style={styles.pipelineSwitchBtnText}>Workflow Step</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Grid: WhatsApp Link, Edit, Download, Fees */}
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionGridCard} onPress={handleShareUploadLink}>
                <View style={[styles.actionIconCircle, { backgroundColor: '#25D366' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionGridTitle}>WhatsApp Link</Text>
                <Text style={styles.actionGridSub}>Get Docs</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridCard} onPress={() => setFeeModalVisible(true)}>
                <View style={[styles.actionIconCircle, { backgroundColor: Colors.warningGold }]}>
                  <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionGridTitle}>Payment</Text>
                <Text style={styles.actionGridSub}>Charges</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridCard} onPress={handleDownloadApplication}>
                <View style={[styles.actionIconCircle, { backgroundColor: Colors.primary }]}>
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionGridTitle}>Download</Text>
                <Text style={styles.actionGridSub}>Print PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionGridCard} onPress={() => setEditModalVisible(true)}>
                <View style={[styles.actionIconCircle, { backgroundColor: Colors.primaryDark }]}>
                  <Ionicons name="create-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionGridTitle}>Edit Details</Text>
                <Text style={styles.actionGridSub}>Modify</Text>
              </TouchableOpacity>
            </View>

            {/* Customer WhatsApp Document Upload Link Card */}
            <View style={styles.whatsappCard}>
              <View style={styles.whatsappHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="share-social-outline" size={20} color={Colors.primary} />
                  <Text style={styles.whatsappTitle}>Customer Document Upload Link</Text>
                </View>
                {linkTracking.sent ? (
                  <View style={styles.linkSentBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.successGreen} />
                    <Text style={styles.linkSentText}>Link Sent</Text>
                  </View>
                ) : (
                  <View style={styles.linkPendingBadge}>
                    <Text style={styles.linkPendingText}>Not Sent</Text>
                  </View>
                )}
              </View>

              <Text style={styles.whatsappDesc}>
                Share this secure link with the customer to allow them to directly upload documents from their phone.
              </Text>

              <View style={styles.linkDisplayBox}>
                <Text style={styles.linkDisplayText} numberOfLines={1}>
                  {`${WEB_BASE_URL}/upload/${caseData.application_number || caseData.id}`}
                </Text>
              </View>

              <View style={styles.whatsappBtnRow}>
                <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareUploadLink}>
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.whatsappBtnText}>Send on WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.copyLinkBtn}
                  onPress={() => {
                    const appNum = caseData.application_number || caseData.id;
                    Share.share({
                      title: `Upload Link - ${appNum}`,
                      message: `Document Upload Link:\n${WEB_BASE_URL}/upload/${appNum}`,
                    });
                  }}
                >
                  <Ionicons name="copy-outline" size={16} color={Colors.primary} />
                  <Text style={styles.copyLinkBtnText}>Share Link</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Payment & Charges Section */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cash-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sectionHeader}>Payment Charges & Fees</Text>
                </View>
                <TouchableOpacity
                  style={styles.addFeeHeaderBtn}
                  onPress={() => setFeeModalVisible(true)}
                >
                  <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
                  <Text style={styles.addFeeHeaderText}>Add / Update</Text>
                </TouchableOpacity>
              </View>

              {/* Fee Metrics Row */}
              <View style={styles.feeGrid}>
                <View style={styles.feeItem}>
                  <Text style={styles.feeItemLabel}>Total Charges</Text>
                  <Text style={styles.feeItemValue}>₹{currentTotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.feeItem}>
                  <Text style={styles.feeItemLabel}>Amount Paid</Text>
                  <Text style={[styles.feeItemValue, { color: Colors.successGreen }]}>
                    ₹{currentPaid.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.feeItem}>
                  <Text style={styles.feeItemLabel}>Pending Balance</Text>
                  <Text
                    style={[
                      styles.feeItemValue,
                      { color: currentPending > 0 ? Colors.warningGold : Colors.successGreen },
                    ]}
                  >
                    ₹{currentPending.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {feeRemarks ? (
                <View style={styles.feeNotesBox}>
                  <Text style={styles.feeNotesLabel}>Fee Notes:</Text>
                  <Text style={styles.feeNotesContent}>{feeRemarks}</Text>
                </View>
              ) : null}

              {/* Recorded Payment Transactions */}
              {recordedCharges.length > 0 && (
                <View style={styles.chargesList}>
                  <Text style={styles.chargesListTitle}>Payment Transactions:</Text>
                  {recordedCharges.map((chg: any, idx: number) => (
                    <View key={chg.id || idx} style={styles.chargeRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.chargeDesc}>{chg.description || 'Payment'}</Text>
                        <Text style={styles.chargeDate}>
                          {chg.date ? new Date(chg.date).toLocaleDateString('en-GB') : 'Recent'}
                        </Text>
                      </View>
                      <Text style={styles.chargeAmt}>+₹{chg.amount?.toLocaleString('en-IN')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Applicant Details */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="person-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sectionHeader}>Applicant Details</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditTab('applicant'); setEditModalVisible(true); }}>
                  <Text style={styles.editCardText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Owner Name:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.owner_name || caseData.fullData?.customerName || 'N/A'}
                </Text>
              </View>

              {caseData.fullData?.fatherName ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Father / Spouse:</Text>
                  <Text style={styles.infoValue}>{caseData.fullData.fatherName}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mobile Number:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.owner_phone || caseData.fullData?.mobile || 'N/A'}
                </Text>
              </View>

              {caseData.fullData?.altMobile ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Alt Mobile:</Text>
                  <Text style={styles.infoValue}>{caseData.fullData.altMobile}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.owner_email || caseData.fullData?.email || 'N/A'}
                </Text>
              </View>

              {caseData.fullData?.aadhar ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Aadhaar Number:</Text>
                  <Text style={styles.infoValue}>{caseData.fullData.aadhar}</Text>
                </View>
              ) : null}

              {caseData.fullData?.pan ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>PAN Number:</Text>
                  <Text style={styles.infoValue}>{caseData.fullData.pan}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Service Type:</Text>
                <Text style={styles.infoValue}>
                  {(caseData.approval_type || caseData.fullData?.serviceType || 'Building Plan').replace(/_/g, ' ')}
                </Text>
              </View>
            </View>

            {/* Site & Property Details */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="business-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sectionHeader}>Property & Site Details</Text>
                </View>
                <TouchableOpacity onPress={() => { setEditTab('property'); setEditModalVisible(true); }}>
                  <Text style={styles.editCardText}>Edit</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Survey Number:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.survey_number || caseData.fullData?.propertyDetails?.surveyNo || 'N/A'}
                </Text>
              </View>

              {caseData.fullData?.propertyDetails?.pattaNo ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patta Number:</Text>
                  <Text style={styles.infoValue}>{caseData.fullData.propertyDetails.pattaNo}</Text>
                </View>
              ) : null}

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Site Address:</Text>
                <Text style={styles.infoValue}>{caseData.property?.address || 'N/A'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Village / Area:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.village || caseData.fullData?.propertyDetails?.village || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Taluk / District:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.taluk || caseData.fullData?.propertyDetails?.taluk || 'N/A'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Jurisdiction:</Text>
                <Text style={styles.infoValue}>
                  {caseData.property?.jurisdiction || caseData.fullData?.propertyDetails?.jurisdiction || 'DTCP'}
                </Text>
              </View>
            </View>

            {/* Document Checklist & Uploads */}
            <View style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="document-text-outline" size={18} color={Colors.primary} />
                  <Text style={styles.sectionHeader}>Documents Checklist</Text>
                </View>
                <Text style={styles.docCount}>
                  {Object.keys(uploadedFiles).length} / {REQUIRED_DOCS.length} Uploaded
                </Text>
              </View>

              {/* Quick Doc Actions */}
              <View style={styles.docActionsBar}>
                <TouchableOpacity
                  style={styles.reuploadReqBtn}
                  onPress={() => setReuploadModalVisible(true)}
                >
                  <Ionicons name="repeat-outline" size={14} color="#D97706" />
                  <Text style={styles.reuploadReqBtnText}>Request Re-upload (WhatsApp)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bulkDownloadBtn}
                  onPress={() => {
                    const urls = Object.values(uploadedFiles).filter(Boolean);
                    if (urls.length === 0) {
                      Alert.alert('No Documents', 'No documents uploaded yet.');
                      return;
                    }
                    Linking.openURL(urls[0] as string);
                  }}
                >
                  <Ionicons name="download-outline" size={14} color={Colors.primary} />
                  <Text style={styles.bulkDownloadBtnText}>View First Doc</Text>
                </TouchableOpacity>
              </View>

              {REQUIRED_DOCS.map(docKey => {
                const isUploaded = !!uploadedFiles[docKey];
                const fileUrl = uploadedFiles[docKey] as string | undefined;
                const isUploadingThis = uploadingDoc === docKey;
                const isImage = fileUrl && (fileUrl.endsWith('.jpg') || fileUrl.endsWith('.png') || fileUrl.endsWith('.jpeg') || fileUrl.includes('cloudinary'));

                return (
                  <View key={docKey} style={styles.docItem}>
                    <View style={styles.docItemLeft}>
                      {isUploaded && isImage ? (
                        <TouchableOpacity
                          onPress={() => {
                            setViewingDocKey(docKey);
                            setViewingDocUrl(fileUrl!);
                            setViewerModalVisible(true);
                          }}
                        >
                          <Image source={{ uri: fileUrl }} style={styles.docThumb} />
                        </TouchableOpacity>
                      ) : (
                        <Ionicons
                          name={isUploaded ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isUploaded ? Colors.successGreen : Colors.textMuted}
                        />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docName}>{docKey}</Text>
                        {isUploaded && (
                          <Text style={styles.docStatusText}>Attached to MongoDB</Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.docItemRight}>
                      {isUploadingThis ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : isUploaded ? (
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.viewDocBtn}
                            onPress={() => {
                              setViewingDocKey(docKey);
                              setViewingDocUrl(fileUrl!);
                              setViewerModalVisible(true);
                            }}
                          >
                            <Ionicons name="eye-outline" size={14} color={Colors.primary} />
                            <Text style={styles.viewDocText}>View</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.replaceDocBtn}
                            onPress={() => handlePickDocument(docKey)}
                          >
                            <Ionicons name="cloud-upload-outline" size={14} color={Colors.textSecondary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.uploadDocBtn}
                          onPress={() => handlePickDocument(docKey)}
                        >
                          <Ionicons name="cloud-upload-outline" size={14} color="#FFFFFF" />
                          <Text style={styles.uploadDocText}>Upload</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Download Printable Application PDF Button */}
            <TouchableOpacity style={styles.downloadAppBtn} onPress={handleDownloadApplication}>
              <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
              <Text style={styles.downloadAppBtnText}>Download & Print Application</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODALS: EDIT APPLICATION, PAYMENTS, VIEWER, RE-UPLOAD     */}
      {/* ======================================================== */}

      {/* MODAL 1: EDIT APPLICATION DETAILS */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Application Details</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Edit Sub-tabs */}
            <View style={styles.editTabRow}>
              <TouchableOpacity
                style={[styles.editTabBtn, editTab === 'applicant' && styles.editTabBtnActive]}
                onPress={() => setEditTab('applicant')}
              >
                <Text style={[styles.editTabText, editTab === 'applicant' && styles.editTabTextActive]}>
                  Applicant Info
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editTabBtn, editTab === 'property' && styles.editTabBtnActive]}
                onPress={() => setEditTab('property')}
              >
                <Text style={[styles.editTabText, editTab === 'property' && styles.editTabTextActive]}>
                  Property & Site
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {editTab === 'applicant' ? (
                <View>
                  <Text style={styles.inputLabel}>Applicant Full Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Customer Name"
                  />

                  <Text style={styles.inputLabel}>Father's / Spouse's Name</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editFatherName}
                    onChangeText={setEditFatherName}
                    placeholder="Father Name"
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Mobile Number *</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editPhone}
                        onChangeText={setEditPhone}
                        keyboardType="phone-pad"
                        placeholder="10-digit mobile"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.inputLabel}>Alt Mobile</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editAltMobile}
                        onChangeText={setEditAltMobile}
                        keyboardType="phone-pad"
                        placeholder="Optional"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Email Address</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholder="email@example.com"
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Aadhaar Number</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editAadhar}
                        onChangeText={setEditAadhar}
                        keyboardType="numeric"
                        placeholder="12-digit Aadhaar"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.inputLabel}>PAN Number</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editPan}
                        onChangeText={setEditPan}
                        autoCapitalize="characters"
                        placeholder="PAN Card"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Service / Approval Type</Text>
                  <View style={styles.chipRow}>
                    {[
                      { label: 'Building Plan', val: 'BUILDING_PLAN_APPROVAL' },
                      { label: 'Layout Approval', val: 'LAYOUT_APPROVAL' },
                      { label: 'Patta Transfer', val: 'PATTA_TRANSFER' },
                      { label: 'Completion Cert', val: 'COMPLETION_CERTIFICATE' },
                    ].map(st => (
                      <TouchableOpacity
                        key={st.val}
                        style={[styles.typeChip, editServiceType === st.val && styles.typeChipActive]}
                        onPress={() => setEditServiceType(st.val)}
                      >
                        <Text style={[styles.typeChipText, editServiceType === st.val && styles.typeChipTextActive]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Residential Street / Area</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={editResStreet}
                    onChangeText={setEditResStreet}
                    placeholder="e.g. Gandhi Nagar"
                  />

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>City / Area</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editResCity}
                        onChangeText={setEditResCity}
                        placeholder="City"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.inputLabel}>Pincode</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editResPincode}
                        onChangeText={setEditResPincode}
                        keyboardType="numeric"
                        placeholder="6-digit pin"
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Survey Number *</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editSurveyNo}
                        onChangeText={setEditSurveyNo}
                        placeholder="e.g. 142/2A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.inputLabel}>Patta Number</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editPattaNo}
                        onChangeText={setEditPattaNo}
                        placeholder="e.g. 4391"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Door / Plot No</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editDno}
                        onChangeText={setEditDno}
                        placeholder="e.g. Plot 12"
                      />
                    </View>
                    <View style={{ flex: 2, marginLeft: 10 }}>
                      <Text style={styles.inputLabel}>Street / Road</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editStreetName}
                        onChangeText={setEditStreetName}
                        placeholder="Main Road"
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Village / Area *</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editVillage}
                        onChangeText={setEditVillage}
                        placeholder="Village"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.inputLabel}>Taluk / District</Text>
                      <TextInput
                        style={styles.modalInput}
                        value={editTaluk}
                        onChangeText={setEditTaluk}
                        placeholder="Taluk"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Jurisdiction</Text>
                  <View style={styles.chipRow}>
                    {['DTCP', 'TOWN_PANCHAYAT', 'PANCHAYAT_UNION'].map(j => (
                      <TouchableOpacity
                        key={j}
                        style={[styles.typeChip, editJurisdiction === j && styles.typeChipActive]}
                        onPress={() => setEditJurisdiction(j)}
                      >
                        <Text style={[styles.typeChipText, editJurisdiction === j && styles.typeChipTextActive]}>
                          {j.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveApplicationEdit}
                disabled={savingEdit}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: PAYMENT CHARGES & FEES */}
      <Modal visible={feeModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Manage Payment Charges</Text>
              <TouchableOpacity onPress={() => setFeeModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Estimated Total Fee (₹) *</Text>
              <TextInput
                style={styles.modalInput}
                value={feeTotal}
                onChangeText={setFeeTotal}
                keyboardType="numeric"
                placeholder="e.g. 35000"
              />

              <Text style={styles.inputLabel}>Amount Paid So Far (₹)</Text>
              <TextInput
                style={styles.modalInput}
                value={feePaid}
                onChangeText={setFeePaid}
                keyboardType="numeric"
                placeholder="e.g. 15000"
              />

              {/* Calculated Balance */}
              <View style={styles.feeCalcBox}>
                <Text style={styles.feeCalcLabel}>Calculated Balance Pending:</Text>
                <Text style={styles.feeCalcVal}>
                  ₹{Math.max(0, (parseFloat(feeTotal) || 0) - (parseFloat(feePaid) || 0)).toLocaleString('en-IN')}
                </Text>
              </View>

              <Text style={[styles.sectionSubHeader, { marginTop: 14 }]}>+ Record New Payment Entry</Text>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Add Amount (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newChargeAmount}
                    onChangeText={setNewChargeAmount}
                    keyboardType="numeric"
                    placeholder="e.g. 5000"
                  />
                </View>
                <View style={{ flex: 1.2, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newChargeDesc}
                    onChangeText={setNewChargeDesc}
                    placeholder="e.g. Scrutiny Fee"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Payment Mode</Text>
              <View style={styles.chipRow}>
                {['UPI', 'Cash', 'Bank Transfer', 'Cheque'].map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.typeChip, newChargeMode === m && styles.typeChipActive]}
                    onPress={() => setNewChargeMode(m)}
                  >
                    <Text style={[styles.typeChipText, newChargeMode === m && styles.typeChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Fee Notes & Remarks</Text>
              <TextInput
                style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]}
                value={feeNotes}
                onChangeText={setFeeNotes}
                multiline
                numberOfLines={2}
                placeholder="Notes or breakdown remarks..."
              />
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setFeeModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSavePaymentCharges}
                disabled={savingFee}
              >
                {savingFee ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>Save Payment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 3: IN-APP DOCUMENT VIEWER */}
      <Modal visible={viewerModalVisible} transparent animationType="fade">
        <View style={styles.viewerModalOverlay}>
          <View style={styles.viewerModalHeader}>
            <Text style={styles.viewerDocTitle} numberOfLines={1}>{viewingDocKey}</Text>
            <TouchableOpacity onPress={() => setViewerModalVisible(false)} style={styles.viewerCloseBtn}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.viewerBody}>
            {viewingDocUrl ? (
              viewingDocUrl.endsWith('.pdf') ? (
                <View style={styles.pdfNotice}>
                  <Ionicons name="document-text" size={64} color="#FFFFFF" />
                  <Text style={styles.pdfNoticeTitle}>PDF Document</Text>
                  <Text style={styles.pdfNoticeSub}>This file is in PDF format.</Text>
                  <TouchableOpacity
                    style={styles.pdfOpenBtn}
                    onPress={() => Linking.openURL(viewingDocUrl)}
                  >
                    <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.pdfOpenBtnText}>Open in External Viewer</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Image
                  source={{ uri: viewingDocUrl }}
                  style={styles.viewerImage}
                  resizeMode="contain"
                />
              )
            ) : (
              <ActivityIndicator size="large" color="#FFFFFF" />
            )}
          </View>

          <View style={[styles.viewerFooter, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
            <TouchableOpacity
              style={styles.viewerActionBtn}
              onPress={() => Linking.openURL(viewingDocUrl)}
            >
              <Ionicons name="open-outline" size={18} color="#FFFFFF" />
              <Text style={styles.viewerActionBtnText}>Open Full File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewerActionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => {
                Share.share({
                  title: viewingDocKey,
                  message: `Attached Document: ${viewingDocKey}\n${viewingDocUrl}`,
                });
              }}
            >
              <Ionicons name="share-outline" size={18} color="#FFFFFF" />
              <Text style={styles.viewerActionBtnText}>Share Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: REQUEST RE-UPLOAD VIA WHATSAPP */}
      <Modal visible={reuploadModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Request Re-upload</Text>
              <TouchableOpacity onPress={() => setReuploadModalVisible(false)}>
                <Ionicons name="close-circle-outline" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.reuploadDesc}>
              Select the documents that require re-upload from the customer. A pre-filled WhatsApp message with the upload link will be created.
            </Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 10 }}>
              {REQUIRED_DOCS.map(doc => {
                const isSelected = selectedForReupload.includes(doc);
                return (
                  <TouchableOpacity
                    key={doc}
                    style={styles.reuploadCheckItem}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedForReupload(selectedForReupload.filter(d => d !== doc));
                      } else {
                        setSelectedForReupload([...selectedForReupload, doc]);
                      }
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={styles.reuploadCheckText}>{doc}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReuploadModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: '#25D366' }]}
                onPress={handleSendReuploadRequest}
                disabled={sendingReupload}
              >
                {sendingReupload ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    <Text style={styles.modalSaveBtnText}>Send WhatsApp</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 14,
    paddingBottom: 50,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  headerEditBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },

  // PIPELINE PROGRESS BAR
  pipelineBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    paddingVertical: 10,
  },
  pipelineContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  pipelineStepActive: {
    backgroundColor: '#EBF1FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pipelineStepCompleted: {
    backgroundColor: '#DCFCE7',
  },
  pipelineBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipelineBadgeActive: {
    backgroundColor: Colors.primary,
  },
  pipelineBadgeCompleted: {
    backgroundColor: Colors.successGreen,
  },
  pipelineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pipelineBadgeTextActive: {
    color: '#FFFFFF',
  },
  pipelineStepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pipelineStepLabelActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  pipelineStepLabelCompleted: {
    color: Colors.successGreen,
    fontWeight: '700',
  },
  pipelineConnector: {
    width: 14,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 3,
  },
  pipelineConnectorDone: {
    backgroundColor: Colors.successGreen,
  },

  // VIEW SWITCHER TABS
  viewTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDE7DA',
    padding: 3,
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 8,
    gap: 4,
  },
  viewTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
  },
  viewTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  viewTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  viewTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '800',
  },

  // STAGE WORKFLOW CARDS
  stageCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stageCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stageIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EBF1FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  stageSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  stageInnerBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 14,
  },
  stageInnerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  stageInnerSub: {
    fontSize: 11,
    color: '#374151',
    marginTop: 2,
    marginBottom: 10,
    lineHeight: 15,
  },
  stageWaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  stageWaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  stageChecklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  stageChecklistCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  stageChecklistViewAll: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  stagePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    gap: 8,
    marginTop: 6,
  },
  stagePrimaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stageBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 8,
    gap: 6,
  },
  stageBackBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },

  // STAGE 2: VERIFICATION GRID
  verifyGrid: {
    gap: 8,
    marginBottom: 14,
  },
  verifyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  verifyItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  verifyItemStatus: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  verifyViewBtn: {
    backgroundColor: '#EBF1FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  verifyViewBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  verifyUploadBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  verifyUploadBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // STAGE 3 & 4: FORMS & INPUTS
  stageForm: {
    marginBottom: 14,
  },
  stageInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    color: Colors.textPrimary,
    marginTop: 4,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  uploadedReceiptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
    marginTop: 6,
  },
  uploadedReceiptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  uploadedReceiptSub: {
    fontSize: 10,
    color: '#4B5563',
  },
  uploadDropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginTop: 6,
  },
  uploadDropZoneTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
  },
  uploadDropZoneSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // STAGE 5: COMPLETED CELEBRATION
  completedCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    marginBottom: 14,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#166534',
    marginTop: 12,
    textAlign: 'center',
  },
  completedSub: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  completedActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  completedBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.successGreen,
    paddingVertical: 11,
    borderRadius: 8,
    gap: 6,
  },
  completedBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  completedOverviewBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  completedOverviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },

  // OVERVIEW DETAILS STYLES
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  bannerLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pipelineSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  pipelineSwitchBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionGridCard: {
    flex: 1,
    backgroundColor: Colors.bgSurface,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  actionIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionGridTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  actionGridSub: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  whatsappCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  whatsappHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  whatsappTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  linkSentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  linkSentText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.successGreen,
  },
  linkPendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  linkPendingText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  whatsappDesc: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 10,
    lineHeight: 16,
  },
  linkDisplayBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  linkDisplayText: {
    fontSize: 11,
    color: Colors.primaryDark,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  whatsappBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  whatsappBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  copyLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    gap: 4,
  },
  copyLinkBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  sectionCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  editCardText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  addFeeHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addFeeHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  feeGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  feeItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  feeItemLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  feeItemValue: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  feeNotesBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
    marginBottom: 6,
  },
  feeNotesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  feeNotesContent: {
    fontSize: 11,
    color: '#78350F',
    marginTop: 2,
  },
  chargesList: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  chargesListTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  chargeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  chargeDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  chargeDate: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  chargeAmt: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.successGreen,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
    maxWidth: '62%',
    textAlign: 'right',
  },
  docCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  docActionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  reuploadReqBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reuploadReqBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  bulkDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  bulkDownloadBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  docItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  docThumb: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  docName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  docStatusText: {
    fontSize: 9,
    color: Colors.successGreen,
    fontWeight: '600',
  },
  docItemRight: {
    marginLeft: 8,
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#EBF1FF',
  },
  viewDocText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  replaceDocBtn: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  uploadDocText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  downloadAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryDark,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  downloadAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  editTabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  editTabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  editTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  editTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  editTabTextActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    marginTop: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 38,
    backgroundColor: '#FFFFFF',
    fontSize: 12,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  typeChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: '#F9FAFB',
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  sectionSubHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  feeCalcBox: {
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  feeCalcLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  feeCalcVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1.5,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSaveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'space-between',
  },
  viewerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewerDocTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  viewerCloseBtn: {
    padding: 4,
  },
  viewerBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  pdfNotice: {
    alignItems: 'center',
    padding: 20,
  },
  pdfNoticeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  pdfNoticeSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  pdfOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  pdfOpenBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  viewerFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingTop: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewerActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewerActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  reuploadDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  reuploadCheckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reuploadCheckText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
});
