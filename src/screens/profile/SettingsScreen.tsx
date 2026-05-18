import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../navigation/ProfileStack';

const DANGER_RED = '#8b1a1a';

type Props = {
  navigation: NativeStackNavigationProp<ProfileStackParamList>;
};

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user, signOut, deleteAccount } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const provider = user?.app_metadata?.provider;
  const signInMethod = provider === 'apple' ? 'Apple' : 'Email';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => void signOut(),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'This action is permanent and cannot be reversed.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm Delete',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    const { error } = await deleteAccount();
                    if (error) {
                      setDeleting(false);
                      Alert.alert('Delete failed', error.message);
                    }
                    // On success: auth state change routes to Welcome automatically
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() => navigation.goBack()}
          disabled={deleting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.headerBackText, deleting && styles.disabledText]}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        scrollEnabled={!deleting}
      >
        {/* ── Account section ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Email</Text>
            <Text style={styles.cardValue} numberOfLines={1}>
              {user?.email ?? '—'}
            </Text>
          </View>
          <View style={styles.rowSep} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Sign-in method</Text>
            <Text style={styles.cardValue}>{signInMethod}</Text>
          </View>
        </View>

        {/* ── Session section ── */}
        <Text style={styles.sectionLabel}>Session</Text>
        <TouchableOpacity
          style={[styles.pill, styles.pillPrimary, deleting && styles.pillDisabled]}
          onPress={handleSignOut}
          disabled={deleting}
          activeOpacity={0.85}
        >
          <Text style={[styles.pillText, styles.pillTextLight]}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── Danger zone ── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelDanger]}>Danger Zone</Text>
        <TouchableOpacity
          style={[styles.pill, styles.pillDanger, deleting && styles.pillDisabled]}
          onPress={handleDeleteAccount}
          disabled={deleting}
          activeOpacity={0.85}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={[styles.pillText, styles.pillTextLight]}>Delete Account</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.disclaimer}>
          Permanently deletes your account and all data.
        </Text>
      </ScrollView>

      {/* Full-screen overlay while deleting */}
      {deleting && (
        <View style={styles.deletingOverlay}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.deletingText}>Deleting account…</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: theme.surface,
    minHeight: 56,
  },
  headerBack: {
    minWidth: 70,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerBackText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerSpacer: {
    minWidth: 70,
  },
  disabledText: {
    opacity: 0.4,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[6],
    paddingBottom: spacing[12],
    gap: spacing[3],
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing[4],
    marginBottom: spacing[1],
  },
  sectionLabelDanger: {
    color: DANGER_RED,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 52,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    flex: 1,
  },
  cardValue: {
    fontSize: 14,
    color: theme.textSecondary,
    flex: 2,
    textAlign: 'right',
  },
  rowSep: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginHorizontal: spacing[4],
  },
  pill: {
    borderRadius: borderRadius.full,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  pillPrimary: {
    backgroundColor: theme.primary,
  },
  pillDanger: {
    backgroundColor: DANGER_RED,
  },
  pillDisabled: {
    opacity: 0.5,
  },
  pillText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pillTextLight: {
    color: colors.textInverse,
  },
  disclaimer: {
    fontSize: 12,
    color: theme.textMuted,
    textAlign: 'center',
    marginTop: spacing[1],
  },
  deletingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 244, 241, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
  },
  deletingText: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: spacing[2],
  },
});
