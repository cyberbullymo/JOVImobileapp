/**
 * Home Screen
 * Main feed displaying gigs
 */

import React, { useState, useMemo, useEffect } from 'react';
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
import { getActiveGigs } from '../../services/firebase/gigService';
import type { Gig } from '../../types';

// Helper to format time ago
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
};

// Helper to convert Gig to FeedCardData
const gigToFeedCard = (gig: Gig): FeedCardData => {
  // Determine tag based on gig type
  let tag = 'Paid';
  let type: FeedCardData['type'] = 'gig';

  if (gig.gigType === 'tfp') {
    tag = 'TFP';
    type = 'tfp';
  } else if (gig.gigType === 'apprenticeship') {
    tag = 'Apprenticeship';
    type = 'apprenticeship';
  } else if (gig.gigType === 'trade') {
    tag = 'Trade Offer';
    type = 'trade';
  }

  // Format pay rate
  const formatRate = (): string => {
    if (gig.gigType === 'tfp') return 'Trade for Portfolio';
    if (gig.gigType === 'apprenticeship') return 'Learning Opportunity';
    const { min, max, type: payType } = gig.payRange;
    const suffix = payType === 'hourly' ? '/hr' : payType === 'daily' ? '/day' : '';
    if (min === max) return `$${min}${suffix}`;
    return `$${min}-${max}${suffix}`;
  };

  // Get author name from founder profile or use source
  const getAuthor = (): string => {
    if (gig.founderProfile?.businessName) return gig.founderProfile.businessName;
    if (gig.founderProfile?.displayName) return gig.founderProfile.displayName;
    if (gig.source === 'manual') return 'Jovi Curated';
    if (gig.source !== 'user-generated') return `via ${gig.source}`;
    return 'Anonymous';
  };

  // Build posted by info for user-generated gigs
  const getPostedBy = () => {
    if (gig.source === 'user-generated' && gig.postedBy) {
      return {
        userId: gig.postedBy,
        name: gig.founderProfile?.displayName || gig.founderProfile?.businessName || 'Jovi User',
        photoUrl: gig.founderProfile?.photoURL,
      };
    }
    return undefined;
  };

  return {
    id: gig.id,
    type,
    tag,
    title: gig.title,
    author: getAuthor(),
    authorType: gig.founderProfile?.businessName ? 'Business' : 'Individual',
    location: `${gig.location.city}, ${gig.location.state}`,
    rate: formatRate(),
    interestedPros: gig.applicationCount || 0,
    experienceLevel: 'All Levels',
    licenseRequired: true,
    requirements: gig.profession.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')),
    postedDate: formatTimeAgo(new Date(gig.createdAt)),
    // Source attribution (GIG-007)
    source: gig.source,
    sourceUrl: gig.sourceUrl,
    postedBy: getPostedBy(),
  };
};

// Map FeedCardData types to filter content types (MVP: gigs only)
const mapTypeToContentType = (_type: FeedCardData['type']): string => {
  // All gig types map to 'gigs'
  return 'gigs';
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
  const { filters, sort, isLoading, setLoading } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [gigs, setGigs] = useState<FeedCardData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch gigs from Firestore
  const fetchGigs = async () => {
    try {
      setError(null);
      const activeGigs = await getActiveGigs({ limitCount: 50 });
      const feedCards = activeGigs.map(gigToFeedCard);
      setGigs(feedCards);
    } catch (err) {
      console.error('Failed to fetch gigs:', err);
      setError('Failed to load gigs');
    }
  };

  // Fetch gigs on mount
  useEffect(() => {
    fetchGigs();
  }, []);

  // MVP: Only show gigs (no discussions/community content)
  const allFeedData = useMemo(() => {
    return gigs;
  }, [gigs]);

  // Apply filters and sorting to feed data
  const filteredAndSortedData = useMemo(() => {
    let data = [...allFeedData];

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
        // MVP: Sort by interested pros count
        data.sort((a, b) => {
          const aScore = a.interestedPros || 0;
          const bScore = b.interestedPros || 0;
          return bScore - aScore;
        });
        break;
      case 'trending':
        // MVP: Sort by interested pros (same as popular for now)
        data.sort((a, b) => {
          const aScore = a.interestedPros || 0;
          const bScore = b.interestedPros || 0;
          return bScore - aScore;
        });
        break;
      case 'relevant':
        // MVP: Prioritize gig types
        data.sort((a, b) => {
          const priority: Record<string, number> = { gig: 3, tfp: 2, apprenticeship: 2, trade: 1, portfolio: 0 };
          return (priority[b.type] || 0) - (priority[a.type] || 0);
        });
        break;
    }

    return data;
  }, [filters, sort]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchGigs();
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

  const handleProfilePress = (userId: string) => {
    // Navigate to user profile - implement navigation here
    console.log('Profile pressed:', userId);
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
            onProfilePress={handleProfilePress}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name={error ? "alert-circle-outline" : "search-outline"} size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>{error || 'No results found'}</Text>
            <Text style={styles.emptyText}>
              {error ? 'Pull down to try again' : 'Try adjusting your filters to see more content'}
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
