# Focus Screen Simplification + Always-On Discovery Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the IntentScreen UI (remove emoji from chips, clean time row, rename CTA) and make all users discoverable at all times via a silent default intent + FAB-accessible focus modal.

**Architecture:** IntentScreen becomes an optional update modal opened from a floating pencil button on the Discover tab. The needs_intent gate is removed from DiscoverScreen; a silent default intent is auto-created on first load each day. A new `getDefaultIntentTimes()` utility in `discoveryService.ts` provides default time values for both auto-create and IntentScreen initialization.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, Supabase via `@supabase/supabase-js`, react-native-safe-area-context

**Spec:** `docs/superpowers/specs/2026-03-25-focus-screen-simplification-design.md`

---

## Chunk 1: IntentScreen Visual Refresh

### Task 1: Remove emoji from chips

**Files:**
- Modify: `src/screens/discover/IntentScreen.tsx`

- [ ] **Step 1: Open IntentScreen and locate the chip arrays**

  Find the two arrays near the top of the file (around lines 26–35):
  ```typescript
  const WORK_STYLES: { value: WorkStyle; emoji: string; label: string }[] = [
    { value: 'Deep focus', emoji: '🎧', label: 'Deep focus' },
    { value: 'Chat mode', emoji: '💬', label: 'Chat mode' },
    { value: 'Flexible', emoji: '✌️', label: 'Flexible' },
  ];
  const LOCATION_TYPES: { value: LocationType; emoji: string; label: string }[] = [
    { value: 'Cafe', emoji: '☕️', label: 'Cafe' },
    { value: 'Library', emoji: '📚', label: 'Library' },
    { value: 'Anywhere', emoji: '📍', label: 'Anywhere' },
  ];
  ```

- [ ] **Step 2: Replace both arrays — drop the `emoji` field**

  ```typescript
  const WORK_STYLES: { value: WorkStyle; label: string }[] = [
    { value: 'Deep focus', label: 'Deep focus' },
    { value: 'Chat mode', label: 'Chat mode' },
    { value: 'Flexible', label: 'Flexible' },
  ];
  const LOCATION_TYPES: { value: LocationType; label: string }[] = [
    { value: 'Cafe', label: 'Cafe' },
    { value: 'Library', label: 'Library' },
    { value: 'Anywhere', label: 'Anywhere' },
  ];
  ```

- [ ] **Step 3: Remove emoji rendering from the Work vibe chip JSX**

  Find the Work vibe chip render (around lines 247–268). Each chip `<TouchableOpacity>` currently contains two `<Text>` nodes. Find this existing inner chip content:
  ```tsx
  <Text style={[styles.chipEmoji, selected && styles.chipTextSelected]}>
    {style.emoji}
  </Text>
  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
    {style.label}
  </Text>
  ```
  Replace by rewriting the entire `.map(...)` block so each chip renders only the label text:

  ```tsx
  {WORK_STYLES.map((style, index) => {
    const selected = workStyle === style.value;
    const isLast = index === WORK_STYLES.length - 1;
    return (
      <TouchableOpacity
        key={style.value}
        onPress={() => setWorkStyle(style.value)}
        style={[
          styles.chip,
          selected && styles.chipSelected,
          !isLast && styles.chipSpacer,
        ]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {style.label}
        </Text>
      </TouchableOpacity>
    );
  })}
  ```

- [ ] **Step 4: Remove emoji rendering from the Where chip JSX**

  Find the Where chip render (around lines 274–298). Each chip currently contains two `<Text>` nodes. Find this existing inner chip content:
  ```tsx
  <Text style={[styles.chipEmoji, selected && styles.chipTextSelected]}>
    {type.emoji}
  </Text>
  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
    {type.label}
  </Text>
  ```
  Replace by rewriting the entire `.map(...)` block so each chip renders only the label text:

  ```tsx
  {LOCATION_TYPES.map((type, index) => {
    const selected = locationType === type.value;
    const isLast = index === LOCATION_TYPES.length - 1;
    return (
      <TouchableOpacity
        key={type.value}
        onPress={() => setLocationType(type.value)}
        style={[
          styles.chip,
          selected && styles.chipSelected,
          !isLast && styles.chipSpacer,
        ]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {type.label}
        </Text>
      </TouchableOpacity>
    );
  })}
  ```

- [ ] **Step 5: Remove the `chipEmoji` style** (no longer referenced)

  Find and delete this style entry in the `StyleSheet.create` block:
  ```typescript
  chipEmoji: {
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center',
  },
  ```

- [ ] **Step 6: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors. If you see `Property 'emoji' does not exist`, you missed a reference — search the file for `.emoji` and remove it.

---

### Task 2: Simplify the time row

**Files:**
- Modify: `src/screens/discover/IntentScreen.tsx`

- [ ] **Step 1: Replace the time row JSX**

  Find the time row section (around lines 314–345). It currently has this structure:
  ```tsx
  <View style={styles.section}>
    <Text style={styles.label}>Available</Text>
    <View style={styles.timeRow}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeLabel}>Start</Text>
        <TouchableOpacity
          style={styles.timePicker}
          onPress={() => setIsStartPickerOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.timePickerText}>{formatDisplayTime(startTime)}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.timeColumn}>
        <Text style={styles.timeLabel}>End</Text>
        <TouchableOpacity
          style={styles.timePicker}
          onPress={() => setIsEndPickerOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.timePickerText}>
            {endTimeOptions.length > 0 ? formatDisplayTime(endTime) : '--'}
          </Text>
        </TouchableOpacity>
      </View>
      {durationLabel !== '--' && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationBadgeText}>{durationLabel}</Text>
        </View>
      )}
    </View>
  </View>
  ```

  Replace with (remove `timeColumn` wrappers and `timeLabel` sub-labels, add `→` separator):
  ```tsx
  <View style={styles.section}>
    <Text style={styles.label}>Available</Text>
    <View style={styles.timeRow}>
      <TouchableOpacity
        style={styles.timePicker}
        onPress={() => setIsStartPickerOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.timePickerText}>{formatDisplayTime(startTime)}</Text>
      </TouchableOpacity>
      <Text style={styles.timeSeparator}>→</Text>
      <TouchableOpacity
        style={styles.timePicker}
        onPress={() => setIsEndPickerOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.timePickerText}>
          {endTimeOptions.length > 0 ? formatDisplayTime(endTime) : '--'}
        </Text>
      </TouchableOpacity>
      {durationLabel !== '--' && (
        <View style={styles.durationBadge}>
          <Text style={styles.durationBadgeText}>{durationLabel}</Text>
        </View>
      )}
    </View>
  </View>
  ```

- [ ] **Step 2: Update `timeRow` style to align items centered**

  Find `timeRow` in StyleSheet.create:
  ```typescript
  timeRow: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'flex-end',
  },
  ```
  Change `alignItems` to `'center'`:
  ```typescript
  timeRow: {
    flexDirection: 'row',
    gap: spacing[4],
    alignItems: 'center',
  },
  ```

- [ ] **Step 3: Add `timeSeparator` style and remove unused `timeColumn` / `timeLabel` styles**

  Add `timeSeparator` to StyleSheet.create:
  ```typescript
  timeSeparator: {
    fontSize: 14,
    color: theme.textMuted,
    alignSelf: 'center',
  },
  ```

  Delete these now-unused styles from the StyleSheet:
  ```typescript
  timeColumn: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: spacing[2],
  },
  ```

- [ ] **Step 4: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors.

---

### Task 3: Rename CTA and remove empty-input validation

**Files:**
- Modify: `src/screens/discover/IntentScreen.tsx`

- [ ] **Step 1: Remove the empty-input validation guard in `handleSubmit`**

  Find this block in `handleSubmit` (around lines 141–144):
  ```typescript
  if (!taskDescription.trim()) {
    Alert.alert('Missing info', 'Please describe what you\'ll be working on');
    return;
  }
  ```
  Delete it entirely. The only remaining validation in `handleSubmit` should be the `endTime <= startTime` check and the `!user` check.

- [ ] **Step 2: Rename the CTA button**

  Find:
  ```tsx
  <Button
    title="Find Co-Workers"
    onPress={handleSubmit}
    loading={loading}
    style={styles.button}
  />
  ```
  Change `title` to `"Save focus"`:
  ```tsx
  <Button
    title="Save focus"
    onPress={handleSubmit}
    loading={loading}
    style={styles.button}
  />
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors.

- [ ] **Step 4: Commit Chunk 1**

  ```bash
  git add src/screens/discover/IntentScreen.tsx
  git commit -m "feat: simplify IntentScreen — text-only chips, cleaner time row, save focus CTA"
  ```

---

## Chunk 2: Always-On Discovery

### Task 4: Add `getDefaultIntentTimes` to `discoveryService.ts`

**Files:**
- Modify: `src/services/discoveryService.ts`

- [ ] **Step 1: Add the utility function and its helper at the bottom of the file**

  Append to the end of `src/services/discoveryService.ts`:
  ```typescript
  // ─── Time utilities ──────────────────────────────────────────────────────────

  const INTENT_TIME_START = 7 * 60;  // 07:00
  const INTENT_TIME_END   = 23 * 60; // 23:00
  const INTENT_INTERVAL   = 30;
  const INTENT_DURATION   = 120; // 2 hours default

  /**
   * Returns default start/end times for a new intent.
   * Start = current time rounded up to the next 30-min interval (clamped 07:00–23:00).
   * End   = start + 2 hours (clamped to 23:00).
   */
  export function getDefaultIntentTimes(): { defaultStart: string; defaultEnd: string } {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const rounded = Math.ceil(currentMins / INTENT_INTERVAL) * INTENT_INTERVAL;
    const startMins = Math.min(Math.max(rounded, INTENT_TIME_START), INTENT_TIME_END);
    const endMins   = Math.min(startMins + INTENT_DURATION, INTENT_TIME_END);
    const defaultStart = _fmtTime(startMins);
    const defaultEnd   = endMins > startMins ? _fmtTime(endMins) : _fmtTime(INTENT_TIME_END);
    return { defaultStart, defaultEnd };
  }

  function _fmtTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
  }
  ```

- [ ] **Step 2: Update `IntentScreen.tsx` to import and use `getDefaultIntentTimes`**

  In `src/screens/discover/IntentScreen.tsx`, update the import line from discoveryService:
  ```typescript
  import { upsertIntent, IntentInput, getTodayIntent, getDefaultIntentTimes } from '../../services/discoveryService';
  ```

  Then in the `loadIntent` `useEffect`, find the `else if (isMounted)` branch that calls `getDefaultTimes()`:
  ```typescript
  } else if (isMounted) {
    const { defaultStart, defaultEnd } = getDefaultTimes();
    setStartTime(defaultStart);
    setEndTime(defaultEnd);
  }
  ```
  Replace `getDefaultTimes()` with `getDefaultIntentTimes()`:
  ```typescript
  } else if (isMounted) {
    const { defaultStart, defaultEnd } = getDefaultIntentTimes();
    setStartTime(defaultStart);
    setEndTime(defaultEnd);
  }
  ```

  Then delete the now-unused local `getDefaultTimes` function (around line 629) and its helpers `clampMinutes` and `formatValueTime` **only if they are no longer referenced anywhere else in the file**. Search for all usages of each function name before deleting. `formatValueTime` is also used by `getTimeOptions` — keep it. Only delete `getDefaultTimes` itself (not `formatValueTime` or `clampMinutes` if still used by `getTimeOptions`).

  > Note: `clampMinutes` is used by `getDefaultTimes` only. `formatValueTime` is used by both `getDefaultTimes` and `getTimeOptions`. After deleting `getDefaultTimes`, you can also delete `clampMinutes`. Keep `formatValueTime`.

- [ ] **Step 3: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/services/discoveryService.ts src/screens/discover/IntentScreen.tsx
  git commit -m "feat: export getDefaultIntentTimes from discoveryService"
  ```

---

### Task 5: Remove intent gate from DiscoverScreen + auto-create default intent

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`

- [ ] **Step 1: Update the `DiscoverState` type**

  Find:
  ```typescript
  type DiscoverState = 'loading' | 'needs_intent' | 'discovering' | 'empty';
  ```
  Replace with:
  ```typescript
  type DiscoverState = 'loading' | 'error' | 'discovering' | 'empty';
  ```

- [ ] **Step 2: Update the import from discoveryService to include the new utilities**

  Find the existing import line from discoveryService and add `upsertIntent`, `IntentInput`, and `getDefaultIntentTimes` if not already present:
  ```typescript
  import {
    fetchDiscoveryCards,
    getTodayIntent,
    upsertIntent,
    getDefaultIntentTimes,
    DiscoveryCard,
  } from '../../services/discoveryService';
  ```
  (Keep any other names already in the import.)

- [ ] **Step 3: Replace the `loadDiscoveryData` function body**

  Find the `loadDiscoveryData` function. Replace its body with the new version that auto-creates a default intent instead of gating:
  ```typescript
  const loadDiscoveryData = async () => {
    if (!user) return;
    setState('loading');

    const todayIntent = await getTodayIntent(user.id);
    if (!todayIntent) {
      const { defaultStart, defaultEnd } = getDefaultIntentTimes();
      await upsertIntent(user.id, {
        task_description: '',
        work_style: 'Flexible',
        location_type: 'Anywhere',
        location_name: null,
        available_from: defaultStart,
        available_until: defaultEnd,
        latitude,
        longitude,
      });
    }

    const discoveryCards = await fetchDiscoveryCards(user.id, latitude, longitude);
    setState(discoveryCards.length > 0 ? 'discovering' : 'empty');
    setCards(discoveryCards);
  };
  ```

- [ ] **Step 4: Fix the `locationError` branch**

  Find the `useEffect` that watches `locationError` (or the section inside `loadDiscoveryData` / a separate effect). It currently sets `setState('needs_intent')` when `locationError` is truthy. Change it to `setState('error')`:
  ```typescript
  if (locationError) {
    setState('error');
    return;
  }
  ```

- [ ] **Step 5: Replace the `needs_intent` render branch with an `error` render branch**

  Find the block (actual source uses a `<>` fragment, not SafeAreaView, and props use `?? 0`):
  ```tsx
  if (state === 'needs_intent') {
    return (
      <>
        <IntentScreen
          latitude={latitude ?? 0}
          longitude={longitude ?? 0}
          onIntentSet={handleIntentSet}
          locationLoading={locationLoading}
          locationError={locationError}
          onRequestLocation={refreshLocation}
        />
        {renderMatchModal()}
      </>
    );
  }
  ```
  Replace with:
  ```tsx
  if (state === 'error') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centeredMessage}>
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.errorText}>
            Clover needs your location to find co-workers nearby.
          </Text>
          <Button
            title="Enable Location"
            onPress={refreshLocation}
            style={styles.centeredButton}
          />
        </View>
      </SafeAreaView>
    );
  }
  ```

- [ ] **Step 6: Add the missing styles**

  In `StyleSheet.create`, add:
  ```typescript
  centeredMessage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: theme.text,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing[6],
  },
  centeredButton: {
    alignSelf: 'stretch',
  },
  ```
  (Check first whether `errorTitle` / `errorText` styles already exist in DiscoverScreen. If they do, reuse them and skip adding duplicates.)

- [ ] **Step 7: Remove the `IntentScreen` inline render import if no longer needed at module level**

  `IntentScreen` is still used (in the upcoming FAB modal), so keep it imported. Do not remove it.

- [ ] **Step 8: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors. Any `'needs_intent'` reference that remains will cause a TS error — search and remove.

---

### Task 6: Add Edit Focus FAB and modal to DiscoverScreen

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`

- [ ] **Step 1: Add `isFocusModalVisible` state**

  Near the top of the component, alongside other `useState` declarations, add:
  ```typescript
  const [isFocusModalVisible, setIsFocusModalVisible] = useState(false);
  ```

- [ ] **Step 2: Add `Modal` to the React Native import**

  Find the React Native import line. Add `Modal` and `TouchableOpacity` if not already present:
  ```typescript
  import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
  } from 'react-native';
  ```

- [ ] **Step 3: Add `CLOVER_FOREST` and `CLOVER_BG` to the constants import**

  Add the clover constants import (after existing imports):
  ```typescript
  import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';
  ```

- [ ] **Step 4: Update the `discovering` render branch to include the FAB and modal**

  The `discovering` state is handled by the **final ungarded `return`** at the bottom of the component (there is no `if (state === 'discovering')` guard). Find this existing final return (around lines 183–197):
  ```tsx
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>
      <CardStack
        cards={cards}
        onSwipe={handleSwipe}
        onEmpty={handleEmpty}
      />
      {renderMatchModal()}
    </SafeAreaView>
  );
  ```
  Replace it with (add FAB and modal before `{renderMatchModal()}`):
  ```tsx
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <CardStack
        cards={cards}
        onSwipe={handleSwipe}
        onEmpty={handleEmpty}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsFocusModalVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>✎</Text>
      </TouchableOpacity>

      <Modal
        visible={isFocusModalVisible}
        animationType="slide"
        onRequestClose={() => setIsFocusModalVisible(false)}
      >
        <IntentScreen
          latitude={latitude ?? 0}
          longitude={longitude ?? 0}
          onIntentSet={() => {
            setIsFocusModalVisible(false);
            loadDiscoveryData();
          }}
        />
      </Modal>

      {renderMatchModal()}
    </SafeAreaView>
  );
  ```

  > **Note:** `loadDiscoveryData` must be defined before this return in the component body. If TS complains about calling it before declaration, move its `const` definition higher up.

- [ ] **Step 5: Add FAB styles**

  In `StyleSheet.create`, add:
  ```typescript
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: CLOVER_FOREST,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 22,
    color: CLOVER_BG,
    lineHeight: 28,
  },
  ```

- [ ] **Step 6: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors.

- [ ] **Step 7: Commit**

  ```bash
  git add src/screens/discover/DiscoverScreen.tsx src/services/discoveryService.ts
  git commit -m "feat: always-on discovery — remove intent gate, auto-create default intent, add edit focus FAB"
  ```

---

### Task 7: SwipeCard fallback for empty task_description

**Files:**
- Modify: `src/components/discover/SwipeCard.tsx`

- [ ] **Step 1: Locate the intent text render**

  Find the lines (around 111–114) that unconditionally render the divider and intent text:
  ```tsx
  <View style={styles.divider} />
  <Text style={styles.intent} numberOfLines={2}>
    {intent.task_description}
  </Text>
  ```

- [ ] **Step 2: Wrap in a conditional so they only render when `task_description` is non-empty**

  ```tsx
  {intent.task_description ? (
    <>
      <View style={styles.divider} />
      <Text style={styles.intent} numberOfLines={2}>
        {intent.task_description}
      </Text>
    </>
  ) : null}
  ```

- [ ] **Step 3: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors.

- [ ] **Step 4: Final commit**

  ```bash
  git add src/components/discover/SwipeCard.tsx
  git commit -m "feat: hide empty intent line on SwipeCard when task_description is blank"
  ```

---

## Verification Checklist

After all tasks are complete, smoke-test in the iOS simulator:

- [ ] Open the Discover tab cold (no intent set for today) → cards load immediately, no intent prompt
- [ ] Tap the pencil FAB → IntentScreen slides up
- [ ] Chips show text only, no emoji
- [ ] Time row shows `[Start] → [End] [2 HR]` with no Start/End sub-labels
- [ ] CTA button reads "Save focus"
- [ ] Submit with empty task input → no alert, saves successfully
- [ ] After saving → modal closes, discover feed refreshes
- [ ] SwipeCard for user with no `task_description` → no blank line below profession
- [ ] Run `npx tsc --noEmit` → 0 errors
