import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius, theme } from '../../constants';
import { Profile } from '../../types';

type MatchModalProps = {
  visible: boolean;
  currentUser: Profile;
  matchedUser: Profile;
  matchId: string;
  onSendMessage: (matchId: string, matchedUser: Profile) => void;
  onDismiss: () => void;
};

export default function MatchModal({
  visible,
  currentUser,
  matchedUser,
  matchId,
  onSendMessage,
  onDismiss,
}: MatchModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  const renderAvatar = (profile: Profile, withSpacing: boolean) => {
    const initials = profile.name
      ? profile.name
          .split(' ')
          .map((part) => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    return (
      <View style={[styles.avatar, withSpacing && styles.avatarSpacing]}>
        {profile.photo_url ? (
          <Image
            source={{ uri: profile.photo_url }}
            style={styles.avatarImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <View style={styles.avatarsRow}>
            {renderAvatar(currentUser, true)}
            {renderAvatar(matchedUser, false)}
          </View>

          <Text style={styles.title}>It&apos;s a Match!</Text>
          <Text style={styles.subtitle}>
            You and {matchedUser.name || 'your match'} both want to co-work!
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => onSendMessage(matchId, matchedUser)}
          >
            <Text style={styles.primaryButtonText}>Send Message</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostButton} onPress={onDismiss}>
            <Text style={styles.ghostButtonText}>Keep Swiping</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  avatarsRow: {
    flexDirection: 'row',
    marginBottom: spacing[5],
  },
  avatarSpacing: {
    marginRight: spacing[4],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
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
    backgroundColor: colors.accentSubtle,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  primaryButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  ghostButton: {
    paddingVertical: spacing[2],
  },
  ghostButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
