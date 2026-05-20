import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, spacing } from '../../constants';

export default function MatchesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Matches</Text>
      <Text style={styles.subtitle}>Your co-working connections</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: spacing[2],
  },
});
