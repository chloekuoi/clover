# Phase 6: Friend Profile View — CERTIFICATION

**Status:** CERTIFIED COMPLETE
**Certified:** 2026-03-07
**Phase completed:** 2026-03-07
**RUNBOOK Flows verified:** 34, 35, 36, 37, 38 (manually verified by user)

---

## Guaranteed Behaviors

The following behaviors are verified and must not regress:

### Friend Profile Modal

1. **Avatar tap zone** — Tapping the avatar on any `FriendCard` (in both "Available Today" and "Not Available" sections) opens the `FriendProfileModal`. Tapping anywhere else on the card (name text, meta text, availability dot, card body) opens the chat — unchanged from Phase 5.

2. **Modal opens immediately with spinner** — The `FriendProfileModal` opens instantly on avatar tap, showing a centered `ActivityIndicator` while the profile fetch is in progress. The `💬` icon is visible during loading.

3. **Profile fetch** — `getFullProfile(userId)` and `getTodayIntent(userId)` are called in parallel via `Promise.all` when an avatar is tapped. On resolution, `profileData` is set and the spinner clears.

4. **Full profile display** — After fetch, the modal body renders `UserProfileView` with `isOwnProfile={false}`. Photos, name, field rows, and bio are shown. If the friend has no today's intent, the Today's Focus card is hidden (not shown as empty).

5. **`💬` icon → chat** — Tapping the `💬` icon in the modal top-right dismisses the modal and navigates to the friend's chat (opens existing match conversation).

6. **Swipe-to-dismiss** — Swiping the modal down triggers `onDismiss`, closing the modal and returning to the Friends list. (iOS `presentationStyle="pageSheet"` native behavior.)

7. **Null profile guard** — If `getFullProfile` returns `null` (e.g., deleted account), the modal remains in loading state and does not crash.

8. **Last-write-wins on rapid taps** — If the user taps two avatars quickly, the second fetch's result overwrites the first. Modal shows the latest data. No crash.

9. **No new navigation routes** — Phase 6 uses a `Modal` component directly, not a new navigator route. `MatchesStackParamList` is unchanged.

---

## Explicit Exclusions (Out of Scope for Phase 6)

- No profile editing from the Friend Profile Modal
- No new Supabase tables or RPCs (reads from existing `profiles`, `profile_photos`, `work_intents`)
- No changes to `FriendRequestCard`, `UserSearchResultCard`, `CollapsibleSection` behavior
- No changes to `FriendsStack` navigator routes
- No changes to `UserProfileView` component itself
- No Android-specific modal adjustments (`pageSheet` renders full-screen on Android — acceptable for MVP)
- No phone number field in EditProfileScreen (deferred beyond Phase 6)

---

## Hard Constraints Phase 7 Must Respect

1. **`FriendCard` prop interface is now frozen** — `FriendCard` accepts an optional `onProfilePress?: () => void` prop (added in Phase 6). Do not remove or rename this prop.

2. **`FriendProfileModal` component is frozen** — Props interface: `{ visible, profile, photos, intent, loading, onDismiss, onMessage }`. Do not change this signature.

3. **All Phase 5 constraints still apply** — See `PHASE_5_CERTIFICATION.md` for full list. Includes:
   - `friendships` table schema frozen
   - `friend` RPCs frozen
   - `profile_photos` table schema frozen
   - `avatars` storage bucket path frozen
   - `FriendsScreen` existing behavior (chat tap, accept/decline requests, badge) frozen
   - 4-tab MainTabs structure frozen

4. **`getFullProfile` and `getTodayIntent` function signatures frozen** — Phase 6 calls these from `FriendsScreen`. Do not change their return types or signatures.

5. **`UserProfileView` component is frozen** — Props: `isOwnProfile`, `profile`, `photos`, `intent`. Phase 7 may call it from new locations but must not modify its interface or internal behavior.

---

## Phase 6 Frozen Infrastructure Summary

| Layer | Item | Frozen Since |
|-------|------|-------------|
| Code | `FriendCard.onProfilePress` prop | Phase 6 |
| Code | `FriendProfileModal` component + props | Phase 6 |
| Code | `FriendsScreen.handleOpenProfile` behavior | Phase 6 |
| Code | `UserProfileView` component interface | Phase 6 |
| Nav | `MatchesStackParamList` (no new routes in Phase 6) | Phase 6 |

---

## Known Non-Issues (Intentionally Not Handled)

- **Flows 1–33 not re-verified in this run** — Prior-phase RUNBOOK flows require manual multi-user app testing in a live simulator. These were not re-run during Phase 6 implementation. Phase 6-specific flows (34–38) passed manual user verification.
- **Android `pageSheet` behavior** — On Android, the modal renders full-screen (not as a sheet). This is acceptable for MVP and was not explicitly tested on Android during Phase 6.
- **Race condition on rapid avatar taps** — Last-write-wins behavior is intentional and documented. No request cancellation implemented.
