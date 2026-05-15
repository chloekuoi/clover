# Focus Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the FAB + full-screen Modal with an in-screen animated bottom sheet triggered by a header pill, keeping the tab bar visible.

**Architecture:** Two files change: `IntentScreen` gains an `isBottomSheet` prop that swaps SafeAreaView→View and suppresses its own subtitle; `DiscoverScreen` gains a `renderHeader()` helper (header pill), a `renderFocusSheet()` helper (in-screen `Animated.View` sheet), and the FAB + `<Modal>` are removed entirely. The sheet animation is driven by a `useRef(new Animated.Value(SHEET_HEIGHT)).current` ref with spring open / timing close.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, `react-native-safe-area-context`

---

## Chunk 1: IntentScreen — add `isBottomSheet` prop

### Task 1: Update `IntentScreen` props and all render paths

**Files:**
- Modify: `src/screens/discover/IntentScreen.tsx`

- [ ] **Step 1: Add `isBottomSheet` to the type and destructured parameters**

  In `src/screens/discover/IntentScreen.tsx`, find the `IntentScreenProps` type (line 42-49) and the function signature (line 51-58). Replace both with:

  ```typescript
  type IntentScreenProps = {
    latitude: number;
    longitude: number;
    onIntentSet: () => void;
    locationLoading?: boolean;
    locationError?: string | null;
    onRequestLocation?: () => void;
    isBottomSheet?: boolean;
  };

  export default function IntentScreen({
    latitude,
    longitude,
    onIntentSet,
    locationLoading = false,
    locationError = null,
    onRequestLocation,
    isBottomSheet = false,
  }: IntentScreenProps) {
  ```

- [ ] **Step 2: Update the loading early-return (path 1 of 3)**

  Find (line ~177-186):
  ```tsx
  if (locationLoading || initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  ```

  Replace with:
  ```tsx
  if (locationLoading || initialLoading) {
    const Wrapper = isBottomSheet ? View : SafeAreaView;
    return (
      <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] as const })}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Wrapper>
    );
  }
  ```

- [ ] **Step 3: Update the locationError early-return (path 2 of 3)**

  Find (line ~188-204):
  ```tsx
  if (locationError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          ...
        </View>
      </SafeAreaView>
    );
  }
  ```

  Replace with:
  ```tsx
  if (locationError) {
    const Wrapper = isBottomSheet ? View : SafeAreaView;
    return (
      <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] as const })}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorTitle}>Location Required</Text>
          <Text style={styles.errorText}>
            CoWork Connect needs your location to find co-workers nearby.
          </Text>
          <Button
            title="Enable Location"
            onPress={onRequestLocation || (() => {})}
            style={styles.button}
          />
        </View>
      </Wrapper>
    );
  }
  ```

- [ ] **Step 4: Update the main form return (path 3 of 3) — outer wrapper + subtitle + KAV**

  Find the main return (line ~206-366). Make three changes inside it:

  **a) Outer wrapper:** Replace opening tag:
  ```tsx
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
  ```
  With:
  ```tsx
  const Wrapper = isBottomSheet ? View : SafeAreaView;
  return (
    <Wrapper style={styles.container} {...(!isBottomSheet && { edges: ['top'] as const })}>
  ```
  And the closing tag `</SafeAreaView>` → `</Wrapper>`.

  **b) KeyboardAvoidingView behavior:** Replace:
  ```tsx
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  ```
  With:
  ```tsx
  behavior={isBottomSheet ? 'padding' : (Platform.OS === 'ios' ? 'padding' : 'height')}
  ```

  **c) Subtitle suppression:** Replace:
  ```tsx
  <Text style={styles.subtitle}>Set availability to connect</Text>
  ```
  With:
  ```tsx
  {!isBottomSheet && (
    <Text style={styles.subtitle}>Set availability to connect</Text>
  )}
  ```

- [ ] **Step 5: Run TypeScript check**

  From the worktree root (`/Users/chloe/Documents/Claude/cowork-connect/.claude/worktrees/frosty-edison`):
  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors. Fix any TypeScript errors before proceeding.

- [ ] **Step 6: Commit IntentScreen changes**

  ```bash
  git add src/screens/discover/IntentScreen.tsx
  git commit -m "feat(intent): add isBottomSheet prop for sheet embedding"
  ```

---

## Chunk 2: DiscoverScreen — header pill + animated bottom sheet

### Task 2: Update imports and add module-level constant

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`

- [ ] **Step 1: Update react-native imports**

  Find (line 2):
  ```typescript
  import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
  ```

  Replace with:
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
  (`Modal` is removed; `Animated`, `Easing`, `Dimensions` are added.)

- [ ] **Step 2: Add `useRef` to React import**

  Find (line 1):
  ```typescript
  import React, { useState, useEffect, useCallback } from 'react';
  ```

  Replace with:
  ```typescript
  import React, { useState, useEffect, useCallback, useRef } from 'react';
  ```

- [ ] **Step 3: Add `SHEET_HEIGHT` constant after imports, before component**

  After all import statements and before `type DiscoverState = ...`, add:
  ```typescript
  const SHEET_HEIGHT = Dimensions.get('window').height * 0.82;
  ```

### Task 3: Add animation state, helpers, and renderHeader

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`

- [ ] **Step 1: Add `sheetAnim` ref inside the component**

  Inside `DiscoverScreen`, directly after the existing state declarations (`const [matchModal, ...]`), add:
  ```typescript
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  ```

- [ ] **Step 2: Add `openSheet` and `closeSheet` helpers inside the component**

  Directly after the `sheetAnim` line:
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

- [ ] **Step 3: Add `renderHeader` helper inside the component**

  After `renderMatchModal()` and before the render returns, add:
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

- [ ] **Step 4: Add `renderFocusSheet` helper inside the component**

  After `renderHeader`:
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

### Task 4: Update render returns and remove FAB + Modal

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`

- [ ] **Step 1: Update the `empty` state return**

  Find the current `empty` state return (line ~162-181):
  ```tsx
  if (state === 'empty') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {!matchModal.visible && (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Discover</Text>
            </View>
            <View style={styles.centerContent}>
              <Text style={styles.emptyTitle}>No one nearby right now</Text>
              <Text style={styles.emptyText}>
                Check back later or expand your search radius
              </Text>
            </View>
          </>
        )}
        {renderMatchModal()}
      </SafeAreaView>
    );
  }
  ```

  Replace with:
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
      </SafeAreaView>
    );
  }
  ```

- [ ] **Step 2: Update the `discovering` return — replace header, remove FAB + Modal, add renderFocusSheet**

  Find the current `discovering` return (line ~183-218):
  ```tsx
  // State: discovering
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <CardStack cards={cards} onSwipe={handleSwipe} onEmpty={handleEmpty} />

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

  Replace with:
  ```tsx
  // State: discovering
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <CardStack cards={cards} onSwipe={handleSwipe} onEmpty={handleEmpty} />
      {renderMatchModal()}
      {renderFocusSheet()}
    </SafeAreaView>
  );
  ```

### Task 5: Update styles

**Files:**
- Modify: `src/screens/discover/DiscoverScreen.tsx`

- [ ] **Step 1: Update `header` style to flex row**

  Find:
  ```typescript
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  ```

  Replace with:
  ```typescript
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[2],
    paddingBottom: spacing[4],
  },
  ```

- [ ] **Step 2: Remove `fab` and `fabIcon` styles**

  Find and delete:
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

- [ ] **Step 3: Add new styles for pill and sheet**

  After the last existing style entry (before the closing `}`), add:
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
    overflow: 'hidden',
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
    color: theme.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  ```

- [ ] **Step 4: Run TypeScript check**

  ```bash
  npx tsc --noEmit
  ```
  Expected: 0 errors. Fix any TypeScript errors before proceeding.

- [ ] **Step 5: Commit DiscoverScreen changes**

  ```bash
  git add src/screens/discover/DiscoverScreen.tsx
  git commit -m "feat(discover): replace FAB+modal with header pill and animated bottom sheet"
  ```

---

## Acceptance Criteria Verification

- [ ] Header shows "Discover" left-aligned and "✎ Focus" pill right-aligned in both `discovering` and `empty` states
- [ ] Tapping pill opens sheet with spring animation; tab bar remains visible beneath
- [ ] Sheet shows drag handle, "Set availability to connect" subtitle (once, not duplicated), IntentScreen form
- [ ] IntentScreen form is usable inside the sheet (scrollable, keyboard avoidance works)
- [ ] Tapping the dim overlay dismisses the sheet with easing animation
- [ ] "Save focus" saves, dismisses sheet, reloads cards
- [ ] No FAB visible anywhere
- [ ] `npx tsc --noEmit` → 0 errors
