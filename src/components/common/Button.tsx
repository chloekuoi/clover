import React from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, theme, spacing, borderRadius, touchTarget, shadows } from '../../constants';
import PressableScale from './PressableScale';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <PressableScale
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'pill' ? theme.surface : theme.primary}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`${variant}Text` as keyof typeof styles],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget.min,
    paddingHorizontal: spacing[6],
    paddingVertical: 15,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#0c1f0e',  // CLOVER_FOREST — inlined to avoid circular dep with clover.ts
    ...shadows.button,
  },
  secondary: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pill: {
    height: 58,
    borderRadius: 9999,
    backgroundColor: '#0c1f0e',  // CLOVER_FOREST — inlined to avoid circular dep with clover.ts
    paddingVertical: 0,           // reset base's paddingVertical: 15 so height is respected
    paddingHorizontal: 0,         // full-width; caller controls width via style prop
    shadowColor: '#0c1f0e',       // CLOVER_FOREST — inlined for same reason
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',  // FONT_DM_SANS_MEDIUM — inlined to avoid circular dep
    fontSize: 15,
    letterSpacing: 0.75,   // 0.05em at 15px
    color: '#ede8ff',      // CLOVER_BG — inlined for same reason
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: theme.surface,
  },
  secondaryText: {
    color: colors.textPrimary,
  },
  ghostText: {
    color: colors.textTertiary,
  },
});
