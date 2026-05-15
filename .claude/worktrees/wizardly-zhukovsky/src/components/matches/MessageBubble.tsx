import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, theme } from '../../constants';
import { Message } from '../../types';

type MessageBubbleProps = {
  message: Message;
  isMine: boolean;
};

export default function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <View style={[styles.container, isMine ? styles.containerRight : styles.containerLeft]}>
      <View style={[styles.bubble, isMine ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.messageText, isMine ? styles.textSent : styles.textReceived]}>
          {message.content}
        </Text>
      </View>
      <Text style={[styles.timestamp, isMine ? styles.timestampRight : styles.timestampLeft]}>
        {time}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '75%',
  },
  containerLeft: {
    alignSelf: 'flex-start',
    marginLeft: spacing[4],
  },
  containerRight: {
    alignSelf: 'flex-end',
    marginRight: spacing[4],
  },
  bubble: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 14,
  },
  bubbleSent: {
    backgroundColor: colors.accentSecondary,
    borderBottomRightRadius: 4,
    shadowColor: colors.accentSecondary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  bubbleReceived: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  textSent: {
    color: colors.accentSecondaryText,
  },
  textReceived: {
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: spacing[1],
  },
  timestampLeft: {
    textAlign: 'left',
  },
  timestampRight: {
    textAlign: 'right',
  },
});
