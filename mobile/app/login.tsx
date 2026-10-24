import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { Colors } from '../constants/theme';
import { apiRequest } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your mobile/email and password.');
      return;
    }

    setLoading(true);

    // 1. Admin login credentials (same fallback logic as existing web app)
    if (identifier === 'admin@test.com' || identifier === 'admin') {
      if (password === 'admin123') {
        setLoading(false);
        await login({
          id: 'admin_master',
          name: 'Master Admin',
          phone: '9999999999',
          role: 'ADMIN',
          status: 'Active',
        });
        router.replace('/(admin)');
        return;
      } else {
        setLoading(false);
        Alert.alert('Login Failed', 'Invalid admin password.');
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

        if (u.role === 'ADMIN') {
          router.replace('/(admin)');
        } else if (u.role === 'CLIENT_READONLY') {
          router.replace('/(customer)');
        } else {
          router.replace('/(employee)');
        }
      } else {
        Alert.alert('Login Failed', res.error || 'User not found or invalid credentials.');
      }
    } catch (err: any) {
      Alert.alert('Network Error', err.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../assets/modern_architecture_login.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom', 'left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              {/* Logo & Brand Header */}
              <View style={styles.logoSection}>
                <Image
                  source={require('../assets/logo.jpeg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.brandTitle}>CB BUILDING APPROVALS</Text>
                <Text style={styles.brandSubtitle}>Native Mobile Portal</Text>
              </View>

              {/* Input Form */}
              <View style={styles.formSection}>
                <Text style={styles.inputLabel}>Mobile Number / Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter registered mobile or email"
                    placeholderTextColor={Colors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>Log In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.hintContainer}>
                  <Text style={styles.hintText}>
                    Authorized access only for Administrative, Staff & Customer accounts.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 47, 148, 0.82)',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 24,
    paddingVertical: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 10,
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brandRed,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  formSection: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  eyeIcon: {
    padding: 6,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  hintContainer: {
    marginTop: 18,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
