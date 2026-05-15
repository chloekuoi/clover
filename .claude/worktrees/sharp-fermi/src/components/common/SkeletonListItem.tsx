import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors, spacing, theme } from '../../constants';

// ─── shared pulse hook ────────────────────────────────────────────────────────
function usePulse() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

// ─── SkeletonListItem ─────────────────────────────────────────────────────────
// Used by MatchesListScreen (chat rows) and anywhere with avatar + text rows.
type ListItemProps = {
  avatarSize?: number;
  showTimestamp?: boolean;
  lineTopWidth?: DimensionValue;
  lineBottomWidth?: DimensionValue;
};

export default function SkeletonListItem({
  avatarSize = 44,
  showTimestamp = true,
  lineTopWidth = '62%',
  lineBottomWidth = '42%',
}: ListItemProps) {
  const animStyle = usePulse();
  return (
    <Animated.View style={[styles.row, animStyle]}>
      <View
        style={[
          styles.block,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      />
      <View style={styles.lines}>
        <View style={[styles.block, styles.lineTop, { width: lineTopWidth }]} />
        <View style={[styles.block, styles.lineBottom, { width: lineBottomWidth }]} />
      </View>
      {showTimestamp && <View style={[styles.block, styles.timestamp]} />}
    </Animated.View>
  );
}

// ─── SkeletonSectionCard ──────────────────────────────────────────────────────
// Mimics a CollapsibleSection card — used by FriendsScreen.
type SectionCardProps = { rows?: number };

export function SkeletonSectionCard({ rows = 2 }: SectionCardProps) {
  const animStyle = usePulse();
  return (
    <Animated.View style={[styles.sectionCard, animStyle]}>
      {/* header bar */}
      <View style={styles.sectionHeader}>
        <View style={[styles.block, styles.sectionChevron]} />
        <View style={[styles.block, styles.sectionTitle]} />
      </View>
      {/* rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.sectionRow}>
          <View style={[styles.block, styles.rowAvatar]} />
          <View style={styles.lines}>
            <View style={[styles.block, styles.lineTop, { width: i % 2 === 0 ? '58%' : '48%' }]} />
            <View style={[styles.block, styles.lineBottom, { width: i % 2 === 0 ? '38%' : '52%' }]} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // shared block tint
  block: {
    backgroundColor: colors.bgSecondary,
    borderRadius: 5,
  },

  // SkeletonListItem
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: theme.surface,
    gap: spacing[3],
  },
  lines: {
    flex: 1,
    gap: spacing[2],
  },
  lineTop: {
    height: 13,
  },
  lineBottom: {
    height: 11,
  },
  timestamp: {
    width: 32,
    height: 10,
  },

  // SkeletonSectionCard
  sectionCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
    marginBottom: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 48,
    backgroundColor: colors.bgSecondary,
    gap: spacing[2],
  },
  sectionChevron: {
    width: 10,
    height: 10,
    borderRadius: 3,
  },
  sectionTitle: {
    height: 12,
    width: 110,
    borderRadius: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    gap: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
