import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { apiRequest } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type MascotState = 'idle' | 'covering_eyes' | 'sad' | 'happy';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [mascotState, setMascotState] = useState<MascotState>('idle');

  const { login } = useAuth();

  // Animation Refs
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const tearAnim = useRef(new Animated.Value(0)).current;

  // Shake Animation for Sad Mascot
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();

    // Tear drop animation
    tearAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(tearAnim, { toValue: 14, duration: 600, useNativeDriver: true }),
        Animated.timing(tearAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      { iterations: 3 }
    ).start();
  };

  // Bounce Animation for Happy Mascot
  const triggerBounce = () => {
    bounceAnim.setValue(0.8);
    Animated.spring(bounceAnim, {
      toValue: 1.15,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(bounceAnim, {
        toValue: 1.0,
        friction: 4,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleLogin = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!identifier.trim() || !password.trim()) {
      setMascotState('sad');
      setErrorMessage('Please enter both your mobile/email and password.');
      triggerShake();
      return;
    }

    setLoading(true);

    // 1. Admin login fallback credentials
    if (identifier.trim() === 'admin@test.com' || identifier.trim() === 'admin') {
      if (password === 'admin123') {
        setMascotState('happy');
        setSuccessMessage('🎉 Login Successful! Welcome Master Admin!');
        triggerBounce();

        await login({
          id: 'admin_master',
          name: 'Master Admin',
          phone: '9999999999',
          role: 'ADMIN',
          status: 'Active',
        });

        setTimeout(() => {
          setLoading(false);
          router.replace('/(admin)');
        }, 900);
        return;
      } else {
        setLoading(false);
        setMascotState('sad');
        setErrorMessage('❌ Wrong credentials! Password does not match. Please check once.');
        triggerShake();
        return;
      }
    }

    // 2. Dynamic Staff / User Login via Backend API
    try {
      const res = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: identifier.trim(),
          password: password.trim(),
        }),
      });

      if (res.data && res.data.user) {
        const u = res.data.user;
        setMascotState('happy');
        setSuccessMessage(`🎉 Welcome back, ${u.name || 'User'}!`);
        triggerBounce();

        await login(
          {
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            role: u.role,
            status: u.status || 'Active',
          },
          res.data.token
        );

        setTimeout(() => {
          setLoading(false);
          if (u.role === 'ADMIN') {
            router.replace('/(admin)');
          } else if (u.role === 'CLIENT_READONLY') {
            router.replace('/(customer)');
          } else {
            router.replace('/(employee)');
          }
        }, 900);
      } else {
        setLoading(false);
        setMascotState('sad');
        setErrorMessage(
          res.error || '❌ Wrong credentials! User not found or incorrect password. Please check once.'
        );
        triggerShake();
      }
    } catch (err: any) {
      setLoading(false);
      setMascotState('sad');
      setErrorMessage('❌ Connection error! Unable to reach backend server. Please try again.');
      triggerShake();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Branding with Official Logo */}
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/logo.jpeg')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.companyName}>CB BUILDING APPROVALS</Text>
            <Text style={styles.tagline}>Your Approvals, Our Responsibility</Text>
          </View>

          {/* Cute Animated Monkey Mascot */}
          <Animated.View
            style={[
              styles.mascotContainer,
              {
                transform: [
                  { translateX: shakeAnim },
                  { scale: bounceAnim },
                ],
              },
            ]}
          >
            <View style={styles.mascotHead}>
              {/* Cute Round Ears */}
              <View style={[styles.ear, styles.earLeft]}>
                <View style={styles.innerEar} />
              </View>
              <View style={[styles.ear, styles.earRight]}>
                <View style={styles.innerEar} />
              </View>

              {/* Face Center */}
              <View style={styles.faceArea}>
                {mascotState === 'happy' ? (
                  /* Happy Celebration State */
                  <View style={styles.mascotMoodWrap}>
                    <View style={styles.partyBadge}>
                      <Text style={styles.partyText}>🎉 YAAY!</Text>
                    </View>
                    <View style={styles.eyesRow}>
                      <Text style={styles.mascotBigEmoji}>😄</Text>
                    </View>
                    <Text style={styles.mascotStatusText}>Welcome back!</Text>
                  </View>
                ) : mascotState === 'sad' ? (
                  /* Sad Error State */
                  <View style={styles.mascotMoodWrap}>
                    <View style={styles.eyesRow}>
                      <View style={styles.sadEyeWrap}>
                        <Text style={styles.mascotBigEmoji}>🥺</Text>
                        <Animated.View
                          style={[
                            styles.tearDrop,
                            { transform: [{ translateY: tearAnim }] },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.sadBadge}>
                      <Text style={styles.sadBadgeText}>WRONG CREDENTIALS</Text>
                    </View>
                  </View>
                ) : mascotState === 'covering_eyes' ? (
                  /* Covering Eyes State (Typing Password) */
                  <View style={styles.mascotMoodWrap}>
                    <Text style={styles.mascotBigEmoji}>🙈</Text>
                    <Text style={styles.peekText}>Shh! Password is safe</Text>
                  </View>
                ) : (
                  /* Default / Cute Idle Monkey Face */
                  <View style={styles.mascotMoodWrap}>
                    <View style={styles.eyesRow}>
                      <View style={styles.normalEye}>
                        <View style={styles.pupil}>
                          <View style={styles.specular} />
                        </View>
                      </View>
                      <View style={styles.normalEye}>
                        <View style={styles.pupil}>
                          <View style={styles.specular} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.snout}>
                      <View style={styles.nose} />
                      <View style={styles.smileCurve} />
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Feedback Banners */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={20} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={20} color="#15803D" />
              <Text style={styles.successBannerText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Card Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSubtitle}>Access approvals, tracking & billing</Text>

            {/* Identifier Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile / Email / Username</Text>
              <View
                style={[
                  styles.inputWrap,
                  errorMessage ? styles.inputWrapError : null,
                ]}
              >
                <Ionicons name="person-outline" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="admin@test.com or registered mobile"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  autoCapitalize="none"
                  onFocus={() => {
                    if (mascotState !== 'sad' && mascotState !== 'happy') {
                      setMascotState('idle');
                    }
                  }}
                  onChangeText={(t) => {
                    setIdentifier(t);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrap,
                  errorMessage ? styles.inputWrapError : null,
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter password (e.g. admin123)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={password}
                  onFocus={() => {
                    if (mascotState !== 'sad' && mascotState !== 'happy') {
                      setMascotState(showPassword ? 'idle' : 'covering_eyes');
                    }
                  }}
                  onBlur={() => {
                    if (mascotState === 'covering_eyes') {
                      setMascotState('idle');
                    }
                  }}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
                <TouchableOpacity
                  onPress={() => {
                    const next = !showPassword;
                    setShowPassword(next);
                    if (next) setMascotState('idle');
                    else setMascotState('covering_eyes');
                  }}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={styles.loginBtnInner}>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#022F94',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoWrap: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2.5,
    borderColor: '#D6A756',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  companyName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 12,
    color: '#D6A756',
    fontWeight: '600',
    marginTop: 2,
  },

  /* Mascot Styles */
  mascotContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  mascotHead: {
    width: 100,
    height: 90,
    backgroundColor: '#8B5A2B',
    borderRadius: 45,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5D3A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  ear: {
    position: 'absolute',
    top: 15,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8B5A2B',
    borderWidth: 2,
    borderColor: '#5D3A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earLeft: {
    left: -14,
  },
  earRight: {
    right: -14,
  },
  innerEar: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F7C59F',
  },
  faceArea: {
    width: 76,
    height: 66,
    backgroundColor: '#F7C59F',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  eyesRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  normalEye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  pupil: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    position: 'relative',
  },
  specular: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 1,
    left: 1,
  },
  mascotMoodWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotBigEmoji: {
    fontSize: 28,
  },
  mascotStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 2,
  },
  peekText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  snout: {
    alignItems: 'center',
  },
  nose: {
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3E2723',
  },
  smileCurve: {
    width: 18,
    height: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#3E2723',
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    marginTop: 2,
  },

  /* Mascot State Overlays */
  happyEye: {
    alignItems: 'center',
  },
  mouthHappy: {
    marginTop: -4,
  },
  partyBadge: {
    position: 'absolute',
    top: -22,
    backgroundColor: '#15803D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  partyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  sadEyeWrap: {
    position: 'relative',
    alignItems: 'center',
  },
  sadEye: {
    fontSize: 20,
  },
  tearDrop: {
    position: 'absolute',
    bottom: -6,
    width: 5,
    height: 8,
    backgroundColor: '#38BDF8',
    borderRadius: 3,
  },
  mouthSad: {
    marginTop: -4,
  },
  sadBadge: {
    position: 'absolute',
    top: -22,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  pawCover: {
    alignItems: 'center',
  },
  pawEmoji: {
    fontSize: 32,
  },
  mascotEmoji: {
    fontSize: 22,
  },

  /* Banners */
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#15803D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },

  /* Form Card */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 6,
  },
  inputWrapError: {
    borderColor: '#DC2626',
    backgroundColor: '#FFF5F5',
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  loginBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  testAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  testAccountText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
});
