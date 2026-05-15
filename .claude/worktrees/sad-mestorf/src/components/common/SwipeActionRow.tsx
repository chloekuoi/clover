import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { borderRadius, colors, spacing } from '../../constants';

type SwipeActionRowProps = {
  enabled?: boolean;
  actionLabel: string;
  onActionPress: () => void;
  children: React.ReactNode;
};

export default function SwipeActionRow({
  enabled = true,
  actionLabel,
  onActionPress,
  children,
}: SwipeActionRowProps) {
  const swipeableRef = useRef<Swipeable | null>(null);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => {
              swipeableRef.current?.close();
              onActionPress();
            }}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionsWrap: {
    width: 112,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingLeft: spacing[2],
    paddingRight: spacing[4],
    paddingVertical: spacing[2],
  },
  actionButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accentDanger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
});
