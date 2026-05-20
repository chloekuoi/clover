import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, theme, spacing, borderRadius } from '../../constants';
import { Profile, ProfilePhoto, WorkIntent, WorkStyle, LocationType } from '../../types';

// ── Constants ────────────────────────────────────────────────────────────────

const INTENT_CARD_BORDER = '#D4E4D8';

const WORK_STYLE_EMOJI: Record<WorkStyle, string> = {
  'Deep focus': '🎧',
  'Chat mode': '💬',
  Flexible: '✌️',
};

const LOCATION_EMOJI: Record<LocationType, string> = {
  Cafe: '☕️',
  Library: '📚',
  Anywhere: '📍',
};

function formatDisplayTime(value: string): string {
  const parts = value.split(':');
  if (parts.length < 2) return value;
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
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

  const primaryPhoto = useMemo<ProfilePhoto | null>(() => {
    if (photoList.length === 0) return null;
    const explicitPrimary = photoList.find((photo) => photo.position === 0);
    return explicitPrimary || photoList[0];
  }, [photoList]);

  const secondaryPhotos = useMemo<ProfilePhoto[]>(
    () => photoList.filter((photo) => photo.id !== primaryPhoto?.id),
    [photoList, primaryPhoto?.id]
  );

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
  const pills: { key: string; icon: string; label: string }[] = [
    ...(profile.work_type ? [{ key: 'work_type', icon: '💼', label: profile.work_type }] : []),
    ...(profile.neighborhood ? [{ key: 'neighborhood', icon: '📍', label: profile.neighborhood }] : []),
    ...(profile.city ? [{ key: 'city', icon: '🏙️', label: profile.city }] : []),
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

  const hasAnyFields =
    aboutYouRows.length > 0 || workSchoolRows.length > 0;

  const renderGroup = useCallback((rows: { label: string; value: string }[]) => {
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
  }, []);

  // Show intent card: always if active; only for own profile if empty
  const showIntentCard = todayIntent !== null || isOwnProfile;

  return (
    <>
      {/* ── Top photo area ─────────────────────────────────────────── */}
      <View style={styles.primaryPhotoBlock}>
        {!primaryPhoto ? (
          <View style={[styles.photoFrame, styles.primaryFrame, styles.initialsFrame]}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        ) : (
          <View style={[styles.photoFrame, styles.primaryFrame]}>
            <Image source={{ uri: primaryPhoto.photo_url }} style={styles.photoImage} contentFit="cover" />
          </View>
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
              <View key={pill.key} style={styles.pill}>
                <Text style={styles.pillIcon}>{pill.icon}</Text>
                <Text style={styles.pillText}>{pill.label}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* ── Today's Focus ────────────────────────────────────────────── */}
      {showIntentCard ? (
        <>
          <View style={styles.sectionGap} />
          {todayIntent ? (
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
          ) : null}
        </>
      ) : null}

      {/* ── Field rows (edge-to-edge white block) ───────────────────── */}
      {hasAnyFields ? (
        <>
          <View style={styles.sectionGap} />
          <View style={styles.fieldsArea}>
            {renderGroup(aboutYouRows)}
            {aboutYouRows.length > 0 && workSchoolRows.length > 0 ? (
              <View style={styles.groupSep} />
            ) : null}
            {renderGroup(workSchoolRows)}
          </View>
        </>
      ) : null}

      {secondaryPhotos.length > 0 ? (
        <>
          <View style={styles.sectionGap} />
          <View style={styles.secondaryPhotoBlock}>
            {secondaryPhotos.map((photo) => (
              <View key={photo.id} style={[styles.photoFrame, styles.secondaryFrame]}>
                <Image source={{ uri: photo.photo_url }} style={styles.photoImage} contentFit="cover" />
              </View>
            ))}
          </View>
        </>
      ) : null}
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Photos
  primaryPhotoBlock: {
    gap: spacing[3],
    paddingTop: spacing[4],
  },
  secondaryPhotoBlock: {
    gap: spacing[3],
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
  // Name block
  nameBlock: {
    marginTop: spacing[3],
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
    paddingBottom: spacing[2],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accentSecondaryLight,
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
    color: theme.textSecondary,
  },
  // Fields
  fieldsArea: {
    backgroundColor: theme.surface,
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
  // Section gap — full-width grey block between major profile sections
  sectionGap: {
    height: 8,
    backgroundColor: colors.bgSecondary,
  },
  // Intent card
  intentCard: {
    marginHorizontal: spacing[2],
    marginTop: spacing[2],
    marginBottom: spacing[2],
    backgroundColor: colors.accentPrimaryLight,
    borderRadius: borderRadius.xl,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: INTENT_CARD_BORDER,
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
    color: colors.textInverse,
  },
});
