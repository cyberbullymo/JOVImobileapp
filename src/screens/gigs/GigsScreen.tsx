/**
 * Gigs Screen
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../components/design-system/theme/theme';

const GigsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Opportunities</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>
          Browse beauty industry gigs and opportunities
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  header: {
    backgroundColor: theme.colors.background.paper,
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  placeholder: {
    ...theme.typography.body1,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default GigsScreen;
