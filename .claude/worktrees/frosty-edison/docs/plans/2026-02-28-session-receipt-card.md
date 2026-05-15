# Session Receipt Card Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the active-session lock-pill UI with a polished "Cowork Receipt" card — green banner with avatar stack and sign buttons, a torn-edge separator, and a total-sessions footer.

**Architecture:** Extract a new `SessionReceiptCard` component that renders the entire receipt layout. `SessionRequestCard` delegates to it when `status === 'active'`. `ChatScreen` derives a `totalSessions` count from its existing sessions array and passes it down — no new queries needed.

**Tech Stack:** React Native 0.81, Expo SDK 54, Animated API (`useNativeDriver: true` for opacity pulse), existing design tokens (`colors`, `spacing`, `borderRadius`, `shadows`, `theme` from `src/constants`).

**Design reference:** `docs/plans/2026-02-28-session-receipt-card-design.md`

---

## Task 1: Create `SessionReceiptCard.tsx`

**Files:**
- Create: `src/components/session/SessionReceiptCard.tsx`

---

### Step 1: Create the file with imports, types, and helpers

```tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { borderRadius, colors, spacing, theme, shadows } from '../../constants';
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
```

---

### Step 2: Add the component body — derive lock state and the pulse animation

```tsx
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

  // Pulse animation for the pending sign button (opacity only — native driver safe)
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
```

---

### Step 3: Add the JSX — banner, torn edge, body

Add this directly after the `useEffect` block, still inside the component:

```tsx
  return (
    <View style={[styles.card, shadows.card]}>

      {/* ── GREEN BANNER ── */}
      <View style={styles.banner}>

        {/* Label */}
        <Text style={styles.receiptLabel}>COWORK RECEIPT</Text>

        {/* Title */}
        <Text style={styles.receiptTitle}>You locked in 🔒</Text>

        {/* Avatar stack + names */}
        <View style={styles.avatarRow}>
          {/* Partner avatar */}
          <View style={styles.avatarPartner}>
            <Text style={styles.avatarInitials}>{partnerInitials}</Text>
          </View>
          {/* Current user avatar — overlaps partner by 12pt */}
          <View style={styles.avatarMe}>
            <Text style={styles.avatarMeText}>Me</Text>
          </View>
          {/* Names */}
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
        {Array.from({ length: 16 }).map((_, i) => (
          <View key={i} style={styles.notch} />
        ))}
      </View>

      {/* ── WHITE BODY ── */}
      <View style={styles.body}>
        <Text style={styles.bodyLabel}>Total sessions</Text>
        <Text style={styles.bodyValue}>{totalSessions} 🔥</Text>
      </View>

    </View>
  );
}
```

---

### Step 4: Add the StyleSheet

Append at the bottom of the file after the component closing brace:

```tsx
const BANNER_BG = '#3F5443';
const CARD_BG = '#FFFFFF'; // matches theme.surface / colors.bgCard

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing[2],
    backgroundColor: CARD_BG,
  },

  // ── BANNER ──
  banner: {
    backgroundColor: BANNER_BG,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 12,
  },
  receiptLabel: {
    fontSize: 9,
    letterSpacing: 2,
    color: '#FFFFFF',
    opacity: 0.65,
    textTransform: 'uppercase',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '300',
    color: '#FFFFFF',
  },

  // Avatar stack
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPartner: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarNameSub: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.65,
  },

  // Sign buttons
  signRow: {
    flexDirection: 'row',
    gap: 8,
  },
  signBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signBtnTouch: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  signBtnTranslucent: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  signBtnSolid: {
    backgroundColor: '#FFFFFF',
  },
  signBtnPrimaryWhite: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signBtnSubWhite: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 2,
  },
  signBtnWaiting: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.45,
  },
  signBtnPrimaryForest: {
    fontSize: 14,
    fontWeight: '600',
    color: BANNER_BG,
  },
  signBtnSubForest: {
    fontSize: 11,
    color: BANNER_BG,
    opacity: 0.7,
    marginTop: 2,
  },

  // ── TORN EDGE ──
  tornEdge: {
    height: 10,
    backgroundColor: BANNER_BG,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  notch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: CARD_BG,
  },

  // ── BODY ──
  body: {
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  bodyLabel: {
    fontSize: 13,
    color: theme.textSecondary,
  },
  bodyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
```

---

### Step 5: Verify the file compiles with no TypeScript errors

```bash
cd /Users/chloe/Documents/Claude/cowork-connect
npx tsc --noEmit 2>&1 | grep -i "SessionReceiptCard\|error" | head -20
```

Expected: no errors mentioning `SessionReceiptCard`.

---

### Step 6: Commit

```bash
git add src/components/session/SessionReceiptCard.tsx
git commit -m "feat: add SessionReceiptCard component (receipt UI)"
```

---

## Task 2: Wire `SessionReceiptCard` into `SessionRequestCard`

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx`

---

### Step 1: Add `totalSessions` to `SessionRequestCardProps`

Find this block (lines 7–15):
```tsx
type SessionRequestCardProps = {
  session: SessionRecord;
  currentUserId: string;
  otherUserName?: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onCancel: () => void;
  onLockIn: () => void;
};
```

Replace with:
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

---

### Step 2: Add `totalSessions` to the destructured props

Find (line 40–48):
```tsx
export default function SessionRequestCard({
  session,
  currentUserId,
  otherUserName,
  onAccept,
  onDecline,
  onCancel,
  onLockIn,
}: SessionRequestCardProps) {
```

Replace with:
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
}: SessionRequestCardProps) {
```

---

### Step 3: Add the import for `SessionReceiptCard` at the top of the file

After the existing imports (after line 5), add:
```tsx
import SessionReceiptCard from './SessionReceiptCard';
```

---

### Step 4: Replace the `active` block in `renderActions()`

Find this block (lines 318–403):
```tsx
    if (session.status === 'active') {
      return (
        <View style={styles.activeContent}>
          ...
        </View>
      );
    }
```

Replace the entire `if (session.status === 'active')` block with:
```tsx
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
```

> **Note:** The receipt card renders its own outer `<View>` with full styling, so `renderActions()` returns it directly. The existing `<Animated.View style={styles.card}>` wrapper in the main `return` still wraps non-active states. But for the `active` status, `SessionRequestCard` renders the main `<Animated.View style={[styles.card, styles.activeCard, ...]}>` wrapper around `renderActions()`. This means the receipt card gets double-wrapped. To fix this cleanly, the `active` status should short-circuit and return `<SessionReceiptCard />` directly from the component, bypassing the outer card wrapper.

### Step 4b: Short-circuit for `active` status before the main `return`

Find the check for `cancelled` near line 439:
```tsx
  if (session.status === 'cancelled') {
    return null;
  }
```

Add a new short-circuit directly after it:
```tsx
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
```

Then revert Step 4 (the change inside `renderActions`) — it's no longer needed since we short-circuit before `renderActions()` is called.

---

### Step 5: Verify TypeScript

```bash
npx tsc --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: no errors.

---

### Step 6: Commit

```bash
git add src/components/session/SessionRequestCard.tsx
git commit -m "feat: render SessionReceiptCard for active sessions"
```

---

## Task 3: Pass `totalSessions` from `ChatScreen`

**Files:**
- Modify: `src/screens/matches/ChatScreen.tsx`

---

### Step 1: Add the `totalSessions` derived value

Find the line (around line 52):
```tsx
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
```

After the existing state declarations, add the derived count using `useMemo`. First confirm `useMemo` is already imported — check the top of the file for:
```tsx
import React, { ... useMemo ... } from 'react';
```

If `useMemo` is not in the import, add it. Then add this derived value near the other session-related logic (after the `sessions` state declaration is a good place):

```tsx
  const totalSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed').length,
    [sessions]
  );
```

---

### Step 2: Pass `totalSessions` to `SessionRequestCard`

Find (lines 494–502):
```tsx
                <SessionRequestCard
                  session={item.session}
                  currentUserId={user?.id ?? ''}
                  otherUserName={otherUser.name}
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
                />
```

---

### Step 3: Verify TypeScript

```bash
npx tsc --noEmit 2>&1 | grep -i "error" | head -20
```

Expected: no errors.

---

### Step 4: Commit

```bash
git add src/screens/matches/ChatScreen.tsx
git commit -m "feat: pass totalSessions count to SessionRequestCard"
```

---

## Task 4: Visual Verification

**No automated tests exist in this project — verify visually in the simulator.**

### Step 1: Start the dev server

```bash
cd /Users/chloe/Documents/Claude/cowork-connect
npm run ios
```

### Step 2: Navigate to an active session

Open the app → go to **Matches** tab → open a chat that has an accepted session (status = `active`).

### Step 3: Check the receipt layout

Confirm all of these visually:

| Element | Expected |
|---|---|
| Banner background | Dark forest green `#3F5443` |
| Label | `COWORK RECEIPT` — small, faded, uppercase |
| Title | `You locked in 🔒` — large, light weight |
| Partner avatar | White circle with forest-coloured initials |
| Me avatar | Translucent white circle, overlapping partner by ~12pt |
| Sign buttons | Two equal-width buttons side by side |
| Pending button | Solid white, forest text, visibly pulsing |
| Confirmed button | Translucent, white text |
| Torn edge | Row of scalloped notches between green and white |
| Footer | `Total sessions` label left, count + 🔥 bold right |

### Step 4: Test the tap-to-sign interaction

Tap the **"Tap to sign ✍️"** button:
- Pulse animation should stop
- Button should switch to `✓ Signed / You`
- If partner has also signed → session transitions to `completed` via Supabase

### Step 5: Final commit if any tweaks were made during verification

```bash
git add -p   # stage only intentional changes
git commit -m "fix: receipt card visual tweaks after verification"
```

---

## Summary of Commits

1. `feat: add SessionReceiptCard component (receipt UI)`
2. `feat: render SessionReceiptCard for active sessions`
3. `feat: pass totalSessions count to SessionRequestCard`
4. *(optional)* `fix: receipt card visual tweaks after verification`
