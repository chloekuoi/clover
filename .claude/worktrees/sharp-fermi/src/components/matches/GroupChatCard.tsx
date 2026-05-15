import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, theme } from '../../constants';
import { GroupChatPreview } from '../../types';

type GroupChatCardProps = {
  groupChat: GroupChatPreview;
  onPress: () => void;
};

function formatRelativeTime(isoDate: string | null): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60 * 1000) return 'Now';
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default function GroupChatCard({ groupChat, onPress }: GroupChatCardProps) {
  const hasUnread = groupChat.unreadCount > 0;
  const timestamp = formatRelativeTime(groupChat.lastMessageAt);
  const previewText = groupChat.lastMessage
    ? `${groupChat.lastSenderName || 'Someone'}: ${groupChat.lastMessage}`
    : 'No messages yet';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconWrap}>
        <View style={styles.dotGrid}>
          <View style={[styles.dot, styles.dotLit]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotLit]} />
        </View>
      </View>

      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {groupChat.name}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <Text
          style={[styles.preview, !groupChat.lastMessage && styles.previewEmpty, hasUnread && styles.previewUnread]}
          numberOfLines={1}
        >
          {previewText}
        </Text>
      </View>

      <View style={styles.rightStatus}>{hasUnread ? <View style={styles.unreadDot} /> : null}</View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 72,
    backgroundColor: theme.surface,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
    backgroundColor: colors.accentPrimary,
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 22,
    height: 22,
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotLit: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginRight: spacing[2],
  },
  timestamp: {
    fontSize: 13,
    color: theme.textMuted,
  },
  preview: {
    marginTop: spacing[1],
    fontSize: 14,
    color: theme.textSecondary,
  },
  previewEmpty: {
    fontStyle: 'italic',
  },
  previewUnread: {
    fontWeight: '700',
  },
  rightStatus: {
    marginLeft: spacing[2],
    minWidth: 12,
    alignItems: 'flex-end',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.success,
  },
});
