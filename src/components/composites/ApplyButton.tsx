/**
 * Apply Button Component (GIG-008)
 * Handles both internal Jovi applications and external source applications
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme } from '../design-system/theme/theme';
import { ExternalApplyConfirmModal } from './ExternalApplyConfirmModal';
import { openExternalUrl, getSourceDisplayName } from '../../lib/deepLinks';
import { trackApplicationAttempt } from '../../services/firebase/applicationService';
import { showMarkAppliedPrompt } from '../../lib/markAppliedPrompt';
import type { GigOrigin } from '../../types';

const SKIP_CONFIRM_KEY = 'skip_external_confirm';

export interface ApplyButtonProps {
  gigId: string;
  gigTitle: string;
  source: GigOrigin;
  sourceUrl: string | null;
  userId: string | null;
  hasApplied: boolean;
  onInternalApply?: () => void;
  onMarkApplied?: (gigId: string) => void;
  compact?: boolean;
}

export function ApplyButton({
  gigId,
  gigTitle,
  source,
  sourceUrl,
  userId,
  hasApplied,
  onInternalApply,
  onMarkApplied,
  compact = false,
}: ApplyButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isExternal = source !== 'user-generated';

  const handlePress = async () => {
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (hasApplied) {
      return;
    }

    if (isExternal) {
      // Check if user has disabled confirmation
      const skipConfirm = await AsyncStorage.getItem(SKIP_CONFIRM_KEY);
      if (skipConfirm === 'true') {
        await openExternalUrlFlow();
      } else {
        setShowConfirm(true);
      }
    } else {
      // Internal Jovi application flow
      onInternalApply?.();
    }
  };

  const openExternalUrlFlow = async () => {
    if (!sourceUrl) return;

    setIsLoading(true);
    setShowConfirm(false);

    try {
      // Track application attempt
      if (userId) {
        await trackApplicationAttempt({
          gigId,
          userId,
          source,
          sourceUrl,
        });
      }

      // Open external URL (tries deep link first)
      await openExternalUrl(source, sourceUrl);

      // Show mark as applied prompt after delay
      setTimeout(() => {
        showMarkAppliedPrompt(gigId, gigTitle, () => {
          onMarkApplied?.(gigId);
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to open external URL:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (skipFuture: boolean) => {
    if (skipFuture) {
      await AsyncStorage.setItem(SKIP_CONFIRM_KEY, 'true');
    }
    await openExternalUrlFlow();
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // Render applied state
  if (hasApplied) {
    return (
      <View style={[styles.button, styles.appliedButton, compact && styles.compactButton]}>
        <Ionicons name="checkmark-circle" size={compact ? 16 : 20} color="#10B981" />
        <Text style={[styles.appliedText, compact && styles.compactText]}>Applied</Text>
      </View>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.button, styles.loadingButton, compact && styles.compactButton]}>
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  // Render apply button
  return (
    <>
      <TouchableOpacity
        style={[styles.button, compact && styles.compactButton]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, compact && styles.compactText]}>
          {isExternal
            ? `Apply on ${getSourceDisplayName(source)}`
            : 'Apply through Jovi'}
        </Text>
        {isExternal && (
          <Ionicons name="open-outline" size={compact ? 14 : 16} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {isExternal && sourceUrl && (
        <ExternalApplyConfirmModal
          visible={showConfirm}
          source={source}
          sourceUrl={sourceUrl}
          gigTitle={gigTitle}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  compactButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  compactText: {
    fontSize: 12,
  },
  appliedButton: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  appliedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  loadingButton: {
    opacity: 0.8,
  },
});
