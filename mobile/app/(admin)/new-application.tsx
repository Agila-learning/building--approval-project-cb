import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileHeader } from '../../components/MobileHeader';
import { Colors } from '../../constants/theme';
import { applicationService } from '../../services/applicationService';
import { Ionicons } from '@expo/vector-icons';

export default function NewApplicationScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Personal & Applicant Details
  const [serviceType, setServiceType] = useState('BUILDING_PLAN_APPROVAL');
  const [customerName, setCustomerName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');
  const [aadhar, setAadhar] = useState('');
  const [pan, setPan] = useState('');
  const [resHouseNo, setResHouseNo] = useState('');
  const [resStreet, setResStreet] = useState('');
  const [resCity, setResCity] = useState('');
  const [resTaluk, setResTaluk] = useState('');
  const [resPincode, setResPincode] = useState('');

  // Step 2: Property & Site Details
  const [surveyNo, setSurveyNo] = useState('');
  const [pattaNo, setPattaNo] = useState('');
  const [dno, setDno] = useState('');
  const [streetName, setStreetName] = useState('');
  const [village, setVillage] = useState('');
  const [panchayat, setPanchayat] = useState('');
  const [taluk, setTaluk] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [jurisdiction, setJurisdiction] = useState('DTCP');
  const [refSource, setRefSource] = useState('Direct');

  // Step 3: Fees & Payment Details
  const [feesAmount, setFeesAmount] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');
  const [feeNotes, setFeeNotes] = useState('');

  const calculatePending = () => {
    const total = parseFloat(feesAmount) || 0;
    const paid = parseFloat(paidAmount) || 0;
    return Math.max(0, total - paid);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!customerName.trim() || !mobile.trim()) {
        Alert.alert('Required Fields', 'Please enter applicant name and mobile number.');
        return;
      }
      if (mobile.replace(/\D/g, '').length < 10) {
        Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!village.trim() && !surveyNo.trim()) {
        Alert.alert('Property Details', 'Please provide at least a Village/Area or Survey Number.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleSubmit = async (isPartial = false) => {
    setSubmitting(true);
    try {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const rand = Math.floor(100 + Math.random() * 900);
      const appNumber = `CBA-${yy}${mm}${dd}-${rand}`;

      const totalFee = parseFloat(feesAmount) || 0;
      const initialPaid = parseFloat(paidAmount) || 0;
      const pendingFee = Math.max(0, totalFee - initialPaid);

      const payload = {
        application_number: appNumber,
        approval_type: serviceType,
        status: isPartial ? 'Draft' : 'Submitted',
        property: {
          owner_name: customerName,
          owner_phone: mobile,
          owner_email: email,
          address: `${dno ? dno + ', ' : ''}${streetName ? streetName + ', ' : ''}${village || ''}`.trim() || 'Site Address',
          village: village || 'Local Area',
          taluk: taluk || city || 'Taluk Area',
          survey_number: surveyNo || 'TBD',
          jurisdiction: jurisdiction,
        },
        fullData: {
          customerName,
          fatherName,
          dob,
          mobile,
          altMobile,
          email,
          aadhar,
          pan,
          serviceType,
          residentialAddress: {
            houseNo: resHouseNo,
            streetName: resStreet,
            city: resCity,
            taluk: resTaluk,
            pincode: resPincode,
            state: 'Tamil Nadu',
            country: 'INDIA',
          },
          propertyDetails: {
            surveyNo,
            pattaNo,
            dno,
            streetName,
            village,
            panchayat,
            taluk,
            city,
            pincode,
            jurisdiction,
          },
          referenceDetails: {
            source: refSource,
          },
          feesAmount: totalFee.toString(),
          paidAmount: initialPaid.toString(),
          feeNotes,
          fees: {
            total: totalFee,
            paid: initialPaid,
            pending: pendingFee,
            notes: feeNotes,
            charges: initialPaid > 0 ? [
              {
                id: `chg-${Date.now()}`,
                description: 'Initial Advance / Deposit',
                amount: initialPaid,
                date: new Date().toISOString(),
              }
            ] : []
          },
        },
        linkTracking: {
          sent: false,
          sendStatus: 'pending',
          customerUploaded: false,
        },
      };

      const res = await applicationService.create(payload as any);
      if (res.data) {
        const createdId = res.data.id || appNumber;
        const uploadLink = `https://building-approval.vercel.app/upload/${appNumber}`;

        Alert.alert(
          'Application Created!',
          `Application ${appNumber} created successfully!\n\nWould you like to share the document upload link to the customer via WhatsApp?`,
          [
            {
              text: 'Open Application',
              onPress: () => router.replace({
                pathname: '/(admin)/application-detail',
                params: { id: createdId },
              }),
            },
            {
              text: 'Share on WhatsApp',
              style: 'default',
              onPress: async () => {
                let cleanPhone = mobile.replace(/\D/g, '');
                if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;
                const msg = `Hello ${customerName},\n\nPlease use the following link to upload your documents for building approval application ${appNumber}:\n${uploadLink}`;
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
                try {
                  await Linking.openURL(waUrl);
                  // Mark link sent
                  await applicationService.update(createdId, {
                    linkTracking: {
                      sent: true,
                      sendStatus: 'success',
                      sentDate: new Date().toISOString(),
                      customerUploaded: false,
                    }
                  });
                } catch {
                  // Fallback
                }
                router.replace({
                  pathname: '/(admin)/application-detail',
                  params: { id: createdId },
                });
              },
            },
          ]
        );
      } else {
        Alert.alert('Submission Error', res.error || 'Failed to submit application.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <MobileHeader title="New Application" showBack />

      {/* 4-Step Indicator Matching Web */}
      <View style={styles.stepIndicator}>
        {[
          { num: 1, label: 'Applicant' },
          { num: 2, label: 'Property' },
          { num: 3, label: 'Fees' },
          { num: 4, label: 'Review' },
        ].map((s, index) => (
          <React.Fragment key={s.num}>
            <TouchableOpacity
              onPress={() => s.num < step && setStep(s.num)}
              style={styles.stepItem}
            >
              <View style={[styles.stepDot, step >= s.num && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= s.num && styles.stepDotTextActive]}>
                  {s.num}
                </Text>
              </View>
              <Text style={[styles.stepLabel, step >= s.num && styles.stepLabelActive]}>
                {s.label}
              </Text>
            </TouchableOpacity>
            {index < 3 && (
              <View style={[styles.stepLine, step > index + 1 && styles.stepLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 24, 40) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: APPLICANT & SERVICE */}
        {step === 1 && (
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>Step 1: Applicant & Service Details</Text>

            <Text style={styles.label}>Service / Approval Type *</Text>
            <View style={styles.chipRow}>
              {[
                { label: 'Building Plan', val: 'BUILDING_PLAN_APPROVAL' },
                { label: 'Layout Approval', val: 'LAYOUT_APPROVAL' },
                { label: 'Patta Transfer', val: 'PATTA_TRANSFER' },
                { label: 'Completion Cert', val: 'COMPLETION_CERTIFICATE' },
              ].map(item => (
                <TouchableOpacity
                  key={item.val}
                  style={[styles.typeChip, serviceType === item.val && styles.typeChipActive]}
                  onPress={() => setServiceType(item.val)}
                >
                  <Text style={[styles.typeChipText, serviceType === item.val && styles.typeChipTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Applicant Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Ramesh Kumar"
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={styles.label}>Father's / Spouse's Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. K. Krishnan"
              value={fatherName}
              onChangeText={setFatherName}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Mobile Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-digit mobile"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={setMobile}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>Alternate Mobile</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Optional"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={altMobile}
                  onChangeText={setAltMobile}
                />
              </View>
            </View>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. applicant@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Aadhaar Card No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12-digit Aadhaar"
                  keyboardType="numeric"
                  maxLength={12}
                  value={aadhar}
                  onChangeText={setAadhar}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>PAN Card No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="10-char PAN"
                  autoCapitalize="characters"
                  maxLength={10}
                  value={pan}
                  onChangeText={setPan}
                />
              </View>
            </View>

            <Text style={[styles.sectionSubHeader, { marginTop: 16 }]}>Residential Address</Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Door / House No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 12/A"
                  value={resHouseNo}
                  onChangeText={setResHouseNo}
                />
              </View>
              <View style={{ flex: 2, marginLeft: 10 }}>
                <Text style={styles.label}>Street / Area</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Gandhi Nagar"
                  value={resStreet}
                  onChangeText={setResStreet}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>City / Village</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Shoolagiri"
                  value={resCity}
                  onChangeText={setResCity}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>Taluk / District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hosur"
                  value={resTaluk}
                  onChangeText={setResTaluk}
                />
              </View>
            </View>

            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 635117"
              keyboardType="numeric"
              maxLength={6}
              value={resPincode}
              onChangeText={setResPincode}
            />

            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Next: Property Details →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: PROPERTY & SITE */}
        {step === 2 && (
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>Step 2: Property & Site Details</Text>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Survey Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 142/2A"
                  value={surveyNo}
                  onChangeText={setSurveyNo}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>Patta Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 4391"
                  value={pattaNo}
                  onChangeText={setPattaNo}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Door / Plot No</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Plot No 5"
                  value={dno}
                  onChangeText={setDno}
                />
              </View>
              <View style={{ flex: 2, marginLeft: 10 }}>
                <Text style={styles.label}>Street / Road</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 40ft Main Road"
                  value={streetName}
                  onChangeText={setStreetName}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Village / Area *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bagalur"
                  value={village}
                  onChangeText={setVillage}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>Panchayat</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Bagalur Panchayat"
                  value={panchayat}
                  onChangeText={setPanchayat}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Taluk</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Hosur"
                  value={taluk}
                  onChangeText={setTaluk}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.label}>District / City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Krishnagiri"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </View>

            <Text style={styles.label}>Pincode</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 635109"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />

            <Text style={styles.label}>Jurisdiction</Text>
            <View style={styles.chipRow}>
              {['DTCP', 'TOWN_PANCHAYAT', 'PANCHAYAT_UNION'].map(j => (
                <TouchableOpacity
                  key={j}
                  style={[styles.typeChip, jurisdiction === j && styles.typeChipActive]}
                  onPress={() => setJurisdiction(j)}
                >
                  <Text style={[styles.typeChipText, jurisdiction === j && styles.typeChipTextActive]}>
                    {j.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Reference / Source</Text>
            <View style={styles.chipRow}>
              {['Direct', 'Friend', 'Officers', 'Newspaper Ad', 'Facebook', 'Instagram'].map(src => (
                <TouchableOpacity
                  key={src}
                  style={[styles.typeChip, refSource === src && styles.typeChipActive]}
                  onPress={() => setRefSource(src)}
                >
                  <Text style={[styles.typeChipText, refSource === src && styles.typeChipTextActive]}>
                    {src}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonHalf} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Next: Fees →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: FEES & CHARGES */}
        {step === 3 && (
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>Step 3: Fees & Payment Charges</Text>

            <Text style={styles.label}>Estimated Total Fee (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 35000"
              keyboardType="numeric"
              value={feesAmount}
              onChangeText={setFeesAmount}
            />

            <Text style={styles.label}>Initial Amount Paid (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 10000 (0 if unpaid)"
              keyboardType="numeric"
              value={paidAmount}
              onChangeText={setPaidAmount}
            />

            {/* Calculated Pending Card */}
            <View style={styles.feeSummaryBox}>
              <View style={styles.feeSummaryRow}>
                <Text style={styles.feeSummaryLabel}>Total Charges:</Text>
                <Text style={styles.feeSummaryVal}>₹{parseFloat(feesAmount) || 0}</Text>
              </View>
              <View style={styles.feeSummaryRow}>
                <Text style={styles.feeSummaryLabel}>Amount Paid:</Text>
                <Text style={[styles.feeSummaryVal, { color: Colors.successGreen }]}>
                  ₹{parseFloat(paidAmount) || 0}
                </Text>
              </View>
              <View style={[styles.feeSummaryRow, { borderTopWidth: 1, borderTopColor: '#DDD', paddingTop: 8 }]}>
                <Text style={[styles.feeSummaryLabel, { fontWeight: '800' }]}>Pending Balance:</Text>
                <Text style={[styles.feeSummaryVal, { color: Colors.warningGold, fontWeight: '800' }]}>
                  ₹{calculatePending()}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Additional Fee Notes / Breakdown</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="e.g. Includes scrutiny fee, government challan, and liaison fee"
              multiline
              numberOfLines={3}
              value={feeNotes}
              onChangeText={setFeeNotes}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButtonHalf} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>Next: Review →</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: REVIEW & SUBMIT */}
        {step === 4 && (
          <View style={styles.formCard}>
            <Text style={styles.cardHeading}>Step 4: Review & Finalize Application</Text>

            {/* Applicant Summary */}
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeaderRow}>
                <Ionicons name="person-outline" size={16} color={Colors.primary} />
                <Text style={styles.reviewHeader}>Applicant Info</Text>
              </View>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Name:</Text> {customerName}</Text>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Mobile:</Text> {mobile}</Text>
              {email ? <Text style={styles.reviewText}><Text style={styles.reviewBold}>Email:</Text> {email}</Text> : null}
              {fatherName ? <Text style={styles.reviewText}><Text style={styles.reviewBold}>Father:</Text> {fatherName}</Text> : null}
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Service:</Text> {serviceType.replace(/_/g, ' ')}</Text>
            </View>

            {/* Property Summary */}
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeaderRow}>
                <Ionicons name="business-outline" size={16} color={Colors.primary} />
                <Text style={styles.reviewHeader}>Site & Property</Text>
              </View>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Survey No:</Text> {surveyNo || 'N/A'}</Text>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Village / Area:</Text> {village || 'N/A'}</Text>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Taluk:</Text> {taluk || city || 'N/A'}</Text>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Jurisdiction:</Text> {jurisdiction}</Text>
            </View>

            {/* Fees Summary */}
            <View style={styles.reviewSection}>
              <View style={styles.reviewHeaderRow}>
                <Ionicons name="cash-outline" size={16} color={Colors.primary} />
                <Text style={styles.reviewHeader}>Payment Charges</Text>
              </View>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Total Charges:</Text> ₹{parseFloat(feesAmount) || 0}</Text>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Amount Paid:</Text> ₹{parseFloat(paidAmount) || 0}</Text>
              <Text style={styles.reviewText}><Text style={styles.reviewBold}>Balance Pending:</Text> ₹{calculatePending()}</Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(3)}>
                <Text style={styles.backButtonText}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.draftButton}
                onPress={() => handleSubmit(true)}
                disabled={submitting}
              >
                <Text style={styles.draftButtonText}>Save Draft</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: Colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
  },
  stepDotText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stepLabelActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: 4,
    marginBottom: 12,
  },
  stepLineActive: {
    backgroundColor: Colors.primary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  formCard: {
    backgroundColor: Colors.bgSurface,
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 14,
  },
  sectionSubHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.bgPrimary,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: '#FFFFFF',
  },
  feeSummaryBox: {
    backgroundColor: '#F7F9FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D4E0FD',
  },
  feeSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  feeSummaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  feeSummaryVal: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  reviewSection: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  reviewHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  reviewText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginVertical: 2,
  },
  reviewBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  primaryButtonHalf: {
    flex: 1.5,
    backgroundColor: Colors.primary,
    height: 46,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 12,
  },
  draftButton: {
    flex: 1,
    height: 46,
    borderRadius: 8,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftButtonText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  submitBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
