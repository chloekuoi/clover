# Invite Card — CloverMark Icon with Spin Animation

**Date:** 2026-04-07
**Status:** Approved
**Scope:** `SessionRequestCard`, `GroupSessionRSVPCard`

---

## Problem

Both session invite cards use a ☕️ emoji in the icon box. The app is moving away from emojis in favour of the Clover design system.

---

## Solution

Replace the emoji with the existing `CloverMark` component. Add a slow continuous rotation animation while the invite/session is pending, using `Animated.Value` with a `rotate` transform on a wrapping `Animated.View`. Animation stops once the status changes.

---

## Design

### Icon

- Component: `CloverMark` (existing, `src/components/common/CloverMark.tsx`)
- Size: `26` pt
- Petal colour: `CLOVER_FOREST` (`#1e3d28`) — matches app logo on all other screens
- Center cutout `bg`: `colors.statusPendingBg` (`#F5EEFF`) — matches icon box background so the hole is invisible

### Spin Animation

- Duration: **8000ms** per full rotation
- Easing: `Easing.linear` (constant speed, no ease-in/out)
- Loop: `Animated.loop` wrapping a single `Animated.timing` from `0 → 1`
- **`useNativeDriver: false`** — required; the `Animated.View` wraps a react-native-svg view which is not guaranteed to be native-driver compatible across all RN/SVG version combinations. The 8s rotation is not performance-sensitive so JS-thread animation is fine here.
- Interpolation: `inputRange: [0, 1]` → `outputRange: ['0deg', '360deg']`

### Wrapper pattern

```tsx
<Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
  <CloverMark size={26} color={CLOVER_FOREST} bg={colors.statusPendingBg} />
</Animated.View>
```

---

## Files Changed

### `src/components/session/SessionRequestCard.tsx`

**New imports to add** (at the top of the file):
```tsx
import { CLOVER_FOREST } from '../../constants/clover';
import CloverMark from '../common/CloverMark';
```
Note: `Animated`, `Easing`, `useRef`, `useEffect` are already imported — do not duplicate them.

**New hooks** — place immediately after the existing `statusDotPulse` ref declaration and its `useEffect`, and **before** the `// IMPORTANT: All hooks … must appear ABOVE this line` guard comment at line ~145. Violating Rules of Hooks here will cause a crash.

```tsx
const spinAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (session.status !== 'pending') {
    spinAnim.stopAnimation();
    spinAnim.setValue(0); // reset so next pending cycle starts from 0deg
    return;
  }
  const loop = Animated.loop(
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 8000,
      easing: Easing.linear,
      useNativeDriver: false,
    })
  );
  loop.start();
  return () => loop.stop();
}, [session.status, spinAnim]);

const spinRotation = spinAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});
```

**Replace both emoji instances** — there are two separate early-return branches that each render the icon box:
- Initiator view (line ~170): `<Text style={styles.pendingIcon}>☕️</Text>`
- Invitee view (line ~202): `<Text style={styles.pendingIcon}>☕️</Text>`

In both places, replace with:
```tsx
<Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
  <CloverMark size={26} color={CLOVER_FOREST} bg={colors.statusPendingBg} />
</Animated.View>
```

**Remove** the `pendingIcon` style entry from `StyleSheet.create` — it is no longer used.

---

### `src/components/session/GroupSessionRSVPCard.tsx`

**New imports to add**:
```tsx
import { Animated, Easing } from 'react-native';  // add Animated + Easing to existing RN import
import { useRef, useEffect } from 'react';          // add to existing React import
import { CLOVER_FOREST } from '../../constants/clover';
import CloverMark from '../common/CloverMark';
```

**New hooks** — insert immediately after the existing `const [isChanging, setIsChanging] = useState(false);` line and before the `if (!isGroupSessionVisible(session)) return null;` guard:

```tsx
const spinAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  // isGroupSessionVisible only returns true when status === 'proposed',
  // so the spin runs for the entire visible lifetime of this card.
  const loop = Animated.loop(
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 8000,
      easing: Easing.linear,
      useNativeDriver: false,
    })
  );
  loop.start();
  return () => loop.stop();
}, [spinAnim]);

const spinRotation = spinAnim.interpolate({
  inputRange: [0, 1],
  outputRange: ['0deg', '360deg'],
});
```

**Replace emoji instance** (line ~73):
```tsx
// Before:
<Text style={styles.iconEmoji}>☕️</Text>

// After:
<Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
  <CloverMark size={26} color={CLOVER_FOREST} bg={colors.statusPendingBg} />
</Animated.View>
```

**Remove** the `iconEmoji` style entry from `StyleSheet.create`.

---

## Constraints

- No layout changes — icon box dimensions (44×44, borderRadius 11, bg `colors.statusPendingBg`) unchanged
- No new dependencies — `CloverMark` and `react-native-svg` are already in the project
- `useNativeDriver: false` — do not change to `true`
- All new hooks must be placed before any early-return guards (Rules of Hooks)
- No changes to any other emoji in the codebase (e.g. "☕️ Count me in" button text is out of scope)

---

## Non-Goals

- No changes to the "☕️ Count me in" button text in `GroupSessionRSVPCard`
- No changes to any other emoji in the codebase
- No new animation for non-pending states
