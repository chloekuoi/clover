import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, theme } from '../../constants';
import { GroupMessage } from '../../types';

type GroupMessageBubbleProps = {
  message: GroupMessage;
  isMine: boolean;
  onAvatarPress?: () => void;
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function GroupMessageBubble({
  message,
  isMine,
  onAvatarPress,
}: GroupMessageBubbleProps) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  if (isMine) {
    return (
      <View style={[styles.container, styles.containerRight]}>
        <View style={[styles.bubble, styles.bubbleSent]}>
          <Text style={[styles.messageText, styles.textSent]}>{message.content}</Text>
        </View>
        <Text style={[styles.timestamp, styles.timestampRight]}>{time}</Text>
      </View>
    );
  }

  const initials = getInitials(message.sender_name);

  return (
    <View style={[styles.container, styles.containerLeftRow]}>
      <TouchableOpacity
        style={styles.avatar}
        onPress={onAvatarPress}
        activeOpacity={0.8}
        disabled={!onAvatarPress}
      >
        {message.sender_photo_url ? (
          <Image source={{ uri: message.sender_photo_url }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.receivedWrap}>
        <Text style={styles.senderName}>{message.sender_name || 'Someone'}</Text>
        <View style={[styles.bubble, styles.bubbleReceived]}>
          <Text style={[styles.messageText, styles.textReceived]}>{message.content}</Text>
        </View>
        <Text style={[styles.timestamp, styles.timestampLeft]}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  containerRight: {
    alignSelf: 'flex-end',
    marginRight: spacing[4],
    maxWidth: '75%',
  },
  containerLeftRow: {
    alignSelf: 'flex-start',
    marginLeft: spacing[4],
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: spacing[2],
    backgroundColor: colors.accentSubtle,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  receivedWrap: {
    maxWidth: '78%',
  },
  senderName: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 4,
    marginLeft: spacing[1],
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
    marginLeft: spacing[1],
  },
  timestampRight: {
    textAlign: 'right',
  },
});
