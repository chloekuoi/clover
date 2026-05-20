import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Button from '../common/Button';
import { colors, spacing, theme } from '../../constants';
import { PendingRequestItem } from '../../services/friendsService';

type FriendRequestCardProps = {
  request: PendingRequestItem;
  onAccept: () => void;
  onDecline: () => void;
  loading?: boolean;
};

function initials(name: string | null, username: string): string {
  if (name && name.trim()) {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return username.slice(0, 2).toUpperCase() || '?';
}

export default function FriendRequestCard({ request, onAccept, onDecline, loading = false }: FriendRequestCardProps) {
  const user = request.requester;
  const avatarInitials = initials(user.name, user.username);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          )}
        </View>

        <View style={styles.textWrap}>
          <Text style={styles.name}>{user.name || 'Anonymous'}</Text>
          <Text style={styles.username}>@{user.username}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Decline" variant="secondary" onPress={onDecline} disabled={loading} style={styles.actionButton} />
        <Button title="Accept" onPress={onAccept} loading={loading} style={styles.actionButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    padding: spacing[3],
    backgroundColor: theme.surface,
    gap: spacing[3],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  textWrap: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  username: {
    marginTop: 2,
    fontSize: 13,
    color: theme.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    flex: 1,
  },
});
