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
      <Text style={styles.text}>Send Cowork Invite</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.min,
    paddingHorizontal: spacing[3],
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.accent,
  },
  disabled: {
    opacity: 0.4,
  },
});
