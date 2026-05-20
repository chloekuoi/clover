# Session Receipt Card — Design Doc
**Date:** 2026-02-28
**Status:** Approved
**Scope:** Replace the `active` state of `SessionRequestCard` with a new receipt-style UI

---

## Problem

The current `active` state (lock-pill row with a connecting line) is functional but not visually polished. The goal is a "Cowork Receipt" design: a green banner with avatar stack and sign buttons, a torn-edge separator, and a session count footer.

---

## Approach

**Approach B — Extract a new `SessionReceiptCard` component.**

The receipt design is visually distinct from all other session states (pending, declined, cancelled). It has its own layout, animations, and data needs. Keeping it in a separate file makes each component's job clear and reduces regression risk.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/session/SessionReceiptCard.tsx` | **New** — full receipt UI |
| `src/components/session/SessionRequestCard.tsx` | Render `<SessionReceiptCard />` when `status === 'active'` |
| `src/screens/matches/ChatScreen.tsx` | Derive `totalSessions` count from existing sessions state, pass as prop |

No database changes. No new queries.

---

## Props — `SessionReceiptCard`

```typescript
type SessionReceiptCardProps = {
  session: SessionRecord;         // has locked_by_initiator_at / locked_by_invitee_at
  currentUserId: string;          // to determine which side is "you"
  otherUserName?: string | null;  // partner's display name
  totalSessions: number;          // count of completed sessions for this match
  onLockIn: () => void;           // called when user taps "Tap to sign"
};
```

---

## Layout

```
┌─────────────────────────────────────────┐
│  #3F5443 green banner                   │
│                                         │
│  COWORK RECEIPT          ← 9px label    │
│  You locked in 🔒        ← 18px title   │
│                                         │
│  [CG] [Me]  Chloe guo   ← avatar stack │
│              You                        │
│                                         │
│  [✓ Signed ] [Tap to sign ✍️]           │
│  [Chloe guo] [You       ]               │
│                                         │
├ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ∿ ┤
│                                         │
│  Total sessions          3 🔥           │
│                                         │
└─────────────────────────────────────────┘
```

### 1. Green Banner (`#3F5443`)

- `borderTopLeftRadius` + `borderTopRightRadius`: `borderRadius.lg`
- `paddingHorizontal: 20`, `paddingTop: 18`, `paddingBottom: 20`

**Label row:**
- Text: `"COWORK RECEIPT"`
- Style: 9px, `letterSpacing: 2`, `opacity: 0.65`, white, uppercase

**Title:**
- Text: `"You locked in 🔒"`
- Style: 18px, `fontWeight: '300'`, white

**Avatar stack:**
- Partner circle (36pt): `backgroundColor: '#FFFFFF'`, border 1.5pt `#3F5443`, initials from `otherUserName` (e.g. "CG")
- User circle (36pt): `backgroundColor: 'rgba(255,255,255,0.25)'`, `marginLeft: -12` (overlap), text `"Me"`
- Names column (marginLeft: 10):
  - Partner name: white, 14px, `fontWeight: '600'`
  - "You": white, 12px, `opacity: 0.65`

**Sign row (two equal-width buttons, gap 8):**

| State | Left button (partner) | Right button (you) |
|---|---|---|
| Neither signed | `Waiting…` faded, translucent white bg | `Tap to sign ✍️` / `You`, solid white bg, **pulsing** |
| Partner signed only | `✓ Signed` / partner name, translucent white bg | `Tap to sign ✍️` / `You`, solid white bg, **pulsing** |
| You signed only | `Waiting…` faded, translucent white bg | `✓ Signed` / `You`, solid white bg, no pulse |
| Both signed | `✓ Signed` / partner name, translucent white bg | `✓ Signed` / `You`, solid white bg, no pulse |

Button styles:
- Confirmed (translucent): `backgroundColor: 'rgba(255,255,255,0.15)'`, `borderRadius: 12`, `paddingVertical: 10`
- Pending (solid): `backgroundColor: '#FFFFFF'`, `borderRadius: 12`, `paddingVertical: 10`
- Primary text: 14px, `fontWeight: '600'`
- Sub-label text: 11px, `opacity: 0.7`
- Confirmed text colour: white; Pending "Tap to sign" text colour: `#3F5443`

### 2. Torn Edge Separator

```tsx
<View style={styles.tornEdge}>
  {Array.from({ length: 16 }).map((_, i) => (
    <View key={i} style={styles.notch} />
  ))}
</View>
```

- `tornEdge`: `height: 10`, `backgroundColor: '#3F5443'`, `flexDirection: 'row'`, `justifyContent: 'space-around'`, `alignItems: 'flex-end'`, `overflow: 'hidden'`
- `notch`: `width: 10`, `height: 10`, `borderRadius: 5`, `backgroundColor: theme.surface` (card background — makes circles appear to "bite into" the green)

### 3. White Body

- `paddingHorizontal: 20`, `paddingVertical: 14`
- `borderBottomLeftRadius` + `borderBottomRightRadius`: `borderRadius.lg`
- Single row: `justifyContent: 'space-between'`
  - Left: `"Total sessions"` — `theme.textSecondary`, 13px
  - Right: `"{totalSessions} 🔥"` — `colors.textPrimary`, 14px, `fontWeight: '700'`

---

## Animation

**One animation: pending sign button opacity pulse**

```typescript
const signPulse = useRef(new Animated.Value(0.3)).current;

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
        useNativeDriver: true,   // opacity only — native driver safe
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

Applied to the **entire pending right button** as `<Animated.View style={{ opacity: signPulse }}>`. No JS-driver animations on the same node.

---

## `SessionRequestCard` Change

In `renderActions()`, replace the `active` block:

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

Add `totalSessions: number` to `SessionRequestCardProps`.

---

## `ChatScreen` Change

Derive count from the sessions array already in state:

```typescript
const totalSessions = useMemo(
  () => sessions.filter(s => s.status === 'completed').length,
  [sessions]
);
```

Pass `totalSessions={totalSessions}` to `<SessionRequestCard />`.

---

## Edge Cases

- `otherUserName` is null → show `"Partner"` as fallback for initials and name
- `totalSessions` is 0 → show `"0 🔥"` (first session in progress)
- Both locked → pulse stops, both buttons show `✓ Signed`; the card will transition to `completed` status shortly after via Supabase real-time update, at which point `SessionRequestCard` returns `null` for `active` (it already hides on `cancelled` — completed is handled by the chat flow showing a toast)

---

## Out of Scope

- The `pending`, `declined`, `cancelled` states in `SessionRequestCard` — unchanged
- The `InviteComposerCard` — unchanged
- Any database schema changes
