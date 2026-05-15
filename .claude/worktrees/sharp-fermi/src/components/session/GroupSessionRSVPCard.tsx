import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { borderRadius, colors, shadows, spacing, theme, touchTarget } from '../../constants';
import { GroupSession, GroupSessionRsvp } from '../../types';

// No errorBg token exists in the design system — hardcoded to match the
// existing value already in this file.
const ERROR_BG = '#FBEDEA';

type GroupSessionRSVPCardProps = {
  session: GroupSession;
  rsvps: GroupSessionRsvp[];
  memberCount: number;
  currentUserId: string;
  proposedByName: string;
  onRsvp: (response: 'yes' | 'no') => void;
  onCancel: () => void;
};

function formatDateLabel(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function GroupSessionRSVPCard({
  session,
  rsvps,
  memberCount,
  currentUserId,
  proposedByName,
  onRsvp,
  onCancel,
}: GroupSessionRSVPCardProps) {
  const [isChanging, setIsChanging] = useState(false);

  if (session.status === 'cancelled') {
    return null;
  }

  const myRsvp = rsvps.find((item) => item.user_id === currentUserId) ?? null;
  const yesCount = rsvps.filter((item) => item.response === 'yes').length;
  const noCount = rsvps.filter((item) => item.response === 'no').length;
  const pendingCount = Math.max(0, memberCount - yesCount - noCount);
  const isProposer = session.proposed_by === currentUserId;
  const isCompleted = session.status === 'completed';

  const metaDate = formatDateLabel(session.scheduled_date);
  const metaWho = isProposer ? 'You proposed' : `${proposedByName} proposed`;

  const countText =
    noCount === 0
      ? `${yesCount} going · ${memberCount - yesCount} haven't replied`
      : `${yesCount} going · ${noCount} not going · ${pendingCount} pending`;

  // Show action buttons when: no rsvp yet, OR user tapped "Change"
  const showButtons = !myRsvp || isChanging;

  function handleRsvp(response: 'yes' | 'no') {
    setIsChanging(false);
    onRsvp(response);
  }

  return (
    <View style={[styles.card, styles.cardShadow]}>
      {/* ── card-top: icon box + title + badge + meta ── */}
      <View style={styles.cardTop}>
        <View style={styles.iconBox} testID="group-session-icon-box">
          <Text style={styles.iconEmoji}>☕️</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Group Session</Text>
            <View style={[styles.badge, isCompleted && styles.badgeConfirmed]}>
              <Text style={[styles.badgeText, isCompleted && styles.badgeTextConfirmed]}>
                {isCompleted ? 'CONFIRMED' : 'PENDING'}
              </Text>
            </View>
          </View>
          <Text style={styles.meta}>{metaDate} · {metaWho}</Text>
        </View>
      </View>

      {/* ── divider ── */}
      <View style={styles.divider} />

      {/* ── card-bottom ── */}
      <View style={styles.cardBottom}>
        {/* Count line — hidden in completed state */}
        {!isCompleted && (
          <Text style={styles.countText}>{countText}</Text>
        )}

        {/* Action area — varies by state */}
        {showButtons && !isCompleted ? (
          // State 1: action buttons
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.btnYes]}
              onPress={() => handleRsvp('yes')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnYesText}>☕️ Count me in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnNo]}
              onPress={() => handleRsvp('no')}
              activeOpacity={0.8}
            >
              <Text style={styles.btnNoText}>Pass</Text>
            </TouchableOpacity>
          </View>
        ) : isCompleted ? (
          // State 4: session confirmed
          <View style={styles.statusRow}>
            <View style={[styles.statusCircle, styles.statusCircleDone]}>
              <Text style={[styles.statusCircleText, styles.statusCircleTextDone]}>🎉</Text>
            </View>
            <Text style={[styles.statusLabel, styles.statusLabelDone]}>Session confirmed</Text>
          </View>
        ) : myRsvp?.response === 'yes' ? (
          // State 2: responded yes
          <View style={styles.statusRow}>
            <View style={[styles.statusCircle, styles.statusCircleYes]}>
              <Text style={[styles.statusCircleText, styles.statusCircleTextYes]}>✓</Text>
            </View>
            <Text style={[styles.statusLabel, styles.statusLabelYes]}>You're going</Text>
            <View style={styles.spacer} />
            <TouchableOpacity
              onPress={() => setIsChanging(true)}
              style={styles.actionLink}
              activeOpacity={0.7}
            >
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // State 3: responded no
          <View style={styles.statusRow}>
            <View style={[styles.statusCircle, styles.statusCircleNo]}>
              <Text style={[styles.statusCircleText, styles.statusCircleTextNo]}>✗</Text>
            </View>
            <Text style={[styles.statusLabel, styles.statusLabelNo]}>Can't make it</Text>
            <View style={styles.spacer} />
            {isProposer ? (
              <TouchableOpacity
                onPress={onCancel}
                style={styles.actionLink}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setIsChanging(true)}
                style={styles.actionLink}
                activeOpacity={0.7}
              >
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── outer card ──────────────────────────────────────────────────────────────
  // shadows.card spread is kept in a separate style to avoid TypeScript issues
  // with StyleSheet.create() and 'as const' typed objects.
  card: {
    marginHorizontal: spacing[4],
    marginVertical: spacing[2],
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  cardShadow: {
    ...shadows.card,
  },

  // ── card-top ─────────────────────────────────────────────────────────────────
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 14,
    paddingHorizontal: spacing[4],
    paddingBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.statusPendingBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 21,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.statusPendingBg,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeConfirmed: {
    backgroundColor: colors.statusConfirmedBg,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.statusPendingText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeTextConfirmed: {
    color: colors.statusConfirmedText,
  },
  meta: {
    fontSize: 12,
    color: colors.textTertiary,
  },

  // ── divider ───────────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginHorizontal: spacing[4],
  },

  // ── card-bottom ───────────────────────────────────────────────────────────────
  cardBottom: {
    paddingTop: 11,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  countText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 9,
  },

  // ── State 1: action buttons ───────────────────────────────────────────────────
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    borderRadius: borderRadius.md,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTarget.min,
  },
  btnYes: {
    flex: 2,
    backgroundColor: colors.accentPrimary,
  },
  btnNo: {
    flex: 1,
    backgroundColor: colors.bgSecondary,
  },
  btnYesText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
  btnNoText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },

  // ── States 2, 3, 4: circle icon + text row ────────────────────────────────────
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusCircleYes: {
    backgroundColor: colors.statusConfirmedBg,
  },
  statusCircleNo: {
    backgroundColor: ERROR_BG,
  },
  statusCircleDone: {
    backgroundColor: colors.statusConfirmedBg,
  },
  statusCircleText: {
    fontSize: 14,
  },
  // Per-state color for the symbol inside the circle
  statusCircleTextYes: {
    color: colors.statusConfirmedText,
  },
  statusCircleTextNo: {
    color: theme.error,
  },
  statusCircleTextDone: {
    color: colors.statusConfirmedText,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusLabelYes: {
    color: colors.statusConfirmedText,
  },
  statusLabelNo: {
    color: theme.error,
  },
  statusLabelDone: {
    color: colors.statusConfirmedText,
  },
  spacer: {
    flex: 1,
  },
  actionLink: {
    minHeight: touchTarget.min,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.error,
  },
});
