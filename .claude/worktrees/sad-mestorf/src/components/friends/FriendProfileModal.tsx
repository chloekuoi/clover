import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderRadius, colors, shadows, spacing, theme } from '../../constants';
import { Profile, ProfilePhoto, WorkIntent } from '../../types';
import UserProfileView from '../profile/UserProfileView';

interface FriendProfileModalProps {
  visible: boolean;
  profile: Profile | null;
  photos: ProfilePhoto[];
  intent: WorkIntent | null;
  loading: boolean;
  onDismiss: () => void;
  onMessage: () => void;
}

export default function FriendProfileModal({
  visible,
  profile,
  photos,
  intent,
  loading,
  onDismiss,
  onMessage,
}: FriendProfileModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.container}>
        {/* Drag handle only — no header button */}
        <View style={styles.header}>
          <View style={styles.handle} />
        </View>

        {loading || !profile ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accentPrimary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <UserProfileView
              profile={profile}
              photos={photos}
              todayIntent={intent}
              isOwnProfile={false}
            />
          </ScrollView>
        )}

        {/* Floating message button — fixed bottom-right, does not scroll */}
        <TouchableOpacity
          style={styles.fab}
          onPress={onMessage}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Message friend"
        >
          <Text style={styles.fabEmoji}>💬</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
    position: 'relative',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderDefault,
  },
  fab: {
    position: 'absolute',
    bottom: spacing[5],
    right: spacing[4],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  fabEmoji: {
    fontSize: 22,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingText: {
    marginTop: spacing[2],
    fontSize: 14,
    color: theme.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing[4],
  },
});
