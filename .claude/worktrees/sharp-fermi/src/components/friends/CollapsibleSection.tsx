import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
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
  const chevronRotation = useSharedValue(expanded ? 90 : 0);

  useEffect(() => {
    chevronRotation.value = withTiming(expanded ? 90 : 0, {
      duration: 260,
      easing: Easing.out(Easing.ease),
    });
  }, [expanded]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.left}>
          <Animated.Text style={[styles.chevron, chevronStyle]}>▶</Animated.Text>
          <Text style={styles.title}>{title} ({count})</Text>
        </View>
        {showDot ? <View style={styles.dot} /> : null}
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          entering={FadeInDown.duration(240).easing(Easing.out(Easing.ease))}
          exiting={FadeOut.duration(160)}
          style={styles.body}
        >
          {children}
        </Animated.View>
      )}
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
