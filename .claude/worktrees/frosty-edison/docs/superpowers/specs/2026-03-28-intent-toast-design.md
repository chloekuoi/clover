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

`onIntentSet` callback becomes:
```typescript
onIntentSet={() => {
  setShowToast(true);
  closeSheet(() => loadDiscoveryData());
}}
```

The existing `closeSheet()` call from the backdrop tap continues to work unchanged since `onComplete` is optional.

### 2. Toast banner

**State:** Add `showToast: boolean` (default `false`) to `DiscoverScreen`.

**Component:** `ToastBanner` — a small inline component defined inside `DiscoverScreen.tsx`, receiving `visible: boolean` as its only prop.

**Appearance:**
- Background: `CLOVER_FOREST` (`#0c1f0e`) — use the constant already imported at line 15, do not use raw hex
- Text colour: `CLOVER_BG` (`#ede8ff`) — use the constant already imported at line 15
- Shape: pill (`borderRadius: 9999`), horizontally centred
- Text: `"Your focus for today is set ✦"`
- Font: `FONT_DM_SANS_MEDIUM`, size 13, letter spacing 0.3
- Padding: 10px vertical, 20px horizontal
- Shadow: `CLOVER_FOREST` shadow, opacity 0.25, radius 12

**Positioning:**
- `position: 'absolute'`, `zIndex: 99`, `pointerEvents: 'none'`
- `top: 72` (below the header area; header is ~60pt tall including its padding)
- `alignSelf: 'center'` — do not use left/right

**Animation:**
- `const toastOpacity = useRef(new Animated.Value(0)).current` — starts invisible
- Fade in: animate `toastOpacity` from `0` → `1` over 200ms
- Hold: inside the fade-in's `.start()` callback, start a `setTimeout` of 2500ms (so the hold begins only after the fade-in completes)
- Fade out: inside the `setTimeout` callback, animate `toastOpacity` from `1` → `0` over 300ms, then call `setShowToast(false)` in its `.start()` callback
- Total visible time: ~3 seconds (200ms in + 2500ms hold + 300ms out)
- Clean up the `setTimeout` ref on unmount

**Lifecycle:**
```typescript
useEffect(() => {
  if (!showToast) return;
  // fade in
  Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
    // hold then fade out
    const timer = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setShowToast(false);
      });
    }, 2500);
    return () => clearTimeout(timer); // cleanup
  });
}, [showToast]);
```

---

## Render placement

`<ToastBanner>` is rendered as an **absolute overlay on the root `SafeAreaView`** in every state branch (`discovering`, `empty`, `loading`, `error`). This is required because `loadDiscoveryData()` switches to the `loading` branch mid-transition — a per-branch approach would unmount the toast before it finishes. By placing it at the root level of every branch, it remains visible regardless of which state is active.

```tsx
// In every return branch:
<SafeAreaView style={styles.container} edges={['top']}>
  {/* ... existing content ... */}
  <ToastBanner visible={showToast} opacity={toastOpacity} />
</SafeAreaView>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/screens/discover/DiscoverScreen.tsx` | Add `showToast` state + `toastOpacity` ref, `ToastBanner` component, fix `closeSheet` signature, update `onIntentSet`, add `<ToastBanner>` to all render branches |

---

## Success Criteria

- Tapping "Save focus" slides the sheet fully off screen
- A forest-green pill toast appears reading *"Your focus for today is set ✦"* and fades out after ~3 seconds
- Discovery cards refresh after the sheet closes
- Tapping the backdrop to dismiss still works (no regression)
- Toast does not block swipes or taps (`pointerEvents="none"`)
