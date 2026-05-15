import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, theme, spacing } from '../../constants';
import { DiscoveryCard } from '../../types';
import UserProfileView from '../profile/UserProfileView';


interface UserProfileModalProps {
  visible: boolean;
  card: DiscoveryCard | null;
  onDismiss: () => void;
  onSkip: () => void;
  onConnect: () => void;
}

export default function UserProfileModal({
  visible,
  card,
  onDismiss,
  onSkip,
  onConnect,
}: UserProfileModalProps) {
  if (!card) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <SafeAreaView style={styles.container}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Scrollable profile */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <UserProfileView
            profile={card.profile}
            todayIntent={card.intent}
            isOwnProfile={false}
          />
        </ScrollView>

        {/* Sticky Skip / Connect bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.btn, styles.btnSkip]}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSkipText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnConnect]}
            onPress={onConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.btnConnectText}>✓</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing[2],
    paddingBottom: spacing[1],
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderDefault,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  // Action bar — floats over content
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[8],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
  },
  btn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  btnSkip: {
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: 'rgba(184,92,77,0.4)',
  },
  btnSkipText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.accentDanger,
  },
  btnConnect: {
    backgroundColor: colors.accentSuccess,
    shadowColor: colors.accentSuccess,
    shadowOpacity: 0.42,
    shadowRadius: 12,
    elevation: 4,
  },
  btnConnectText: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.surface,
  },
});
