/**
 * Filter Modal Component
 * Bottom sheet modal for feed filtering options
 */

import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../components/design-system/theme/theme';
import {
  useFeedStore,
  FeedFilters,
  ContentType,
  UserTypeFilter,
  Category,
  DatePosted,
  CONTENT_TYPE_LABELS,
  USER_TYPE_LABELS,
  CATEGORY_LABELS,
  DATE_POSTED_LABELS,
} from '../../store/feedStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

// Design spec colors
const COLORS = {
  primary: '#4A1E6B',
  activeBackground: '#F8F4FB',
  checkboxActive: '#4A1E6B',
  checkboxInactive: '#E0E0E0',
  divider: '#E8E8E8',
  sectionHeader: '#1A1A1A',
  coral: '#FF6B6B',
};

interface CheckboxItemProps {
  label: string;
  isSelected: boolean;
  onToggle: () => void;
}

const CheckboxItem = ({ label, isSelected, onToggle }: CheckboxItemProps) => (
  <TouchableOpacity
    style={styles.checkboxItem}
    onPress={onToggle}
    activeOpacity={0.7}>
    <View
      style={[
        styles.checkbox,
        isSelected && styles.checkboxActive,
      ]}>
      {isSelected && (
        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
      )}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

interface RadioItemProps {
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

const RadioItem = ({ label, isSelected, onSelect }: RadioItemProps) => (
  <TouchableOpacity
    style={styles.radioItem}
    onPress={onSelect}
    activeOpacity={0.7}>
    <View
      style={[
        styles.radio,
        isSelected && styles.radioActive,
      ]}>
      {isSelected && <View style={styles.radioInner} />}
    </View>
    <Text style={styles.radioLabel}>{label}</Text>
  </TouchableOpacity>
);

export const FilterModal = () => {
  const insets = useSafeAreaInsets();
  const {
    filters,
    isFilterModalVisible,
    closeFilterModal,
    applyFilters,
    clearAllFilters,
  } = useFeedStore();

  // Local state for editing filters before applying
  const [localFilters, setLocalFilters] = useState<FeedFilters>(filters);

  // Sync local filters when modal opens
  useEffect(() => {
    if (isFilterModalVisible) {
      setLocalFilters(filters);
    }
  }, [isFilterModalVisible, filters]);

  const toggleContentType = (type: ContentType) => {
    setLocalFilters((prev) => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter((t) => t !== type)
        : [...prev.contentTypes, type],
    }));
  };

  const toggleUserType = (type: UserTypeFilter) => {
    setLocalFilters((prev) => ({
      ...prev,
      userTypes: prev.userTypes.includes(type)
        ? prev.userTypes.filter((t) => t !== type)
        : [...prev.userTypes, type],
    }));
  };

  const toggleCategory = (category: Category) => {
    setLocalFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  };

  const setDatePosted = (date: DatePosted) => {
    setLocalFilters((prev) => ({
      ...prev,
      datePosted: date,
    }));
  };

  const toggleLocation = () => {
    setLocalFilters((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        enabled: !prev.location.enabled,
      },
    }));
  };

  const setLocationRadius = (radius: number) => {
    setLocalFilters((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        radiusMiles: radius,
      },
    }));
  };

  const handleApply = () => {
    applyFilters(localFilters);
  };

  const handleClearAll = () => {
    setLocalFilters({
      contentTypes: [],
      userTypes: [],
      location: { enabled: false, radiusMiles: 25 },
      categories: [],
      datePosted: 'all',
    });
  };

  return (
    <Modal
      visible={isFilterModalVisible}
      transparent
      animationType="slide"
      onRequestClose={closeFilterModal}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeFilterModal} />
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={closeFilterModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}>

            {/* Content Type - Hidden for MVP (gigs only) */}
            {/* TODO: Re-enable when discussions/posts are added
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Content Type</Text>
              <View style={styles.optionsGrid}>
                {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((type) => (
                  <CheckboxItem
                    key={type}
                    label={CONTENT_TYPE_LABELS[type]}
                    isSelected={localFilters.contentTypes.includes(type)}
                    onToggle={() => toggleContentType(type)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.divider} />
            */}

            {/* User Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Type</Text>
              <View style={styles.optionsGrid}>
                {(Object.keys(USER_TYPE_LABELS) as UserTypeFilter[]).map((type) => (
                  <CheckboxItem
                    key={type}
                    label={USER_TYPE_LABELS[type]}
                    isSelected={localFilters.userTypes.includes(type)}
                    onToggle={() => toggleUserType(type)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <CheckboxItem
                label="Enable location filter"
                isSelected={localFilters.location.enabled}
                onToggle={toggleLocation}
              />
              {localFilters.location.enabled && (
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>
                    Distance: {localFilters.location.radiusMiles} miles
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={5}
                    maximumValue={100}
                    step={5}
                    value={localFilters.location.radiusMiles}
                    onValueChange={setLocationRadius}
                    minimumTrackTintColor={COLORS.primary}
                    maximumTrackTintColor={COLORS.checkboxInactive}
                    thumbTintColor={COLORS.primary}
                  />
                  <View style={styles.sliderLabels}>
                    <Text style={styles.sliderMinMax}>5 mi</Text>
                    <Text style={styles.sliderMinMax}>100 mi</Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.optionsGrid}>
                {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
                  <CheckboxItem
                    key={category}
                    label={CATEGORY_LABELS[category]}
                    isSelected={localFilters.categories.includes(category)}
                    onToggle={() => toggleCategory(category)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Date Posted */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Date Posted</Text>
              <View style={styles.radioGroup}>
                {(Object.keys(DATE_POSTED_LABELS) as DatePosted[]).map((date) => (
                  <RadioItem
                    key={date}
                    label={DATE_POSTED_LABELS[date]}
                    isSelected={localFilters.datePosted === date}
                    onSelect={() => setDatePosted(date)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.8}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
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
    height: MODAL_HEIGHT,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.sectionHeader,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.coral,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.sectionHeader,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.checkboxInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.checkboxActive,
    borderColor: COLORS.checkboxActive,
  },
  checkboxLabel: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  radioGroup: {
    gap: 12,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.checkboxInactive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: COLORS.checkboxActive,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.checkboxActive,
  },
  radioLabel: {
    fontSize: 15,
    color: theme.colors.text.primary,
  },
  sliderContainer: {
    marginTop: 16,
    paddingLeft: 34,
  },
  sliderLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderMinMax: {
    fontSize: 12,
    color: theme.colors.text.disabled,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FilterModal;
