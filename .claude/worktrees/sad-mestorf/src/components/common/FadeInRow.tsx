import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';

type FadeInRowProps = {
  index: number;
  children: React.ReactNode;
};

const DURATION = 320;
const STAGGER = 55;
const MAX_STAGGER_INDEX = 7; // beyond this, no extra delay

export default function FadeInRow({ index, children }: FadeInRowProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER;
    const easing = Easing.out(Easing.ease);
    opacity.value = withDelay(delay, withTiming(1, { duration: DURATION, easing }));
    translateY.value = withDelay(delay, withTiming(0, { duration: DURATION, easing }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}
