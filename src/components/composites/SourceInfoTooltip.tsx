/**
 * Source Info Tooltip Component
 * Modal popup showing source details for aggregated gigs
 * GIG-007: Add Source Attribution UI to Gig Cards
 */

import React from 'react';
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../design-system/theme/theme';
import type { GigOrigin } from '../../types';

export interface SourceInfoTooltipProps {
  source: GigOrigin;
  sourceUrl?: string | null;
  visible: boolean;
  onClose: () => void;
}

// Get display name for each source
const getSourceDisplayName = (source: GigOrigin): string => {
  switch (source) {
    case 'user-generated':
      return 'a Jovi user';
    case 'craigslist':
      return 'Craigslist';
    case 'school-board':
      return 'a School Job Board';
    case 'indeed':
      return 'Indeed';
    case 'facebook':
      return 'Facebook';
    case 'instagram':
      return 'Instagram';
    case 'manual':
      return 'Jovi\'s curated selection';
    default:
      return 'an external source';
  }
};

// Get icon for each source type
const SourceIcon = ({ source, size = 24 }: { source: GigOrigin; size?: number }) => {
  const color = theme.colors.text.secondary;

  switch (source) {
    case 'craigslist':
      return <MaterialCommunityIcons name="post-outline" size={size} color="#FF6F00" />;
    case 'school-board':
      return <Ionicons name="school" size={size} color="#FF6B6B" />;
    case 'indeed':
      return <MaterialCommunityIcons name="briefcase-search" size={size} color="#2164F3" />;
    case 'facebook':
      return <Ionicons name="logo-facebook" size={size} color="#1877F2" />;
    case 'instagram':
      return <Ionicons name="logo-instagram" size={size} color="#E4405F" />;
    case 'manual':
      return <Ionicons name="checkmark-circle" size={size} color="#FFD700" />;
    default:
      return <Ionicons name="globe" size={size} color={color} />;
  }
};

// Get verification message based on source
const getVerificationMessage = (source: GigOrigin): string => {
  switch (source) {
    case 'manual':
      return 'Hand-picked and verified by Jovi team';
    case 'school-board':
      return 'Sourced from accredited beauty schools';
    default:
      return 'Verified by Jovi team';
  }
};

// Get application guidance based on source
const getApplicationGuidance = (source: GigOrigin): string => {
  switch (source) {
    case 'user-generated':
      return 'Apply directly through Jovi';
    case 'manual':
      return 'Apply through Jovi or the original source';
    default:
      return 'Apply through their website';
  }
};

export const SourceInfoTooltip = ({
  source,
  sourceUrl,
  visible,
  onClose,
}: SourceInfoTooltipProps) => {
  const handleOpenSource = async () => {
    if (sourceUrl) {
      try {
        const canOpen = await Linking.canOpenURL(sourceUrl);
        if (canOpen) {
          await Linking.openURL(sourceUrl);
        }
      } catch (error) {
        console.error('Failed to open source URL:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.tooltip}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <SourceIcon source={source} />
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Title */}
            <Text style={styles.title}>About this gig source</Text>

            {/* Description */}
            <Text style={styles.description}>
              This gig was found on {getSourceDisplayName(source)}.
            </Text>

            {/* Application guidance */}
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color={theme.colors.text.secondary} />
              <Text style={styles.infoText}>{getApplicationGuidance(source)}</Text>
            </View>

            {/* Verification */}
            <View style={styles.verificationRow}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.verificationText}>{getVerificationMessage(source)}</Text>
            </View>

            {/* View original posting link */}
            {sourceUrl && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={handleOpenSource}
              >
                <Text style={styles.linkText}>View original posting</Text>
                <Ionicons name="open-outline" size={16} color={theme.colors.primary.main} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  tooltip: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 320,
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#F0FDF4',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.md,
  },
  verificationText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '500',
    flex: 1,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    marginTop: theme.spacing.xs,
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.primary.main,
    fontWeight: '500',
  },
});

export default SourceInfoTooltip;
