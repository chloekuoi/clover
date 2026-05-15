# PHASE 6 — Friend Profile View: Implementation Map

**Status:** IN PROGRESS
**Phase:** 6

> This document is a pre-implementation scaffold. After Codex implements each ticket, update the Status field and Verification column with actual results.

---

## Baseline Findings

- Branch: `feat/phase6-baseline`
- Baseline-only scope applied: fixed no feature code, only verified boot blockers
- Commands run:
  - `npm install`
  - `npx tsc --noEmit`
  - `CI=1 npx expo start --clear --port 8082`
- Results:
  - Dependencies installed successfully
  - TypeScript compile check passed (0 errors)
  - Expo Metro reached `Waiting on http://localhost:8082` with no startup fatal errors
  - Existing user Expo session on `8081` was preserved
- Baseline boot status: PASS

---

## P6-01 — `FriendProfileModal` component

**Status:** DONE

**Files changed:**
- `src/components/friends/FriendProfileModal.tsx`
- `docs/PHASE_6_IMPLEMENTED.md`

**Verification performed:**
- RUNBOOK Flows 34-38: manual in-app execution BLOCKED in this environment (simulator/UI interaction not available)
- Local verification PASS: `npx tsc --noEmit`
- Local verification PASS: modal shell includes `presentationStyle="pageSheet"`, persistent top-right `💬` action, loading `ActivityIndicator`, and `UserProfileView` render path

**Intended Behavior:**
Bottom sheet modal (`presentationStyle="pageSheet"`) that renders a friend's read-only profile. Header row contains a centered drag handle and a `💬` icon absolutely positioned in the top-right corner. Body is a `ScrollView` wrapping `UserProfileView` with `isOwnProfile={false}`. While `loading` is true, the body area shows a centered `ActivityIndicator`. The `💬` icon remains visible during loading so the user can dismiss immediately if desired.

**Expected File Paths:**
- Create: `src/components/friends/FriendProfileModal.tsx`

**Props interface:**
```ts
interface FriendProfileModalProps {
  visible: boolean;
  profile: Profile | null;
  photos: ProfilePhoto[];
  intent: WorkIntent | null;
  loading: boolean;
  onDismiss: () => void;
  onMessage: () => void;
}
```

**Verification:** RUNBOOK Phase 6 — Flow 34 (Open profile modal from Friends tab)

**Known Risks / TODOs:**
- If `profile` is null after fetch completes (deleted account edge case), modal will show spinner indefinitely. Consider adding error state.
- Test on Android: `presentationStyle="pageSheet"` is iOS-only; on Android, `Modal` renders full-screen. Verify UX is acceptable or add Android-specific adjustments.

---

## P6-02 — `FriendCard` split tap zones

**Status:** DONE

**Files changed:**
- `src/components/friends/FriendCard.tsx`
- `docs/PHASE_6_IMPLEMENTED.md`

**Verification performed:**
- RUNBOOK Flows 34-38: manual in-app execution BLOCKED in this environment (simulator/UI interaction not available)
- Local verification PASS: `npx tsc --noEmit`
- Local verification PASS: avatar is wrapped in an inner `TouchableOpacity` with optional `onProfilePress`, while outer card `onPress` remains unchanged for chat

**Intended Behavior:**
Inner `TouchableOpacity` wrapping only the avatar `<View>`. When `onProfilePress` is provided and user taps the avatar, `onProfilePress` fires. When user taps anywhere else on the card (name, meta text, availability dot, card body), the outer `onPress` (chat) fires. When `onProfilePress` is not provided, the inner touchable is `disabled={true}` so the outer press still fires on avatar tap.

**Expected File Paths:**
- Modify: `src/components/friends/FriendCard.tsx`

**Verification:** RUNBOOK Phase 6 — Flow 35 (Verify card tap zones)

**Known Risks / TODOs:**
- React Native nested `TouchableOpacity` event propagation: inner press must NOT bubble to outer. This works correctly on iOS; verify on Android emulator.
- Avatar is 40×40pt — within the 44pt minimum touch target guideline when combined with padding. No size change needed.

---

## P6-03 — `FriendsScreen` wiring

**Status:** DONE

**Files changed:**
- `src/screens/friends/FriendsScreen.tsx`
- `docs/PHASE_6_IMPLEMENTED.md`

**Verification performed:**
- RUNBOOK Flows 34-38: manual in-app execution BLOCKED in this environment (simulator/UI interaction not available)
- Local verification PASS: `npx tsc --noEmit`
- Local verification PASS: `FriendsScreen` now opens modal with loading state, fetches `getFullProfile` + `getTodayIntent` in parallel, wires avatar `onProfilePress` for both friend sections, and routes modal `💬` action to `openChat`

**Intended Behavior:**
Three new state fields track the target friend, loading state, and fetched data. `handleOpenProfile(friend)` opens the modal immediately (spinner visible), then calls `getFullProfile` and `getTodayIntent` in parallel via `Promise.all`. On resolution, sets `profileData` and clears loading. `FriendProfileModal` is rendered at the bottom of the JSX tree outside the `ScrollView`. When `onMessage` fires, modal closes and `openChat(profileModalFriend)` is called.

**Expected File Paths:**
- Modify: `src/screens/friends/FriendsScreen.tsx`

**New Imports Required:**
- `getFullProfile` from `../../services/profileService`
- `getTodayIntent` from `../../services/discoveryService`
- `FriendProfileModal` from `../../components/friends/FriendProfileModal`
- `Profile`, `ProfilePhoto`, `WorkIntent` from `../../types`

**Verification:** RUNBOOK Phase 6 — Flows 34–38

**Known Risks / TODOs:**
- Race condition: if user taps two different friend avatars quickly, the second fetch resolves and overwrites `profileData` while the first modal is open. For MVP this is acceptable (latest data wins). Post-MVP: add request cancellation or a request ID guard.
- `getTodayIntent` may return null if the friend has no intent today — `UserProfileView` handles null gracefully (hides the Today's Focus card on non-own profiles).

---

## TypeScript

All new and modified files must pass `npx tsc --noEmit` with zero errors before marking any ticket complete.

---

## Phase 6 Exit Gate Results

**Exit Gate Status:** FAIL (Phase 6 flows pass; prior-phase full regression flows 1-33 still not fully re-verified in this run)

**Local verification (non-RUNBOOK manual):**
- PASS: `npx tsc --noEmit`
- PASS: `CI=1 npx expo start --clear --port 8083` reached `Waiting on http://localhost:8083` without startup fatal errors

**RUNBOOK Flow Results (PASS / FAIL):**
- Flow 1 — Create Account: FAIL (blocked: manual app + Supabase verification required)
- Flow 2 — Complete Onboarding: FAIL (blocked: manual app + Supabase verification required)
- Flow 3 — Create Intent: FAIL (blocked: manual app + Supabase verification required)
- Flow 4 — See Discovery Feed: FAIL (blocked: manual app + test accounts required)
- Flow 5 — Swipe Left / Right: FAIL (blocked: manual app + multi-user test required)
- Flow 6 — Messaging: FAIL (blocked: manual app verification required)
- Flow 7 — Verify Phase 3 Database: FAIL (blocked: direct Supabase SQL/Dashboard verification required)
- Flow 8 — Match Creation via Swipe: FAIL (blocked: manual app + multi-user test required)
- Flow 9 — Match Modal: FAIL (blocked: manual app verification required)
- Flow 10 — Chat Send and Receive Messages: FAIL (blocked: manual app realtime verification required)
- Flow 11 — Matches List: FAIL (blocked: manual app verification required)
- Flow 12 — Unread Message Badge: FAIL (blocked: manual app verification required)
- Flow 13 — Verify Phase 4 Database: FAIL (blocked: direct Supabase SQL/Dashboard verification required)
- Flow 14 — Send Cowork Invite from Chat: FAIL (blocked: manual app verification required)
- Flow 15 — Accept and Decline Invite: FAIL (blocked: manual app + multi-user test required)
- Flow 16 — Dual-Lock Confirmation: FAIL (blocked: manual app + multi-user test required)
- Flow 17 — Cancel Invite: FAIL (blocked: manual app verification required)
- Flow 18 — Auto-Cancel Stale Sessions: FAIL (blocked: manual app + database time-based verification required)
- Flow 19 — Multiple Pending Invites: FAIL (blocked: manual app + multi-chat test required)
- Flow 20 — Verify Phase 5 Database: FAIL (blocked: direct Supabase SQL/Dashboard verification required)
- Flow 21 — Search Users and Send Friend Request: FAIL (blocked: manual app + multi-user test required)
- Flow 22 — Accept Friend Request: FAIL (blocked: manual app + multi-user test required)
- Flow 23 — Decline Friend Request: FAIL (blocked: manual app + multi-user test required)
- Flow 24 — Mutual Request Auto-Accept: FAIL (blocked: manual app + multi-user test required)
- Flow 25 — Friends List with Availability: FAIL (blocked: manual app + seeded intent data required)
- Flow 26 — Profile Screen Verification: FAIL (blocked: manual app visual verification required)
- Flow 27 — Verify Profile Redesign Database: FAIL (blocked: direct Supabase SQL/Dashboard verification required)
- Flow 28 — New User Onboarding with Photo Upload: FAIL (blocked: manual app/device photo picker + storage verification required)
- Flow 29 — Profile Screen Visual Verification: FAIL (blocked: manual app visual verification required)
- Flow 30 — Edit Profile Flow: FAIL (blocked: manual app + Supabase verification required)
- Flow 31 — Discover Card with Photo and Tagline: FAIL (blocked: manual app + multi-user setup required)
- Flow 32 — Avatar Verification (MatchCard + MatchModal): FAIL (blocked: manual app + multi-user setup required)
- Flow 33 — Editable Username (P5-18 Add-On): FAIL (blocked: manual app + Supabase verification required)
- Flow 34 — Open a Friend's Profile from the Friends Tab: PASS (manually verified by user)
- Flow 35 — Verify Card Tap Zones Are Distinct: PASS (manually verified by user)
- Flow 36 — Message a Friend from Their Profile Modal: PASS (manually verified by user)
- Flow 37 — Friend with No Today's Intent: PASS (manually verified by user)
- Flow 38 — Friend in Not Available Section: PASS (manually verified by user)
