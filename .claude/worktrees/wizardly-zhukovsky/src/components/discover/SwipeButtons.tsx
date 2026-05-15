import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme, spacing, colors, touchTarget } from '../../constants';

type SwipeButtonsProps = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export default function SwipeButtons({ onSwipeLeft, onSwipeRight }: SwipeButtonsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, styles.nopeButton]}
        onPress={onSwipeLeft}
        activeOpacity={0.8}
      >
        <Text style={styles.nopeIcon}>✕</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.likeButton]}
        onPress={onSwipeRight}
        activeOpacity={0.8}
      >
        <Text style={styles.likeIcon}>OK</Text>
      </TouchableOpacity>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  nopeButton: {
    backgroundColor: theme.surface,
    borderWidth: 2,
    borderColor: colors.accentDanger,
  },
  likeButton: {
    backgroundColor: colors.accentSuccess,
  },
  nopeIcon: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.accentDanger,
  },
  likeIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.surface,
  },
});
