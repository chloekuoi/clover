import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, theme } from '../../constants';

type CollapsibleSectionProps = {
  title: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  showDot?: boolean;
  children: React.ReactNode;
};

export default function CollapsibleSection({
  title,
  count,
  expanded,
  onToggle,
  showDot = false,
  children,
}: CollapsibleSectionProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.left}>
          <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
          <Text style={styles.title}>{title} ({count})</Text>
        </View>
        {showDot ? <View style={styles.dot} /> : null}
      </TouchableOpacity>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
  },
  header: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.bgSecondary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    fontSize: 12,
    color: theme.textSecondary,
    marginRight: spacing[2],
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.error,
  },
  body: {
    padding: spacing[3],
    gap: spacing[2],
  },
});
