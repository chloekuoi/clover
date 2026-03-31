import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { theme, spacing } from '../../constants';
import { CLOVER_FOREST, CLOVER_BG, CLOVER_VIOLET, CLOVER_LAVENDER } from '../../constants/clover';
import PressableScale from '../common/PressableScale';

type SwipeButtonsProps = {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

function XIcon({ size = 19 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 17 17" fill="none">
      <Line x1="3" y1="3" x2="14" y2="14" stroke={CLOVER_VIOLET} strokeWidth={2.2} strokeLinecap="round" />
      <Line x1="14" y1="3" x2="3" y2="14" stroke={CLOVER_VIOLET} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

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
        fill={CLOVER_BG}
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
        <XIcon size={19} />
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
    borderColor: CLOVER_LAVENDER,
  },
  likeButton: {
    backgroundColor: CLOVER_FOREST,
    shadowColor: CLOVER_FOREST,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
