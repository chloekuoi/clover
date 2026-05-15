import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { spacing, theme, touchTarget } from '../../constants';

type StartSessionButtonProps = {
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function StartSessionButton({
  onPress,
  disabled = false,
  style,
}: StartSessionButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabled, style]}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>+ Cowork</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.min,
    paddingHorizontal: spacing[3],
    paddingVertical: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.primary,
    borderRadius: 999,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.4,
  },
});
