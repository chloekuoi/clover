import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { borderRadius, colors, spacing, theme, touchTarget, shadows } from '../../constants';
import { SessionRecord } from '../../types';
import SessionReceiptCard from './SessionReceiptCard';

type SessionRequestCardProps = {
  session: SessionRecord;
  currentUserId: string;
  otherUserName?: string | null;
  totalSessions: number;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onLockIn: () => void;
  onSendMessage: (text: string) => void;
};

function formatStatus(status: SessionRecord['status']) {
  switch (status) {
    case 'pending':
      return 'Session Pending';
    case 'active':
      return 'Session Complete?';
    case 'declined':
      return 'Session Declined';
    case 'completed':
      return 'Session Completed';
    case 'cancelled':
      return 'Session Cancelled';
    default:
      return 'Session';
  }
}

function formatDateLabel(dateValue?: string | null) {
  if (!dateValue) return 'Today';
  const date = new Date(dateValue);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SessionRequestCard({
  session,
  currentUserId,
  otherUserName,
  totalSessions,
  onAccept,
  onDecline,
  onCancel,
  onLockIn,
  onSendMessage,
}: SessionRequestCardProps) {
  const isInitiator = session.initiated_by === currentUserId;
  const currentUserLocked = isInitiator
    ? !!session.locked_by_initiator_at
    : !!session.locked_by_invitee_at;
  const otherUserLocked = isInitiator
    ? !!session.locked_by_invitee_at
    : !!session.locked_by_initiator_at;
  const scheduledLabel = formatDateLabel(session.scheduled_date || session.session_date);
  const bothLocked = currentUserLocked && otherUserLocked;

  const statusDotPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (session.status !== 'pending' || bothLocked) {
      statusDotPulse.stopAnimation();
      statusDotPulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(statusDotPulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(statusDotPulse, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bothLocked, session.status, statusDotPulse]);

  const dotAnimatedStyle = useMemo(
    () => ({
      transform: [
        {
          scale: statusDotPulse.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.4],
          }),
        },
      ],
      opacity: statusDotPulse.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0.4],
      }),
    }),
    [statusDotPulse]
  );

  const renderDescription = () => {
    if (session.status === 'pending') {
      return isInitiator
        ? `Invite sent for ${scheduledLabel}.`
        : `Cowork invite for ${scheduledLabel}.`;
    }

    if (session.status === 'active') {
      return '';
    }

    if (session.status === 'declined') {
      return isInitiator
        ? 'Your invitation was declined.'
        : 'You declined this session.';
    }

    if (session.status === 'completed') {
      return 'Session confirmed.';
    }

    if (session.status === 'cancelled') {
      return isInitiator
        ? 'You cancelled this session.'
        : 'The session was cancelled.';
    }

    return '';
  };

  const [showProposeInput, setShowProposeInput] = useState(false);
  const [proposeText, setProposeText] = useState('');
  // IMPORTANT: All hooks (useRef/useEffect/useMemo) must appear ABOVE this line.
  // Do not add hooks below — early returns follow and would violate Rules of Hooks.
  // Capture status before TypeScript narrows it via early returns below.
  const statusForDisplay = session.status as SessionRecord['status'];

  if (session.status === 'cancelled') {
    return null;
  }

  if (session.status === 'active') {
    return (
      <SessionReceiptCard
        session={session}
        currentUserId={currentUserId}
        otherUserName={otherUserName}
        totalSessions={totalSessions}
        onLockIn={onLockIn}
      />
    );
  }

  if (session.status === 'pending' && isInitiator) {
    return (
      <View style={styles.pendingRowCard}>
        <View style={styles.pendingIconBox}>
          <Text style={styles.pendingIcon}>☕️</Text>
        </View>
        <View style={styles.pendingContent}>
          <View style={styles.pendingTitleRow}>
            <Text style={styles.pendingTitle}>Cowork Invite</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          </View>
          <Text style={styles.pendingDate}>{scheduledLabel}</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.pendingCancelButton}>
          <Text style={styles.pendingCancelText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (session.status === 'pending' && !isInitiator) {
    const handleSendProposal = () => {
      const trimmed = proposeText.trim();
      if (!trimmed) return;
      onSendMessage(trimmed);
      setProposeText('');
      setShowProposeInput(false);
    };

    return (
      <View style={styles.pendingCardOuter}>
        {/* ── TOP ROW ── */}
        <View style={styles.pendingRowInner}>
          <View style={styles.pendingIconBox}>
            <Text style={styles.pendingIcon}>☕️</Text>
          </View>
          <View style={styles.pendingContent}>
            <View style={styles.pendingTitleRow}>
              <Text style={styles.pendingTitle}>Cowork Invite</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
            </View>
            <Text style={styles.pendingDate}>{scheduledLabel}</Text>
          </View>
          <View style={styles.inviteeActions}>
            <TouchableOpacity onPress={onAccept} style={styles.acceptBtn} activeOpacity={0.8}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDecline} style={styles.declineBtn} activeOpacity={0.8}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowProposeInput((v) => !v)}
              style={styles.proposeBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.proposeBtnText}>Propose…</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── EXPANDABLE PROPOSE INPUT ── */}
        {showProposeInput && (
          <>
            <View style={styles.proposeDivider} />
            <View style={styles.proposeInputRow}>
              <TextInput
                style={styles.proposeInput}
                value={proposeText}
                onChangeText={setProposeText}
                placeholder="Suggest an alternative…"
                placeholderTextColor={colors.textTertiary}
                autoFocus
                multiline={false}
                returnKeyType="send"
                onSubmitEditing={handleSendProposal}
              />
              <TouchableOpacity
                style={[styles.proposeSendBtn, !proposeText.trim() && styles.proposeSendBtnDisabled]}
                onPress={handleSendProposal}
                disabled={!proposeText.trim()}
                activeOpacity={0.8}
                hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
              >
                <Text style={styles.proposeSendIcon}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        statusForDisplay === 'declined' && styles.dimmedCard,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.statusLabel}>{formatStatus(statusForDisplay)}</Text>
        <Animated.View
          style={[
            styles.statusDot,
            statusForDisplay === 'active' && styles.statusDotActive,
            statusForDisplay === 'pending' && styles.statusDotPending,
            statusForDisplay === 'declined' && styles.statusDotDeclined,
            statusForDisplay === 'completed' && styles.statusDotCompleted,
            statusForDisplay === 'pending' && !bothLocked ? dotAnimatedStyle : null,
          ]}
        />
      </View>
      {renderDescription() ? <Text style={styles.description}>{renderDescription()}</Text> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: theme.highlight,
    marginVertical: spacing[2],
  },
  pendingRowCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginVertical: spacing[2],
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.card,
  },
  pendingIconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.statusPendingBg,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pendingIcon: {
    fontSize: 22,
    color: colors.statusPendingText,
  },
  pendingContent: {
    flex: 1,
    marginHorizontal: 14,
  },
  pendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  pendingBadge: {
    marginLeft: 8,
    backgroundColor: colors.statusPendingBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
    overflow: 'hidden',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.statusPendingText,
  },
  pendingDate: {
    fontSize: 12.5,
    color: colors.textTertiary,
    marginTop: 2,
  },
  pendingCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pendingCancelText: {
    color: colors.textTertiary,
    fontSize: 16,
    fontWeight: '600',
  },
  // ── Outer card wrapper for invitee (column, so input row can expand below) ──
  pendingCardOuter: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    marginVertical: spacing[2],
    ...shadows.card,
  },
  // ── Inner horizontal row (icon + content + actions) ──
  pendingRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  inviteeActions: {
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
  },
  acceptBtn: {
    backgroundColor: colors.accentPrimary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  declineBtn: {
    backgroundColor: colors.bgSecondary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  declineBtnText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  proposeBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textTertiary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  proposeBtnText: {
    fontSize: 11,
    color: colors.textTertiary,
  },
  proposeDivider: {
    height: 1,
    backgroundColor: colors.bgSecondary,
  },
  proposeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  proposeInput: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
  },
  proposeSendBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proposeSendBtnDisabled: {
    opacity: 0.35,
  },
  proposeSendIcon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dimmedCard: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.textMuted,
  },
  statusDotActive: {
    backgroundColor: theme.success,
  },
  statusDotPending: {
    backgroundColor: theme.warning,
  },
  statusDotDeclined: {
    backgroundColor: theme.error,
  },
  statusDotCompleted: {
    backgroundColor: theme.primary,
  },
  description: {
    marginTop: spacing[2],
    color: theme.textSecondary,
    fontSize: 14,
  },
  descriptionCentered: {
    marginTop: spacing[2],
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  activeContent: {
    marginTop: spacing[2],
  },
  lockLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockLabelCell: {
    flex: 1,
  },
  lockLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  connectorSpacer: {
    width: 36,
    marginHorizontal: spacing[2],
  },
  lockPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  lockPillCell: {
    flex: 1,
  },
  lockPill: {
    minHeight: touchTarget.min,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#3F5443',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    backgroundColor: theme.surface,
  },
  lockPillTouch: {
    minHeight: touchTarget.min,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
  },
  lockPillConfirmed: {
    backgroundColor: '#e8f0ea',
  },
  lockTextConfirmed: {
    color: '#3F5443',
  },
  lockEmojiOnly: {
    fontSize: 22,
    lineHeight: 24,
    color: '#3F5443',
  },
  connectingLineTrack: {
    width: 36,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d8e4da',
    overflow: 'hidden',
    marginHorizontal: spacing[2],
  },
  connectingLineFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3F5443',
  },
  connectingLineShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 28,
    backgroundColor: '#6a8f6e',
    opacity: 0.45,
  },
  successMessageWrap: {
    marginTop: spacing[2],
  },
  successMessage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F5443',
    textAlign: 'center',
  },
});
