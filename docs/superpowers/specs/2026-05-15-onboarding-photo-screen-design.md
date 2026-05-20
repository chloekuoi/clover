# Design Spec: Onboarding Photo Screen

**Date:** 2026-05-15
**Status:** Approved

---

## Overview

Add a dedicated photo upload screen to the cinematic onboarding flow, placed immediately after the Identity screen (name + profile photo circle). The screen presents a 3+2 grid of 5 photo slots with the same prompts used in Edit Profile. Photos are optional — the screen is always skippable.

---

## Screen: PhotoScreen

### Placement
Step 2 in the flow, right after IdentityScreen. Total steps increase from 9 to 10 (`TOTAL_STEPS = 10`).

**Updated flow:**

| Step | Screen |
|------|--------|
| 0 | Hook |
| 1 | Identity — name + photo circle (slot 0) |
| 2 | **Photos (new)** |
| 3 | Birthday |
| 4 | Building |
| 5 | About (role) |
| 6 | Looking For |
| 7 | Notifications |
| 8 | Contact Sync |
| 9 | Success |

### Layout
- Follows the cinematic onboarding aesthetic: cream background (`t.bg`), dark green text, serif fonts, lower-anchor layout (wordmark at top, `spacer: flex:1` pushes content down)
- TypewriterText question: `"put a face to the name."` with `startDelay={300}`
- **3+2 photo grid** (see Grid sizing below)
- `"skip for now"` text link sits between the grid and the ProgressBar, calls `onNext` directly — same pattern as NotificationsScreen and ContactSyncScreen
- `ProgressBar` at bottom, always has `onNext` (photos optional), `nextLabel="skip"` — label does not change based on whether photos have been added

### "skip for now" style
Matches the skip link on NotificationsScreen/ContactSyncScreen:
```ts
skip: { paddingVertical: 4 },
skipText: {
  fontFamily: t.fontSans.light,
  fontSize: 12,
  color: t.placeholder,
},
```

### Grid sizing
Available width = `screenWidth - 2 * t.screenPaddingH` (i.e., screen width minus the 28px horizontal padding on each side).

- **Column gap:** 6px; **Row gap:** 6px
- Each slot width = `(availableWidth - 2 * 6) / 3`
- Each slot height = slot width (1:1 aspect ratio, square slots)
- Bottom row: 2 slots + 1 invisible `View` (same dimensions as a slot, `backgroundColor: 'transparent'`) for left-alignment

### Photo slots

| Position | Prompt | Subtitle |
|----------|--------|----------|
| 0 | Hi, I'm a real person 👋 | Not a stock photo, promise |
| 1 | Proof I touch grass sometimes | Hobbies, activities, general humanness |
| 2 | What my camera roll actually looks like | Candid is an understatement |
| 3 | Currently building something... | Still figuring it out, send help |
| 4 | Add photo 5 | *(none)* |

These prompts and subtitles are hard-coded in `PhotoScreen.tsx`. No changes are made to `PHOTO_PROMPTS` or `PHOTO_SUBTITLES` in `EditProfileScreen.tsx`.

- Slot 0 has a green dashed border (`t.accentDark`) to distinguish it as primary; all other slots use a muted cream fill (`rgba(12,31,14,0.06)`)
- Slot 0 is pre-populated if the user already picked a photo on IdentityScreen (shows the image instead of the prompt)
- Tapping a filled slot re-opens the image picker (replaces the photo)
- Tapping an empty slot opens the image picker
- Each slot uses `pickImage()` from `photoService` (handles permissions + library launch)
- No delete action on this screen — users can manage photos in Edit Profile after onboarding

### Implementation note
`PhotoScreen` is a **custom component** using onboarding theming (`onboardingTheme`). It does not reuse the existing `PhotoSlots` component, which is styled for the main-app theme.

---

## State changes

### `OnboardingState` (CinematicOnboardingFlow.tsx)

Replace:
```ts
photoUri: string | null;
```
With:
```ts
photoUris: (string | null)[];   // index = position (0–4)
```

`INITIAL_STATE` initialises as:
```ts
photoUris: [null, null, null, null, null],
```

Also update: `TOTAL_STEPS: 9 → 10`.

### IdentityScreen.tsx

**Picker call:** No change — keep the existing inline `ImagePicker.launchImageLibraryAsync` call. Only the state write changes.

```ts
// Before
setState(s => ({ ...s, photoUri: result.assets[0].uri }));

// After
setState(s => {
  const next = [...s.photoUris];
  next[0] = result.assets[0].uri;
  return { ...s, photoUris: next };
});
```

Read also changes:
```ts
// Before
state.photoUri

// After
state.photoUris[0]
```

### PhotoScreen.tsx

Each slot reads `state.photoUris[position]`. The write uses the same array-copy pattern:
```ts
setState(s => {
  const next = [...s.photoUris];
  next[position] = uri;
  return { ...s, photoUris: next };
});
```

---

## Upload changes (onboardingService.ts)

Replace:
```ts
if (state.photoUri) {
  await uploadPhoto(userId, state.photoUri, 0).catch(() => {
    // Photo upload failure shouldn't block onboarding
  });
}
```

With:
```ts
await Promise.allSettled(
  state.photoUris.map((uri, position) =>
    uri ? uploadPhoto(userId, uri, position) : Promise.resolve()
  )
);
// Photo upload failures don't block onboarding (Promise.allSettled never rejects)
```

`Promise.allSettled` preserves the original intent — upload failures are silently ignored and onboarding completion is never blocked.

---

## Files to create / modify

| File | Change |
|------|--------|
| `src/screens/auth/onboarding/screens/PhotoScreen.tsx` | **Create** — 3+2 grid, prompts, TypewriterText, pickImage |
| `src/screens/auth/onboarding/CinematicOnboardingFlow.tsx` | `photoUri` → `photoUris[]`, `TOTAL_STEPS` 9→10, import + wire `PhotoScreen` as case 2, shift cases 3–9 |
| `src/screens/auth/onboarding/screens/IdentityScreen.tsx` | Circle reads/writes `photoUris[0]`; picker call unchanged |
| `src/screens/auth/onboarding/onboardingService.ts` | Replace single `uploadPhoto` call with `Promise.allSettled` loop over `photoUris` |

---

## Out of scope

- Deleting or reordering photos within the onboarding flow (available in Edit Profile)
- Camera capture (library picker only, consistent with existing IdentityScreen behaviour)
- Showing upload progress during the photo step (uploads happen at completion in SuccessScreen)
- Changes to `PHOTO_PROMPTS` / `PHOTO_SUBTITLES` in `EditProfileScreen.tsx`
