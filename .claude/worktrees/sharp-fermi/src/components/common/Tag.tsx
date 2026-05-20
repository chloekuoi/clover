import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, theme, borderRadius } from '../../constants';

type TagProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  size?: 'sm' | 'md';
};

export default function Tag({
  label,
  selected = false,
  onPress,
  style,
  size = 'md',
}: TagProps) {
  const Wrapper = onPress ? TouchableOpacity : ({ children, style }: any) => (
    <Text style={style}>{children}</Text>
  );

  if (!onPress) {
    return (
      <Text
        style={[
          styles.base,
          size === 'sm' ? styles.sm : styles.md,
          selected ? styles.selected : styles.unselected,
          style,
        ]}
      >
        {label}
      </Text>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        selected ? styles.selected : styles.unselected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          size === 'sm' ? styles.smText : styles.mdText,
          selected ? styles.selectedText : styles.unselectedText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  md: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  selected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
    shadowColor: theme.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: colors.borderDefault,
  },
  text: {
    fontWeight: '500',
  },
  smText: {
    fontSize: 12,
  },
  mdText: {
    fontSize: 13,
  },
  selectedText: {
    color: colors.textInverse,
  },
  unselectedText: {
    color: colors.textSecondary,
  },
});
