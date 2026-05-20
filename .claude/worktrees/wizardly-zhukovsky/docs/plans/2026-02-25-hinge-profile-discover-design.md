# Hinge-Style Profile + Discover Tap-to-Expand — Design Doc

**Date:** 2026-02-25
**Status:** Approved

---

## Overview

Two connected changes:

1. **Profile UI refresh** — update the Profile tab to use a Hinge-style layout: scrollable attribute pills row (age, work type, city) beneath the name, then flat field rows, then Today's Focus card, then remaining photos.
2. **Discover tap-to-expand** — when a user taps a swipe card on the Discover screen, a full-screen modal slides up showing the other user's full profile with **Skip** / **Connect** action buttons.

---

## Architecture — Option A: Shared `UserProfileView` Component

A single `UserProfileView` component renders the full profile content (photos, pills, fields, Today's Focus). It is used in two places:

- **`ProfileScreen`** — own profile, read-only, with pencil header icon to navigate to Edit Profile
- **`UserProfileModal`** — other users' profiles, triggered from Discover, with Skip/Connect action bar at the bottom

This avoids duplicating the layout and keeps styling consistent across both surfaces.

---

## Screen Layout

### Content order (both own and others' profiles)

```
1. Main profile photo        (tall, aspectRatio 1:1.1)
2. Bio card                  (name + age · pills row · flat field rows)
3. Today's Focus card        (active state or empty CTA)
4. Remaining photos          (landscape, aspectRatio 16:9, with prompt labels)
```

---

## Component Specs

### `UserProfileView` (new shared component)

**Props:**
```ts
interface UserProfileViewProps {
  profile: Profile;
  photos: ProfilePhoto[];
  todayIntent: WorkIntent | null;
  // own profile only — omit on others' profiles
  onEditPress?: () => void;
}
```

**Sections:**

#### Attribute Pills Row
- Single horizontal scrollable row (`flexWrap: 'nowrap'`, `ScrollView` horizontal)
- Fades at right edge to hint at overflow
- Pills: **Age** (computed from birthday), **Work type**, **City**
- Style: `backgroundColor: colors.accentPrimaryLight`, `color: colors.accentPrimary`, 13px 600w, `borderRadius: borderRadius.full`
- Pill icons: 💼 work type · 📍 neighbourhood · 🏙️ city

#### Flat Field Rows
- Edge-to-edge white background (`marginHorizontal: -spacing[4]`)
- Groups: About You · Work & School · Location
- Empty fields hidden; empty groups + their separator hidden
- Same `fieldRow`, `fieldLabel`, `fieldValue`, `groupSep` styles as `EditProfileScreen`

#### Today's Focus Card
- **Active**: green background (`colors.accentPrimaryLight`), green border, task + work style + location + time
- **Empty (own profile)**: dashed border, "Share what you're working on today" + "Set Today's Focus" CTA → Discover tab
- **Empty (others' profiles)**: hide the card entirely (don't show a CTA)

#### Photos
- Position 0: `aspectRatio: 1 / 1.1` (tall primary)
- Position > 0: `aspectRatio: 16 / 9` (landscape)
- Prompt label overlaid at bottom-left of each photo
- Only filled photos rendered

---

### `UserProfileModal` (new component)

Wraps `UserProfileView` in a React Native `Modal` (animationType: `'slide'`, presentationStyle: `'pageSheet'`).

**Sticky action bar (bottom):**

| Button | Style |
|--------|-------|
| **Skip** | `background: #FFF0F0`, `border: #F5C2C2`, `color: #C0392B` |
| **Connect** | `background: #EAF2EE`, `border: #C4DDD0`, `color: #2C6044` |

- "Connect" triggers the same swipe-right action as swiping right on the card
- "Skip" triggers the same swipe-left action as swiping left on the card
- Modal closes after either action

**Header:**
- Drag handle bar at top (dismiss by swiping down)
- No explicit close button — handle + back swipe is sufficient

---

### Changes to Discover

**`SwipeCard`** — add `onPress` prop that opens the modal
**`CardStack`** (or `DiscoverScreen`) — hold `selectedCard` state, render `UserProfileModal` when set

Data already available on `DiscoveryCard`:
```ts
{ profile: Profile; intent: WorkIntent; distance: number }
```
No new API calls needed for the modal — all data is already fetched.

---

### Changes to `ProfileScreen`

- Replaces current bespoke layout with `<UserProfileView>` + own-profile extras
- Header stays: "Profile" title centred + ✏️ pencil icon → EditProfile
- Sign out link stays at the bottom, below `UserProfileView`

---

## Files Affected

| File | Change |
|------|--------|
| `src/components/profile/UserProfileView.tsx` | **Create** — shared profile layout component |
| `src/components/discover/UserProfileModal.tsx` | **Create** — modal wrapper with Skip/Connect bar |
| `src/screens/profile/ProfileScreen.tsx` | Refactor to use `UserProfileView` |
| `src/components/discover/SwipeCard.tsx` | Add `onPress` prop |
| `src/components/discover/CardStack.tsx` | Add modal state + render `UserProfileModal` |
| `src/services/discoveryService.ts` | Read-only reference (no changes) |

---

## Mockup

`docs/mockups/hinge-profile-redesign.html`

---

## Out of Scope

- Editing profile from the modal (others' profiles are always read-only)
- Super-like or other action variants
- Distance shown on profile modal (already visible on the card before tapping)
