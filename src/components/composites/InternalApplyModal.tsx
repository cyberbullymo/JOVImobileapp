/**
 * Internal Apply Modal (GIG-008)
 * Modal for applying to user-generated gigs through Jovi
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../design-system/theme/theme';
import { submitInternalApplication } from '../../services/firebase/applicationService';

export interface InternalApplyModalProps {
  visible: boolean;
  gigId: string;
  gigTitle: string;
  companyName: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const MAX_COVER_LETTER_LENGTH = 1000;
const MIN_COVER_LETTER_LENGTH = 50;

export function InternalApplyModal({
  visible,
  gigId,
  gigTitle,
  companyName,
  userId,
  onClose,
  onSuccess,
}: InternalApplyModalProps) {
  const [coverLetter, setCoverLetter] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const characterCount = coverLetter.length;
  const isValidLength = characterCount >= MIN_COVER_LETTER_LENGTH && characterCount <= MAX_COVER_LETTER_LENGTH;

  const handleSubmit = async () => {
    if (!isValidLength) {
      setError(`Cover letter must be between ${MIN_COVER_LETTER_LENGTH} and ${MAX_COVER_LETTER_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitInternalApplication({
        gigId,
        gigTitle,
        applicantId: userId,
        coverLetter: coverLetter.trim(),
        portfolioLinks: portfolioLink.trim() ? [portfolioLink.trim()] : [],
      });

      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reset form
      setCoverLetter('');
      setPortfolioLink('');

      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit application';
      setError(errorMessage);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setCoverLetter('');
    setPortfolioLink('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.backdropPressable}
            onPress={handleClose}
            activeOpacity={1}
          />
          <View style={styles.modal}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Text style={styles.title}>Apply through Jovi</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {gigTitle} at {companyName}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                disabled={isSubmitting}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Error Message */}
              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Cover Letter */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Cover Letter *</Text>
                <Text style={styles.hint}>
                  Introduce yourself and explain why you're interested in this opportunity
                </Text>
                <TextInput
                  style={[
                    styles.textArea,
                    !isValidLength && characterCount > 0 && styles.textAreaError,
                  ]}
                  placeholder="Tell them about your experience, skills, and why you'd be a great fit..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  value={coverLetter}
                  onChangeText={setCoverLetter}
                  maxLength={MAX_COVER_LETTER_LENGTH + 100}
                  editable={!isSubmitting}
                />
                <Text
                  style={[
                    styles.characterCount,
                    !isValidLength && characterCount > 0 && styles.characterCountError,
                  ]}
                >
                  {characterCount}/{MAX_COVER_LETTER_LENGTH} characters
                  {characterCount < MIN_COVER_LETTER_LENGTH && ` (min ${MIN_COVER_LETTER_LENGTH})`}
                </Text>
              </View>

              {/* Portfolio Link */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Portfolio Link (Optional)</Text>
                <Text style={styles.hint}>
                  Share your work to stand out from other applicants
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="https://your-portfolio.com"
                  placeholderTextColor="#9CA3AF"
                  value={portfolioLink}
                  onChangeText={setPortfolioLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  editable={!isSubmitting}
                />
              </View>

              {/* Tips */}
              <View style={styles.tipsContainer}>
                <View style={styles.tipHeader}>
                  <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                  <Text style={styles.tipTitle}>Tips for a great application</Text>
                </View>
                <View style={styles.tipsList}>
                  <Text style={styles.tipItem}>
                    {'\u2022'} Mention relevant experience and skills
                  </Text>
                  <Text style={styles.tipItem}>
                    {'\u2022'} Show enthusiasm for the opportunity
                  </Text>
                  <Text style={styles.tipItem}>
                    {'\u2022'} Be specific about what you can contribute
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!isValidLength || isSubmitting) && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!isValidLength || isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Submit Application</Text>
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  closeButton: {
    padding: 4,
    marginLeft: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#DC2626',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: '#FAFAFA',
    minHeight: 140,
  },
  textAreaError: {
    borderColor: '#EF4444',
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: 6,
  },
  characterCountError: {
    color: '#EF4444',
  },
  tipsContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  tipsList: {
    gap: 6,
  },
  tipItem: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
