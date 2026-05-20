# PHASE 6 — Friend Profile View

**Status:** PLANNED
**Phase:** 6
**Depends on:** Phase 5 (CERTIFIED COMPLETE — 2026-02-26)

---

## Goal

Users can tap a friend's avatar on the Friends screen to open a full read-only profile modal, enabling them to view a friend's complete profile (photos, bio, Today's Focus, work details) before deciding whether to message.

---

## Scope

### In
- Tappable avatar zone on `FriendCard` → opens profile modal
- `FriendProfileModal`: full profile view + `💬` chat icon in top-right header corner
- On-demand Supabase fetch: full profile (`profiles` + `profile_photos`) + today's intent (`work_intents`) when avatar is tapped
- `💬` icon tapped inside modal → dismisses modal and opens chat

### Out
- No new Supabase tables or RPCs
- No changes to friend request flow, chat, or matching
- No profile editing from this modal
- No changes to `UserProfileView` component
- No changes to `FriendsStack` navigator (modal approach, no new route)
- No changes to `FriendRequestCard` or `UserSearchResultCard`

---

## Tickets

---

### P6-01 — Create `FriendProfileModal` component

**Goal:** A bottom sheet modal that shows a friend's full read-only profile using `UserProfileView`, with a `💬` chat icon pinned to the top-right corner of the header.

**Scope:**
- IN: New component at `src/components/friends/FriendProfileModal.tsx`
- IN: `loading` spinner state while profile data is being fetched
- IN: Header row — centered drag handle + `💬` icon absolutely positioned top-right
- IN: Scrollable `UserProfileView` body (`isOwnProfile={false}`)
- IN: Modal uses `presentationStyle="pageSheet"` (iOS sheet with swipe-to-dismiss)
- OUT: No bottom action bar

**Dependencies:** None (standalone new component)

**Definition of Done:**
- Component renders without TypeScript errors
- When `visible=true` and `loading=true`: shows `ActivityIndicator` centered in the sheet
- When `visible=true`, `loading=false`, and `profile` is non-null: shows full `UserProfileView`
- `💬` icon is visible in top-right of header at all times (including while loading)
- Tapping `💬` icon calls `onMessage`
- Swiping down the sheet calls `onDismiss` (iOS pageSheet native behavior)
- `npx tsc --noEmit` passes with zero errors

---

### P6-02 — Modify `FriendCard` to add avatar tap zone

**Goal:** The avatar on a `FriendCard` becomes its own independently tappable zone (opens profile), while the rest of the card retains its existing press behavior (opens chat).

**Scope:**
- IN: Add optional prop `onProfilePress?: () => void` to `FriendCard`
- IN: Wrap the avatar `<View style={styles.avatar}>` in an inner `<TouchableOpacity>` that calls `onProfilePress`
- IN: Inner touchable is `disabled` when `onProfilePress` is undefined
- OUT: No change to outer card `onPress` behavior (chat)
- OUT: No visual style changes to the card layout

**Dependencies:** None (isolated component change)

**Definition of Done:**
- Tapping the avatar fires `onProfilePress`, not `onPress`
- Tapping outside the avatar (name text, meta text, availability dot, card background) still fires `onPress`
- When `onProfilePress` is not provided, avatar tap has no effect
- `npx tsc --noEmit` passes with zero errors

---

### P6-03 — Wire profile fetch and modal state in `FriendsScreen`

**Goal:** Tapping a friend's avatar fetches their full profile and today's intent from Supabase, then opens the profile modal.

**Scope:**
- IN: Three new state fields: `profileModalFriend`, `profileLoading`, `profileData`
- IN: `handleOpenProfile(friend)` — opens modal immediately (spinner), fetches `getFullProfile` + `getTodayIntent` in parallel, then sets data
- IN: `onProfilePress` passed to every `FriendCard` in the available and not-available lists
- IN: `FriendProfileModal` rendered at the bottom of the screen JSX
- IN: `onMessage` handler: close modal → call `openChat(profileModalFriend)`
- OUT: No changes to `openChat`, `handleRespond`, or data loading logic
- OUT: No changes to `FriendRequestCard` rows

**Dependencies:** P6-01 (`FriendProfileModal` exists), P6-02 (`FriendCard` accepts `onProfilePress`)

**Definition of Done:**
- Tapping avatar on any friend card (available or not-available section) opens the modal
- Modal shows loading spinner while fetch is in progress
- Modal shows full profile after fetch completes
- Tapping `💬` in modal closes the modal and opens the correct friend's chat
- Tapping elsewhere on the card (name, meta, rest of row) still opens chat directly (unchanged)
- `npx tsc --noEmit` passes with zero errors

---

## Key Utilities to Reuse

| Utility | File | Notes |
|---------|------|-------|
| `getFullProfile(userId)` | `src/services/profileService.ts` | Returns `{ profile: Profile \| null, photos: ProfilePhoto[] }` |
| `getTodayIntent(userId)` | `src/services/discoveryService.ts` | Returns `WorkIntent \| null` |
| `UserProfileView` | `src/components/profile/UserProfileView.tsx` | Pass `isOwnProfile={false}`, `photos` optional (falls back to `profile.photo_url`) |
| `UserProfileModal` | `src/components/discover/UserProfileModal.tsx` | Structural reference for modal shell pattern |
| `Profile`, `ProfilePhoto`, `WorkIntent` | `src/types/index.ts` | Existing types, no changes needed |

---

## No Database Changes

Phase 6 introduces no new tables, columns, or RPCs. It reads from existing tables:
- `profiles` — via `getFullProfile`
- `profile_photos` — via `getFullProfile`
- `work_intents` — via `getTodayIntent`
