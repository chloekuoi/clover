# Propose Alternative Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Propose…" tertiary action to the receiver's pending invite card that expands an inline text input and sends the proposal as a chat message.

**Architecture:** Two-task change. Task 1 updates `SessionRequestCard.tsx`: restructures the invitee pending branch to use a new column-wrapper layout (supporting the expandable input row), adds `showProposeInput`/`proposeText` state, and adds the new styles. Task 2 wires the new `onSendMessage` prop in `ChatScreen.tsx`. No DB changes needed.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, `useState`, `TextInput`

---

### Task 1: Restructure invitee pending branch with Propose action

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx`

**Context:**

The current file at `/Users/chloe/Documents/Claude/cowork-connect/src/components/session/SessionRequestCard.tsx` has two pending branches:
- **Initiator** (`isInitiator === true`): renders `pendingRowCard` (row layout) with ☕️ icon, title+badge+date, ✕ cancel button. **Do not touch this.**
- **Invitee** (`!isInitiator`): renders `pendingRowCard` with icon, title+badge+date, Accept + Decline pills. **This is what we're changing.**

The problem: `pendingRowCard` is `flexDirection: 'row'`. For the receiver we need a column wrapper so the expandable input row can appear below the top row. Solution: create a new `pendingCardOuter` (column wrapper, same card visuals as `pendingRowCard`) and `pendingRowInner` (the horizontal row with padding). The sender's `pendingRowCard` stays completely untouched.

**Important:** React Native hook rules require all `useState`/`useRef`/`useEffect`/`useMemo` calls to appear before any conditional returns. There is already a comment in the file at the hooks boundary: `// IMPORTANT: All hooks (useRef/useEffect/useMemo) must appear ABOVE this line.` Add the new `useState` hooks immediately before this comment.

---

**Step 1: Add `useState` and `TextInput` to imports**

Current line 1-2:
```tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
```

Replace with:
```tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
```

**Step 2: Add `onSendMessage` to props type**

Current `SessionRequestCardProps`:
```tsx
type SessionRequestCardProps = {
  session: SessionRecord;
  currentUserId: string;
  otherUserName?: string | null;
  totalSessions: number;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onLockIn: () => void;
};
```

Add `onSendMessage` after `onLockIn`:
```tsx
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
```

Also destructure it in the function signature alongside the other props:
```tsx
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
```

**Step 3: Add state hooks before the hooks boundary comment**

Find the comment (currently around line 168):
```tsx
  // IMPORTANT: All hooks (useRef/useEffect/useMemo) must appear ABOVE this line.
```

Insert these two lines immediately before it:
```tsx
  const [showProposeInput, setShowProposeInput] = useState(false);
  const [proposeText, setProposeText] = useState('');
```

**Step 4: Replace the invitee pending branch JSX**

Find the current invitee branch:
```tsx
  if (session.status === 'pending' && !isInitiator) {
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
        <View style={styles.inviteeActions}>
          <TouchableOpacity onPress={onAccept} style={styles.acceptBtn} activeOpacity={0.8}>
            <Text style={styles.acceptBtnText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDecline} style={styles.declineBtn} activeOpacity={0.8}>
            <Text style={styles.declineBtnText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
```

Replace entirely with:
```tsx
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
            <View style={styles.secondaryRow}>
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
              >
                <Text style={styles.proposeSendIcon}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    );
  }
```

**Step 5: Update styles**

In `StyleSheet.create({...})`:

**Replace** the existing `inviteeActions`, `acceptBtn`, `acceptBtnText`, `declineBtn`, `declineBtnText` styles and **add** the new styles. Find and replace this block:

```tsx
  inviteeActions: {
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
  },
  acceptBtn: {
    backgroundColor: colors.accentPrimary,
    paddingVertical: 5,
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
    fontSize: 12,
    color: colors.textTertiary,
  },
```

Replace with:
```tsx
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  acceptBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 4,
  },
  declineBtn: {
    backgroundColor: colors.bgSecondary,
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
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
```

**Step 6: Verify TypeScript compiles**

```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit
```

Expected: 0 errors. If you see an error about `onSendMessage` being required but not provided, that's expected — Task 2 wires it up in ChatScreen.

**Step 7: Commit**

```bash
git add src/components/session/SessionRequestCard.tsx
git commit -m "feat: add Propose alternative inline input to invitee pending card"
```

---

### Task 2: Wire onSendMessage in ChatScreen

**Files:**
- Modify: `src/screens/matches/ChatScreen.tsx`

**Context:**

`ChatScreen.tsx` renders `<SessionRequestCard>` at around line 499. It already imports and uses `sendMessage` from `messagingService`. The `handleSend` function (line 312) already calls `sendMessage(matchId, user.id, content)`. We need to pass `onSendMessage` as a prop to `SessionRequestCard`, wired to the same `sendMessage` call pattern.

**Step 1: Add `onSendMessage` prop to the SessionRequestCard render**

Find the `<SessionRequestCard` block (around line 499):
```tsx
                <SessionRequestCard
                  session={item.session}
                  currentUserId={user?.id ?? ''}
                  otherUserName={otherUser.name}
                  totalSessions={totalSessions}
                  onAccept={() => handleAcceptSession(item.session.id)}
                  onDecline={() => handleDeclineSession(item.session.id)}
                  onCancel={() => handleCancelSession(item.session.id)}
                  onLockIn={() => handleLockIn(item.session.id)}
                />
```

Replace with:
```tsx
                <SessionRequestCard
                  session={item.session}
                  currentUserId={user?.id ?? ''}
                  otherUserName={otherUser.name}
                  totalSessions={totalSessions}
                  onAccept={() => handleAcceptSession(item.session.id)}
                  onDecline={() => handleDeclineSession(item.session.id)}
                  onCancel={() => handleCancelSession(item.session.id)}
                  onLockIn={() => handleLockIn(item.session.id)}
                  onSendMessage={(text) => handleSend(text)}
                />
```

**Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add src/screens/matches/ChatScreen.tsx
git commit -m "feat: wire onSendMessage prop for propose alternative in ChatScreen"
```
