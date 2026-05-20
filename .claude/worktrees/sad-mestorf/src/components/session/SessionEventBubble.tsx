import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, theme, borderRadius } from '../../constants';

type SessionEventBubbleProps = {
  text: string;
};

export default function SessionEventBubble({ text }: SessionEventBubbleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: spacing[2],
  },
  bubble: {
    backgroundColor: theme.highlight,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  text: {
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: '600',
  },
});
