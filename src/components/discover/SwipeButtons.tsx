import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { theme, spacing, colors } from '../../constants';
import { CLOVER_FOREST } from '../../constants/clover';
import PressableScale from '../common/PressableScale';

type SwipeButtonsProps = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

function CloverIcon({ size = 26 }: { size?: number }) {
  const c = size / 2;
  const r = size * 0.21;
  const offset = size * 0.19;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* 4 petals */}
      <Circle cx={c}          cy={c - offset} r={r} fill="rgba(255,255,255,0.92)" />
      <Circle cx={c + offset} cy={c}          r={r} fill="rgba(255,255,255,0.92)" />
      <Circle cx={c}          cy={c + offset} r={r} fill="rgba(255,255,255,0.92)" />
      <Circle cx={c - offset} cy={c}          r={r} fill="rgba(255,255,255,0.92)" />
      {/* stem */}
      <Rect
        x={c - 2}
        y={c + offset + r - 3}
        width={4}
        height={size * 0.18}
        rx={2}
        fill="rgba(255,255,255,0.7)"
      />
    </Svg>
  );
}

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
        <CloverIcon size={26} />
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
    backgroundColor: CLOVER_FOREST,
    shadowColor: CLOVER_FOREST,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  nopeIcon: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.accentDanger,
  },
});
