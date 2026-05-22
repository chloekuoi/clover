import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DiscoveryCard, ProfilePhoto } from '../../types';
import {
  CLOVER_BG,
  CLOVER_FOREST,
  CLOVER_LAVENDER,
  CLOVER_VIOLET,
  FONT_CORMORANT_LIGHT,
  FONT_DM_SANS_LIGHT,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Cards and photos share the same horizontal margin — unified floating system
const FEED_MARGIN_H = 16;
const PHOTO_SIZE = SCREEN_WIDTH - FEED_MARGIN_H * 2; // square, consistent with card width
const FEED_RADIUS = 14;
const FEED_GAP = 12; // vertical gap between every feed item

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(timeStr: string): string {
  // "HH:MM:SS" → "H:MM"
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  return `${hour}:${m}`;
}

function formatDistance(km: number): string {
  if (km < 1) return '< 1 km away';
  return `${Math.round(km)} km away`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PhotoBlock({ photo }: { photo: ProfilePhoto }) {
  return (
    <View style={styles.photoWrapper}>
      <Image
        source={{ uri: photo.photo_url }}
        style={styles.photo}
        resizeMode="cover"
      />
    </View>
  );
}

function CardBlock({ label, answer }: { label: string; answer: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardAnswer}>{answer}</Text>
    </View>
  );
}

function InfoRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface DiscoverProfileViewProps {
  card: DiscoveryCard;
  onPass: () => void;
  onConnect: () => void;
}

export default function DiscoverProfileView({ card, onPass, onConnect }: DiscoverProfileViewProps) {
  const insets = useSafeAreaInsets();
  const { profile, intent, distance, photos } = card;

  const photo1 = photos[0];
  const photo2 = photos[1];
  const photo3 = photos[2];
  const photo4 = photos[3];
  const photo5 = photos[4];

  const aboutText = profile.tagline || profile.bio;
  const hasCwo = !!profile.currently_working_on;

  let availableText: string | null = null;
  if (intent?.available_from && intent?.available_until) {
    availableText = `${formatTime(intent.available_from)} – ${formatTime(intent.available_until)}`;
  }

  const distanceLabel = distance > 0 ? formatDistance(distance) : null;
  const nameDistance = [profile.name, distanceLabel].filter(Boolean).join(' · ');

  const hasPersonalInfo =
    !!profile.city ||
    !!profile.neighborhood ||
    !!profile.work_type ||
    !!availableText ||
    !!profile.school;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 96 + Math.max(insets.bottom, 16) },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Name · distance */}
        <Text style={styles.nameHeader}>{nameDistance}</Text>

        {/* Photo 1 */}
        {photo1 ? <PhotoBlock photo={photo1} /> : null}

        {/* About card */}
        {aboutText ? <CardBlock label="About" answer={aboutText} /> : null}

        {/* Photo 2 */}
        {photo2 ? <PhotoBlock photo={photo2} /> : null}

        {/* Personal info section */}
        {hasPersonalInfo ? (
          <View style={styles.infoSection}>
            {profile.city ? <InfoRow emoji="🏙️" text={profile.city} /> : null}
            {profile.neighborhood ? <InfoRow emoji="📍" text={profile.neighborhood} /> : null}
            {profile.work_type ? <InfoRow emoji="💼" text={profile.work_type} /> : null}
            {availableText ? <InfoRow emoji="🕐" text={availableText} /> : null}
            {profile.school ? <InfoRow emoji="🎓" text={profile.school} /> : null}
          </View>
        ) : null}

        {/* Currently working on card */}
        {hasCwo ? (
          <CardBlock label="Currently building" answer={profile.currently_working_on!} />
        ) : null}

        {/* Photos 3, 4, 5 — gallery run with consistent gap */}
        {photo3 ? <PhotoBlock photo={photo3} /> : null}
        {photo4 ? <PhotoBlock photo={photo4} /> : null}
        {photo5 ? <PhotoBlock photo={photo5} /> : null}
      </ScrollView>

      {/* Floating Pass / Connect bar — no hard border, soft overlay */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.passBtn]}
          onPress={onPass}
          activeOpacity={0.85}
        >
          <Text style={styles.passBtnText}>Pass</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.connectBtn]}
          onPress={onConnect}
          activeOpacity={0.85}
        >
          <Text style={styles.connectBtnText}>Connect</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f0f8',
  },
  scrollContent: {
    // paddingBottom set dynamically for floating bar
  },

  // Drag handle
  handleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(124,92,191,0.25)',
  },

  // Name header — tight lead-in before first photo
  nameHeader: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 22,
    color: CLOVER_FOREST,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
    letterSpacing: 0.3,
  },

  // Photos — same margin + radius as cards (unified floating system)
  photoWrapper: {
    marginHorizontal: FEED_MARGIN_H,
    marginBottom: FEED_GAP,
    borderRadius: FEED_RADIUS,
    overflow: 'hidden', // clips the image to the border radius
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },

  // White prompt cards (About, Currently building)
  card: {
    backgroundColor: '#ffffff',
    borderRadius: FEED_RADIUS,
    marginHorizontal: FEED_MARGIN_H,
    marginBottom: FEED_GAP,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  cardLabel: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 11,
    color: 'rgba(30,61,40,0.40)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardAnswer: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 22,
    color: CLOVER_FOREST,
    lineHeight: 28,
  },

  // Personal info section — same card treatment
  infoSection: {
    backgroundColor: '#ffffff',
    borderRadius: FEED_RADIUS,
    marginHorizontal: FEED_MARGIN_H,
    marginBottom: FEED_GAP,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoEmoji: {
    fontSize: 15,
    width: 22,
    textAlign: 'center',
  },
  infoText: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 14,
    color: CLOVER_FOREST,
    flex: 1,
  },

  // Floating action bar — soft overlay, no hard border
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(242,240,248,0.96)',
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: CLOVER_LAVENDER,
  },
  passBtnText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    color: CLOVER_VIOLET,
    letterSpacing: 0.3,
  },
  connectBtn: {
    backgroundColor: CLOVER_FOREST,
  },
  connectBtnText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    color: CLOVER_BG,
    letterSpacing: 0.3,
  },
});
