# Onboarding Photo Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated 3+2 photo-grid screen (step 2) to the cinematic onboarding flow, letting users upload up to 5 photos with the same prompts used in Edit Profile.

**Architecture:** Replace the single `photoUri` field in `OnboardingState` with a `photoUris: (string | null)[]` array (5 slots, index = position). `IdentityScreen` writes slot 0; new `PhotoScreen` writes all slots. All uploads happen in `onboardingService` at completion using `Promise.allSettled`.

**Tech Stack:** React Native 0.81, Expo SDK 54, expo-image-picker (via existing `pickImage()` helper in `photoService`), TypeScript, Supabase (upload in `onboardingService`).

**Spec:** `docs/superpowers/specs/2026-05-15-onboarding-photo-screen-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx` | Modify | State type, INITIAL_STATE, TOTAL_STEPS, screen wiring |
| `src/screens/auth/onboarding/screens/IdentityScreen.tsx` | Modify | Read/write `photoUris[0]` instead of `photoUri` |
| `src/screens/auth/onboarding/onboardingService.ts` | Modify | Upload loop over all photo slots |
| `src/screens/auth/onboarding/screens/PhotoScreen.tsx` | **Create** | 3+2 photo grid, prompts, TypewriterText, skip link |

---

## Chunk 1: State migration

### Task 1: Update OnboardingState, INITIAL_STATE, and TOTAL_STEPS

**Files:**
- Modify: `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx`

- [ ] **Step 1: Open the file and locate the three target sections**

  File: `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx`

  Three edits needed:
  1. `OnboardingState` interface (around line 17) — replace `photoUri`
  2. `INITIAL_STATE` constant (around line 44) — replace `photoUri`
  3. `TOTAL_STEPS` constant (line 42) — increment to 10

- [ ] **Step 2: Replace `photoUri` in `OnboardingState`**

  Change:
  ```ts
  photoUri: string | null;
  ```
  To:
  ```ts
  photoUris: (string | null)[];   // index = position (0–4)
  ```

- [ ] **Step 3: Replace `photoUri` in `INITIAL_STATE` and bump `TOTAL_STEPS`**

  Change:
  ```ts
  const TOTAL_STEPS = 9;

  const INITIAL_STATE: OnboardingState = {
    name: '',
    photoUri: null,
    birthday: '',
  ```
  To:
  ```ts
  const TOTAL_STEPS = 10;

  const INITIAL_STATE: OnboardingState = {
    name: '',
    photoUris: [null, null, null, null, null],
    birthday: '',
  ```

- [ ] **Step 4: Verify TypeScript errors now point only to `IdentityScreen.tsx`**

  Run:
  ```bash
  cd /Users/chloe/Documents/Claude/clover && npx tsc --noEmit 2>&1 | head -30
  ```
  Expected: errors referencing `state.photoUri` in `IdentityScreen.tsx` only (not in `CinematicOnboardingFlow.tsx` itself).

---

### Task 2: Update IdentityScreen to use `photoUris[0]`

**Files:**
- Modify: `src/screens/auth/onboarding/screens/IdentityScreen.tsx`

- [ ] **Step 1: Locate the photo read and write**

  Two spots to change in `IdentityScreen.tsx`:
  1. The `setState` call inside `pickPhoto()` (around line 36)
  2. The `state.photoUri` read in JSX (around line 58)

- [ ] **Step 2: Update the state write in `pickPhoto()`**

  Change:
  ```ts
  setState(s => ({ ...s, photoUri: result.assets[0].uri }));
  ```
  To:
  ```ts
  setState(s => {
    const next = [...s.photoUris];
    next[0] = result.assets[0].uri;
    return { ...s, photoUris: next };
  });
  ```

- [ ] **Step 3: Update the state read in JSX**

  Change:
  ```tsx
  {state.photoUri ? (
    <Image source={{ uri: state.photoUri }} style={styles.photoImage} />
  ```
  To:
  ```tsx
  {state.photoUris[0] ? (
    <Image source={{ uri: state.photoUris[0] }} style={styles.photoImage} />
  ```

- [ ] **Step 4: Verify TypeScript errors are now only in `onboardingService.ts`**

  Run:
  ```bash
  cd /Users/chloe/Documents/Claude/clover && npx tsc --noEmit 2>&1 | head -30
  ```
  Expected: only `onboardingService.ts` errors remain (referencing `state.photoUri`).

---

### Task 3: Update `onboardingService.ts` upload loop

**Files:**
- Modify: `src/screens/auth/onboarding/onboardingService.ts`

- [ ] **Step 1: Locate the existing single-photo upload block**

  Around lines 17–21:
  ```ts
  if (state.photoUri) {
    await uploadPhoto(userId, state.photoUri, 0).catch(() => {
      // Photo upload failure shouldn't block onboarding
    });
  }
  ```

- [ ] **Step 2: Replace with `Promise.allSettled` loop**

  Change the block above to:
  ```ts
  await Promise.allSettled(
    state.photoUris.map((uri, position) =>
      uri ? uploadPhoto(userId, uri, position) : Promise.resolve()
    )
  );
  // Photo upload failures don't block onboarding (Promise.allSettled never rejects)
  ```

- [ ] **Step 3: Verify TypeScript is clean**

  Run:
  ```bash
  cd /Users/chloe/Documents/Claude/clover && npx tsc --noEmit 2>&1
  ```
  Expected: no output (zero errors).

- [ ] **Step 4: Commit state migration**

  ```bash
  cd /Users/chloe/Documents/Claude/clover && \
  git add \
    src/screens/auth/onboarding/CinematicOnboardingFlow.tsx \
    src/screens/auth/onboarding/screens/IdentityScreen.tsx \
    src/screens/auth/onboarding/onboardingService.ts && \
  git commit -m "refactor(onboarding): replace photoUri with photoUris array (5 slots)"
  ```

---

## Chunk 2: PhotoScreen + flow wiring

### Task 4: Create `PhotoScreen.tsx`

**Files:**
- Create: `src/screens/auth/onboarding/screens/PhotoScreen.tsx`

- [ ] **Step 1: Create the file with the full implementation**

  Create `src/screens/auth/onboarding/screens/PhotoScreen.tsx`:

  ```tsx
  import React from 'react';
  import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  import { onboardingTheme as t } from '../theme';
  import { ProgressBar } from '../components/ProgressBar';
  import { TypewriterText } from '../components/TypewriterText';
  import { pickImage } from '../../../../services/photoService';
  import type { ScreenProps } from '../CinematicOnboardingFlow';

  const { width: WINDOW_WIDTH } = Dimensions.get('window');
  const AVAILABLE_WIDTH = WINDOW_WIDTH - 2 * t.screenPaddingH;
  const SLOT_GAP = 6;
  const SLOT_SIZE = (AVAILABLE_WIDTH - 2 * SLOT_GAP) / 3;

  const SLOT_DATA: { prompt: string; subtitle?: string }[] = [
    { prompt: "Hi, I'm a real person 👋", subtitle: 'Not a stock photo, promise' },
    { prompt: 'Proof I touch grass sometimes', subtitle: 'Hobbies, activities, general humanness' },
    { prompt: 'What my camera roll actually looks like', subtitle: 'Candid is an understatement' },
    { prompt: 'Currently building something...', subtitle: 'Still figuring it out, send help' },
    { prompt: 'Add photo 5' },
  ];

  export function PhotoScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
    const handlePickPhoto = async (position: number) => {
      const { uri, error } = await pickImage();
      if (error || !uri) return;
      setState(s => {
        const next = [...s.photoUris];
        next[position] = uri;
        return { ...s, photoUris: next };
      });
    };

    const renderSlot = (position: number) => {
      const uri = state.photoUris[position];
      const { prompt, subtitle } = SLOT_DATA[position] ?? { prompt: `Add photo ${position + 1}` };
      const isPrimary = position === 0;

      return (
        <TouchableOpacity
          key={position}
          style={[styles.slot, isPrimary && styles.slotPrimary]}
          onPress={() => handlePickPhoto(position)}
          activeOpacity={0.7}
        >
          {uri ? (
            <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={styles.slotContent}>
              <Text style={styles.slotPlus}>+</Text>
              <Text style={styles.slotPrompt} numberOfLines={2}>{prompt}</Text>
              {subtitle ? (
                <Text style={styles.slotSubtitle} numberOfLines={2}>{subtitle}</Text>
              ) : null}
            </View>
          )}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.screen}>
        <Text style={styles.wordmark}>cowork</Text>
        <View style={styles.spacer} />

        <TypewriterText
          text="put a face to the name."
          style={styles.question}
          startDelay={300}
        />

        <View style={styles.gridRow}>
          {renderSlot(0)}
          {renderSlot(1)}
          {renderSlot(2)}
        </View>
        <View style={styles.gridRow}>
          {renderSlot(3)}
          {renderSlot(4)}
          <View style={styles.slotSpacer} />
        </View>

        <TouchableOpacity onPress={onNext} style={styles.skip} activeOpacity={0.7}>
          <Text style={styles.skipText}>skip for now</Text>
        </TouchableOpacity>

        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={onNext}
          nextLabel="skip"
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      paddingHorizontal: t.screenPaddingH,
      paddingTop: t.screenPaddingTop,
      paddingBottom: t.screenPaddingBottom,
    },
    wordmark: {
      fontFamily: t.fontSerif.lightItalic,
      fontSize: 11,
      color: t.placeholder,
      textAlign: 'center',
      letterSpacing: 1.5,
      flexShrink: 0,
    },
    spacer: { flex: 1 },
    question: {
      fontSize: 24,
      lineHeight: 32,
      marginBottom: 10,
    },
    gridRow: {
      flexDirection: 'row',
      gap: SLOT_GAP,
      marginBottom: SLOT_GAP,
    },
    slot: {
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      borderRadius: 8,
      backgroundColor: 'rgba(12,31,14,0.06)',
      overflow: 'hidden',
    },
    slotPrimary: {
      backgroundColor: 'rgba(30,61,40,0.10)',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.accentDark,
    },
    slotContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 6,
    },
    slotPlus: {
      fontFamily: t.fontSans.light,
      fontSize: 16,
      color: t.placeholder,
      marginBottom: 2,
    },
    slotPrompt: {
      fontFamily: t.fontSerif.light,
      fontSize: 9,
      color: t.muted,
      textAlign: 'center',
      lineHeight: 13,
    },
    slotSubtitle: {
      fontFamily: t.fontSerif.lightItalic,
      fontSize: 7.5,
      color: t.placeholder,
      textAlign: 'center',
      lineHeight: 11,
      marginTop: 2,
    },
    slotSpacer: {
      width: SLOT_SIZE,
      height: SLOT_SIZE,
      backgroundColor: 'transparent',
    },
    skip: {
      paddingVertical: 4,
      marginTop: 12,
    },
    skipText: {
      fontFamily: t.fontSans.light,
      fontSize: 12,
      color: t.placeholder,
    },
  });
  ```

- [ ] **Step 2: Verify the file was created and TypeScript is clean**

  Run:
  ```bash
  cd /Users/chloe/Documents/Claude/clover && npx tsc --noEmit 2>&1
  ```
  Expected: no errors (the file won't cause errors until it is imported).

---

### Task 5: Wire `PhotoScreen` into `CinematicOnboardingFlow.tsx`

**Files:**
- Modify: `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx`

- [ ] **Step 1: Add the import**

  Add after the existing `BuildingScreen` import line:
  ```ts
  import { PhotoScreen } from './screens/PhotoScreen';
  ```

- [ ] **Step 2: Update the switch statement**

  Locate the `renderScreen` switch block and replace the entire set of cases:

  Change:
  ```tsx
  case 0: return <HookScreen {...props} />;
  case 1: return <IdentityScreen {...props} />;
  case 2: return <BirthdayScreen {...props} />;
  case 3: return <BuildingScreen {...props} />;
  case 4: return <AboutScreen {...props} />;
  case 5: return <LookingForScreen {...props} />;
  case 6: return <NotificationsScreen {...props} />;
  case 7: return <ContactSyncScreen {...props} />;
  case 8: return <SuccessScreen {...props} />;
  ```
  To:
  ```tsx
  case 0: return <HookScreen {...props} />;
  case 1: return <IdentityScreen {...props} />;
  case 2: return <PhotoScreen {...props} />;
  case 3: return <BirthdayScreen {...props} />;
  case 4: return <BuildingScreen {...props} />;
  case 5: return <AboutScreen {...props} />;
  case 6: return <LookingForScreen {...props} />;
  case 7: return <NotificationsScreen {...props} />;
  case 8: return <ContactSyncScreen {...props} />;
  case 9: return <SuccessScreen {...props} />;
  ```

- [ ] **Step 3: Verify TypeScript is fully clean**

  Run:
  ```bash
  cd /Users/chloe/Documents/Claude/clover && npx tsc --noEmit 2>&1
  ```
  Expected: no output (zero errors).

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/chloe/Documents/Claude/clover && \
  git add \
    src/screens/auth/onboarding/screens/PhotoScreen.tsx \
    src/screens/auth/onboarding/CinematicOnboardingFlow.tsx && \
  git commit -m "feat(onboarding): add PhotoScreen — 3+2 photo grid at step 2"
  ```
