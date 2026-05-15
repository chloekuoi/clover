# Intent Toast — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the "Save focus" button so the IntentScreen sheet slides fully off-screen before cards refresh, and show a 3-second toast reading "Your focus for today is set ✦".

**Architecture:** All changes are contained in `DiscoverScreen.tsx`. `closeSheet` gains an optional `onComplete` callback so `loadDiscoveryData()` can be sequenced after the 220ms slide-down animation completes. A `ToastBanner` component (inline, not a separate file) is rendered as an absolute overlay in every state branch so it survives the `loading` → `discovering` state transition that happens mid-animation.

**Tech Stack:** React Native `Animated` API, `useRef`, `useEffect`, `useState` — all already imported in `DiscoverScreen.tsx`.

**Spec:** `docs/superpowers/specs/2026-03-28-intent-toast-design.md`

---

## Chunk 1: All changes to DiscoverScreen.tsx

### Task 1: Extend the clover import

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx:15`

Current line 15:
```typescript
import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';
```

- [ ] **Step 1.1: Add `FONT_DM_SANS_MEDIUM` to the clover import**

```typescript
import { CLOVER_FOREST, CLOVER_BG, FONT_DM_SANS_MEDIUM } from '../../constants/clover';
```

No test needed — TypeScript will catch a missing export at compile time.

---

### Task 2: Add the `ToastBanner` component

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx` (insert before `export default function DiscoverScreen`)

The component is defined inline — not extracted to a separate file — because it uses types local to this module and is small enough to stay here.

- [ ] **Step 2.1: Insert `ToastBanner` immediately before the `export default function DiscoverScreen()` line (line 35)**

```typescript
// ── Toast banner ──────────────────────────────────────────────────────────────

interface ToastBannerProps {
  visible: boolean;
  opacity: Animated.Value;
}

function ToastBanner({ visible, opacity }: ToastBannerProps) {
  if (!visible) return null;
  return (
    <Animated.View style={[styles.toastBanner, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>Your focus for today is set ✦</Text>
    </Animated.View>
  );
}
```

---

### Task 3: Add state and refs inside DiscoverScreen

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx` (inside `DiscoverScreen` function, after existing state declarations)

Current state block ends around line 52 (`matchModal` state). The `sheetAnim` ref is on line 53.

- [ ] **Step 3.1: Add `showToast` state, `toastOpacity` animated ref, and `timerRef` after the `sheetAnim` ref (after line 53)**

```typescript
const [showToast, setShowToast] = useState(false);
const toastOpacity = useRef(new Animated.Value(0)).current;
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

---

### Task 4: Add the toast animation effect

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx` (after the `sheetAnim` ref block, before `openSheet`)

- [ ] **Step 4.1: Insert the `useEffect` that drives the fade-in → hold → fade-out sequence after line 53 (the `sheetAnim` ref line)**

```typescript
// Toast animation: fade in → hold → fade out
useEffect(() => {
  if (!showToast) return;
  toastOpacity.setValue(0); // reset in case of rapid re-trigger
  Animated.timing(toastOpacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start(() => {
    timerRef.current = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowToast(false));
    }, 2500);
  });
  return () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
}, [showToast]);
```

> **Why the cleanup works here:** The `return` cleanup function runs when `showToast` changes (i.e. when the component triggers a new effect cycle) or when the component unmounts. The timer ref is set synchronously inside the `.start()` callback, so cleanup will find it if it has been set by the time the effect re-runs.

---

### Task 5: Fix `closeSheet` and update `onIntentSet`

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx:66-73` (`closeSheet`) and `src/screens/discover/DiscoverScreen.tsx:196-202` (`onIntentSet`)

Current `closeSheet` (lines 66–73):
```typescript
const closeSheet = () => {
  Animated.timing(sheetAnim, {
    toValue: SHEET_HEIGHT,
    duration: 220,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  }).start(() => setIsFocusModalVisible(false));
};
```

Current `onIntentSet` (lines 198–201):
```typescript
onIntentSet={() => {
  closeSheet();
  loadDiscoveryData();
}}
```

- [ ] **Step 5.1: Replace `closeSheet` with the version that accepts an optional callback**

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

- [ ] **Step 5.2: Update `onIntentSet` to show the toast and sequence close → reload**

```typescript
onIntentSet={() => {
  setShowToast(true);
  closeSheet(() => loadDiscoveryData());
}}
```

> **Backdrop tap** still calls `closeSheet()` without arguments — it continues to work unchanged because `onComplete` is optional.

---

### Task 6: Add `<ToastBanner>` to every render branch

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx` — four return statements (loading, error, empty, discovering)

The toast must appear in **all** branches because `loadDiscoveryData()` immediately switches to the `loading` branch after `closeSheet` completes — if only `discovering` had the toast, it would unmount before finishing.

- [ ] **Step 6.1: Add `<ToastBanner>` to the `loading` branch (currently lines 210–220)**

```tsx
if (state === 'loading') {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Finding co-workers nearby...</Text>
      </View>
      {renderMatchModal()}
      <ToastBanner visible={showToast} opacity={toastOpacity} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 6.2: Add `<ToastBanner>` to the `error` branch (currently lines 222–236)**

```tsx
if (state === 'error') {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.centeredMessage}>
        <Text style={styles.errorTitle}>Location Required</Text>
        <Text style={styles.errorText}>
          Clover needs your location to find co-workers nearby.
        </Text>
        <TouchableOpacity style={styles.errorButton} onPress={refreshLocation}>
          <Text style={styles.errorButtonText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
      <ToastBanner visible={showToast} opacity={toastOpacity} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 6.3: Add `<ToastBanner>` to the `empty` branch (currently lines 238–256)**

```tsx
if (state === 'empty') {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!matchModal.visible && (
        <>
          {renderHeader()}
          <View style={styles.centerContent}>
            <Text style={styles.emptyTitle}>No one nearby right now</Text>
            <Text style={styles.emptyText}>
              Check back later or expand your search radius
            </Text>
          </View>
        </>
      )}
      {renderMatchModal()}
      {renderFocusSheet()}
      <ToastBanner visible={showToast} opacity={toastOpacity} />
    </SafeAreaView>
  );
}
```

- [ ] **Step 6.4: Add `<ToastBanner>` to the `discovering` branch (currently lines 258–266)**

```tsx
// State: discovering
return (
  <SafeAreaView style={styles.container} edges={['top']}>
    {renderHeader()}
    <CardStack cards={cards} onSwipe={handleSwipe} onEmpty={handleEmpty} />
    {renderMatchModal()}
    {renderFocusSheet()}
    <ToastBanner visible={showToast} opacity={toastOpacity} />
  </SafeAreaView>
);
```

---

### Task 7: Add toast styles

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx` — `StyleSheet.create({...})` block (starting at line 269)

- [ ] **Step 7.1: Append `toastBanner` and `toastText` entries to the `StyleSheet.create` object**

```typescript
toastBanner: {
  position: 'absolute',
  top: 72,
  alignSelf: 'center',
  zIndex: 99,
  backgroundColor: CLOVER_FOREST,
  borderRadius: 9999,
  paddingVertical: 10,
  paddingHorizontal: 20,
  shadowColor: CLOVER_FOREST,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
},
toastText: {
  fontFamily: FONT_DM_SANS_MEDIUM,
  fontSize: 13,
  letterSpacing: 0.3,
  color: CLOVER_BG,
},
```

---

### Task 8: Verify and commit

- [ ] **Step 8.1: Start the dev server and open the iOS simulator**

```bash
npm run ios
```

- [ ] **Step 8.2: Verify all five success criteria from the spec**

1. **Sheet slides fully off screen** — tap "✎ Focus", fill in intent, tap "Save focus". The sheet should slide smoothly down and disappear (no freeze).
2. **Toast appears** — a forest-green pill reading "Your focus for today is set ✦" fades in just below the header.
3. **Toast fades out** — after ~3 seconds the pill fades away automatically.
4. **Cards refresh** — after the sheet closes, discovery cards reload (loading spinner may flash briefly).
5. **Backdrop tap still works** — open the sheet, tap the backdrop. Sheet slides away with no regression.
6. **Toast does not block interaction** — swipe cards while toast is visible; swipes should register normally.

- [ ] **Step 8.3: Commit**

```bash
git add src/screens/discover/DiscoverScreen.tsx
git commit -m "feat: fix closeSheet timing and add intent-set toast

- closeSheet() accepts optional onComplete callback; loadDiscoveryData()
  is now called after the 220ms slide animation completes, preventing
  the sheet from freezing mid-transition
- ToastBanner component fades in/holds/fades out over ~3 s whenever
  the user saves their focus intent
- Toast rendered at root level of every state branch so it survives
  the loading state switch that occurs immediately after sheet close

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
