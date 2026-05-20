import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon, Line, Path } from 'react-native-svg';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile } from '../../services/profileService';
import { getTodayIntent } from '../../services/discoveryService';
import { Profile, ProfilePhoto, WorkIntent } from '../../types';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import UserProfileView from '../../components/profile/UserProfileView';

function PencilIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill={CLOVER_BG}
      />
    </Svg>
  );
}

function GearIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.02 7.02 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
        fill={theme.textMuted}
      />
    </Svg>
  );
}

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [profileData, setProfileData] = useState<Profile | null>(profile);
  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayIntent, setTodayIntent] = useState<WorkIntent | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [result, intent] = await Promise.all([
      getFullProfile(user.id),
      getTodayIntent(user.id),
    ]);
    if (result.error) {
      setProfileData(profile);
      setPhotos([]);
    } else {
      setProfileData(result.data.profile || profile);
      setPhotos(result.data.photos);
    }
    setTodayIntent(intent);
    setLoading(false);
  }, [profile, user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const isProfileEmpty =
    photos.length === 0 &&
    !profileData?.name &&
    !profileData?.tagline &&
    !profileData?.currently_working_on &&
    !profileData?.work &&
    !profileData?.school &&
    !profileData?.neighborhood &&
    !profileData?.city &&
    !profileData?.work_type;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <GearIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.85}
        >
          <View style={styles.editPill}>
            <PencilIcon />
            <Text style={styles.editPillText}> Edit</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {profileData !== null ? (
          <UserProfileView
            profile={profileData}
            photos={photos}
            todayIntent={todayIntent}
            isOwnProfile
            onSetFocusPress={() => navigation.getParent()?.navigate('Discover' as never)}
          />
        ) : null}

        {/* Nudge card — shown when profile is completely blank */}
        {isProfileEmpty ? (
          <View style={styles.nudgeCard}>
            <Text style={styles.nudgeTitle}>Your profile is blank</Text>
            <Text style={styles.nudgeBody}>
              Add a photo and a few details so co-workers know who they'll be meeting.
            </Text>
            <TouchableOpacity
              style={styles.nudgeCta}
              onPress={() => navigation.navigate('EditProfile')}
              activeOpacity={0.8}
            >
              <Text style={styles.nudgeCtaText}>Complete your profile</Text>
            </TouchableOpacity>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    marginTop: spacing[2],
    fontSize: 14,
    color: theme.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    minHeight: 56,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 32,
    fontWeight: '300',
    color: theme.text,
  },
  headerAction: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
  },
  editPill: {
    backgroundColor: CLOVER_FOREST,
    borderRadius: 100,
    paddingHorizontal: spacing[3],
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: CLOVER_BG,
  },
  scroll: {
    flex: 1,
  },
  // No paddingHorizontal — UserProfileView owns horizontal spacing per section
  content: {
    paddingBottom: spacing[12],
  },
  nudgeCard: {
    marginTop: spacing[4],
    marginHorizontal: spacing[4],
    backgroundColor: colors.accentSecondaryLight,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.accentSecondary,
  },
  nudgeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.text,
    marginBottom: spacing[2],
  },
  nudgeBody: {
    fontSize: 14,
    color: theme.textSecondary,
    lineHeight: 21,
    marginBottom: spacing[4],
  },
  nudgeCta: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  nudgeCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textInverse,
  },
});
