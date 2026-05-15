# Hinge-Style Profile + Discover Tap-to-Expand — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Add a horizontal attribute-pills row to the profile, extract the profile layout into a shared `UserProfileView` component, and let users tap a Discover card to see the full profile in a modal with Skip / Connect buttons.

**Architecture:** A new `UserProfileView` component owns the profile layout (photo stack → name + pills → fields → Today's Focus). `ProfileScreen` and a new `UserProfileModal` both use it. A tap gesture composed with the existing pan in `CardStack` opens the modal; Skip/Connect buttons trigger the same swipe animation as the physical swipe buttons.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, react-native-reanimated 3, react-native-gesture-handler, expo-image, Supabase

---

## Task 1: Create `UserProfileView` shared component

**Files:**
- Create: `src/components/profile/UserProfileView.tsx`

This component renders the scrollable profile body (no header, no sign-out). It is used by both `ProfileScreen` and `UserProfileModal`. Each section manages its own horizontal padding so the component works inside any parent without relying on inherited padding.

**Step 1: Create the file with this exact content**

```tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { Profile, ProfilePhoto, WorkIntent } from '../../types';

// ── Helpers (moved here from ProfileScreen) ─────────────────────────────────

const PHOTO_PROMPTS = [
  "Hi, I'm a real person 👋",
  'Proof I touch grass sometimes',
  'What my camera roll actually looks like',
  'Currently building something...',
];

const WORK_STYLE_EMOJI: Record<string, string> = {
  'Deep focus': '🎧',
  'Chat mode': '💬',
  Flexible: '✌️',
};

const LOCATION_EMOJI: Record<string, string> = {
  Cafe: '☕️',
  Library: '📚',
  Anywhere: '📍',
};

function formatBirthdayDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDisplayTime(value: string): string {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface UserProfileViewProps {
  profile: Profile;
  /**
   * Full photo array from profile_photos table (used on own profile).
   * If omitted, falls back to profile.photo_url as the single primary photo.
   */
  photos?: ProfilePhoto[];
  todayIntent: WorkIntent | null;
  /**
   * When true, renders a "Set Today's Focus" CTA on the empty intent state.
   * On others' profiles omit this prop (or pass false) to hide the card entirely.
   */
  isOwnProfile?: boolean;
  /** Called when the "Set Today's Focus" CTA is pressed (own profile only). */
  onSetFocusPress?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function UserProfileView({
  profile,
  photos,
  todayIntent,
  isOwnProfile = false,
  onSetFocusPress,
}: UserProfileViewProps) {
  // Build photo list: prefer full array, else synthesise one entry from photo_url
  const photoList = useMemo<ProfilePhoto[]>(() => {
    if (photos && photos.length > 0) {
      return [...photos].sort((a, b) => a.position - b.position);
    }
    if (profile.photo_url) {
      return [
        {
          id: 'primary',
          user_id: profile.id,
          photo_url: profile.photo_url,
          position: 0,
          created_at: '',
        },
      ];
    }
    return [];
  }, [photos, profile.id, profile.photo_url]);

  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const ageText = useMemo(() => {
    if (!profile.birthday) return null;
    const birthDate = new Date(profile.birthday);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age > 0 ? `${age}` : null;
  }, [profile.birthday]);

  // Only show pills that have values
  const pills: { icon: string; label: string }[] = [
    ...(profile.work_type ? [{ icon: '💼', label: profile.work_type }] : []),
    ...(profile.neighborhood ? [{ icon: '📍', label: profile.neighborhood }] : []),
    ...(profile.city ? [{ icon: '🏙️', label: profile.city }] : []),
  ];

  // Field groups — empty values are hidden
  const aboutYouRows = [
    { label: 'Tagline', value: profile.tagline },
    { label: 'Currently working on', value: profile.currently_working_on },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const workSchoolRows = [
    { label: 'Work', value: profile.work },
    { label: 'School', value: profile.school },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const locationRows = [
    { label: 'Neighbourhood', value: profile.neighborhood },
    { label: 'City', value: profile.city },
    {
      label: 'Birthday',
      value: profile.birthday ? formatBirthdayDisplay(profile.birthday) : null,
    },
  ].filter((r): r is { label: string; value: string } => Boolean(r.value));

  const hasAnyFields =
    aboutYouRows.length > 0 || workSchoolRows.length > 0 || locationRows.length > 0;

  const renderGroup = (rows: { label: string; value: string }[]) => {
    if (rows.length === 0) return null;
    return rows.map((row, idx) => (
      <React.Fragment key={row.label}>
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{row.label}</Text>
          <Text style={styles.fieldValue}>{row.value}</Text>
        </View>
        {idx < rows.length - 1 ? <View style={styles.rowSep} /> : null}
      </React.Fragment>
    ));
  };

  // Show intent card: always if active; only for own profile if empty
  const showIntentCard = todayIntent !== null || isOwnProfile;

  return (
    <>
      {/* ── Photo stack ─────────────────────────────────────────────── */}
      <View style={styles.photoStack}>
        {photoList.length === 0 ? (
          <View style={[styles.photoFrame, styles.primaryFrame, styles.initialsFrame]}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        ) : (
          photoList.map((photo) => (
            <View key={photo.id} style={styles.photoBlock}>
              <View
                style={[
                  styles.photoFrame,
                  photo.position === 0 ? styles.primaryFrame : styles.secondaryFrame,
                ]}
              >
                <Image
                  source={{ uri: photo.photo_url }}
                  style={styles.photoImage}
                  contentFit="cover"
                />
              </View>
              {PHOTO_PROMPTS[photo.position] ? (
                <Text style={styles.promptLabel}>{PHOTO_PROMPTS[photo.position]}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* ── Name + age ──────────────────────────────────────────────── */}
      <View style={styles.nameBlock}>
        <View style={styles.nameRow}>
          <Text style={styles.nameText}>{profile.name || 'Anonymous'}</Text>
          {ageText ? <Text style={styles.ageText}>{ageText}</Text> : null}
        </View>

        {/* Horizontal scrollable attribute pills */}
        {pills.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsRow}
            contentContainerStyle={styles.pillsContent}
          >
            {pills.map((pill) => (
              <View key={pill.label} style={styles.pill}>
                <Text style={styles.pillIcon}>{pill.icon}</Text>
                <Text style={styles.pillText}>{pill.label}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* ── Field rows (edge-to-edge white block) ───────────────────── */}
      {hasAnyFields ? (
        <View style={styles.fieldsArea}>
          {renderGroup(aboutYouRows)}
          {aboutYouRows.length > 0 && workSchoolRows.length > 0 ? (
            <View style={styles.groupSep} />
          ) : null}
          {renderGroup(workSchoolRows)}
          {(aboutYouRows.length > 0 || workSchoolRows.length > 0) &&
          locationRows.length > 0 ? (
            <View style={styles.groupSep} />
          ) : null}
          {renderGroup(locationRows)}
        </View>
      ) : null}

      {/* ── Today's Focus ────────────────────────────────────────────── */}
      {showIntentCard ? (
        todayIntent ? (
          <View style={styles.intentCard}>
            <View style={styles.intentHeader}>
              <Text style={styles.intentLabel}>TODAY'S FOCUS</Text>
              <View style={styles.intentDot} />
            </View>
            <Text style={styles.intentTask}>{todayIntent.task_description}</Text>
            <View style={styles.intentMeta}>
              <Text style={styles.intentMetaText}>
                {WORK_STYLE_EMOJI[todayIntent.work_style] ?? ''} {todayIntent.work_style}
              </Text>
              <Text style={styles.intentMetaDivider}>·</Text>
              <Text style={styles.intentMetaText}>
                {LOCATION_EMOJI[todayIntent.location_type] ?? ''} {todayIntent.location_type}
                {todayIntent.location_name ? ` · ${todayIntent.location_name}` : ''}
              </Text>
              <Text style={styles.intentMetaDivider}>·</Text>
              <Text style={styles.intentMetaText}>
                {formatDisplayTime(todayIntent.available_from)} –{' '}
                {formatDisplayTime(todayIntent.available_until)}
              </Text>
            </View>
          </View>
        ) : isOwnProfile ? (
          <View style={[styles.intentCard, styles.intentCardEmpty]}>
            <Text style={styles.intentLabel}>TODAY'S FOCUS</Text>
            <Text style={styles.intentEmptyText}>Share what you're working on today</Text>
            <TouchableOpacity
              style={styles.intentCta}
              onPress={onSetFocusPress}
              activeOpacity={0.8}
            >
              <Text style={styles.intentCtaText}>Set Today's Focus</Text>
            </TouchableOpacity>
          </View>
        ) : null
      ) : null}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Photos
  photoStack: {
    gap: spacing[3],
    paddingTop: spacing[4],
  },
  photoBlock: {
    gap: spacing[2],
  },
  photoFrame: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  primaryFrame: {
    aspectRatio: 1.1,
  },
  secondaryFrame: {
    aspectRatio: 1.72,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  initialsFrame: {
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.textSecondary,
    paddingHorizontal: spacing[1],
  },
  // Name block
  nameBlock: {
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.text,
    letterSpacing: -0.3,
  },
  ageText: {
    fontSize: 22,
    fontWeight: '400',
    color: theme.textSecondary,
  },
  // Pills
  pillsRow: {
    // Bleed to parent edges while keeping left-pad aligned with text above
    marginHorizontal: -spacing[4],
  },
  pillsContent: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentPrimaryLight,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  // Fields
  fieldsArea: {
    backgroundColor: theme.surface,
    marginTop: spacing[3],
    // Edge-to-edge — caller's parent has no horizontal padding,
    // but we still need this component to work inside a padded parent
    // (ProfileScreen uses paddingHorizontal: 0 on its ScrollView content).
  },
  fieldRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  rowSep: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginHorizontal: spacing[4],
  },
  groupSep: {
    height: 8,
    backgroundColor: colors.bgSecondary,
  },
  // Intent card
  intentCard: {
    marginTop: spacing[3],
    marginHorizontal: spacing[4],
    backgroundColor: colors.accentPrimaryLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: '#D4E4D8',
  },
  intentCardEmpty: {
    backgroundColor: theme.surface,
    borderColor: colors.borderDefault,
  },
  intentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  intentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accentPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  intentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },
  intentTask: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
    lineHeight: 24,
    marginBottom: spacing[3],
  },
  intentMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
  },
  intentMetaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  intentMetaDivider: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  intentEmptyText: {
    fontSize: 15,
    color: theme.textSecondary,
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  intentCta: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  intentCtaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
```

**Step 2: Run type check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | head -30
```
Expected: zero errors (or only pre-existing errors from other files — none related to UserProfileView).

**Step 3: Commit**
```bash
git add src/components/profile/UserProfileView.tsx
git commit -m "feat: add UserProfileView shared profile layout component"
```

---

## Task 2: Refactor `ProfileScreen` to use `UserProfileView`

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

`ProfileScreen` keeps: header, loading state, `loadProfile`/`useFocusEffect`, nudge card, sign-out link. Everything else (photos, name, pills, fields, intent) is delegated to `UserProfileView`.

Key layout change: remove `paddingHorizontal` from the ScrollView's `contentContainerStyle` so `UserProfileView`'s full-width sections reach the screen edges.

**Step 1: Replace the file with this content**

```tsx
import React, { useCallback, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { getFullProfile } from '../../services/profileService';
import { getTodayIntent } from '../../services/discoveryService';
import { Profile, ProfilePhoto, WorkIntent } from '../../types';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import UserProfileView from '../../components/profile/UserProfileView';

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

  const filledPhotos = useMemo(
    () => [...photos].sort((a, b) => a.position - b.position),
    [photos]
  );

  const isProfileEmpty =
    filledPhotos.length === 0 &&
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.pencilIcon}>✏</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <UserProfileView
          profile={profileData ?? ({} as Profile)}
          photos={filledPhotos}
          todayIntent={todayIntent}
          isOwnProfile
          onSetFocusPress={() => navigation.getParent()?.navigate('Discover' as never)}
        />

        {/* Nudge card — shown between photos and fields when profile is blank */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    minHeight: 56,
    backgroundColor: theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  headerSpacer: {
    minWidth: 44,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerAction: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    minHeight: 44,
  },
  pencilIcon: {
    fontSize: 18,
    color: theme.textSecondary,
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
    color: '#FFFFFF',
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
```

**Step 2: Run type check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | head -30
```
Expected: zero new errors.

**Step 3: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "refactor: use UserProfileView in ProfileScreen, add attribute pills"
```

---

## Task 3: Create `UserProfileModal` for Discover

**Files:**
- Create: `src/components/discover/UserProfileModal.tsx`

A full-screen modal that renders `UserProfileView` for another user's profile with sticky **Skip** / **Connect** action buttons at the bottom. The modal receives an already-fetched `DiscoveryCard` so no extra API calls are needed.

**Step 1: Create the file with this exact content**

```tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { colors, theme, spacing, borderRadius } from '../../constants';
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
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Sticky Skip / Connect bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.btnSkip}
            onPress={onSkip}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSkipText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnConnect}
            onPress={onConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.btnConnectText}>Connect</Text>
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
    paddingBottom: spacing[4],
  },
  bottomSpacer: {
    height: spacing[4],
  },
  // Action bar
  actionBar: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  btnSkip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFF0F0',
    borderWidth: 1.5,
    borderColor: '#F5C2C2',
    minHeight: 54,
  },
  btnSkipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C0392B',
  },
  btnConnect: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accentPrimaryLight,
    borderWidth: 1.5,
    borderColor: '#C4DDD0',
    minHeight: 54,
  },
  btnConnectText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accentPrimary,
  },
});
```

**Step 2: Run type check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | head -30
```
Expected: zero new errors.

**Step 3: Commit**
```bash
git add src/components/discover/UserProfileModal.tsx
git commit -m "feat: add UserProfileModal with Skip/Connect action bar"
```

---

## Task 4: Add tap gesture + modal to `CardStack`

**Files:**
- Modify: `src/components/discover/CardStack.tsx`

The `GestureDetector` currently uses only a pan gesture. We compose it with a tap gesture using `Gesture.Exclusive(tap, pan)` — if the user taps without moving, the tap fires; if they swipe, the pan fires. The modal state lives inside `CardStack` so no changes to `DiscoverScreen` are needed.

**Step 1: Update `CardStack.tsx` with these exact changes**

Replace the top of the file imports + type section (lines 1–27):
```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { theme } from '../../constants';
import { DiscoveryCard } from '../../types';
import SwipeCard, { CARD_WIDTH, CARD_HEIGHT } from './SwipeCard';
import SwipeButtons from './SwipeButtons';
import UserProfileModal from './UserProfileModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY_THRESHOLD = 800;

type CardStackProps = {
  cards: DiscoveryCard[];
  onSwipe: (card: DiscoveryCard, direction: 'left' | 'right') => void;
  onEmpty: () => void;
};
```

Replace the component body (lines 28–191) — key changes are: add `selectedCard` state, add `tapGesture`, compose with `Gesture.Exclusive`, render `UserProfileModal`:

```tsx
export default function CardStack({ cards, onSwipe, onEmpty }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCard, setSelectedCard] = useState<DiscoveryCard | null>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const currentCard = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];
  const thirdCard = cards[currentIndex + 2];

  const handleSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      if (currentCard) {
        onSwipe(currentCard, direction);
      }
      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        onEmpty();
      }
      setCurrentIndex(nextIndex);
      translateX.value = 0;
      translateY.value = 0;
    },
    [currentCard, currentIndex, cards.length, onSwipe, onEmpty, translateX, translateY]
  );

  useEffect(() => {
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
      translateX.value = 0;
      translateY.value = 0;
    }
  }, [cards.length, currentIndex, translateX, translateY]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const shouldSwipeRight =
        translateX.value > SWIPE_THRESHOLD ||
        event.velocityX > SWIPE_VELOCITY_THRESHOLD;
      const shouldSwipeLeft =
        translateX.value < -SWIPE_THRESHOLD ||
        event.velocityX < -SWIPE_VELOCITY_THRESHOLD;

      if (shouldSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('right');
        });
      } else if (shouldSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH * 1.5, { duration: 300 }, () => {
          runOnJS(handleSwipeComplete)('left');
        });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  // Tap opens the profile modal — Exclusive means pan wins if user moves finger
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      if (currentCard) {
        runOnJS(setSelectedCard)(currentCard);
      }
    });

  const composedGesture = Gesture.Exclusive(tapGesture, panGesture);

  // animated styles (unchanged)
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ] as const,
    };
  });

  const nextCardScale = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.95, 1],
      Extrapolation.CLAMP
    );
    const translateYValue = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [10, 0],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY: translateYValue }] as const,
    };
  });

  const thirdCardScale = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [0.9, 0.95],
      Extrapolation.CLAMP
    );
    const translateYValue = interpolate(
      Math.abs(translateX.value),
      [0, SWIPE_THRESHOLD],
      [20, 10],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }, { translateY: translateYValue }] as const,
    };
  });

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    translateX.value = withTiming(targetX, { duration: 300 }, () => {
      runOnJS(handleSwipeComplete)(direction);
    });
  };

  if (!currentCard) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {thirdCard && (
          <Animated.View style={[styles.cardWrapper, styles.thirdCard, thirdCardScale]}>
            <SwipeCard card={thirdCard} />
          </Animated.View>
        )}
        {nextCard && (
          <Animated.View style={[styles.cardWrapper, styles.nextCard, nextCardScale]}>
            <SwipeCard card={nextCard} />
          </Animated.View>
        )}
        {/* composedGesture replaces panGesture — tap opens modal, swipe dismisses card */}
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
            <SwipeCard card={currentCard} translateX={translateX} isTopCard />
          </Animated.View>
        </GestureDetector>
      </View>

      <SwipeButtons
        onSwipeLeft={() => handleButtonSwipe('left')}
        onSwipeRight={() => handleButtonSwipe('right')}
      />

      {/* Profile modal — Skip/Connect trigger same animation as physical swipe */}
      <UserProfileModal
        visible={selectedCard !== null}
        card={selectedCard}
        onDismiss={() => setSelectedCard(null)}
        onSkip={() => {
          setSelectedCard(null);
          handleButtonSwipe('left');
        }}
        onConnect={() => {
          setSelectedCard(null);
          handleButtonSwipe('right');
        }}
      />
    </View>
  );
}
```

Keep the existing `styles` StyleSheet at the bottom unchanged.

**Step 2: Run type check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | head -30
```
Expected: zero new errors.

**Step 3: Commit**
```bash
git add src/components/discover/CardStack.tsx
git commit -m "feat: tap discover card to expand full profile modal"
```

---

## Task 5: Verify in the simulator

**Step 1: Start the app**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npm start
```
Press `i` for iOS simulator.

**Step 2: Check Profile tab**
- [ ] Header: "Profile" centred, pencil ✏ top-right
- [ ] Tapping pencil navigates to Edit Profile
- [ ] Attribute pills appear below name in a single scrollable row (work type, neighbourhood, city)
- [ ] Pills scroll horizontally if there are more than fit on screen
- [ ] Field rows appear edge-to-edge (white background)
- [ ] Today's Focus card: green if intent set, dashed CTA if not
- [ ] "Set Today's Focus" CTA navigates to Discover tab
- [ ] Sign out link at bottom triggers confirmation alert

**Step 3: Check Discover tap**
- [ ] Swipe cards still swipe normally (pan gesture unchanged)
- [ ] Tapping a card (no swipe movement) opens profile modal sliding up from bottom
- [ ] Modal shows: profile photo, name + age, attribute pills, fields, Today's Focus
- [ ] **Skip** button (red-ish) → modal closes → card swipes left (recorded as pass)
- [ ] **Connect** button (green) → modal closes → card swipes right (recorded as like)
- [ ] Swiping modal sheet down dismisses it without triggering a swipe
- [ ] After Skip/Connect the next card is shown correctly

**Step 4: If any TypeScript errors remain, fix them, then final commit**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit
```
Expected: clean.
