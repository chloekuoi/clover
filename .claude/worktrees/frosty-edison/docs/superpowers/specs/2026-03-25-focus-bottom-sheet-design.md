# Focus Bottom Sheet — Design Spec

**Date:** 2026-03-25
**Status:** Approved by user
**Scope:** Fix FAB placement conflict with swipe buttons; replace full-screen modal with bottom sheet that keeps the tab bar visible.

---

## Problem

1. The pencil FAB (`position: 'absolute', bottom: 96, right: 20`) visually collides with the SwipeButtons (✕ / ✓ circles) rendered by `CardStack`, making the UI appear cluttered.
2. The current `<Modal animationType="slide">` opens IntentScreen as a full-screen overlay, hiding the discover card and tab bar, which feels heavy for an optional focus update.

---

## Solution

### 1. Replace FAB with a Header Pill

Remove the absolute FAB (`TouchableOpacity` + `fab`/`fabIcon` styles) entirely. In its place, add a small pill button on the right side of the `Discover` header row.

**Layout:**
```
[Discover]                     [✎ Focus]
```

The header `View` style should be updated to include `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-between'` (keep existing padding values):
```typescript
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing[5],
  paddingTop: spacing[2],
  paddingBottom: spacing[4],
}
```

Right side: `TouchableOpacity` pill
- Label: `"✎ Focus"`
- `backgroundColor: CLOVER_FOREST`, `borderRadius: 100`
- `paddingHorizontal: spacing[3]`, `paddingVertical: 6`
- Font: size 13, `fontWeight: '600'`, `color: CLOVER_BG`
- `activeOpacity: 0.8`

**The pill must appear in both `discovering` and `empty` states.** Extract a `renderHeader()` helper to avoid duplicating JSX:

```tsx
const renderHeader = () => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>Discover</Text>
    <TouchableOpacity
      style={styles.focusPill}
      onPress={openSheet}
      activeOpacity={0.8}
    >
      <Text style={styles.focusPillText}>✎ Focus</Text>
    </TouchableOpacity>
  </View>
);
```

Replace the existing `<View style={styles.header}>...</View>` block in the `discovering` return with `{renderHeader()}`. Also replace the same block in the `empty` state early return.

The pill is **not** shown in `loading` or `error` states.

---

### 2. Bottom Sheet (in-screen, no Modal)

Remove the `<Modal>` import usage from DiscoverScreen and replace with an in-screen animated bottom sheet. Because the sheet lives inside the tab navigator's screen (not a system Modal), the tab bar remains visible beneath it.

#### 2a. New state, ref, and constants

Add `useRef` to the React import (currently only `useState`, `useEffect`, `useCallback` are imported):
```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
```

Place the following module-level constant **directly below the import block, before the component function and before the `StyleSheet.create` call** (so `SHEET_HEIGHT` is defined before it is referenced in the styles):
```typescript
const SHEET_HEIGHT = Dimensions.get('window').height * 0.82;
```

Inside the component, add:
```typescript
const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
```

Define two helpers inside the component:
```typescript
const openSheet = () => {
  setIsFocusModalVisible(true);
  Animated.spring(sheetAnim, {
    toValue: 0,
    damping: 25,
    stiffness: 300,
    useNativeDriver: true,
  }).start();
};

const closeSheet = () => {
  Animated.timing(sheetAnim, {
    toValue: SHEET_HEIGHT,
    duration: 220,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  }).start(() => setIsFocusModalVisible(false));
};
```

`openSheet` is called from the header pill's `onPress`.
`closeSheet` is called from: overlay tap, and `onIntentSet` callback (after save).

#### 2b. Sheet JSX — `renderFocusSheet()` helper

Extract the overlay + sheet into a `renderFocusSheet()` helper so it can be reused in both the `discovering` and `empty` returns:

```tsx
const renderFocusSheet = () => {
  if (!isFocusModalVisible) return null;
  return (
    <>
      <TouchableOpacity
        style={styles.sheetOverlay}
        activeOpacity={1}
        onPress={closeSheet}
      />
      <Animated.View
        style={[styles.sheetContainer, { transform: [{ translateY: sheetAnim }] }]}
      >
        <View style={styles.sheetHandle} />
        <Text style={styles.sheetSubtitle}>Set availability to connect</Text>
        <View style={{ flex: 1 }}>
          <IntentScreen
            latitude={latitude ?? 0}
            longitude={longitude ?? 0}
            onIntentSet={() => {
              closeSheet();
              loadDiscoveryData();
            }}
            isBottomSheet
          />
        </View>
      </Animated.View>
    </>
  );
};
```

The `<View style={{ flex: 1 }}>` wrapper around `<IntentScreen>` ensures the form fills the remaining height of the fixed-size sheet after the handle and subtitle consume their space.

Call `{renderFocusSheet()}` in both the `discovering` final return and the `empty` state early return, placed **after** `{renderMatchModal()}` and **outside** the `{!matchModal.visible && (...)}` guard.

In the `empty` state, the correct structure is:
```tsx
<SafeAreaView style={styles.container} edges={['top']}>
  {!matchModal.visible && (
    <>
      {renderHeader()}
      <View style={styles.centerContent}>...</View>
    </>
  )}
  {renderMatchModal()}
  {renderFocusSheet()}   {/* outside the !matchModal.visible guard */}
</SafeAreaView>
```

This ensures the sheet can be opened and dismissed even if a match fires while it is open.

#### 2c. Updated imports for DiscoverScreen.tsx

Update the `react-native` import line — **add** `Animated`, `Easing`, `Dimensions`; **remove** `Modal`:
```typescript
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
```

---

### 3. IntentScreen `isBottomSheet` prop

#### 3a. Type and signature

Add `isBottomSheet?: boolean` to `IntentScreenProps`:
```typescript
type IntentScreenProps = {
  latitude: number;
  longitude: number;
  onIntentSet: () => void;
  locationLoading?: boolean;
  locationError?: string | null;
  onRequestLocation?: () => void;
  isBottomSheet?: boolean;   // ← add
};
```

Add to the destructured function parameters with a default:
```typescript
export default function IntentScreen({
  latitude,
  longitude,
  onIntentSet,
  locationLoading = false,
  locationError = null,
  onRequestLocation,
  isBottomSheet = false,   // ← add
}: IntentScreenProps) {
```

#### 3b. SafeAreaView → View on all three render paths

When `isBottomSheet === true`, replace `<SafeAreaView style={styles.container} edges={['top']}>` with `<View style={styles.container}>` (and update the matching closing tag). This applies to all three render paths:

1. The `locationLoading || initialLoading` early return (currently line ~179)
2. The `locationError` early return (currently line ~190)
3. The main form return (currently line ~207)

Pattern for each:
```tsx
// replace:
<SafeAreaView style={styles.container} edges={['top']}>
  ...
</SafeAreaView>

// with:
{isBottomSheet ? (
  <View style={styles.container}>...</View>
) : (
  <SafeAreaView style={styles.container} edges={['top']}>...</SafeAreaView>
)}
```

Or equivalently, use a variable:
```tsx
const Wrapper = isBottomSheet ? View : SafeAreaView;
// then render: <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] })}>
```

Either approach is acceptable as long as `edges={['top']}` is only passed when using `SafeAreaView`.

#### 3c. Suppress the subtitle inside IntentScreen when shown in sheet

IntentScreen's `ScrollView` content (line ~217) renders:
```tsx
<Text style={styles.subtitle}>Set availability to connect</Text>
```

The sheet wrapper in DiscoverScreen already renders this same text as `sheetSubtitle`. To prevent it appearing twice, conditionally hide it when `isBottomSheet === true`:
```tsx
{!isBottomSheet && (
  <Text style={styles.subtitle}>Set availability to connect</Text>
)}
```

#### 3d. KeyboardAvoidingView behavior

When `isBottomSheet === true`, use `'padding'` on both platforms to prevent Android from trying to shrink the fixed-height sheet:
```tsx
<KeyboardAvoidingView
  behavior={isBottomSheet ? 'padding' : (Platform.OS === 'ios' ? 'padding' : 'height')}
  style={styles.flex}
>
```

#### 3e. TimePickerModal (no change needed)

IntentScreen contains a `TimePickerModal` sub-component at the bottom of the file that uses its own React Native `<Modal>`. This is intentionally untouched. When the time picker is opened inside the bottom sheet, the `TimePickerModal` renders as a system modal above the sheet, which is correct behavior on both platforms.

---

### 4. Files changed

| File | Change |
|------|--------|
| `src/screens/discover/DiscoverScreen.tsx` | Remove FAB + Modal import; add header pill via `renderHeader()`; add animated sheet via `renderFocusSheet()`; update imports |
| `src/screens/discover/IntentScreen.tsx` | Add `isBottomSheet` prop; conditional SafeAreaView/View on all 3 paths; hide subtitle when `isBottomSheet`; `KeyboardAvoidingView` behavior override |

---

### 5. Styles to add / remove

**DiscoverScreen — remove:**
- `fab`, `fabIcon` styles

**DiscoverScreen — update:**
- `header` → add `flexDirection: 'row'`, `alignItems: 'center'`, `justifyContent: 'space-between'` (keep existing padding)

**DiscoverScreen — add:**
```typescript
focusPill: {
  backgroundColor: CLOVER_FOREST,
  borderRadius: 100,
  paddingHorizontal: spacing[3],
  paddingVertical: 6,
},
focusPillText: {
  color: CLOVER_BG,
  fontSize: 13,
  fontWeight: '600',
},
sheetOverlay: {
  ...StyleSheet.absoluteFillObject,
  backgroundColor: 'rgba(0,0,0,0.45)',
  zIndex: 10,
  elevation: 10,
},
sheetContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: SHEET_HEIGHT,
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  backgroundColor: theme.background,
  zIndex: 11,
  elevation: 11,
  overflow: 'hidden',   // clips children to rounded corners; verify the spinning star in IntentScreen's title row is not clipped at the top edge
},
sheetHandle: {
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: 'rgba(0,0,0,0.12)',
  alignSelf: 'center',
  marginTop: 10,
  marginBottom: 4,
},
sheetSubtitle: {
  fontSize: 12,
  color: theme.textMuted,   // matches IntentScreen's original subtitle style
  textAlign: 'center',
  marginBottom: 4,
},
```

**IntentScreen — no style changes needed.**

---

## What is NOT changing

- IntentScreen form logic, validation, submission — untouched
- IntentScreen's `TimePickerModal` and its `Modal` import — untouched
- DiscoverScreen's state machine (`loading`, `error`, `discovering`, `empty`) — untouched
- SwipeButtons, CardStack — untouched
- Auto-create default intent logic — untouched

---

## Acceptance criteria

- [ ] Header shows "Discover" left-aligned and "✎ Focus" pill right-aligned in both `discovering` and `empty` states
- [ ] Tapping pill opens sheet with spring animation; tab bar remains visible beneath
- [ ] Sheet shows drag handle, "Set availability to connect" subtitle (once, from sheet wrapper), IntentScreen form content
- [ ] IntentScreen form is fully usable inside the sheet (scrollable, keyboard avoidance works on both platforms)
- [ ] Tapping the dim overlay dismisses the sheet with easing animation
- [ ] "Save focus" inside the sheet saves, dismisses the sheet, then reloads cards
- [ ] No visual conflict between any button and the header pill
- [ ] `npx tsc --noEmit` → 0 errors
