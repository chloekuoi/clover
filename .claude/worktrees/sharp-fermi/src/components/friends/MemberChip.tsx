import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { borderRadius, colors, spacing, theme } from '../../constants';

type MemberChipProps = {
  userId: string;
  name: string;
  photoUrl: string | null;
  onRemove: (userId: string) => void;
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export default function MemberChip({ userId, name, photoUrl, onRemove }: MemberChipProps) {
  const initials = getInitials(name);

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarImage} contentFit="cover" />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>

      <TouchableOpacity onPress={() => onRemove(userId)} style={styles.removeButton} activeOpacity={0.8}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 140,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentPrimaryLight,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 8,
    marginRight: spacing[2],
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
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
    fontSize: 10,
    fontWeight: '700',
    color: theme.textSecondary,
  },
  name: {
    flex: 1,
    marginLeft: spacing[2],
    marginRight: spacing[1],
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.textSecondary,
  },
});
