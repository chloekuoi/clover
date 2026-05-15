import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme, spacing, colors, touchTarget } from '../../constants';
import PressableScale from '../common/PressableScale';

type SwipeButtonsProps = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export default function SwipeButtons({ onSwipeLeft, onSwipeRight }: SwipeButtonsProps) {
  return (
    <View style={styles.container}>
      <PressableScale
        style={[styles.button, styles.nopeButton]}
        onPress={onSwipeLeft}
      >
        <Text style={styles.nopeIcon}>✕</Text>
      </PressableScale>

      <PressableScale
        style={[styles.button, styles.likeButton]}
        onPress={onSwipeRight}
      >
        <Text style={styles.likeIcon}>✓</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[6],
    gap: spacing[8],
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  nopeButton: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(184,92,77,0.4)',
  },
  likeButton: {
    backgroundColor: colors.accentSuccess,
    shadowColor: colors.accentSuccess,
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 4,
  },
  nopeIcon: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.accentDanger,
  },
  likeIcon: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.surface,
  },
});
