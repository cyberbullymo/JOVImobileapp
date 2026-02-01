/**
 * Source Badge Component
 * Displays source attribution for gig cards
 * GIG-007: Add Source Attribution UI to Gig Cards
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../design-system/theme/theme';
import type { GigOrigin } from '../../types';

export interface SourceBadgeProps {
  source: GigOrigin;
  postedBy?: {
    userId: string;
    name: string;
    photoUrl?: string;
  };
  sourceUrl?: string | null;
  onPress?: () => void;
  onProfilePress?: (userId: string) => void;
}

// Source-specific styling configuration
const sourceStyles: Record<GigOrigin, {
  badge: { backgroundColor: string; borderColor: string };
  text: { color: string };
  label: string;
  iconColor: string;
}> = {
  'user-generated': {
    badge: {
      backgroundColor: '#4A1E6B',
      borderColor: '#4A1E6B',
    },
    text: { color: '#FFFFFF' },
    label: 'Posted by',
    iconColor: '#FFFFFF',
  },
  'craigslist': {
    badge: {
      backgroundColor: '#F5F5F5',
      borderColor: '#FF6F00',
    },
    text: { color: '#333333' },
    label: 'From Craigslist',
    iconColor: '#FF6F00',
  },
  'school-board': {
    badge: {
      backgroundColor: '#FFF5F5',
      borderColor: '#FF6B6B',
    },
    text: { color: '#FF6B6B' },
    label: 'School Job Board',
    iconColor: '#FF6B6B',
  },
  'indeed': {
    badge: {
      backgroundColor: '#E7F5FF',
      borderColor: '#2164F3',
    },
    text: { color: '#2164F3' },
    label: 'From Indeed',
    iconColor: '#2164F3',
  },
  'facebook': {
    badge: {
      backgroundColor: '#E7F0FF',
      borderColor: '#1877F2',
    },
    text: { color: '#1877F2' },
    label: 'From Facebook',
    iconColor: '#1877F2',
  },
  'instagram': {
    badge: {
      backgroundColor: '#FFF0F5',
      borderColor: '#E4405F',
    },
    text: { color: '#C13584' },
    label: 'From Instagram',
    iconColor: '#E4405F',
  },
  'manual': {
    badge: {
      backgroundColor: '#FFFBF0',
      borderColor: '#FFD700',
    },
    text: { color: '#B8860B' },
    label: 'Jovi Curated',
    iconColor: '#FFD700',
  },
};

// Get icon for each source type
const SourceIcon = ({ source, color, size = 16 }: { source: GigOrigin; color: string; size?: number }) => {
  switch (source) {
    case 'user-generated':
      return <Ionicons name="person" size={size} color={color} />;
    case 'craigslist':
      return <MaterialCommunityIcons name="post-outline" size={size} color={color} />;
    case 'school-board':
      return <Ionicons name="school" size={size} color={color} />;
    case 'indeed':
      return <MaterialCommunityIcons name="briefcase-search" size={size} color={color} />;
    case 'facebook':
      return <Ionicons name="logo-facebook" size={size} color={color} />;
    case 'instagram':
      return <Ionicons name="logo-instagram" size={size} color={color} />;
    case 'manual':
      return <Ionicons name="checkmark-circle" size={size} color={color} />;
    default:
      return <Ionicons name="globe" size={size} color={color} />;
  }
};

export const SourceBadge = ({
  source,
  postedBy,
  onPress,
  onProfilePress,
}: SourceBadgeProps) => {
  const styles = sourceStyles[source] || sourceStyles['manual'];

  // User-generated gig with poster info
  if (source === 'user-generated' && postedBy) {
    return (
      <TouchableOpacity
        style={[baseStyles.badge, { backgroundColor: styles.badge.backgroundColor, borderColor: styles.badge.borderColor }]}
        onPress={() => onProfilePress?.(postedBy.userId)}
        activeOpacity={0.7}
        accessibilityLabel={`Posted by ${postedBy.name}, tap to view profile`}
        accessibilityRole="button"
      >
        {postedBy.photoUrl ? (
          <Image
            source={{ uri: postedBy.photoUrl }}
            style={baseStyles.avatar}
          />
        ) : (
          <View style={[baseStyles.avatar, baseStyles.avatarPlaceholder]}>
            <Ionicons name="person" size={12} color="#FFFFFF" />
          </View>
        )}
        <Text style={[baseStyles.text, { color: styles.text.color }]} numberOfLines={1}>
          Posted by {postedBy.name.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  }

  // Aggregated gig sources
  return (
    <TouchableOpacity
      style={[baseStyles.badge, { backgroundColor: styles.badge.backgroundColor, borderColor: styles.badge.borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`${styles.label}, tap for more info`}
      accessibilityRole="button"
    >
      <SourceIcon source={source} color={styles.iconColor} />
      <Text style={[baseStyles.text, { color: styles.text.color }]} numberOfLines={1}>
        {styles.label}
      </Text>
    </TouchableOpacity>
  );
};

const baseStyles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
    maxWidth: 160,
    ...theme.shadows.sm,
    zIndex: 1,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
});

export default SourceBadge;
