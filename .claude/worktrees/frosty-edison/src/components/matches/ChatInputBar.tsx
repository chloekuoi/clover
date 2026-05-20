import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, spacing, theme } from '../../constants';

type ChatInputBarProps = {
  onSend: (content: string) => void;
  disabled?: boolean;
};

export default function ChatInputBar({ onSend, disabled = false }: ChatInputBarProps) {
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const isDisabled = disabled || trimmed.length === 0;

  const handleSend = () => {
    if (isDisabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        placeholderTextColor={theme.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={1000}
      />
      <TouchableOpacity
        style={[styles.sendButton, isDisabled && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={isDisabled}
      >
        <Text style={styles.sendButtonText}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    backgroundColor: colors.bgCard,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    marginLeft: spacing[2],
    borderRadius: 18,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.accentSubtle,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
});
