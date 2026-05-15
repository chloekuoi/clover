import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { theme, spacing, borderRadius, colors } from '../../constants';
import { DiscoveryCard } from '../../types';
import { formatDistance } from '../../hooks/useLocation';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const CARD_WIDTH = SCREEN_WIDTH - spacing[8];
export const CARD_HEIGHT = CARD_WIDTH * 1.35;

type SwipeCardProps = {
  card: DiscoveryCard;
  translateX?: SharedValue<number>;
  isTopCard?: boolean;
};

export default function SwipeCard({ card, translateX, isTopCard = false }: SwipeCardProps) {
  const { profile, intent, distance } = card;

  const initials = profile.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

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

  const likeOpacity = useAnimatedStyle(() => {
    if (!translateX || !isTopCard) return { opacity: 0 };
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
    if (!translateX || !isTopCard) return { opacity: 0 };
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
      {/* LIKE / NOPE stamps */}
      <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
        <Text style={styles.stampText}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.nopeStamp, nopeOpacity]}>
        <Text style={[styles.stampText, styles.nopeText]}>NOPE</Text>
      </Animated.View>

      {/* Photo or warm sage gradient placeholder */}
      {profile.photo_url ? (
        <Image
          source={{ uri: profile.photo_url }}
          style={styles.photo}
          contentFit="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderInitial}>{initials}</Text>
        </View>
      )}

      {/* Dark overlay at bottom */}
      <View style={styles.gradientOverlay} />

      {/* Info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={styles.distance}>📍 {formatDistance(distance)}</Text>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name || 'Anonymous'}</Text>
          {age ? <Text style={styles.age}>{age}</Text> : null}
        </View>
        {profile.work_type ? (
          <Text style={styles.profession}>{profile.work_type}</Text>
        ) : null}
        <View style={styles.divider} />
        <Text style={styles.intent} numberOfLines={2}>
          {intent.task_description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#8fa893',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    fontSize: CARD_WIDTH * 0.22,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.25)',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
    backgroundColor: 'rgba(20,32,22,0.78)',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
  },
  distance: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: spacing[1],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing[1],
    marginBottom: 2,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
  },
  age: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.52)',
    marginLeft: spacing[1],
  },
  profession: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: spacing[2],
  },
  intent: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 16.8,
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
