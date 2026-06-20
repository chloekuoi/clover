import React from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, theme, spacing } from '../../constants';
import { CLOVER_FOREST } from '../../constants/clover';
import { Profile, ProfilePhoto, WorkIntent } from '../../types';
import DiscoverProfileView from '../discover/UserProfileModal';

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
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {loading || !profile ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.accentPrimary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <DiscoverProfileView
            card={{ profile, intent, distance: 0, photos }}
          />
        )}

        {/* Floating message button — right side, no label */}
        {!loading && profile ? (
          <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.spacer} />
            <TouchableOpacity
              style={[styles.circleBtn, styles.messageCircle]}
              onPress={onMessage}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Message friend"
            >
              <Svg width={22} height={22} viewBox="0 0 24 24">
                <Path
                  d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
                  fill="#1a1a1a"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  // Floating action bar — mirrors Discovery layout
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  spacer: {
    width: 56,
    height: 56,
  },
  circleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
    elevation: 5,
  },
  messageCircle: {
    backgroundColor: '#ffffff',
  },
});
