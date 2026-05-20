import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { borderRadius, colors, spacing, theme } from '../../constants';
import { MatchPreview } from '../../types';

type MatchCardProps = {
  matchPreview: MatchPreview;
  onPress: () => void;
  onAvatarPress?: () => void;
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

export default function MatchCard({ matchPreview, onPress, onAvatarPress }: MatchCardProps) {
  const { other_user, last_message, last_message_at, unread_count, has_unread_invite, invite_badge_text } = matchPreview;
  const initials = other_user.name
    ? other_user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const previewText = last_message || 'Say hello!';
  const hasPendingInvitePreview = /pending cowork invite/i.test(previewText.trim());
  const showInvitePill = hasPendingInvitePreview || !!invite_badge_text;
  const isUnread = unread_count > 0 || has_unread_invite;
  const showPreviewText = !hasPendingInvitePreview;
  const timestamp = formatRelativeTime(last_message_at);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <TouchableOpacity
        style={styles.avatar}
        onPress={onAvatarPress}
        activeOpacity={0.8}
        disabled={!onAvatarPress}
      >
        {other_user.photo_url ? (
          <Image source={{ uri: other_user.photo_url }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.textContainer}>
        <View style={styles.topRow}>
          <Text style={styles.name}>
            {other_user.name || 'Anonymous'}
          </Text>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
        <View style={styles.previewRow}>
          {showPreviewText ? (
            <Text
              style={[styles.preview, !last_message && styles.previewEmpty, isUnread && styles.previewUnread]}
              numberOfLines={1}
            >
              {previewText}
            </Text>
          ) : null}
          {showInvitePill ? (
            <View style={[styles.invitePillInline, !showPreviewText && styles.invitePillAlignedLeft]}>
              <Text style={styles.invitePillText}>{invite_badge_text || 'Invite waiting'}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.rightStatus}>
        {isUnread ? <View style={styles.unreadDot} /> : null}
      </View>
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: spacing[3],
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  textContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  timestamp: {
    fontSize: 13,
    color: theme.textMuted,
    marginLeft: spacing[2],
  },
  preview: {
    flex: 1,
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: spacing[1],
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  previewEmpty: {
    fontStyle: 'italic',
  },
  previewUnread: {
    fontWeight: '700',
  },
  rightStatus: {
    marginLeft: spacing[2],
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 12,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.success,
  },
  invitePillInline: {
    marginLeft: spacing[2],
    backgroundColor: colors.statusPendingBg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.accentSecondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'center',
    flexShrink: 0,
  },
  invitePillAlignedLeft: {
    marginLeft: 0,
    marginTop: spacing[1],
  },
  invitePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.statusPendingText,
  },
});
