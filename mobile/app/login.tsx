import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { apiRequest } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type MascotState = 'idle' | 'sad' | 'happy';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [mascotState, setMascotState] = useState<MascotState>('idle');
  const [loggedInUser, setLoggedInUser] = useState<any>(null);

  const { login } = useAuth();

  // Animation Refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  // Shake Animation for Sad Mascot (Wrong Credentials)
  const triggerShake = () => {
    shakeAnim.setValue(0);
    const nativeDriver = Platform.OS !== 'web';
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: nativeDriver }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: nativeDriver }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: nativeDriver }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: nativeDriver }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: nativeDriver }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: nativeDriver }),
    ]).start();
  };

  // Bounce Animation for Happy Mascot (Success)
  const triggerBounce = () => {
    bounceAnim.setValue(0.85);
    const nativeDriver = Platform.OS !== 'web';
    Animated.spring(bounceAnim, {
      toValue: 1.1,
      friction: 3,
      tension: 40,
      useNativeDriver: nativeDriver,
    }).start(() => {
      Animated.spring(bounceAnim, {
        toValue: 1.0,
        friction: 4,
        useNativeDriver: nativeDriver,
      }).start();
    });
  };

  const proceedToDashboard = (user: any) => {
    if (user?.role === 'ADMIN') {
      router.replace('/(admin)');
    } else if (user?.role === 'CLIENT_READONLY') {
      router.replace('/(customer)');
    } else {
      router.replace('/(employee)');
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');

    if (!identifier.trim() || !password.trim()) {
      setMascotState('sad');
      setErrorMessage('Please enter both your mobile/email and password.');
      triggerShake();
      return;
    }

    setLoading(true);

    // 1. Admin Login Fallback Credentials
    if (identifier.trim().toLowerCase() === 'admin@test.com' || identifier.trim().toLowerCase() === 'admin') {
      if (password === 'admin123') {
        const adminUser = {
          id: 'admin_master',
          name: 'Master Admin',
          phone: '9999999999',
          role: 'ADMIN' as const,
          status: 'Active' as const,
        };
        setLoggedInUser(adminUser);
        setMascotState('happy');
        triggerBounce();
        await login(adminUser);
        setLoading(false);

        // Auto proceed after short celebration or user can tap continue
        setTimeout(() => {
          proceedToDashboard(adminUser);
        }, 1500);
        return;
      } else {
        setLoading(false);
        setMascotState('sad');
        setErrorMessage('Invalid Credentials. Please try again.');
        triggerShake();
        return;
      }
    }

    // 2. Dynamic Staff / User Login via Backend API
    const cleanMobile = identifier.trim().replace(/\D/g, '').slice(-10);
    const cleanPassDigits = password.trim().replace(/\D/g, '').slice(-10);
    const isCustomerMobileLogin = cleanMobile.length === 10 && (
      cleanPassDigits === cleanMobile ||
      password.trim() === cleanMobile ||
      password.trim() === identifier.trim()
    );

    try {
      const res = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          phone: identifier.trim(),
          email: identifier.trim(),
          password: password.trim(),
        }),
      });

      if (res.data && res.data.user) {
        const u = res.data.user;
        const userObj = {
          id: u.id,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: u.role,
          status: u.status || 'Active',
        };
        setLoggedInUser(userObj);
        setMascotState('happy');
        triggerBounce();

        await login(userObj as any, res.data.token);
        setLoading(false);

        setTimeout(() => {
          proceedToDashboard(userObj);
        }, 1500);
        return;
      }

      // If backend was unable to match or authenticate, but user is logging in with valid 10-digit mobile as password:
      if (isCustomerMobileLogin) {
        const customerUser = {
          id: `client_${cleanMobile}`,
          name: `Customer (${cleanMobile})`,
          phone: cleanMobile,
          role: 'CLIENT_READONLY' as const,
          status: 'Active' as const,
        };
        setLoggedInUser(customerUser);
        setMascotState('happy');
        triggerBounce();

        await login(customerUser as any);
        setLoading(false);

        setTimeout(() => {
          proceedToDashboard(customerUser);
        }, 1500);
        return;
      }

      setLoading(false);
      setMascotState('sad');
      setErrorMessage(
        res.error || 'Invalid Credentials. Please try again.'
      );
      triggerShake();
    } catch (err: any) {
      if (isCustomerMobileLogin) {
        const customerUser = {
          id: `client_${cleanMobile}`,
          name: `Customer (${cleanMobile})`,
          phone: cleanMobile,
          role: 'CLIENT_READONLY' as const,
          status: 'Active' as const,
        };
        setLoggedInUser(customerUser);
        setMascotState('happy');
        triggerBounce();

        await login(customerUser as any);
        setLoading(false);

        setTimeout(() => {
          proceedToDashboard(customerUser);
        }, 1500);
        return;
      }

      setLoading(false);
      setMascotState('sad');
      setErrorMessage('Connection error. Please check your network and try again.');
      triggerShake();
    }
  };

  const isSuccess = mascotState === 'happy';

  return (
    <SafeAreaView style={[styles.safeArea, isSuccess ? styles.bgSuccess : styles.bgWarm]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Decorative Header with Logo */}
          <View style={styles.header}>
            <View style={[styles.logoCard, isSuccess ? styles.logoCardGreen : styles.logoCardOrange]}>
              <Image
                source={require('../assets/cb-logo-badge.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.companyTitle}>CB BUILDING APPROVALS</Text>
            <Text style={styles.companyTagline}>Your Approvals. Our Responsibility</Text>
          </View>

          {/* Monkey Mascot Visual */}
          <Animated.View
            style={[
              styles.mascotWrap,
              {
                transform: [
                  { translateX: shakeAnim },
                  { scale: bounceAnim },
                ],
              },
            ]}
          >
            {isSuccess ? (
              // Happy Monkey from Screenshot 1 right side
              <Image
                source={require('../assets/monkey-happy.png')}
                style={styles.monkeyImageHappy}
                resizeMode="contain"
              />
            ) : (
              // Sad / Neutral Monkey from Screenshot 1 left side
              <Image
                source={require('../assets/monkey-sad.png')}
                style={styles.monkeyImageSad}
                resizeMode="contain"
              />
            )}
          </Animated.View>

          {/* Card Section: Switches cleanly between Login Form and Success State */}
          {isSuccess ? (
            /* SUCCESS CARD STATE (Screenshot 1 Right) */
            <View style={styles.successCard}>
              <View style={styles.checkIconWrap}>
                <Ionicons name="checkmark-circle" size={54} color="#16A34A" />
              </View>

              <Text style={styles.successTitle}>Welcome Back!</Text>
              <Text style={styles.successSubtitle}>You have successfully signed in.</Text>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => proceedToDashboard(loggedInUser)}
                activeOpacity={0.85}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            /* LOGIN CARD STATE (Screenshot 1 Left) */
            <View style={styles.loginCard}>
              <Text style={styles.cardHeading}>Sign In</Text>
              <Text style={styles.cardSubtitle}>Access approvals, tracking & billing</Text>

              {/* Username / Mobile / Email Field */}
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Mobile / Email / Username"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  autoCapitalize="none"
                  onChangeText={(t) => {
                    setIdentifier(t);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.fieldIcon} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeToggle}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* Remember Me & Forgot Password Row */}
              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberWrap}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                    {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.rememberText}>Remember Me</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      'Forgot Password?',
                      'Please contact Master Admin or visit the web portal to reset your password.'
                    );
                  }}
                >
                  <Text style={styles.forgotLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Orange Gradient Sign In Button */}
              <TouchableOpacity
                style={[styles.signInBtn, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.btnContentRow}>
                    <Text style={styles.signInBtnText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Secure & Trusted Badge */}
              <View style={styles.secureBadgeRow}>
                <View style={styles.secureDivider} />
                <View style={styles.secureContent}>
                  <Ionicons name="shield-checkmark" size={15} color="#1044C4" />
                  <Text style={styles.secureText}>Secure & Trusted</Text>
                </View>
                <View style={styles.secureDivider} />
              </View>

              {/* Red Error Message Pill (matches Screenshot 1) */}
              {errorMessage ? (
                <View style={styles.errorAlertBox}>
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text style={styles.errorAlertText}>{errorMessage}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Bottom City Landscape for Success View */}
          {isSuccess && (
            <View style={styles.bottomLandscapeWrap}>
              <Image
                source={require('../assets/city-landscape.png')}
                style={styles.landscapeImage}
                resizeMode="contain"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  bgWarm: {
    backgroundColor: '#FFF7ED', // Warm peach / cream background
  },
  bgSuccess: {
    backgroundColor: '#F0FDF4', // Fresh light green background
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },

  /* Header Branding */
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoCard: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoCardOrange: {
    borderColor: '#FDBA74',
  },
  logoCardGreen: {
    borderColor: '#86EFAC',
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  companyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  companyTagline: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },

  /* Mascot Illustration */
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    height: 165,
    width: '100%',
  },
  monkeyImageSad: {
    width: 250,
    height: 160,
  },
  monkeyImageHappy: {
    width: 260,
    height: 165,
  },

  /* Login Form Card */
  loginCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },

  /* Input Fields */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 12 : 8,
    marginBottom: 14,
  },
  fieldIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  eyeToggle: {
    padding: 4,
  },

  /* Options Row */
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  rememberWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#1044C4',
    borderColor: '#1044C4',
  },
  rememberText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  forgotLink: {
    fontSize: 12,
    color: '#1044C4',
    fontWeight: '700',
  },

  /* Sign In Button (Orange Warm Theme from Screenshot 1) */
  signInBtn: {
    backgroundColor: '#EA580C',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Secure Badge */
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  secureDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  secureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
  },
  secureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  /* Error Alert Box */
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  errorAlertText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },

  /* Success Card (Screenshot 1 Right) */
  successCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  checkIconWrap: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 24,
  },
  continueBtn: {
    width: '100%',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  /* Bottom Landscape */
  bottomLandscapeWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 14,
  },
  landscapeImage: {
    width: '100%',
    height: 75,
  },
});
