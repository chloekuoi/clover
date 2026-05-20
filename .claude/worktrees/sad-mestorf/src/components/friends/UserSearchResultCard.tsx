import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, theme, borderRadius } from '../../constants';
import { UserSearchResult } from '../../types';

type UserSearchResultCardProps = {
  result: UserSearchResult;
  onAdd: (userId: string) => void;
  onAccept: (result: UserSearchResult) => void;
  loadingAction: boolean;
};

function getInitials(name: string | null, username: string): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return username.replace(/^@/, '').slice(0, 2).toUpperCase() || '?';
}

export default function UserSearchResultCard({ result, onAdd, onAccept, loadingAction }: UserSearchResultCardProps) {
  const initials = getInitials(result.name, result.username);

  const action = (() => {
    switch (result.relationship_status) {
      case 'none':
        return {
          label: 'Add',
          disabled: false,
          onPress: () => onAdd(result.id),
          style: styles.actionPrimary,
          textStyle: styles.actionPrimaryText,
        };
      case 'pending_sent':
        return {
          label: 'Requested',
          disabled: true,
          onPress: () => {},
          style: styles.actionMuted,
          textStyle: styles.actionMutedText,
        };
      case 'pending_received':
        return {
          label: 'Accept',
          disabled: !result.friendship_id,
          onPress: () => onAccept(result),
          style: styles.actionPrimary,
          textStyle: styles.actionPrimaryText,
        };
      case 'friends':
        return {
          label: 'Friends',
          disabled: true,
          onPress: () => {},
          style: styles.actionMuted,
          textStyle: styles.actionMutedText,
        };
    }
  })();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          {result.photo_url ? (
            <Image source={{ uri: result.photo_url }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.usernamePrimary} numberOfLines={1}>
            @{result.username}
          </Text>
          <Text style={styles.nameSecondary} numberOfLines={1}>
            {result.name || 'Anonymous'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={action.onPress}
        disabled={action.disabled || loadingAction}
        style={[styles.actionBase, action.style, (action.disabled || loadingAction) && styles.actionDisabled]}
        activeOpacity={0.8}
      >
        {loadingAction ? (
          <ActivityIndicator size="small" color={theme.surface} />
        ) : (
          <Text style={[styles.actionTextBase, action.textStyle]}>{action.label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.accentSubtle,
    marginRight: spacing[3],
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  usernamePrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  nameSecondary: {
    marginTop: 2,
    fontSize: 13,
    color: theme.textSecondary,
  },
  actionBase: {
    minWidth: 90,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: theme.primary,
  },
  actionMuted: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  actionDisabled: {
    opacity: 0.8,
  },
  actionTextBase: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionPrimaryText: {
    color: theme.surface,
  },
  actionMutedText: {
    color: theme.textSecondary,
  },
});
