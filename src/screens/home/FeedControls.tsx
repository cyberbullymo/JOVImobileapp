/**
 * Feed Controls Component
 * Filter and Sort buttons for the home feed
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../components/design-system/theme/theme';
import { useFeedStore, SORT_LABELS } from '../../store/feedStore';

// Design spec colors
const COLORS = {
  activeBackground: '#F8F4FB',
  activeBorder: '#4A1E6B',
  activeText: '#4A1E6B',
  inactiveBackground: '#FFFFFF',
  inactiveBorder: '#E0E0E0',
  inactiveText: '#333333',
  badgeBackground: '#FF6B6B',
};

export const FeedControls = () => {
  const {
    sort,
    openFilterModal,
    openSortDropdown,
    getActiveFilterCount,
  } = useFeedStore();

  const activeFilterCount = getActiveFilterCount();
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <View style={styles.container}>
      {/* Filter Button */}
      <TouchableOpacity
        style={[
          styles.button,
          hasActiveFilters && styles.buttonActive,
        ]}
        onPress={openFilterModal}
        activeOpacity={0.7}>
        <Ionicons
          name="funnel-outline"
          size={16}
          color={hasActiveFilters ? COLORS.activeText : COLORS.inactiveText}
        />
        <Text
          style={[
            styles.buttonText,
            hasActiveFilters && styles.buttonTextActive,
          ]}>
          Filter
        </Text>
        {hasActiveFilters && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Sort Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={openSortDropdown}
        activeOpacity={0.7}>
        <Ionicons
          name="swap-vertical-outline"
          size={16}
          color={COLORS.inactiveText}
        />
        <Text style={styles.buttonText}>{SORT_LABELS[sort.method]}</Text>
        <Ionicons
          name="chevron-down"
          size={14}
          color={COLORS.inactiveText}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.inactiveBorder,
    backgroundColor: COLORS.inactiveBackground,
    gap: 6,
    minWidth: 100,
  },
  buttonActive: {
    borderColor: COLORS.activeBorder,
    backgroundColor: COLORS.activeBackground,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.inactiveText,
  },
  buttonTextActive: {
    color: COLORS.activeText,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.badgeBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default FeedControls;
