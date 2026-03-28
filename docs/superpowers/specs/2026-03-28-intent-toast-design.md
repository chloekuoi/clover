# Intent Save — Toast Confirmation & Sheet Dismiss Fix

**Date:** 2026-03-28
**Status:** Approved
**File affected:** `src/screens/discover/DiscoverScreen.tsx` only

---

## Problem

When the user taps "Save focus" on the IntentScreen bottom sheet:

1. `onIntentSet()` fires `closeSheet()` and `loadDiscoveryData()` simultaneously.
2. `loadDiscoveryData()` immediately calls `setState('loading')`, which switches the render branch to a layout that does not include `renderFocusSheet()`.
3. The sheet's `Animated.View` is unmounted before the 220ms slide-down animation completes — the sheet freezes in place rather than sliding away.

---

## Solution

### 1. Fix `closeSheet` timing

Add an optional `onComplete` callback to `closeSheet`. Move `loadDiscoveryData()` into it so the state update only fires after the animation finishes:

```typescript
const closeSheet = (onComplete?: () => void) => {
  Animated.timing(sheetAnim, {
    toValue: SHEET_HEIGHT,
    duration: 220,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  }).start(() => {
    setIsFocusModalVisible(false);
    onComplete?.();
  });
};
```

`onIntentSet` becomes:
```typescript
onIntentSet={() => {
  setShowToast(true);
  closeSheet(() => loadDiscoveryData());
}}
```

The existing `closeSheet()` call (from the backdrop tap) continues to work unchanged since `onComplete` is optional.

### 2. Toast banner

**State:** `showToast: boolean` (default `false`) added to `DiscoverScreen`.

**Component:** `ToastBanner` — a small self-contained component inside `DiscoverScreen.tsx`.

**Appearance:**
- Forest green pill (`#0c1f0e` background, `#ede8ff` text)
- Text: *"Your focus for today is set ✦"*
- Horizontally centred, positioned below the header with `position: 'absolute'`, `zIndex: 99`
- `pointerEvents="none"` — never blocks swipes or taps

**Animation sequence (total ~3s):**
- Fade in: 200ms
- Hold: 2500ms (via `setTimeout`)
- Fade out: 300ms → `setShowToast(false)`

**Lifecycle:** `useEffect` watches `showToast`. When it becomes `true`, starts the fade-in, schedules fade-out via `setTimeout(2500)`. Cleans up timeout on unmount.

---

## Render placement

The `<ToastBanner>` renders inside each state branch that includes `renderFocusSheet()` (`discovering` and `empty`), placed after the header and before the card stack — or as an absolutely positioned overlay on the SafeAreaView so it appears regardless of which branch is active during the transition.

---

## Files Changed

| File | Change |
|------|--------|
| `src/screens/discover/DiscoverScreen.tsx` | Add `showToast` state, `ToastBanner` component, fix `closeSheet` signature, update `onIntentSet` |

---

## Success Criteria

- Tapping "Save focus" slides the sheet fully off screen
- A green pill toast appears on the Discover screen reading *"Your focus for today is set ✦"*
- Toast fades out after ~3 seconds
- Discovery cards refresh after sheet closes
- Tapping the backdrop to dismiss still works (no regression)
