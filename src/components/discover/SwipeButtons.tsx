import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { theme, spacing, colors } from '../../constants';
import { CLOVER_FOREST } from '../../constants/clover';
import PressableScale from '../common/PressableScale';

type SwipeButtonsProps = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

function HeartIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 21.593c-5.63-5.539-11-10.297-11-14.402
           0-3.791 3.068-5.191 5.281-5.191
           1.312 0 4.151.501 5.719 4.457
           1.59-3.968 4.464-4.447 5.726-4.447
           2.54 0 5.274 1.621 5.274 5.181
           0 4.069-5.136 8.625-11 14.402z"
        fill="rgba(255,255,255,0.92)"
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
        <HeartIcon size={27} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing[5],
    gap: 36,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    fontSize: 19,
    fontWeight: '600',
    color: colors.accentDanger,
  },
});
