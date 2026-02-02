/**
 * Quality Badge Component
 * Displays AI quality score for gig listings
 * GIG-010: AI Quality Scoring
 */

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface QualityBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

// Score thresholds and their corresponding styles
const getScoreConfig = (score: number) => {
  if (score >= 9) {
    return {
      color: '#10B981', // Green
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      label: 'Excellent',
      icon: 'star' as const,
    };
  }
  if (score >= 7) {
    return {
      color: '#10B981', // Green
      backgroundColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      label: 'Great',
      icon: 'star-half' as const,
    };
  }
  if (score >= 5) {
    return {
      color: '#F59E0B', // Amber
      backgroundColor: '#FFFBEB',
      borderColor: '#FDE68A',
      label: 'Good',
      icon: 'star-outline' as const,
    };
  }
  return {
    color: '#6B7280', // Gray
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    label: 'Fair',
    icon: 'star-outline' as const,
  };
};

// Size configurations
const getSizeConfig = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return {
        iconSize: 10,
        fontSize: 10,
        labelFontSize: 9,
        paddingHorizontal: 6,
        paddingVertical: 2,
        gap: 3,
      };
    case 'large':
      return {
        iconSize: 16,
        fontSize: 14,
        labelFontSize: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6,
      };
    case 'medium':
    default:
      return {
        iconSize: 12,
        fontSize: 12,
        labelFontSize: 10,
        paddingHorizontal: 8,
        paddingVertical: 3,
        gap: 4,
      };
  }
};

export const QualityBadge = ({
  score,
  showLabel = false,
  size = 'medium',
  style,
}: QualityBadgeProps) => {
  // Clamp score to valid range
  const clampedScore = Math.max(1, Math.min(10, Math.round(score)));
  const scoreConfig = getScoreConfig(clampedScore);
  const sizeConfig = getSizeConfig(size);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: scoreConfig.backgroundColor,
          borderColor: scoreConfig.borderColor,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          gap: sizeConfig.gap,
        },
        style,
      ]}
    >
      <Ionicons
        name={scoreConfig.icon}
        size={sizeConfig.iconSize}
        color={scoreConfig.color}
      />
      <Text
        style={[
          styles.scoreText,
          {
            color: scoreConfig.color,
            fontSize: sizeConfig.fontSize,
          },
        ]}
      >
        {clampedScore}/10
      </Text>
      {showLabel && (
        <Text
          style={[
            styles.labelText,
            {
              color: scoreConfig.color,
              fontSize: sizeConfig.labelFontSize,
            },
          ]}
        >
          {scoreConfig.label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
  },
  scoreText: {
    fontWeight: '600',
  },
  labelText: {
    fontWeight: '500',
  },
});

export default QualityBadge;
