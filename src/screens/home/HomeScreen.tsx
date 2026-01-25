/**
 * Home Screen
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../components/design-system/theme/theme';
import { useAuthStore } from '../../store/authStore';

const HomeScreen = () => {
  const { user } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back, {user?.displayName || 'Beauty Pro'}!
        </Text>
        <Text style={styles.subtitle}>Discover opportunities in beauty</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Your Feed</Text>
          <Text style={styles.cardText}>
            Gigs, updates, and opportunities will appear here.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✨ Featured Opportunities</Text>
          <Text style={styles.cardText}>
            Top gigs from salons and spas in your area.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💼 Quick Actions</Text>
          <Text style={styles.cardText}>
            Browse gigs • Update portfolio • Network with pros
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    backgroundColor: theme.colors.primary.main,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  greeting: {
    ...theme.typography.h2,
    color: theme.colors.primary.contrast,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body1,
    color: theme.colors.primary.contrast,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
  },
});

export default HomeScreen;
