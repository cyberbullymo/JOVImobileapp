/**
 * Sign In Screen
 * Jovi Beauty Marketplace - User Authentication
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../components/design-system/theme/theme';
import { useAuthStore } from '../../store/authStore';

interface SignInScreenProps {
  onNavigateToSignUp?: () => void;
  onNavigateToForgotPassword?: () => void;
}

const SignInScreen = ({
  onNavigateToSignUp,
  onNavigateToForgotPassword,
}: SignInScreenProps) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState({ email: false, password: false });

  // Auth store
  const { login, isLoading, clearError } = useAuthStore();

  // Email validation
  const validateEmail = (value: string): boolean => {
    // Support both email and phone number
    if (/^[\d+]/.test(value)) {
      const phoneRegex = /^[\d\s()+-]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Handle field blur
  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    if (email && !validateEmail(email)) {
      const isPhone = /^[\d+]/.test(email);
      setErrors({
        ...errors,
        email: isPhone
          ? 'Please enter a valid phone number'
          : 'Please enter a valid email address',
      });
    } else {
      const newErrors = { ...errors };
      delete newErrors.email;
      setErrors(newErrors);
    }
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    if (!password) {
      setErrors({ ...errors, password: 'Password is required' });
    } else {
      const newErrors = { ...errors };
      delete newErrors.password;
      setErrors(newErrors);
    }
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    return email.length > 0 && validateEmail(email) && password.length > 0;
  };

  // Handle OAuth sign in (placeholder)
  const handleAppleSignIn = async () => {
    Alert.alert('Coming Soon', 'Apple Sign In will be available soon!');
  };

  const handleGoogleSignIn = async () => {
    Alert.alert('Coming Soon', 'Google Sign In will be available soon!');
  };

  // Handle email/password sign in
  const handleSignIn = async () => {
    // Clear any previous errors
    clearError();

    // Validate all fields
    setTouched({ email: true, password: true });

    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      const isPhone = /^[\d+]/.test(email);
      newErrors.email = isPhone
        ? 'Please enter a valid phone number'
        : 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      // Handle specific Firebase auth errors
      let errorMessage = 'Please check your credentials and try again';

      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      } else if (err.message) {
        errorMessage = err.message;
      }

      Alert.alert('Sign In Failed', errorMessage);
    }
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (onNavigateToForgotPassword) {
      onNavigateToForgotPassword();
    } else {
      // Fallback: Show alert with reset option
      Alert.prompt(
        'Reset Password',
        'Enter your email address to receive a password reset link',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async (resetEmail: string | undefined) => {
              if (resetEmail) {
                try {
                  const { resetPassword } = useAuthStore.getState();
                  await resetPassword(resetEmail);
                  Alert.alert(
                    'Email Sent',
                    'Check your email for password reset instructions'
                  );
                } catch (err) {
                  Alert.alert('Error', 'Failed to send reset email. Please try again.');
                }
              }
            },
          },
        ],
        'plain-text',
        email
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>J</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to continue your beauty journey
          </Text>
        </View>

        {/* OAuth Buttons */}
        <View style={styles.oauthContainer}>
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}>
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#1A1A1A" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email/Phone Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or Phone</Text>
            <View
              style={[
                styles.inputContainer,
                touched.email && errors.email && styles.inputError,
              ]}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={theme.colors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="name@example.com or (555) 123-4567"
                placeholderTextColor={theme.colors.text.disabled}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    const newErrors = { ...errors };
                    delete newErrors.email;
                    setErrors(newErrors);
                  }
                }}
                onBlur={handleEmailBlur}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
            {touched.email && errors.email && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.email}</Text>
              </View>
            )}
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotText}>Forgot?</Text>
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.inputContainer,
                touched.password && errors.password && styles.inputError,
              ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.text.disabled}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    const newErrors = { ...errors };
                    delete newErrors.password;
                    setErrors(newErrors);
                  }
                }}
                onBlur={handlePasswordBlur}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.text.disabled}
                />
              </TouchableOpacity>
            </View>
            {touched.password && errors.password && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.password}</Text>
              </View>
            )}
          </View>

          {/* Remember Me */}
          <TouchableOpacity
            style={styles.rememberContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
            disabled={isLoading}>
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
              ]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.rememberText}>Remember me</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.signInButton,
              (!isFormValid() || isLoading) && styles.signInButtonDisabled,
            ]}
            onPress={handleSignIn}
            disabled={!isFormValid() || isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.signInButtonText}>Signing In...</Text>
              </View>
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={onNavigateToSignUp}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${theme.colors.primary.main}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary.main,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  oauthContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  appleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: 52,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  appleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  googleButtonText: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  dividerText: {
    ...theme.typography.body2,
    color: theme.colors.text.disabled,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...theme.typography.body2,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  forgotText: {
    ...theme.typography.body2,
    fontWeight: '500',
    color: theme.colors.primary.main,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    height: 48,
    paddingHorizontal: theme.spacing.sm,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body1,
    color: theme.colors.text.primary,
    height: '100%',
  },
  eyeButton: {
    padding: theme.spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.error,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  rememberText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  signInButton: {
    backgroundColor: theme.colors.primary.main,
    height: 52,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
    ...theme.shadows.md,
  },
  signInButtonDisabled: {
    opacity: 0.5,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
  },
  footerText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  signUpText: {
    ...theme.typography.body2,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
});

export default SignInScreen;
