# Phase 5: Friends & Polish + Profile Redesign — Implementation Map (Scaffold)

**Status:** PENDING IMPLEMENTATION
**Created:** 2026-02-15

> This document will be updated by Codex after implementation.

---

## Baseline Findings (Step 1)

### Branch
- Current branch: `feat/phase5-baseline` (already existed and was checked out)

### Commands Run
- `npm install`
- `npx expo start --clear`
- Attempted iOS launch via Expo CLI (`i`)

### Results
- `npm install`: PASS (`up to date`, no install errors)
- Expo dev server boot: PASS (Metro started successfully on port 8082 after 8081 conflict prompt)
- iOS simulator openurl: FAIL due to simulator timeout (`simctl openurl ... exited with code 60`)

### Notes
- No code-level build/runtime errors were observed in Metro startup logs.
- iOS openurl timeout appears to be an environment/simulator issue, not an app boot failure.
- No baseline code fixes were required.

---

## P5-01: Database — friendships Table, phone_number Column, RPCs

### Intended Behavior
- `friendships` table stores manual friend request records with requester, recipient, status lifecycle
- `profiles.phone_number` column added (nullable TEXT) for friend search
- `send_friend_request` RPC checks both directions for existing friendships, handles mutual pending (auto-accept + match creation), and inserts new pending requests
- `respond_to_friend_request` RPC accepts/declines pending requests (recipient only); on accept, creates match row via `create_match`
- `get_pending_requests_count` RPC returns count of pending incoming requests
- RLS restricts reads to own friendships (requester or recipient)
- Realtime enabled on `friendships` table

### Expected File Paths
- `supabase/006_friendships_table.sql` (created)

### Verification
- RUNBOOK: Phase 5 Flow 20 — Database setup verification

### Known Risks / TODOs
- Realtime must be explicitly enabled in Supabase Dashboard for the `friendships` table
- `respond_to_friend_request` calls `create_match` internally — verify SECURITY DEFINER can invoke another SECURITY DEFINER function
- The mutual pending auto-accept path in `send_friend_request` must be tested carefully (race condition edge case)
- No phone number format validation at database level

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `supabase/006_friendships_table.sql`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - RUNBOOK Flow 20 (Phase 5 Database)
  - Local verification PASS: migration contains required table/column/RPC/RLS/realtime definitions
  - Manual Supabase SQL Editor/Dashboard verification PASS:
    - friendships table exists
    - profiles.phone_number column exists (text)
    - RPCs exist: send_friend_request, respond_to_friend_request, get_pending_requests_count
    - RLS policies present on friendships
    - send_friend_request + respond_to_friend_request(accept) executed successfully
    - match row created on accept
    - get_pending_requests_count returned expected value (0)

---

## P5-02: Phase 5 TypeScript Types

### Intended Behavior
- `FriendshipStatus` union type: 'pending' | 'accepted' | 'declined'
- `Friendship` type mirrors `friendships` table schema
- `FriendListItem` type for unified friend display: id, name, photo_url, match_id, has_intent_today, available_from, available_until, location_type, location_name
- `UserSearchResult` type: profile fields + relationship_status
- `RelationshipStatus` union type: 'none' | 'pending_sent' | 'pending_received' | 'friends' | 'declined'

### Expected File Paths
- `src/types/index.ts` (modified — append new types)

### Verification
- `npx tsc --noEmit` passes with no errors

### Known Risks / TODOs
- `FriendListItem` needs `match_id` for chat navigation — ensure it's populated for both swipe-matches and manual friends

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/types/index.ts`
  - `src/screens/discover/IntentScreen.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS

---

## P5-03: Friends Service Layer

### Intended Behavior
- `searchUsers(query, currentUserId)` queries profiles by username, email, phone_number using ILIKE; excludes self; max 20 results
- `sendFriendRequest(requesterId, recipientId)` calls `send_friend_request` RPC, returns friendship id or error
- `respondToFriendRequest(friendshipId, userId, response)` calls `respond_to_friend_request` RPC
- `fetchFriends(userId)` queries all matches (unified friends list), joins profiles and today's work_intents for availability
- `fetchPendingRequests(userId)` queries friendships WHERE recipient_id = userId AND status = 'pending', joins requester profile
- `getPendingRequestsCount(userId)` calls `get_pending_requests_count` RPC
- `getRelationshipStatuses(currentUserId, userIds)` checks matches and friendships tables to determine status per user

### Expected File Paths
- `src/services/friendsService.ts` (created)

### Verification
- RUNBOOK: Phase 5 Flows 21–25
- Console log verification of all function returns

### Known Risks / TODOs
- `fetchFriends` requires joining matches → profiles → work_intents — may need optimization for large friend lists
- `getRelationshipStatuses` queries both matches and friendships for a list of user IDs — potential N+1 issue, consider batch query
- Error messages from RPC exceptions need to be parsed into user-friendly strings

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/services/friendsService.ts`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flows 21-25: BLOCKED in this environment (requires in-app multi-user flow; to be completed manually during UI ticket verification)

---

## P5-04: Navigation — 4 Tabs + Stack Navigators

### Intended Behavior
- MainTabs changes from 3 tabs to 4: Discover, Friends, Chat, Profile
- Chat tab is the existing MatchesStack with renamed tab label
- `FriendsStack` created with 2 screens: Friends (initial), AddFriend
- `ProfileStack` created with 2 screens: Profile (initial), EditProfile
- Default React Navigation stack transition animations

### Expected File Paths
- `src/navigation/FriendsStack.tsx` (created)
- `src/navigation/ProfileStack.tsx` (created)
- `src/navigation/MainTabs.tsx` (modified — 4 tabs, import new stacks)

### Verification
- Navigate all 4 tabs, navigate within stacks, verify back buttons

### Known Risks / TODOs
- React Navigation 7 requires `id` prop — ensure ProfileStack has unique id
- Tab bar should remain visible when on Friends or AddFriend screens (default behavior for nested stack in tab)
- Cross-tab navigation from Friends → Chat (Matches tab) needs to work

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/navigation/MainTabs.tsx`
  - `src/navigation/FriendsStack.tsx`
  - `src/navigation/ProfileStack.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK navigation verification: BLOCKED in this environment (requires in-app manual navigation test)

---

## P5-05: Build Add Friend Screen

### Intended Behavior
- Search input with pill shape, placeholder "Search by username, email, or phone"
- Debounced search (300ms, min 3 characters)
- Results show as FlatList of UserSearchResultCard components
- Each result shows photo/initials, name, username, and relationship-aware action button
- Action button states: "Add" (none), "Requested" (pending_sent), "Accept" (pending_received), "Friends ✓" (friends), "Declined" (declined)
- States: initial (prompt), searching (spinner), results (list), no_results (empty state)

### Expected File Paths
- `src/screens/friends/AddFriendScreen.tsx` (created)
- `src/components/friends/UserSearchResultCard.tsx` (created)

### Verification
- RUNBOOK: Phase 5 Flow 21 — Search and send friend request

### Known Risks / TODOs
- Debounce implementation: use `setTimeout` with cleanup, or a hook like `useDebouncedValue`
- Relationship status determination requires fetching matches + friendships after each search — may feel slow
- Optimistic "Requested" update must revert on error

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/screens/friends/AddFriendScreen.tsx`
  - `src/components/friends/UserSearchResultCard.tsx`
  - `src/navigation/FriendsStack.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 21 (Search Users and Send Friend Request): BLOCKED in this environment (requires in-app multi-user manual test)

---

## P5-06: Build Friends Screen

### Intended Behavior
- Three collapsible sections: "Pending Requests", "Available Today", "Not Available"
- **Pending Requests**: collapsed by default, red dot indicator on header when count > 0; when expanded, each item has Accept/Decline buttons
- **Available Today**: expanded by default, shows friends with today's work_intent; each shows photo, name, and intent summary (time window + location)
- **Not Available**: collapsed by default, shows friends without today's intent; each shows photo and name only
- Section headers are tappable with chevron indicator (▶ collapsed, ▼ expanded) and count
- Tapping a friend navigates to Chat tab
- "+" header button → navigate to AddFriendScreen
- Pull-to-refresh, refresh on focus (useFocusEffect)
- Friends Screen is now its own tab (Friends tab)

### Expected File Paths
- `src/screens/friends/FriendsScreen.tsx` (created)
- `src/components/friends/FriendRequestCard.tsx` (created)
- `src/components/friends/FriendCard.tsx` (created — two variants: 'available' and 'simple')
- `src/components/friends/CollapsibleSection.tsx` (created — reusable expand/collapse header)

### Verification
- RUNBOOK: Phase 5 Flows 22–25

### Known Risks / TODOs
- Cross-tab navigation from Friends tab to Chat tab — need to use `navigation.navigate('Matches', { screen: 'Chat', params })` pattern
- Collapsible sections: use `LayoutAnimation` or `Animated` for smooth expand/collapse transitions
- Availability data requires fetching work_intents for all friends — batch query needed; must include `available_from`, `available_until`, `location_type`, `location_name` for the intent summary
- Accept action must move card from pending section to the appropriate friends category (available or not available)
- Red dot on pending header: should use the same `getPendingRequestsCount` as the tab badge

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/screens/friends/FriendsScreen.tsx`
  - `src/components/friends/CollapsibleSection.tsx`
  - `src/components/friends/FriendRequestCard.tsx`
  - `src/components/friends/FriendCard.tsx`
  - `src/navigation/FriendsStack.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flows 22-25: BLOCKED in this environment (requires in-app multi-user manual test)

---

## P5-07: Pending Requests Badge on Friends Tab

### Intended Behavior
- Friends tab in MainTabs shows numeric badge when pending friend request count > 0
- Badge updates on tab focus (useFocusEffect)

### Expected File Paths
- `src/navigation/MainTabs.tsx` (modified — add Friends tab badge)

### Verification
- RUNBOOK: Phase 5 Flow 23 — Pending requests badge

### Known Risks / TODOs
- Badge fetch pattern: reuse the `useFocusEffect` approach from Matches tab

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/navigation/MainTabs.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 23 (Decline Friend Request, includes badge expectation): BLOCKED in this environment (requires in-app multi-user manual test)

---

## P5-08: Polish — Loading States, Error Handling, Empty States

### Intended Behavior
- Loading spinners on FriendsScreen and AddFriendScreen during data fetch
- Error alerts for failed operations (search, send request, accept, decline, save phone number)
- Empty states with Digital Matcha styling for Friends screen ("No friends yet") and search ("No users found")
- Pull-to-refresh visual feedback (RefreshControl) on Friends screen
- Haptic feedback on friend request sent and accepted (if expo-haptics installed)
- Smooth default navigation transitions between ProfileStack screens

### Expected File Paths
- `src/screens/friends/FriendsScreen.tsx` (modified — loading/error/empty states)
- `src/screens/friends/AddFriendScreen.tsx` (modified — loading/error/empty states)

### Verification
- RUNBOOK: Phase 5 Flow 26 — Polish verification
- Visual inspection of all states

### Known Risks / TODOs
- expo-haptics may or may not already be installed — check before using
- Empty state illustrations: use emoji + text (consistent with existing patterns), no custom assets needed
- Error messages from RPCs need parsing — Supabase wraps RPC errors in a generic format

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/screens/friends/AddFriendScreen.tsx`
  - `src/screens/friends/FriendsScreen.tsx`
  - `package.json`
  - `package-lock.json`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 26 (Polish verification): BLOCKED in this environment (requires in-app manual UI flow validation)

---

---

## P5-09: Database & Storage — profile_photos Table, Profile Columns, Avatars Bucket

### Intended Behavior
- `profiles` table gains nullable columns: `tagline TEXT`, `currently_working_on TEXT`, `work TEXT`, `school TEXT`, `birthday DATE`, `neighborhood TEXT`, `city TEXT`
- `profile_photos` table stores photos with position-based ordering (0-4)
- `UNIQUE(user_id, position)` prevents duplicate positions
- RLS: anyone SELECT, owner INSERT/UPDATE/DELETE on `profile_photos`
- `avatars` storage bucket created (public, 5MB limit, jpeg/png/webp)
- Storage RLS: public read, owner-only write to `{userId}/` folder

### Expected File Paths
- `supabase/007_profile_photos.sql` (created)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 27 — Database setup verification

### Known Risks / TODOs
- `avatars` bucket must be created via Supabase Dashboard or SQL (INSERT INTO storage.buckets)
- Storage policies may need to be applied via Dashboard if SQL doesn't work for storage.objects
- Photo file naming uses position-based convention — overwriting on re-upload is intentional

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `supabase/007_profile_photos.sql`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - RUNBOOK Flow 27 (Verify Profile Redesign Database)
  - Local verification PASS: migration includes required profiles columns, profile_photos schema/constraints/indexes, RLS policies, avatars bucket config, and storage policies
  - Live Supabase SQL Editor/Dashboard execution: BLOCKED in this environment (manual execution required to fully complete Flow 27)

---

## P5-10: Profile Redesign TypeScript Types

### Intended Behavior
- `ProfilePhoto` type: `{ id, user_id, photo_url, position, created_at }`
- `Profile` type gains nullable fields: `tagline`, `currently_working_on`, `work`, `school`, `birthday`, `neighborhood`, `city`

### Expected File Paths
- `src/types/index.ts` (modified — add ProfilePhoto type, extend Profile)

### Verification
- `npx tsc --noEmit` passes with no errors

### Known Risks / TODOs
- Must not break existing type imports that depend on the current Profile shape
- New fields are all nullable to maintain backward compatibility with existing profiles

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/types/index.ts`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS

---

## P5-11: Photo Service

### Intended Behavior
- `pickImage()` launches expo-image-picker (library, square crop, 0.8 quality)
- `uploadPhoto(userId, imageUri, position)` uploads to Supabase Storage `avatars/{userId}/{position}.jpg`, upserts `profile_photos` row, syncs `profiles.photo_url` if position=0
- `deletePhoto(userId, position)` removes from storage + DB, promotes next photo if deleting primary
- `getPhotos(userId)` fetches all photos ordered by position
- `setPrimaryPhoto(userId, fromPosition)` swaps positions, updates `profiles.photo_url`

### Expected File Paths
- `src/services/photoService.ts` (created)

### Verification
- Console log verification of all function returns
- Upload a photo, verify it appears in Supabase Storage and profile_photos table
- Delete a photo, verify it's removed from both storage and DB

### Known Risks / TODOs
- `expo-image-picker` must be installed via `npx expo install expo-image-picker`
- Supabase Storage upload may need `Content-Type` header for correct MIME type
- Photo promotion on primary delete: must update `profiles.photo_url` to the new position 0 photo
- Race condition: user uploads multiple photos quickly — upsert handles gracefully via UNIQUE constraint

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/services/photoService.ts`
  - `package.json`
  - `package-lock.json`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 30 (photo management subflow) and Flow 32 dependency behavior: BLOCKED in this environment (requires in-app + Supabase storage manual validation)

---

## P5-12: Profile Service

### Intended Behavior
- `updateProfile(userId, fields)` updates profiles table with any subset of text fields
- `getFullProfile(userId)` parallel fetch of profile + photos

### Expected File Paths
- `src/services/profileService.ts` (created)

### Verification
- Update profile fields, verify changes persist in Supabase
- `getFullProfile` returns both profile data and photos array

### Known Risks / TODOs
- Must not conflict with existing `AuthContext.refreshProfile()` which selects `*` from profiles
- `getFullProfile` should handle the case where a user has 0 photos gracefully (return empty array)

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/services/profileService.ts`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK profile service verification (data persistence + combined fetch): BLOCKED in this environment (requires in-app + Supabase manual checks)

---

## P5-13: PhotoSlots Component + Onboarding Step 4

### Intended Behavior
- Reusable `PhotoSlots` component: large primary slot + 4 smaller slots in 2x2 grid
- Empty slots show dashed border + prompt text
- Filled slots show photo via expo-image
- Onboarding gains Step 4: photo upload (1 required to proceed)
- `totalSteps` changes from 3 to 4
- "Get Started" button disabled until at least 1 photo uploaded

### Expected File Paths
- `src/components/profile/PhotoSlots.tsx` (created)
- `src/screens/auth/OnboardingScreen.tsx` (modified — add Step 4)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 28 — New user onboarding with photo
- Visual verification of PhotoSlots grid layout

### Known Risks / TODOs
- Onboarding step count change affects progress dots rendering
- Photo upload during onboarding: user_id must be available (user is authenticated but profile may not have all fields yet)
- If upload fails during onboarding, user should be able to retry without losing previous steps' data

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/components/profile/PhotoSlots.tsx`
  - `src/screens/auth/OnboardingScreen.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 28 (New User Onboarding with Photo Upload):
    - Local code verification PASS: 4-step onboarding, Step 4 PhotoSlots rendered, "Get Started" requires >=1 selected photo, completion uploads via `uploadPhoto()`
    - Full in-app + Supabase verification BLOCKED in this environment (requires simulator/device account creation + Supabase dashboard checks)

---

## P5-14: ProfileStack + ProfileScreen Redesign (Hinge-Style)

### Intended Behavior
- ProfileStack has 2 screens: Profile, EditProfile
- ProfileScreen uses Hinge-style ScrollView layout:
  - Lead photo (~400px) with name overlaid at bottom-left
  - Age · Neighborhood · City line below lead photo
  - Info card with work type, tagline, currently working on, work, school
  - Additional photos interspersed after info card
  - Edit Profile button and Sign Out at bottom
- `useFocusEffect` refreshes via `getFullProfile()`
- Migration banner when no photos
- No Phone Number or My Friends rows

### Expected File Paths
- `src/navigation/ProfileStack.tsx` (modified — EditProfile screen)
- `src/screens/profile/ProfileScreen.tsx` (rewritten)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 29 — Profile screen visual verification
- Navigate Profile → EditProfile → back, verify data refreshes

### Known Risks / TODOs
- Lead photo fallback must match existing initials pattern (consistent with SwipeCard, MatchCard)
- `getFullProfile` call on every focus could feel slow — consider caching or conditional refresh

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/screens/profile/ProfileScreen.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 29 (Profile Screen Visual Verification):
    - Local code verification PASS: lead photo + name overlay, age/neighborhood/city line, info card fields, additional photos rendering, Edit Profile navigation button, Sign Out, no Phone Number/My Friends rows, migration banner when no photos, focus refresh via `getFullProfile()`
    - Full in-app visual flow BLOCKED in this environment (requires simulator/device interaction)

---

## P5-15: EditProfileScreen

### Intended Behavior
- Header: Cancel (left) / Save (right)
- PhotoSlots grid (editable=true, action sheet: Change/Remove/Set Primary)
- TextInputs: Name, Tagline, Currently Working On, Work, School, Neighborhood, City
- Birthday (date picker)
- Work type single-select pills
- Photos upload/delete immediately (not on save)
- Save updates text fields via `updateProfile()`, then `refreshProfile()` + `goBack()`

### Expected File Paths
- `src/screens/profile/EditProfileScreen.tsx` (created)

### Verification
- RUNBOOK: Phase 5 Profile Redesign Flow 30 — Edit profile flow
- Modify all fields, save, verify persistence
- Upload and delete photos, verify immediate effect

### Known Risks / TODOs
- Action sheet: may need `@react-native-community/action-sheet` or native `ActionSheetIOS` (iOS-only for MVP)
- Photos uploaded during edit persist even if Cancel is tapped — this is intentional behavior
- Work type pills must match onboarding options exactly

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/screens/profile/EditProfileScreen.tsx`
  - `src/navigation/ProfileStack.tsx`
  - `package.json`
  - `package-lock.json`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 30 (Edit Profile Flow):
    - Local code verification PASS: Cancel/Save header, PhotoSlots with action sheet options (Change Photo / Remove Photo / Set as Primary / Cancel), text fields, birthday date picker, work type pills, immediate photo upload/delete/set-primary behavior, Save updates text fields via `updateProfile()` then `refreshProfile()` + `goBack()`, Cancel goes back without saving text changes
    - Full in-app + Supabase validation BLOCKED in this environment (requires simulator/device + Supabase dashboard checks)

---

## P5-16: SwipeCard Tagline Update

### Intended Behavior
- Tagline displays below work_type in SwipeCard photo overlay
- Age + neighborhood displayed in the overlay
- 13px, white, italic, numberOfLines={1}
- Graceful null handling (nothing renders if tagline is null/empty)

### Expected File Paths
- `src/components/discover/SwipeCard.tsx` (modified — add tagline line)

### Verification
- Visual verification on Discover tab
- Cards without tagline look unchanged

### Known Risks / TODOs
- Must not change existing overlay layout significantly
- Long taglines truncated with numberOfLines={1}

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/components/discover/SwipeCard.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 31 (Discover Card with Photo and Tagline):
    - Local code verification PASS: tagline rendered below work type with 13px white italic + `numberOfLines={1}`; age + neighborhood line rendered in overlay; null/empty values render nothing
    - Full in-app visual verification BLOCKED in this environment (requires simulator/device interaction)

---

## P5-17: Verify Avatar Components

### Intended Behavior
- MatchCard shows user's primary photo when `profiles.photo_url` is populated
- MatchModal shows both users' photos when `profiles.photo_url` is populated
- `fetch_match_previews` RPC returns photo_url in results

### Expected File Paths
- No code changes expected — verification only
- `src/components/matches/MatchCard.tsx` (verify)
- `src/components/matches/MatchModal.tsx` (verify)

### Verification
- Upload a photo via EditProfile, verify it appears in MatchCard and MatchModal
- Verify `fetch_match_previews` includes photo_url

### Known Risks / TODOs
- These components already handle photo_url — should work automatically once photo_url is populated
- If components reference an old photo URL after deletion, expo-image will show empty/broken state

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 32 (Avatar Verification - MatchCard + MatchModal):
    - Local code verification PASS:
      - `src/components/matches/MatchCard.tsx` renders `other_user.photo_url` with fallback initials
      - `src/components/matches/MatchModal.tsx` renders `profile.photo_url` for both users with fallback initials
      - `supabase/003_matching_tables.sql` `fetch_match_previews` returns `other_user_photo_url` from `profiles.photo_url`
      - `src/services/messagingService.ts` maps `other_user_photo_url` → `MatchPreview.other_user.photo_url`
    - Full in-app + database verification BLOCKED in this environment (requires matched users and simulator/device interaction)

---

## P5-18: Editable Username (Unique Handle)

### Intended Behavior
- Edit Profile includes a username field users can customize
- Username validation enforces allowed format and minimum length
- Save persists `profiles.username` when valid and available
- Duplicate usernames return a clear user-facing error
- Friend search and user cards reflect the updated username

### Expected File Paths
- `src/screens/profile/EditProfileScreen.tsx` (modified)
- `src/services/profileService.ts` (modified if needed for username update handling)
- `src/types/index.ts` (verify existing username coverage for affected UI/service types)

### Verification
- RUNBOOK: Flow 33 — Editable Username (P5-18 Add-On)
- Update username to an available value, save, verify persistence in Supabase
- Attempt duplicate username, verify conflict error is shown
- Verify updated username appears in Add Friend search/results

### Known Risks / TODOs
- DB uniqueness must be enforced server-side (not client-only)
- Existing users with fallback usernames need smooth migration path
- Keep current profile and friend features unchanged outside username editing scope

### Implementation Status
- Ticket status: DONE
- Files changed:
  - `src/screens/profile/EditProfileScreen.tsx`
  - `src/services/profileService.ts`
  - `src/types/index.ts`
  - `src/services/friendsService.ts`
  - `src/screens/friends/AddFriendScreen.tsx`
  - `src/components/friends/UserSearchResultCard.tsx`
  - `docs/PHASE_5_IMPLEMENTED.md`
- Verification performed:
  - `npx tsc --noEmit`: PASS
  - RUNBOOK Flow 33 (Editable Username):
    - Local code verification PASS:
      - Edit Profile shows editable username field pre-populated from profile
      - Username validation enforces length/format before save
      - Duplicate username DB conflicts map to user-friendly "Username is already taken."
      - Add Friend search/query + UI are username-first (search by username, `@username` displayed prominently)
    - Full in-app + Supabase verification BLOCKED in this environment (requires multi-user app interaction + SQL checks)

---

## Quick Verification Checklist

```bash
# 1. TypeScript compiles
npx tsc --noEmit

# 2. App starts
npm start
# Press 'i' for iOS

# 3. Database ready (run in Supabase SQL Editor)
# Contents of supabase/006_friendships_table.sql
# Contents of supabase/007_profile_photos.sql
```

### Friends End-to-End Test Flow
1. Login as User A, navigate to Friends tab
2. Verify Friends screen (empty state)
3. Tap "+" → Add Friend screen
4. Search for User B by email → verify result with "Add" button
5. Tap "Add" → verify button changes to "Requested"
6. Login as User B, check Friends tab badge → verify "1"
7. Navigate to Friends tab → verify pending request from User A
8. Tap "Accept" → verify User A moves to friends list with availability
9. Tap User A → verify chat opens
10. Login as User A → verify User B in friends list
11. Test decline: send request to User C, User C declines → card disappears
12. Test mutual auto-accept: User D requests User E, User E requests User D → both friends

### Profile Redesign End-to-End Test Flow
1. Create new account → complete onboarding with 4 steps (name → work type → interests → photo)
2. Verify photo uploads to Supabase Storage and profile_photos table
3. Navigate to Profile screen → verify Hinge-style layout: lead photo with name overlay, age · neighborhood · city line, info card, additional photos
4. Tap "Edit Profile" → verify PhotoSlots and text fields populated
5. Change tagline, currently working on, work, school → Save
6. Verify changes persist on Profile screen
7. Add/remove photos in EditProfile → verify immediate upload/delete
8. Navigate to Discover → verify SwipeCard shows photo, tagline, age + neighborhood
9. Navigate to Matches → verify MatchCard shows photo
10. Login as existing user without photos → verify migration banner on Profile screen

---

## Source of Truth Clarification (2026-02-25)

Per user confirmation during execution, conflicts between RUNBOOK profile-redesign wording and plan/spec are resolved in favor of:
- `docs/PHASE_5_PLAN.md`
- `docs/UI_SPEC.md`

Applied conflict resolutions:
- Lead photo target height uses `~400px` (not `~200px`)
- Profile layout uses interleaved additional photos (not thumbnail row)
- Profile screen excludes Phone Number and My Friends rows

---

## Phase 5 Exit Gate Results (2026-02-25)

### Local Verification Executed
- `npx tsc --noEmit`: PASS
- `npx expo start --clear` boot smoke: PASS (Metro started, no fatal startup error in logs)

### Flow Status (PASS / FAIL)
- Flow 1-19 (Phase 1-4 regression suite): FAIL (not executed in this environment; manual run required)
- Flow 20 (Phase 5 DB: friendships): PASS (previous manual Supabase verification recorded)
- Flows 21-26 (Phase 5 friends UI/e2e): FAIL (blocked in this environment; requires multi-user simulator/device + Supabase checks)
- Flow 27 (Phase 5 DB: profile redesign): FAIL (blocked in this environment; requires manual Supabase SQL/Storage checks)
- Flows 28-33 (Phase 5 profile redesign UI/e2e): FAIL (blocked in this environment; requires simulator/device + multi-user checks)

### Exit Gate Decision
- Phase 5 exit gate is NOT complete in this environment because required RUNBOOK flows remain manual.
