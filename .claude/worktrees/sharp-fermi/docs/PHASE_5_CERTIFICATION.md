# Phase 5: Friends & Polish + Profile Redesign — CERTIFICATION

**Status:** CERTIFIED COMPLETE
**Certified:** 2026-02-26
**Phase completed:** 2026-02-25

---

## Guaranteed Behaviors

The following behaviors are verified and must not regress:

### Friends System

1. **User search** — AddFriendScreen searches profiles by username, email, and phone number (min 3 characters, debounced 300ms). Returns up to 20 results excluding the current user.
2. **Relationship-aware action button** — Each search result shows "Add" / "Requested" / "Accept" / "Friends ✓" based on the current relationship status between the searcher and the result user.
3. **Send friend request** — Tapping "Add" calls `send_friend_request` RPC. Button immediately changes to "Requested" (optimistic). Mutual pending requests auto-accept and create a match row.
4. **Accept/decline requests** — FriendsScreen shows a "Pending Requests" collapsible section (collapsed by default). Accept calls `respond_to_friend_request('accept')`, moves user to friends list, and creates a match row enabling chat. Decline calls `respond_to_friend_request('decline')`, removes from pending list.
5. **Unified friends list** — FriendsScreen shows all friends (from both auto-matches and manual friend requests) split into "Available Today" (expanded by default) and "Not Available" (collapsed by default) sections.
6. **Availability data** — Friends with a `work_intent` for today appear in "Available Today" with a time window and location summary (e.g., "14:00–18:00 · Blue Bottle Coffee"). Friends without today's intent appear in "Not Available" with name only.
7. **Tap friend → chat** — Tapping any friend card on FriendsScreen navigates to the Chat tab.
8. **Pending badge** — Friends tab in MainTabs shows a numeric badge when pending request count > 0. Badge updates on tab focus.
9. **Pull-to-refresh** — FriendsScreen supports pull-to-refresh (RefreshControl) and auto-refreshes on screen focus via `useFocusEffect`.
10. **"+" button** — FriendsScreen header "+" navigates to AddFriendScreen.
11. **Empty state** — FriendsScreen shows a friendly empty state when no friends and no pending requests.

### Profile Redesign

12. **Onboarding Step 4** — New user onboarding has 4 steps (name → work type → interests → photo). Step 4 requires at least 1 photo to proceed. "Get Started" is disabled until 1 photo is uploaded.
13. **Photo upload** — Photos upload to `avatars/{userId}/{position}.jpg` in Supabase Storage, upsert a `profile_photos` row, and sync `profiles.photo_url` when position=0.
14. **ProfileScreen — Hinge-style layout** — ScrollView shows: lead photo (~1.1 aspect ratio) or initials fallback, age · neighborhood · city line, info card (work type + tagline + currently working on + work + school), additional photos (1.72 aspect ratio) interspersed.
15. **ProfileScreen — Edit button** — Header has a pencil ✏ icon (top-right) that navigates to EditProfileScreen.
16. **ProfileScreen — Sign out** — Subtle text link at the bottom. Tapping shows a confirmation alert.
17. **ProfileScreen — Migration banner** — Users without photos see a nudge card to complete their profile.
18. **EditProfileScreen** — Cancel (left) / Save (right) header. PhotoSlots grid with tap actions (Change Photo / Remove Photo / Set as Primary). TextInputs: Name, Tagline, Currently Working On, Work, School, Neighborhood, City. Birthday date picker. Work type single-select pills. Username field with uniqueness validation.
19. **Photo management (immediate)** — Photos upload/delete/set-primary immediately on interaction, not on Save.
20. **Text field save** — Save updates text fields via `updateProfile()`, then calls `refreshProfile()` and `goBack()`. Cancel navigates back without saving text changes; photos already uploaded persist.
21. **Username editing** — Users can set a custom username. Validation enforces format (alphanumeric + underscores) and minimum length. Duplicate username shows "Username is already taken." error. Updated username visible in Add Friend search.
22. **SwipeCard — tagline** — Tagline renders below work_type in the Discover card photo overlay (13px, white, italic, `numberOfLines={1}`). Age and neighborhood also shown. Null values render nothing.
23. **MatchCard + MatchModal avatars** — MatchCard and MatchModal automatically show `profiles.photo_url` when set, with initials fallback.
24. **`getFullProfile`** — Returns profile data and photos array in a single call. Handles 0 photos gracefully.

---

## Explicit Exclusions (Out of Scope for Phase 5)

- No phone number uniqueness constraint at the database level
- No phone number format validation or normalization
- No re-request after a declined friend request (declined is permanent for MVP)
- No friendship deletion or blocking
- No phone number field in the EditProfileScreen UI (deferred — added in Phase 6)
- No interest tag editing in EditProfileScreen
- No contact import or invite-by-share-link
- No real-time updates for the friend list (polling on focus only)
- No group sessions
- No full profile modal from Discover (added in Phase 6)
- No Hinge-style attribute pills row on ProfileScreen (added in Phase 6 via `UserProfileView`)
- No push notifications

---

## Hard Constraints Phase 6 Must Respect

1. **`friendships` table schema is frozen** — Do not add, remove, or rename columns. Schema documented in API_CONTRACT.md Phase 5 section.
2. **Friend RPCs are frozen** — Do not modify `send_friend_request`, `respond_to_friend_request`, `get_pending_requests_count` signatures or logic.
3. **`profile_photos` table schema is frozen** — Do not alter columns, UNIQUE constraint, or RLS policies.
4. **`avatars` storage bucket path pattern is frozen** — `avatars/{userId}/{position}.jpg`. Phase 6 must not change the upload path.
5. **`friendsService.ts` exported function signatures are frozen** — `searchUsers`, `sendFriendRequest`, `respondToFriendRequest`, `fetchFriends`, `fetchPendingRequests`, `getPendingRequestsCount`, `getRelationshipStatuses`. Internal query changes (e.g., adding `phone_number` to search) are allowed.
6. **`photoService.ts` is frozen** — `pickImage`, `uploadPhoto`, `deletePhoto`, `getPhotos`, `setPrimaryPhoto` must not change signatures.
7. **`profileService.ts` UpdateProfileFields type may be extended** — Adding `phone_number` to the updatable fields is allowed. Do not remove or rename existing fields.
8. **`PhotoSlots` component prop interface is frozen** — `photos`, `totalSlots`, `onAddPhoto`, `onRemovePhoto?`, `onSetPrimary?`, `prompts[]`, `editable?`.
9. **Friend components are frozen** — `FriendCard`, `FriendRequestCard`, `CollapsibleSection`, `UserSearchResultCard` behavior and prop interfaces must not change.
10. **EditProfileScreen navigation params are frozen** — `ProfileStackParamList['EditProfile']` is parameterless.
11. **4-tab navigation structure is frozen** — MainTabs has exactly 4 tabs: Discover, Friends, Chat, Profile. Tab identifiers and stack names must not change.
12. **All Phase 4 constraints still apply:**
    - `sessions` table, RPCs, and `sessionService.ts` functions are frozen
    - SessionRequestCard 6 variants are frozen
    - Chat timeline merge logic (messages + sessions + session_events) is frozen
    - All Phase 3 constraints (matches table, messages immutable, MatchesStack screens, messagingService frozen)
    - Design system "Digital Matcha" for all new UI
    - Supabase client at `lib/supabase.ts`
    - React Navigation 7 (navigators require `id` prop)

---

## Phase 5 TypeScript Types (Frozen)

The following types exported from `src/types/index.ts` are frozen:

| Type | Description |
|------|-------------|
| `FriendshipStatus` | `'pending' \| 'accepted' \| 'declined'` |
| `Friendship` | Mirrors `friendships` table schema |
| `FriendListItem` | Unified friend display: `id, name, photo_url, match_id, has_intent_today, available_from, available_until, location_type, location_name` |
| `UserSearchResult` | Profile fields + `relationship_status` |
| `RelationshipStatus` | `'none' \| 'pending_sent' \| 'pending_received' \| 'friends' \| 'declined'` |
| `ProfilePhoto` | `id, user_id, photo_url, position, created_at` |
| `Profile` | Extended with `tagline, currently_working_on, work, school, birthday, neighborhood, city` (all nullable) |

---

## Phase 5 Frozen Infrastructure Summary

| Layer | Item | Frozen Since |
|-------|------|-------------|
| DB | `friendships` table | Phase 5 |
| DB | `profile_photos` table | Phase 5 |
| DB | `profiles.phone_number` column | Phase 5 |
| DB | `profiles.tagline, currently_working_on, work, school, birthday, neighborhood, city` columns | Phase 5 |
| DB | `send_friend_request` RPC | Phase 5 |
| DB | `respond_to_friend_request` RPC | Phase 5 |
| DB | `get_pending_requests_count` RPC | Phase 5 |
| Storage | `avatars` bucket + path pattern | Phase 5 |
| Code | `friendsService.ts` function signatures | Phase 5 |
| Code | `photoService.ts` function signatures | Phase 5 |
| Code | `PhotoSlots` component props | Phase 5 |
| Code | `FriendCard`, `FriendRequestCard`, `CollapsibleSection`, `UserSearchResultCard` | Phase 5 |
| Nav | 4-tab MainTabs structure | Phase 5 |
| Nav | `FriendsStack` (Friends, AddFriend screens) | Phase 5 |
| Nav | `ProfileStack` (Profile, EditProfile screens) | Phase 5 |
