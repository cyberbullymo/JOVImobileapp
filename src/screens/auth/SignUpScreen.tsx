/**
 * Sign Up Screen
 * Jovi Beauty Marketplace - User Registration
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

interface SignUpScreenProps {
  onNavigateToLogin?: () => void;
}

const SignUpScreen = ({ onNavigateToLogin }: SignUpScreenProps) => {
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Auth store
  const { signUp, isLoading, error } = useAuthStore();

  // Email validation
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Password validation
  const validatePassword = (value: string): string | null => {
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(value)) {
      return 'Password must contain an uppercase letter';
    }
    if (!/[a-z]/.test(value)) {
      return 'Password must contain a lowercase letter';
    }
    if (!/[0-9]/.test(value)) {
      return 'Password must contain a number';
    }
    return null;
  };

  // Field blur handlers
  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors = { ...errors };

    switch (field) {
      case 'displayName':
        if (!displayName.trim()) {
          newErrors.displayName = 'Name is required';
        } else if (displayName.trim().length < 2) {
          newErrors.displayName = 'Name must be at least 2 characters';
        } else {
          delete newErrors.displayName;
        }
        break;

      case 'email':
        if (!email) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;

      case 'password':
        const passwordError = validatePassword(password);
        if (!password) {
          newErrors.password = 'Password is required';
        } else if (passwordError) {
          newErrors.password = passwordError;
        } else {
          delete newErrors.password;
        }
        // Also validate confirm password if it's been touched
        if (touched.confirmPassword && confirmPassword !== password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else if (touched.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;

      case 'confirmPassword':
        if (!confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (confirmPassword !== password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    return (
      displayName.trim().length >= 2 &&
      validateEmail(email) &&
      !validatePassword(password) &&
      confirmPassword === password &&
      acceptedTerms
    );
  };

  // Handle OAuth sign up (placeholder)
  const handleAppleSignUp = async () => {
    Alert.alert('Coming Soon', 'Apple Sign Up will be available soon!');
  };

  const handleGoogleSignUp = async () => {
    Alert.alert('Coming Soon', 'Google Sign Up will be available soon!');
  };

  // Handle form submission
  const handleSignUp = async () => {
    // Validate all fields
    setTouched({
      displayName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });

    const newErrors: Record<string, string> = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Name is required';
    }
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }
    if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms to continue';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await signUp(email, password, 'FuturePro', displayName.trim());
    } catch (err) {
      Alert.alert('Sign Up Failed', error || 'Please try again');
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the beauty professional community
          </Text>
        </View>

        {/* OAuth Buttons */}
        <View style={styles.oauthContainer}>
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}>
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleSignUp}
            disabled={isLoading}
            activeOpacity={0.8}>
            <Ionicons name="logo-google" size={20} color="#1A1A1A" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign up with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View
              style={[
                styles.inputContainer,
                touched.displayName && errors.displayName && styles.inputError,
              ]}>
              <Ionicons
                name="person-outline"
                size={20}
                color={theme.colors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.text.disabled}
                value={displayName}
                onChangeText={setDisplayName}
                onBlur={() => handleBlur('displayName')}
                autoCapitalize="words"
                editable={!isLoading}
              />
            </View>
            {touched.displayName && errors.displayName && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.displayName}</Text>
              </View>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
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
                placeholder="name@example.com"
                placeholderTextColor={theme.colors.text.disabled}
                value={email}
                onChangeText={setEmail}
                onBlur={() => handleBlur('email')}
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

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
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
                placeholder="Create a password"
                placeholderTextColor={theme.colors.text.disabled}
                value={password}
                onChangeText={setPassword}
                onBlur={() => handleBlur('password')}
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

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View
              style={[
                styles.inputContainer,
                touched.confirmPassword && errors.confirmPassword && styles.inputError,
              ]}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={theme.colors.text.disabled}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor={theme.colors.text.disabled}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onBlur={() => handleBlur('confirmPassword')}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}>
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.colors.text.disabled}
                />
              </TouchableOpacity>
            </View>
            {touched.confirmPassword && errors.confirmPassword && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              </View>
            )}
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
            activeOpacity={0.7}
            disabled={isLoading}>
            <View
              style={[
                styles.checkbox,
                acceptedTerms && styles.checkboxChecked,
              ]}>
              {acceptedTerms && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <View style={[styles.errorContainer, { marginTop: -8 }]}>
              <Ionicons name="alert-circle" size={14} color={theme.colors.error} />
              <Text style={styles.errorText}>{errors.terms}</Text>
            </View>
          )}

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              (!isFormValid() || isLoading) && styles.signUpButtonDisabled,
            ]}
            onPress={handleSignUp}
            disabled={!isFormValid() || isLoading}
            activeOpacity={0.8}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={styles.signInText}>Sign In</Text>
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
    paddingTop: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
  label: {
    ...theme.typography.body2,
    fontWeight: '500',
    color: theme.colors.text.primary,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  termsText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  termsLink: {
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
  signUpButton: {
    backgroundColor: theme.colors.primary.main,
    height: 52,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  signUpButtonDisabled: {
    opacity: 0.5,
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.body2,
    color: theme.colors.text.secondary,
  },
  signInText: {
    ...theme.typography.body2,
    color: theme.colors.primary.main,
    fontWeight: '600',
  },
});

export default SignUpScreen;
