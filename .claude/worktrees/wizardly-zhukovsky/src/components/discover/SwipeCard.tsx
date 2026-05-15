import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { theme, spacing, borderRadius, colors } from '../../constants';
import { DiscoveryCard } from '../../types';
import { formatDistance } from '../../hooks/useLocation';
import Tag from '../common/Tag';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH - spacing[8];
export const CARD_HEIGHT = CARD_WIDTH * 1.3;

type SwipeCardProps = {
  card: DiscoveryCard;
  translateX?: SharedValue<number>;
  isTopCard?: boolean;
};

export default function SwipeCard({ card, translateX, isTopCard = false }: SwipeCardProps) {
  const { profile, intent, distance } = card;

  // Get initials for placeholder
  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  // Format availability time
  const formatAvailability = () => {
    const from = intent.available_from.slice(0, 5);
    const until = intent.available_until.slice(0, 5);
    return `${from} - ${until}`;
  };

  const getAge = () => {
    if (!profile.birthday) return null;
    const birthDate = new Date(profile.birthday);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age > 0 ? `${age}` : null;
  };

  const age = getAge();
  const ageNeighborhoodLine = [age, profile.neighborhood].filter(Boolean).join(' · ');

  const likeOpacity = useAnimatedStyle(() => {
    if (!translateX || !isTopCard) {
      return { opacity: 0 };
    }
    return {
      opacity: interpolate(
        translateX.value,
        [0, SCREEN_WIDTH * 0.25],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  const nopeOpacity = useAnimatedStyle(() => {
    if (!translateX || !isTopCard) {
      return { opacity: 0 };
    }
    return {
      opacity: interpolate(
        translateX.value,
        [-SCREEN_WIDTH * 0.25, 0],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <View style={styles.card}>
      {/* Photo or initials */}
      <View style={styles.photoContainer}>
        {/* LIKE / NOPE labels (top card only) */}
        <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
          <Text style={styles.stampText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.stamp, styles.nopeStamp, nopeOpacity]}>
          <Text style={[styles.stampText, styles.nopeText]}>NOPE</Text>
        </Animated.View>

        {profile.photo_url ? (
          <Image
            source={{ uri: profile.photo_url }}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={styles.initialsContainer}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <View style={styles.gradient} />

        {/* Name and distance overlay */}
        <View style={styles.overlay}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name || 'Anonymous'}</Text>
            <Text style={styles.distance}>{formatDistance(distance)}</Text>
          </View>
          {profile.work_type && (
            <Text style={styles.workType}>{profile.work_type}</Text>
          )}
          {profile.tagline ? (
            <Text style={styles.tagline} numberOfLines={1}>
              {profile.tagline}
            </Text>
          ) : null}
          {ageNeighborhoodLine ? <Text style={styles.ageNeighborhood}>{ageNeighborhoodLine}</Text> : null}
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Task */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Working on</Text>
          <Text style={styles.task} numberOfLines={2}>
            {intent.task_description}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsRow}>
          <Tag label={intent.work_style} size="sm" selected />
          <Tag label={intent.location_type} size="sm" selected style={styles.tagSpacing} />
        </View>

        {/* Location and availability */}
        <View style={styles.metaRow}>
          {intent.location_name && (
            <Text style={styles.metaText}>{intent.location_name}</Text>
          )}
          <Text style={styles.metaText}>{formatAvailability()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  photoContainer: {
    height: '55%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  distance: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  workType: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[1],
  },
  tagline: {
    fontSize: 13,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginTop: spacing[1],
  },
  ageNeighborhood: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing[1],
  },
  details: {
    flex: 1,
    padding: spacing[4],
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: spacing[2],
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing[1],
  },
  task: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  tagSpacing: {
    marginLeft: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  stamp: {
    position: 'absolute',
    top: 16,
    zIndex: 10,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 3,
    borderRadius: 6,
  },
  likeStamp: {
    right: 16,
    borderColor: colors.accentSuccess,
    transform: [{ rotate: '12deg' }],
  },
  nopeStamp: {
    left: 16,
    borderColor: colors.accentDanger,
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.accentSuccess,
    letterSpacing: 1.5,
  },
  nopeText: {
    color: colors.accentDanger,
  },
});
