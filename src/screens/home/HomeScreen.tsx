/**
 * Home Screen
 * Main feed displaying gigs, discussions, and opportunities
 */

import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../components/design-system/theme/theme';
import { useAuthStore } from '../../store/authStore';
import { useFeedStore } from '../../store/feedStore';
import { FeedCard, FeedCardData } from './FeedCard';
import { FeedControls } from './FeedControls';
import { FilterModal } from './FilterModal';
import { SortDropdown } from './SortDropdown';

// Sample feed data - replace with real data from your backend
const SAMPLE_FEED_DATA: FeedCardData[] = [
  {
    id: '1',
    type: 'gig',
    tag: 'Paid',
    title: 'Looking for experienced hairstylist for bridal party',
    author: 'Bella Salon & Spa',
    authorType: 'Salon',
    location: 'Los Angeles, CA',
    distance: '2.5 mi',
    rate: '$45-65/hr',
    rating: 4.8,
    interestedPros: 12,
    experienceLevel: 'Intermediate',
    licenseRequired: true,
    requirements: ['Bridal', 'Updo', 'Color'],
    postedDate: '2h ago',
  },
  {
    id: '2',
    type: 'question',
    tag: 'Question',
    title: 'What are the best products for maintaining color-treated hair between salon visits?',
    author: 'Sarah Mitchell',
    authorType: 'Future Pro',
    timeAgo: '4h ago',
    replies: 24,
    likes: 45,
  },
  {
    id: '3',
    type: 'tfp',
    tag: 'TFP',
    title: 'Creative makeup artist needed for editorial photoshoot',
    author: 'Creative Studios',
    authorType: 'Photography Studio',
    location: 'New York, NY',
    interestedPros: 8,
    requirements: ['Editorial', 'Creative', 'Portfolio Builder'],
    postedDate: '5h ago',
  },
  {
    id: '4',
    type: 'gig',
    tag: 'Paid',
    title: 'Part-time nail technician position available',
    author: 'Glamour Nails',
    authorType: 'Nail Salon',
    location: 'Miami, FL',
    distance: '1.2 mi',
    rate: '$18-25/hr + tips',
    rating: 4.5,
    interestedPros: 6,
    experienceLevel: 'Entry Level',
    licenseRequired: true,
    requirements: ['Gel', 'Acrylics', 'Nail Art'],
    postedDate: '1d ago',
  },
  {
    id: '5',
    type: 'discussion',
    tag: 'Discussion',
    title: 'Tips for building a clientele as a new licensed professional?',
    author: 'Marcus Johnson',
    authorType: 'Licensed Pro',
    timeAgo: '6h ago',
    replies: 56,
    likes: 89,
  },
  {
    id: '6',
    type: 'apprenticeship',
    tag: 'Apprenticeship',
    title: 'Seeking motivated apprentice for busy downtown salon',
    author: 'Urban Cuts',
    authorType: 'Barbershop',
    location: 'Chicago, IL',
    interestedPros: 15,
    experienceLevel: 'Student',
    licenseRequired: false,
    requirements: ['Eager to learn', 'Reliable', 'Team player'],
    postedDate: '2d ago',
  },
];

// Map FeedCardData types to filter content types
const mapTypeToContentType = (type: FeedCardData['type']): string => {
  switch (type) {
    case 'gig':
    case 'tfp':
    case 'apprenticeship':
    case 'trade':
      return 'gigs';
    case 'question':
    case 'discussion':
      return 'discussions';
    case 'portfolio':
      return 'posts';
    default:
      return 'posts';
  }
};

// Map authorType to filter user types
const mapAuthorTypeToUserType = (authorType: string): string => {
  const lowerType = authorType.toLowerCase();
  if (lowerType.includes('future') || lowerType.includes('student')) {
    return 'future_pro';
  }
  if (lowerType.includes('licensed') || lowerType.includes('pro')) {
    return 'licensed_pro';
  }
  if (lowerType.includes('salon') || lowerType.includes('spa') || lowerType.includes('owner') || lowerType.includes('studio') || lowerType.includes('barbershop')) {
    return 'founder';
  }
  return 'licensed_pro';
};

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { filters, sort, isLoading } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Apply filters and sorting to feed data
  const filteredAndSortedData = useMemo(() => {
    let data = [...SAMPLE_FEED_DATA];

    // Apply content type filter
    if (filters.contentTypes.length > 0) {
      data = data.filter((item) =>
        filters.contentTypes.includes(mapTypeToContentType(item.type) as any)
      );
    }

    // Apply user type filter
    if (filters.userTypes.length > 0) {
      data = data.filter((item) =>
        filters.userTypes.includes(mapAuthorTypeToUserType(item.authorType) as any)
      );
    }

    // Apply date filter (simplified for demo - would use actual timestamps in production)
    // In production, you'd compare actual dates
    if (filters.datePosted !== 'all') {
      // For demo purposes, we'll just show all items
      // In production: data = data.filter(item => new Date(item.createdAt) >= getDateCutoff(filters.datePosted));
    }

    // Apply sorting
    switch (sort.method) {
      case 'recent':
        // Already sorted by most recent in sample data
        break;
      case 'popular':
        data.sort((a, b) => {
          const aScore = (a.likes || 0) + (a.replies || 0) + (a.interestedPros || 0);
          const bScore = (b.likes || 0) + (b.replies || 0) + (b.interestedPros || 0);
          return bScore - aScore;
        });
        break;
      case 'trending':
        // For demo, use a combination of engagement and recency
        data.sort((a, b) => {
          const aScore = ((a.likes || 0) + (a.replies || 0)) * 1.5;
          const bScore = ((b.likes || 0) + (b.replies || 0)) * 1.5;
          return bScore - aScore;
        });
        break;
      case 'relevant':
        // For demo, prioritize gigs over discussions
        data.sort((a, b) => {
          const priority: Record<string, number> = { gig: 3, tfp: 2, apprenticeship: 2, question: 1, discussion: 1, trade: 1, portfolio: 0 };
          return (priority[b.type] || 0) - (priority[a.type] || 0);
        });
        break;
    }

    return data;
  }, [filters, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - replace with actual data fetch
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleBookmark = (id: string) => {
    setBookmarkedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCardPress = (item: FeedCardData) => {
    // Navigate to detail screen - implement navigation here
    console.log('Card pressed:', item.id);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <View>
          <Text style={styles.greeting}>
            Welcome back, {user?.displayName?.split(' ')[0] || 'Beauty Pro'}!
          </Text>
          <Text style={styles.subtitle}>Discover opportunities in beauty</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <Text style={styles.searchPlaceholder}>Search gigs, pros, salons...</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListHeader = () => (
    <FeedControls />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        {renderHeader()}
      </View>

      {/* Feed Controls */}
      {renderListHeader()}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        </View>
      )}

      {/* Feed */}
      <FlatList
        data={filteredAndSortedData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary.main}
          />
        }
        renderItem={({ item }) => (
          <FeedCard
            data={item}
            onPress={() => handleCardPress(item)}
            onBookmark={() => handleBookmark(item.id)}
            isBookmarked={bookmarkedIds.has(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your filters to see more content
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <FilterModal />

      {/* Sort Dropdown */}
      <SortDropdown />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    backgroundColor: theme.colors.background.default,
  },
  headerContent: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.background.paper,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: theme.colors.background.paper,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.paper,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchPlaceholder: {
    fontSize: 15,
    color: '#9CA3AF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  feedContent: {
    padding: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});

export default HomeScreen;
