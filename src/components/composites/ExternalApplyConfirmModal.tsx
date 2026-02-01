/**
 * External Apply Confirmation Modal (GIG-008)
 * Shows confirmation before opening external application URLs
 */

import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../design-system/theme/theme';
import { getDomain, getSourceDisplayName } from '../../lib/deepLinks';
import type { GigOrigin } from '../../types';

export interface ExternalApplyConfirmModalProps {
  visible: boolean;
  source: GigOrigin;
  sourceUrl: string;
  gigTitle: string;
  onConfirm: (skipFuture: boolean) => void;
  onCancel: () => void;
}

export function ExternalApplyConfirmModal({
  visible,
  source,
  sourceUrl,
  gigTitle,
  onConfirm,
  onCancel,
}: ExternalApplyConfirmModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = () => {
    onConfirm(dontShowAgain);
    setDontShowAgain(false);
  };

  const handleCancel = () => {
    setDontShowAgain(false);
    onCancel();
  };

  const sourceName = getSourceDisplayName(source);
  const domain = getDomain(sourceUrl);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={handleCancel} />
        <View style={styles.modal}>
          {/* Handle indicator */}
          <View style={styles.handle} />

          {/* Title */}
          <Text style={styles.title}>Apply on {sourceName}</Text>

          {/* URL Preview */}
          <View style={styles.preview}>
            <View style={styles.previewIcon}>
              <Ionicons name="globe-outline" size={24} color="#6B7280" />
            </View>
            <View style={styles.previewContent}>
              <Text style={styles.previewDomain}>{domain}</Text>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {gigTitle}
              </Text>
            </View>
            <Ionicons name="open-outline" size={20} color="#9CA3AF" />
          </View>

          {/* Description */}
          <Text style={styles.description}>
            This will open the original job posting in your browser. After
            applying, come back to mark this gig as applied.
          </Text>

          {/* Don't show again checkbox */}
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setDontShowAgain(!dontShowAgain)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.checkboxBox,
                dontShowAgain && styles.checkboxBoxChecked,
              ]}
            >
              {dontShowAgain && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>Don't show this again</Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewContent: {
    flex: 1,
  },
  previewDomain: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  previewTitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  checkboxLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
