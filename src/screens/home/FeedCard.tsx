/**
 * Feed Card Component
 * Displays gigs in the home feed (MVP: gigs only)
 */

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../components/design-system/theme/theme';

export interface FeedCardData {
  id: string;
  type: 'gig' | 'tfp' | 'apprenticeship' | 'portfolio' | 'trade';  // MVP: gigs only
  tag: string;
  title: string;
  author: string;
  authorType: string;
  avatar?: string;
  location?: string;
  distance?: string;
  rate?: string;
  rating?: number;
  interestedPros?: number;
  experienceLevel?: string;
  licenseRequired?: boolean;
  requirements?: string[];
  postedDate?: string;
}

interface FeedCardProps {
  data: FeedCardData;
  onPress?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}

const getTagStyle = (tag: string) => {
  switch (tag) {
    case 'Paid':
      return { backgroundColor: '#EF6F3C20', color: '#EF6F3C', borderColor: '#EF6F3C40' };
    case 'TFP':
      return { backgroundColor: '#D599FB20', color: '#D599FB', borderColor: '#D599FB40' };
    case 'Apprenticeship':
      return { backgroundColor: '#AFAB2320', color: '#AFAB23', borderColor: '#AFAB2340' };
    case 'Inspiration':
      return { backgroundColor: '#AFAB2320', color: '#AFAB23', borderColor: '#AFAB2340' };
    case 'Trade Offer':
      return { backgroundColor: '#AFAB2320', color: '#AFAB23', borderColor: '#AFAB2340' };
    default:
      return { backgroundColor: '#f9fafb', color: '#374151', borderColor: '#e5e7eb' };
  }
};

export const FeedCard = ({ data, onPress, onBookmark, isBookmarked }: FeedCardProps) => {
  const tagStyle = getTagStyle(data.tag);

  // MVP: Render gig cards only
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, { backgroundColor: tagStyle.backgroundColor, borderColor: tagStyle.borderColor }]}>
          <Text style={[styles.badgeText, { color: tagStyle.color }]}>{data.tag}</Text>
        </View>
        <View style={styles.headerRight}>
          {data.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={15} color="#AFAB23" />
              <Text style={styles.ratingText}>{data.rating}</Text>
            </View>
          )}
          {onBookmark && (
            <TouchableOpacity onPress={onBookmark} style={styles.bookmarkButton}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isBookmarked ? theme.colors.primary.main : '#6B7280'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.title}>{data.title}</Text>

      {/* Experience Level */}
      {data.experienceLevel && (
        <Text style={styles.experienceText}>
          {data.experienceLevel} {data.licenseRequired ? '• License Required' : '• No License Required'}
        </Text>
      )}

      {/* Requirements */}
      {data.requirements && data.requirements.length > 0 && (
        <View style={styles.requirementsContainer}>
          {data.requirements.slice(0, 3).map((req, index) => (
            <View key={index} style={styles.requirementBadge}>
              <Text style={styles.requirementText}>{req}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Location */}
      {data.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText}>
            {data.location}
            {data.distance && <Text style={styles.distanceText}> • {data.distance}</Text>}
          </Text>
        </View>
      )}

      {/* Rate */}
      {data.rate && (
        <Text style={styles.rateText}>{data.rate}</Text>
      )}

      <View style={styles.cardDivider} />

      <View style={styles.cardFooter}>
        <View style={styles.authorContainer}>
          {data.avatar ? (
            <Image source={{ uri: data.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
          <View>
            <Text style={styles.authorName}>{data.author}</Text>
            <Text style={styles.authorType}>
              {data.authorType}
              {data.postedDate && <Text style={styles.postedDate}> • {data.postedDate}</Text>}
            </Text>
          </View>
        </View>

        {data.interestedPros && (
          <View style={styles.interestedContainer}>
            <Ionicons name="people-outline" size={18} color="#B10347" />
            <Text style={styles.interestedText}>{data.interestedPros} pros interested</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 21,
  },
  experienceText: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  requirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  requirementBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  requirementText: {
    fontSize: 11,
    color: '#6B7280',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '300',
  },
  distanceText: {
    color: '#9CA3AF',
  },
  rateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  bookmarkButton: {
    padding: 4,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  authorType: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '300',
  },
  postedDate: {
    color: '#9CA3AF',
  },
  interestedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  interestedText: {
    fontSize: 13,
    color: '#B10347',
    fontWeight: '300',
  },
});

export default FeedCard;
