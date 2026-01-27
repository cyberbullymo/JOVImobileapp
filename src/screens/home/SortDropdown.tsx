/**
 * Sort Dropdown Component
 * Modal dropdown for feed sorting options
 */

import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../components/design-system/theme/theme';
import {
  useFeedStore,
  SortMethod,
  SORT_LABELS,
} from '../../store/feedStore';

// Design spec colors
const COLORS = {
  primary: '#4A1E6B',
  activeBackground: '#F8F4FB',
  divider: '#E8E8E8',
  sectionHeader: '#1A1A1A',
};

// Sort method descriptions
const SORT_DESCRIPTIONS: Record<SortMethod, string> = {
  recent: 'Newest posts first',
  popular: 'Most engagement',
  trending: 'Gaining momentum',
  relevant: 'Personalized for you',
};

// Sort method icons
const SORT_ICONS: Record<SortMethod, keyof typeof Ionicons.glyphMap> = {
  recent: 'time-outline',
  popular: 'heart-outline',
  trending: 'trending-up-outline',
  relevant: 'sparkles-outline',
};

interface SortOptionProps {
  method: SortMethod;
  isSelected: boolean;
  onSelect: () => void;
}

const SortOption = ({ method, isSelected, onSelect }: SortOptionProps) => (
  <TouchableOpacity
    style={[
      styles.sortOption,
      isSelected && styles.sortOptionActive,
    ]}
    onPress={onSelect}
    activeOpacity={0.7}>
    <Ionicons
      name={SORT_ICONS[method]}
      size={22}
      color={isSelected ? COLORS.primary : theme.colors.text.secondary}
    />
    <View style={styles.sortOptionText}>
      <Text
        style={[
          styles.sortOptionLabel,
          isSelected && styles.sortOptionLabelActive,
        ]}>
        {SORT_LABELS[method]}
      </Text>
      <Text style={styles.sortOptionDescription}>
        {SORT_DESCRIPTIONS[method]}
      </Text>
    </View>
    {isSelected && (
      <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
    )}
  </TouchableOpacity>
);

export const SortDropdown = () => {
  const insets = useSafeAreaInsets();
  const {
    sort,
    isSortDropdownVisible,
    closeSortDropdown,
    setSortMethod,
  } = useFeedStore();

  const handleSelect = (method: SortMethod) => {
    setSortMethod(method);
  };

  return (
    <Modal
      visible={isSortDropdownVisible}
      transparent
      animationType="fade"
      onRequestClose={closeSortDropdown}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeSortDropdown} />
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Sort By</Text>
            <TouchableOpacity onPress={closeSortDropdown} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Sort Options */}
          <View style={styles.optionsContainer}>
            {(Object.keys(SORT_LABELS) as SortMethod[]).map((method, index) => (
              <React.Fragment key={method}>
                <SortOption
                  method={method}
                  isSelected={sort.method === method}
                  onSelect={() => handleSelect(method)}
                />
                {index < Object.keys(SORT_LABELS).length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.sectionHeader,
  },
  closeButton: {
    padding: 4,
  },
  optionsContainer: {
    paddingBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 14,
  },
  sortOptionActive: {
    backgroundColor: COLORS.activeBackground,
    marginHorizontal: -4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  sortOptionText: {
    flex: 1,
  },
  sortOptionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  sortOptionLabelActive: {
    color: COLORS.primary,
  },
  sortOptionDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
  },
});

export default SortDropdown;
