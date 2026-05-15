import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Drop-in replacement for TouchableOpacity that adds a spring-bounce
 * press animation (scale 1 → 0.90 on press, spring back with slight
 * overshoot on release). Option C from the animation design review.
 */
export default function PressableScale({
  children,
  style,
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    if (!disabled) {
      scale.value = withTiming(0.9, { duration: 100, easing: Easing.in(Easing.ease) });
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (!disabled) {
      scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    }
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      style={[animatedStyle, style]}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
