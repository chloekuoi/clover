# Invite Card — CloverMark Spin Icon Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ☕️ emoji icon in both session invite cards with the existing CloverMark SVG component, spinning slowly while the invite is pending.

**Architecture:** Two isolated component edits — no new files, no new dependencies. Each component gets a new `Animated.Value` spin loop (8s, linear, `useNativeDriver: false`) placed before its early-return guards. The emoji `<Text>` is swapped for `<Animated.View>` + `<CloverMark>`.

**Tech Stack:** React Native `Animated` API, `react-native-svg` (via existing `CloverMark`), jest-expo + RNTL for tests.

**Spec:** `docs/superpowers/specs/2026-04-07-invite-card-clover-icon-design.md`

---

## Chunk 1: SessionRequestCard

### Task 1: Add imports to SessionRequestCard

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx` (top of file)

- [ ] **Step 1: Add the two new import lines** immediately after the existing imports (line ~6), before any other code:

```tsx
import { CLOVER_FOREST } from '../../constants/clover';
import CloverMark from '../common/CloverMark';
```

Note: `Animated`, `Easing`, `useRef`, `useEffect` are already imported on lines 1–2 — do not add duplicates.

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

Expected: 0 errors.

---

### Task 2: Add spin animation hooks to SessionRequestCard

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx` (~line 93–111)

Insert the new hooks after the two `useState` calls at lines 143–144 (`showProposeInput` and `proposeText`) and **before** the `// IMPORTANT: All hooks … must appear ABOVE this line` guard comment at line ~145. Do NOT insert after `dotAnimatedStyle` (line ~111) — there is a `renderDescription` function definition between them that is not a valid hook placement.

- [ ] **Step 1: Insert spinAnim ref, useEffect, and interpolation** after `const [proposeText, setProposeText] = useState('');` (line ~144) and before the guard comment:

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
      useNativeDriver: false, // required: react-native-svg views are not native-driver compatible
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

- [ ] **Step 2: Verify TypeScript still compiles**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit hooks-only change**

```bash
cd /Users/chloe/Documents/Claude/Clover
git add src/components/session/SessionRequestCard.tsx
git commit -m "feat(session): add spin animation hooks to SessionRequestCard"
```

---

### Task 3: Replace emoji in SessionRequestCard — initiator view

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx` (~line 170)

The initiator early-return branch (starts at line ~166) renders:
```tsx
<View style={styles.pendingIconBox}>
  <Text style={styles.pendingIcon}>☕️</Text>
</View>
```

- [ ] **Step 1: Replace `<Text style={styles.pendingIcon}>☕️</Text>` with the animated wrapper:**

```tsx
<View style={styles.pendingIconBox}>
  <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
    <CloverMark size={26} color={CLOVER_FOREST} bg={colors.statusPendingBg} />
  </Animated.View>
</View>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

Expected: 0 errors.

---

### Task 4: Replace emoji in SessionRequestCard — invitee view

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx` (~line 202)

The invitee early-return branch (starts at line ~188) has the same icon box pattern:
```tsx
<View style={styles.pendingIconBox}>
  <Text style={styles.pendingIcon}>☕️</Text>
</View>
```

- [ ] **Step 1: Replace with the same animated wrapper:**

```tsx
<View style={styles.pendingIconBox}>
  <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
    <CloverMark size={26} color={CLOVER_FOREST} bg={colors.statusPendingBg} />
  </Animated.View>
</View>
```

- [ ] **Step 2: Remove the now-unused `pendingIcon` style** from `StyleSheet.create` at the bottom of the file:

```tsx
// DELETE this entire entry:
pendingIcon: {
  fontSize: 22,
  color: colors.statusPendingText,
},
```

- [ ] **Step 3: Verify TypeScript compiles with 0 errors**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
cd /Users/chloe/Documents/Claude/Clover
git add src/components/session/SessionRequestCard.tsx
git commit -m "feat(session): replace coffee emoji with spinning CloverMark in SessionRequestCard"
```

---

## Chunk 2: GroupSessionRSVPCard

### Task 5: Add imports to GroupSessionRSVPCard

**Files:**
- Modify: `src/components/session/GroupSessionRSVPCard.tsx` (line 1–5)

Current imports:
```tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
```

- [ ] **Step 1: Extend existing React and RN imports, add two new lines:**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { CLOVER_FOREST } from '../../constants/clover';
import CloverMark from '../common/CloverMark';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

Expected: 0 errors.

---

### Task 6: Add spin animation hooks to GroupSessionRSVPCard

**Files:**
- Modify: `src/components/session/GroupSessionRSVPCard.tsx` (~line 40–44)

Current hook block:
```tsx
const [isChanging, setIsChanging] = useState(false);

if (!isGroupSessionVisible(session)) {
  return null;
}
```

- [ ] **Step 1: Insert spinAnim hooks immediately after `useState(false)` and before the `return null` guard.**

Only insert the NEW code shown below. The `if (!isGroupSessionVisible(session)) { return null; }` guard is already present in the file — do NOT add it again.

Insert between the `useState` line and the guard:

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
      useNativeDriver: false, // required: react-native-svg views are not native-driver compatible
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

Expected: 0 errors.

---

### Task 7: Replace emoji and remove unused style in GroupSessionRSVPCard

**Files:**
- Modify: `src/components/session/GroupSessionRSVPCard.tsx` (~line 73, styles)

- [ ] **Step 1: Replace the emoji `<Text>` in the icon box** (~line 73):

```tsx
// Before:
<View style={styles.iconBox} testID="group-session-icon-box">
  <Text style={styles.iconEmoji}>☕️</Text>
</View>

// After:
<View style={styles.iconBox} testID="group-session-icon-box">
  <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
    <CloverMark size={26} color={CLOVER_FOREST} bg={colors.statusPendingBg} />
  </Animated.View>
</View>
```

- [ ] **Step 2: Remove the now-unused `iconEmoji` style** from `StyleSheet.create`:

```tsx
// DELETE this entire entry (search for "iconEmoji" in the styles block):
iconEmoji: {
  fontSize: 21,
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/chloe/Documents/Claude/Clover && npx tsc --noEmit
```

Expected: 0 errors.

---

### Task 8: Run existing tests and commit

**Files:**
- Test: `src/components/session/__tests__/GroupSessionRSVPCard.test.tsx` (no changes needed — tests reference button text `'☕️ Count me in'` which is unchanged, not the icon emoji)

- [ ] **Step 1: Run the existing test suite**

```bash
cd /Users/chloe/Documents/Claude/Clover && npm test -- --testPathPattern="GroupSessionRSVPCard" --watchAll=false
```

Expected: All tests pass. The `'☕️ Count me in'` button text is unchanged and all `getByText` queries will resolve correctly.

- [ ] **Step 2: Run full test suite to confirm no regressions**

```bash
cd /Users/chloe/Documents/Claude/Clover && npm test -- --watchAll=false
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
cd /Users/chloe/Documents/Claude/Clover
git add src/components/session/GroupSessionRSVPCard.tsx
git commit -m "feat(session): replace coffee emoji with spinning CloverMark in GroupSessionRSVPCard"
```
