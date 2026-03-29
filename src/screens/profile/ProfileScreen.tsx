import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
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

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

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

        <TouchableOpacity
          style={styles.signOutLink}
          onPress={handleSignOut}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        >
          <Text style={styles.signOutLinkText}>Sign out</Text>
        </TouchableOpacity>
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
  signOutLink: {
    alignSelf: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[6],
  },
  signOutLinkText: {
    fontSize: 14,
    color: theme.textMuted,
    fontWeight: '400',
  },
});
