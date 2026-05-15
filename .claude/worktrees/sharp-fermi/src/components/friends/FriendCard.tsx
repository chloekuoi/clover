import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, theme } from '../../constants';
import { FriendListItem } from '../../types';

type FriendCardProps = {
  friend: FriendListItem;
  variant: 'available' | 'simple';
  onPress: () => void;
  onProfilePress?: () => void;
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

function formatTime(raw: string | null): string {
  if (!raw) return '';
  return raw.slice(0, 5);
}

function availabilitySummary(friend: FriendListItem): string {
  if (!friend.available_from || !friend.available_until) return 'Available today';
  const timeWindow = `${formatTime(friend.available_from)}-${formatTime(friend.available_until)}`;
  const place = friend.location_name || friend.location_type || 'Anywhere';
  return `${timeWindow} · ${place}`;
}

export default function FriendCard({ friend, variant, onPress, onProfilePress }: FriendCardProps) {
  const initials = getInitials(friend.name);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.left}>
        <TouchableOpacity
          onPress={onProfilePress}
          activeOpacity={0.8}
          disabled={!onProfilePress}
          style={styles.avatar}
        >
          {friend.photo_url ? (
            <Image source={{ uri: friend.photo_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.textWrap}>
          <Text style={styles.name}>{friend.name || 'Anonymous'}</Text>
          {variant === 'available' ? (
            <Text style={styles.meta} numberOfLines={1}>
              {availabilitySummary(friend)}
            </Text>
          ) : null}
        </View>
      </View>

      {variant === 'available' ? <View style={styles.availableDot} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    backgroundColor: theme.surface,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.text,
  },
  meta: {
    marginTop: 2,
    fontSize: 12,
    color: theme.textSecondary,
  },
  availableDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.success,
    marginLeft: spacing[2],
  },
});
