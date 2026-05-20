import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { borderRadius, colors, theme, shadows } from '../../constants';
import { SessionRecord } from '../../types';

type SessionReceiptCardProps = {
  session: SessionRecord;
  currentUserId: string;
  otherUserName?: string | null;
  totalSessions: number;
  onLockIn: () => void;
};

/** Returns up to 2 uppercase initials from a display name. */
function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SessionReceiptCard({
  session,
  currentUserId,
  otherUserName,
  totalSessions,
  onLockIn,
}: SessionReceiptCardProps) {
  const isInitiator = session.initiated_by === currentUserId;
  const currentUserLocked = isInitiator
    ? !!session.locked_by_initiator_at
    : !!session.locked_by_invitee_at;
  const otherUserLocked = isInitiator
    ? !!session.locked_by_invitee_at
    : !!session.locked_by_initiator_at;

  const partnerName = otherUserName || 'Partner';
  const partnerInitials = getInitials(partnerName);

  const signPulse = useRef(new Animated.Value(currentUserLocked ? 1 : 0.3)).current;

  useEffect(() => {
    if (currentUserLocked) {
      signPulse.stopAnimation();
      signPulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(signPulse, {
          toValue: 0.9,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(signPulse, {
          toValue: 0.3,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [currentUserLocked, signPulse]);

  return (
    <View style={[styles.cardShadow, shadows.card]}>
    <View style={styles.card}>

      {/* ── GREEN BANNER ── */}
      <View style={styles.banner}>

        {/* Title row: "You locked in" left, "COWORK RECEIPT" right */}
        <View style={styles.titleRow}>
          <Text style={styles.receiptTitle}>You locked in 🔒</Text>
          <Text style={styles.receiptLabel}>COWORK RECEIPT</Text>
        </View>

        {/* Avatar stack + names */}
        <View style={styles.avatarRow}>
          <View style={styles.avatarPartner}>
            <Text style={styles.avatarInitials}>{partnerInitials}</Text>
          </View>
          <View style={styles.avatarMe}>
            <Text style={styles.avatarMeText}>Me</Text>
          </View>
          <View style={styles.avatarNames}>
            <Text style={styles.avatarNamePrimary}>{partnerName}</Text>
            <Text style={styles.avatarNameSub}>You</Text>
          </View>
        </View>

        {/* Sign buttons row */}
        <View style={styles.signRow}>

          {/* LEFT — partner side */}
          <View style={[styles.signBtn, styles.signBtnTranslucent]}>
            {otherUserLocked ? (
              <>
                <Text style={styles.signBtnPrimaryWhite}>✓ Signed</Text>
                <Text style={styles.signBtnSubWhite}>{partnerName}</Text>
              </>
            ) : (
              <Text style={styles.signBtnWaiting}>Waiting…</Text>
            )}
          </View>

          {/* RIGHT — your side */}
          <Animated.View
            style={[
              styles.signBtn,
              styles.signBtnSolid,
              !currentUserLocked && { opacity: signPulse },
            ]}
          >
            <TouchableOpacity
              onPress={onLockIn}
              disabled={currentUserLocked}
              style={styles.signBtnTouch}
              activeOpacity={0.85}
            >
              {currentUserLocked ? (
                <>
                  <Text style={styles.signBtnPrimaryForest}>✓ Signed</Text>
                  <Text style={styles.signBtnSubForest}>You</Text>
                </>
              ) : (
                <>
                  <Text style={styles.signBtnPrimaryForest}>Tap to sign ✍️</Text>
                  <Text style={styles.signBtnSubForest}>You</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

        </View>
      </View>

      {/* ── TORN EDGE ── */}
      <View style={styles.tornEdge}>
        {Array.from({ length: 38 }).map((_, i) => (
          <View key={i} style={styles.notch} />
        ))}
      </View>

      {/* ── WHITE BODY ── */}
      <View style={styles.body}>
        <Text style={styles.bodyLabel}>Total sessions</Text>
        <Text style={styles.bodyValue}>{totalSessions} 🔥</Text>
      </View>

    </View>
    </View>
  );
}

const BANNER_BG = '#3F5443';
const CARD_BG = '#FFFFFF';

const styles = StyleSheet.create({
  // Outer view carries the shadow — must NOT have overflow:hidden (iOS clips shadow)
  cardShadow: {
    borderRadius: borderRadius.lg,
    marginVertical: 8,
    backgroundColor: CARD_BG,
  },
  // Inner view clips rounded corners — shadow lives on the parent
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: CARD_BG,
  },
  banner: {
    backgroundColor: BANNER_BG,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#FFFFFF',
    opacity: 0.65,
    textTransform: 'uppercase',
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPartner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: BANNER_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    fontWeight: '600',
    color: BANNER_BG,
  },
  avatarMe: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  avatarMeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarNames: {
    marginLeft: 10,
    gap: 2,
  },
  avatarNamePrimary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarNameSub: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.65,
  },
  signRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  signBtnTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 8,
  },
  signBtnTranslucent: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  signBtnSolid: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  signBtnPrimaryWhite: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signBtnSubWhite: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
  },
  signBtnWaiting: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.45,
  },
  signBtnPrimaryForest: {
    fontSize: 13,
    fontWeight: '600',
    color: BANNER_BG,
  },
  signBtnSubForest: {
    fontSize: 10,
    color: BANNER_BG,
    opacity: 0.7,
    marginTop: 2,
  },
  tornEdge: {
    height: 2,
    backgroundColor: BANNER_BG,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  notch: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: CARD_BG,
  },
  body: {
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  bodyLabel: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  bodyValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
