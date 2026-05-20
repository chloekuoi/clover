import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Participant {
  name: string;
  initials: string;
  confirmed: boolean;
}

interface CoworkReceiptCardProps {
  participants: [Participant, Participant]; // always exactly two people
  totalSessions: number;
  onConfirm: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  forest: '#3F5443',
  forestLight: '#e8f0e9',
  warmCard: '#FDFBF7',
  textPrimary: '#2a2a2a',
  textMuted: '#8a8a8a',
  white: '#ffffff',
};

// ─── Pulsing border hook ──────────────────────────────────────────────────────

function usePulseOpacity() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return opacity;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function AvatarStack({ participants }: { participants: [Participant, Participant] }) {
  const [them, me] = participants;
  return (
    <View style={styles.avatarStack}>
      {/* Their avatar — solid */}
      <View style={styles.avatarThem}>
        <Text style={styles.avatarThemText}>{them.initials}</Text>
      </View>
      {/* Your avatar — overlapping, translucent */}
      <View style={styles.avatarMe}>
        <Text style={styles.avatarMeText}>{me.initials}</Text>
      </View>
      {/* Names beside stack */}
      <View style={styles.avatarNames}>
        <Text style={styles.avatarNameText}>{them.name}</Text>
        <Text style={[styles.avatarNameText, { opacity: 0.5 }]}>You</Text>
      </View>
    </View>
  );
}

function SignedButton({ name }: { name: string }) {
  return (
    <View style={styles.signedBtn}>
      <Text style={styles.signedBtnText}>✓ Signed</Text>
      <Text style={styles.signBtnName}>{name}</Text>
    </View>
  );
}

function PendingButton({ onConfirm }: { onConfirm: () => void }) {
  const pulseOpacity = usePulseOpacity();

  return (
    <Pressable
      onPress={onConfirm}
      style={({ pressed }) => [styles.pendingBtn, pressed && { opacity: 0.85 }]}
    >
      {/* Animated glow ring */}
      <Animated.View
        style={[styles.pendingGlow, { opacity: pulseOpacity }]}
        pointerEvents="none"
      />
      <Text style={styles.pendingBtnText}>Tap to sign ✍️</Text>
      <Text style={styles.signBtnName}>You</Text>
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CoworkReceiptCard({
  participants,
  totalSessions,
  onConfirm,
}: CoworkReceiptCardProps) {
  const [them, me] = participants;

  return (
    <View style={styles.card}>

      {/* ── Green banner ── */}
      <View style={styles.banner}>
        <Text style={styles.receiptLabel}>COWORK RECEIPT</Text>
        <Text style={styles.receiptTitle}>You locked in 🔒</Text>

        <AvatarStack participants={participants} />

        {/* Sign buttons */}
        <View style={styles.signRow}>
          {them.confirmed ? (
            <SignedButton name={them.name} />
          ) : (
            <PendingButton onConfirm={onConfirm} />
          )}
          {me.confirmed ? (
            <SignedButton name="You" />
          ) : (
            <PendingButton onConfirm={onConfirm} />
          )}
        </View>
      </View>

      {/* ── Torn edge separator ── */}
      <TornEdge />

      {/* ── Receipt body ── */}
      <View style={styles.body}>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptKey}>Total sessions</Text>
          <Text style={styles.receiptVal}>{totalSessions} 🔥</Text>
        </View>
      </View>

    </View>
  );
}

// ─── Torn edge ───────────────────────────────────────────────────────────────
// Approximates the scalloped tear using evenly-spaced semicircle cutouts.
// Swap this out for a PNG asset if you want pixel-perfect results.

function TornEdge() {
  const NOTCH_COUNT = 14;
  const NOTCH_SIZE = 10;

  return (
    <View style={styles.tornEdge}>
      <View style={styles.tornNotchRow}>
        {Array.from({ length: NOTCH_COUNT }).map((_, i) => (
          <View key={i} style={[styles.tornNotch, { width: NOTCH_SIZE, height: NOTCH_SIZE / 2, borderRadius: NOTCH_SIZE / 2 }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.warmCard,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(63,84,67,0.13)',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },

  // ── Banner ──
  banner: {
    backgroundColor: COLORS.forest,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },

  receiptLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
    marginBottom: 4,
  },

  receiptTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: COLORS.white,
    marginBottom: 14,
    // Use your Fraunces font here if loaded:
    // fontFamily: 'Fraunces_300Light',
  },

  // ── Avatar stack ──
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  avatarThem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 2.5,
    borderColor: COLORS.forest,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  avatarThemText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.forest,
  },

  avatarMe: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12, // overlap
    zIndex: 1,
  },

  avatarMeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
  },

  avatarNames: {
    marginLeft: 10,
    gap: 1,
  },

  avatarNameText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },

  // ── Sign row ──
  signRow: {
    flexDirection: 'row',
    gap: 10,
  },

  signedBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
  },

  signedBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  pendingBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  pendingGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.white,
  },

  pendingBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.forest,
  },

  signBtnName: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },

  // ── Torn edge ──
  tornEdge: {
    height: 10,
    backgroundColor: COLORS.warmCard,
    overflow: 'hidden',
  },

  tornNotchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  tornNotch: {
    backgroundColor: COLORS.forest, // matches banner bg to create cutout illusion
  },

  // ── Body ──
  body: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 14,
  },

  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },

  receiptKey: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  receiptVal: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});
