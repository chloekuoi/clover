# Role & Desired-Roles Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic work-arrangement options in the onboarding "9-to-5" question with role-based professional options, add a "who are you looking to meet?" question, and surface both as pills in the discovery profile view.

**Architecture:** Reuse the existing `work_type` column (just update what values go in it), add one new `desired_roles TEXT` column via migration. A new `LookingForScreen` is inserted as step 4 in the onboarding flow (shifting Notifications/ContactSync/Success to 5/6/7). Discovery SwipeCard gets a styled chip; UserProfileView gets a new "looking for" pill when `desired_roles` is set and not "Open to anyone".

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, Supabase (Postgres), react-native-svg

---

## File Map

| File | Action | What Changes |
|------|--------|--------------|
| `supabase/011_desired_roles.sql` | **Create** | ADD COLUMN desired_roles TEXT |
| `src/types/index.ts` | Modify | Add `desired_roles: string \| null` to Profile type |
| `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx` | Modify | Add `desiredRoles: string[]` to OnboardingState, TOTAL_STEPS 7→8, import + wire LookingForScreen as case 4, shift cases 4-6 → 5-7 |
| `src/screens/auth/onboarding/onboardingService.ts` | Modify | Save `desired_roles` field on completeOnboarding |
| `src/screens/auth/onboarding/screens/AboutScreen.tsx` | Modify | New WORK_OPTIONS (8 items), "Other" reveals TextInput |
| `src/screens/auth/onboarding/screens/LookingForScreen.tsx` | **Create** | New step 4 — "who are you looking to meet?" multi-select |
| `src/screens/profile/EditProfileScreen.tsx` | Modify | New WORK_TYPES (8 items), "Other" triggers Alert.prompt |
| `src/components/discover/SwipeCard.tsx` | Modify | Replace plain-text profession with styled chip |
| `src/components/profile/UserProfileView.tsx` | Modify | Add PeopleIcon, add desired_roles pill |

---

## Chunk 1: Data Layer

### Task 1: Supabase migration

**Files:**
- Create: `supabase/011_desired_roles.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/011_desired_roles.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS desired_roles TEXT;
```

- [ ] **Step 2: Verify file exists**

Run: `ls supabase/ | grep 011`
Expected: `011_desired_roles.sql`

---

### Task 2: TypeScript Profile type

**Files:**
- Modify: `src/types/index.ts:3-23`

- [ ] **Step 1: Add desired_roles field to Profile type**

In `src/types/index.ts`, add one line after `work_type: string | null;` (line 9):

```ts
// Before (line 9):
  work_type: string | null;
  interests: string[] | null;

// After:
  work_type: string | null;
  desired_roles: string | null;
  interests: string[] | null;
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output (clean compile)

---

### Task 3: OnboardingState — add desiredRoles field

**Files:**
- Modify: `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx:15-51`

- [ ] **Step 1: Add desiredRoles to OnboardingState interface**

In `CinematicOnboardingFlow.tsx`, update the interface (currently lines 15-24):

```ts
// Before:
export interface OnboardingState {
  name: string;
  photoUri: string | null;
  birthday: string;
  workType: string[];
  currentlyWorkingOn: string;
  school: string;
  notificationsGranted: boolean;
  contactsGranted: boolean;
}

// After:
export interface OnboardingState {
  name: string;
  photoUri: string | null;
  birthday: string;
  workType: string[];
  desiredRoles: string[];
  currentlyWorkingOn: string;
  school: string;
  notificationsGranted: boolean;
  contactsGranted: boolean;
}
```

- [ ] **Step 2: Add desiredRoles to INITIAL_STATE**

Update `INITIAL_STATE` (currently lines 42-51):

```ts
// Before:
const INITIAL_STATE: OnboardingState = {
  name: '',
  photoUri: null,
  birthday: '',
  workType: [],
  currentlyWorkingOn: '',
  school: '',
  notificationsGranted: false,
  contactsGranted: false,
};

// After:
const INITIAL_STATE: OnboardingState = {
  name: '',
  photoUri: null,
  birthday: '',
  workType: [],
  desiredRoles: ['Open to anyone'],
  currentlyWorkingOn: '',
  school: '',
  notificationsGranted: false,
  contactsGranted: false,
};
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

---

### Task 4: onboardingService — save desired_roles

**Files:**
- Modify: `src/screens/auth/onboarding/onboardingService.ts:26-34`

- [ ] **Step 1: Add desired_roles to the .update() call**

In `onboardingService.ts`, add one line inside the `.update({...})` object (after the `work_type` line, currently line 29):

```ts
// Before:
    .update({
      name: state.name.trim() || null,
      birthday: state.birthday || null,
      work_type: (state.workType as string[]).length > 0 ? (state.workType as string[]).join(', ') : null,
      currently_working_on: state.currentlyWorkingOn.trim() || null,
      school: state.school.trim() || null,
      onboarding_complete: true,
    })
    .eq('id', userId);

// After:
    .update({
      name: state.name.trim() || null,
      birthday: state.birthday || null,
      work_type: (state.workType as string[]).length > 0 ? (state.workType as string[]).join(', ') : null,
      desired_roles: state.desiredRoles.length > 0 ? state.desiredRoles.join(', ') : null,
      currently_working_on: state.currentlyWorkingOn.trim() || null,
      school: state.school.trim() || null,
      onboarding_complete: true,
    })
    .eq('id', userId);
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 3: Commit Chunk 1**

```bash
git add supabase/011_desired_roles.sql src/types/index.ts src/screens/auth/onboarding/CinematicOnboardingFlow.tsx src/screens/auth/onboarding/onboardingService.ts
git commit -m "feat(data): add desired_roles column, Profile type field, and onboarding state"
```

---

## Chunk 2: Onboarding Screens

### Task 5: Update AboutScreen — new role options + "Other" text input

**Files:**
- Modify: `src/screens/auth/onboarding/screens/AboutScreen.tsx`

- [ ] **Step 1: Replace WORK_OPTIONS array**

Replace lines 22-29 (the WORK_OPTIONS const):

```ts
// Before:
const WORK_OPTIONS = [
  'Founder',
  'Freelancer',
  'Remote employee',
  'Student',
  'Creator',
  'Digital nomad',
];

// After:
const WORK_OPTIONS = [
  'Solo founder',
  'Technical / Engineer',
  'Designer',
  'Marketer / Growth',
  'Product',
  'Operator',
  'Investor',
  'Other',
];
```

- [ ] **Step 2: Add otherText state and handleNext with substitution**

After the `toggleWorkType` function (currently ends at line 42), add a new local state and a wrapped next handler. Also add `useState` to the React import.

First, ensure `useState` is imported. The file currently has:
```ts
import React from 'react';
```
Change to:
```ts
import React, { useState } from 'react';
```

Then, inside the `AboutScreen` function body, after `const toggleWorkType = ...` (after line 42), insert:

```ts
  const [otherText, setOtherText] = useState('');

  const handleNext = () => {
    if (selectedTypes.includes('Other') && otherText.trim()) {
      setState(s => ({
        ...s,
        workType: (s.workType as string[]).map(w =>
          w === 'Other' ? otherText.trim() : w
        ),
      }));
    }
    onNext();
  };
```

- [ ] **Step 3: Replace the ProgressBar's onNext prop with handleNext**

Currently at line 119:
```tsx
        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={onNext}
        />
```

Change `onNext={onNext}` → `onNext={handleNext}`:
```tsx
        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          onBack={onBack}
          onNext={handleNext}
        />
```

- [ ] **Step 4: Add "Other" TextInput after the options list**

The options list currently ends at line 112 (`</TouchableOpacity>` + closing `})`). After the `{WORK_OPTIONS.map(...)}` block and before `</ScrollView>`, insert:

```tsx
          {selectedTypes.includes('Other') ? (
            <TextInput
              style={[styles.input, styles.otherInput]}
              value={otherText}
              onChangeText={setOtherText}
              placeholder="your role…"
              placeholderTextColor={t.placeholder}
              autoCapitalize="none"
              autoFocus
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
              multiline={false}
              {...(Platform.OS === 'ios' ? { inputAccessoryViewID: KEYBOARD_ACCESSORY_ID } : null)}
            />
          ) : null}
```

- [ ] **Step 5: Add otherInput style**

In `StyleSheet.create`, after the `optionLabelSelected` style (line ~214), add:

```ts
  otherInput: {
    marginTop: 8,
    marginBottom: 4,
  },
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

---

### Task 6: Create LookingForScreen

**Files:**
- Create: `src/screens/auth/onboarding/screens/LookingForScreen.tsx`

- [ ] **Step 1: Create the file**

```tsx
import React from 'react';
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { onboardingTheme as t } from '../theme';
import { ProgressBar } from '../components/ProgressBar';
import { TypewriterText } from '../components/TypewriterText';
import type { ScreenProps } from '../CinematicOnboardingFlow';

const LOOKING_FOR_OPTIONS = [
  'Open to anyone',
  'Solo founder',
  'Technical / Engineer',
  'Designer',
  'Marketer / Growth',
  'Product',
  'Operator',
  'Investor',
];

export function LookingForScreen({ state, setState, onNext, onBack, currentStep, totalSteps }: ScreenProps) {
  const selected = state.desiredRoles as string[];

  const toggle = (option: string) => {
    setState(s => {
      const current = s.desiredRoles as string[];
      const next = current.includes(option)
        ? current.filter(r => r !== option)
        : [...current, option];
      return { ...s, desiredRoles: next };
    });
  };

  return (
    <Pressable style={styles.screen} onPress={Keyboard.dismiss}>
      <Text style={styles.wordmark}>cowork</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.spacer} />

        <TypewriterText
          text="who are you looking to meet?"
          style={styles.question}
          startDelay={300}
        />

        <View style={styles.divider} />
        {LOOKING_FOR_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.optionRow}
            onPress={() => toggle(option)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionLabel,
                selected.includes(option) && styles.optionLabelSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ProgressBar
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onNext}
      />
    </Pressable>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  question: {
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: t.divider,
  },
  optionRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: t.divider,
  },
  optionLabel: {
    fontFamily: t.fontSerif.light,
    fontSize: 17,
    color: t.placeholder,
    letterSpacing: 0.2,
    lineHeight: 22,
  },
  optionLabelSelected: {
    fontFamily: t.fontSerif.regular,
    color: t.text,
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

---

### Task 7: Wire LookingForScreen into CinematicOnboardingFlow

**Files:**
- Modify: `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx`

- [ ] **Step 1: Import LookingForScreen**

After the existing screen imports (line 13, after `SuccessScreen`), add:

```ts
import { LookingForScreen } from './screens/LookingForScreen';
```

- [ ] **Step 2: Increment TOTAL_STEPS**

Change line 40:
```ts
// Before:
const TOTAL_STEPS = 7;

// After:
const TOTAL_STEPS = 8;
```

- [ ] **Step 3: Update renderScreen() switch**

Replace the switch body (currently lines 92-99):

```tsx
// Before:
    switch (currentStep) {
      case 0: return <HookScreen {...props} />;
      case 1: return <IdentityScreen {...props} />;
      case 2: return <BirthdayScreen {...props} />;
      case 3: return <AboutScreen {...props} />;
      case 4: return <NotificationsScreen {...props} />;
      case 5: return <ContactSyncScreen {...props} />;
      case 6: return <SuccessScreen {...props} />;
      default: return null;
    }

// After:
    switch (currentStep) {
      case 0: return <HookScreen {...props} />;
      case 1: return <IdentityScreen {...props} />;
      case 2: return <BirthdayScreen {...props} />;
      case 3: return <AboutScreen {...props} />;
      case 4: return <LookingForScreen {...props} />;
      case 5: return <NotificationsScreen {...props} />;
      case 6: return <ContactSyncScreen {...props} />;
      case 7: return <SuccessScreen {...props} />;
      default: return null;
    }
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 5: Commit Chunk 2**

```bash
git add src/screens/auth/onboarding/screens/AboutScreen.tsx src/screens/auth/onboarding/screens/LookingForScreen.tsx src/screens/auth/onboarding/CinematicOnboardingFlow.tsx
git commit -m "feat(onboarding): add role options with Other text input and LookingForScreen step"
```

---

## Chunk 3: Discovery UI + EditProfileScreen

### Task 8: SwipeCard — role chip

**Files:**
- Modify: `src/components/discover/SwipeCard.tsx:108-110`

- [ ] **Step 1: Replace plain-text profession with styled chip**

Replace lines 108-110:

```tsx
// Before:
          {profile.work_type ? (
            <Text style={styles.profession}>{profile.work_type}</Text>
          ) : null}

// After:
          {profile.work_type ? (
            <View style={styles.roleChip}>
              <Text style={styles.roleChipText}>{profile.work_type}</Text>
            </View>
          ) : null}
```

- [ ] **Step 2: Replace the profession style with roleChip + roleChipText styles**

In `StyleSheet.create`, find and replace the `profession` style (lines 196-201):

```ts
// Before:
  profession: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing[2],
  },

// After:
  roleChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: spacing[2],
  },
  roleChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
```

Note: `borderRadius` is already imported from `'../../constants'` at line 5.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

---

### Task 9: UserProfileView — desired_roles pill

**Files:**
- Modify: `src/components/profile/UserProfileView.tsx`

- [ ] **Step 1: Add PeopleIcon component**

After the `BuildingIcon` function (currently ends around line 45), add a new icon:

```tsx
function PeopleIcon() {
  return (
    <Svg width={PILL_ICON_SIZE} height={PILL_ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke={PILL_ICON_COLOR} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}
```

- [ ] **Step 2: Update pills array to include desired_roles**

Find the `pills` array construction (lines 149-153):

```ts
// Before:
  const pills: { key: string; iconType: 'work' | 'location' | 'city'; label: string }[] = [
    ...(profile.work_type ? [{ key: 'work_type', iconType: 'work' as const, label: profile.work_type }] : []),
    ...(profile.neighborhood ? [{ key: 'neighborhood', iconType: 'location' as const, label: profile.neighborhood }] : []),
    ...(profile.city ? [{ key: 'city', iconType: 'city' as const, label: profile.city }] : []),
  ];

// After:
  const pills: { key: string; iconType: 'work' | 'location' | 'city' | 'people'; label: string }[] = [
    ...(profile.work_type ? [{ key: 'work_type', iconType: 'work' as const, label: profile.work_type }] : []),
    ...(profile.neighborhood ? [{ key: 'neighborhood', iconType: 'location' as const, label: profile.neighborhood }] : []),
    ...(profile.city ? [{ key: 'city', iconType: 'city' as const, label: profile.city }] : []),
    ...(profile.desired_roles && profile.desired_roles !== 'Open to anyone'
      ? [{ key: 'desired_roles', iconType: 'people' as const, label: `Looking for: ${profile.desired_roles}` }]
      : []),
  ];
```

- [ ] **Step 3: Add PeopleIcon to the pill renderer**

Find the pill icon renderer (around line 217):

```tsx
// Before:
                {pill.iconType === 'work' ? <BriefcaseIcon /> : pill.iconType === 'location' ? <PinIcon /> : <BuildingIcon />}

// After:
                {pill.iconType === 'work' ? <BriefcaseIcon /> : pill.iconType === 'location' ? <PinIcon /> : pill.iconType === 'city' ? <BuildingIcon /> : <PeopleIcon />}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

---

### Task 10: EditProfileScreen — new WORK_TYPES + Other prompt

**Files:**
- Modify: `src/screens/profile/EditProfileScreen.tsx:24-31`

- [ ] **Step 1: Replace WORK_TYPES array**

Replace lines 24-31:

```ts
// Before:
const WORK_TYPES = [
  'Remote Employee',
  'Freelancer',
  'Founder',
  'Student',
  'Digital Nomad',
  'Other',
];

// After:
const WORK_TYPES = [
  'Solo founder',
  'Technical / Engineer',
  'Designer',
  'Marketer / Growth',
  'Product',
  'Operator',
  'Investor',
  'Other',
];
```

- [ ] **Step 2: Update handleWorkTypePress to handle "Other" with custom text**

Find `handleWorkTypePress` (lines 301-310). Replace it entirely:

```ts
// Before:
  const handleWorkTypePress = useCallback(() => {
    if (saving || photoBusy) return;
    Alert.alert('Work type', 'Select your work type', [
      ...WORK_TYPES.map((type) => ({
        text: type,
        onPress: () => setForm((prev) => ({ ...prev, work_type: type })),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, [saving, photoBusy]);

// After:
  const handleWorkTypePress = useCallback(() => {
    if (saving || photoBusy) return;
    Alert.alert('Work type', 'Select your work type', [
      ...WORK_TYPES.map((type) => ({
        text: type,
        onPress: () => {
          if (type === 'Other') {
            if (Platform.OS === 'ios') {
              Alert.prompt(
                'Your role',
                'Enter your role',
                (text) => {
                  const trimmed = text?.trim();
                  setForm((prev) => ({ ...prev, work_type: trimmed || 'Other' }));
                },
                'plain-text',
                '',
              );
            } else {
              setForm((prev) => ({ ...prev, work_type: 'Other' }));
            }
          } else {
            setForm((prev) => ({ ...prev, work_type: type }));
          }
        },
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }, [saving, photoBusy]);
```

Note: `Platform` is already imported at line 6.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no output

- [ ] **Step 4: Commit Chunk 3**

```bash
git add src/components/discover/SwipeCard.tsx src/components/profile/UserProfileView.tsx src/screens/profile/EditProfileScreen.tsx
git commit -m "feat(discovery): role chip on swipe card and desired-roles pill on profile; update EditProfileScreen roles"
```

---

## Verification

After all tasks:

1. Run: `npx tsc --noEmit` — expect clean compile
2. Run: `npm run ios` — launch on iOS simulator
3. Create a new account and step through onboarding:
   - Step 3 (AboutScreen): Should show 8 options (Solo founder … Investor … Other). Select "Other" → a text input should appear. Type a role. Tap Next.
   - Step 4 (LookingForScreen — NEW): Should show "who are you looking to meet?" with "Open to anyone" pre-selected + 7 role options. Test toggling options. Tap Next.
   - Remaining steps (Notifications, ContactSync, Success) should be at steps 5-7 (progress bar advances correctly)
4. After completing onboarding, check Supabase: `profiles` row for the test user should have `work_type` = custom role text, `desired_roles` = selected meeting preferences
5. Navigate to Discover tab — SwipeCard should show a rounded chip (not plain text) for the role
6. Tap a profile card — UserProfileView should show role pill (briefcase) and, if `desired_roles` is not "Open to anyone", a people-icon pill reading "Looking for: …"
7. Navigate to Profile → Edit Profile — should show 8 new role options (Solo founder … Other); selecting Other on iOS should prompt for custom text

---

## Notes

- **Existing `work_type` data:** Old values (Founder, Freelancer, etc.) remain in DB for existing users — no migration needed. They'll see stale data only if they re-edit their profile, at which point they can re-select from the new list.
- **Migration number:** `011` — files `001–010` already exist in `supabase/`.
- **"Open to anyone" storage:** Stored as literal string in `desired_roles`. The pill is suppressed when this value is set — it's the default preference and not useful to display.
- **Android + Other in EditProfileScreen:** `Alert.prompt` is iOS-only. On Android, selecting "Other" sets `work_type = 'Other'` without a custom text prompt — acceptable for MVP.
- **jest test environment:** Pre-existing failure (jest 30 / jest-expo 47 incompatibility) affects all tests. Not a blocker for this feature.
