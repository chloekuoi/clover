# Phase 5: Friends & Polish + Profile Redesign

**Goal:** Users can manually add friends via search, manage friend requests, and see all friends in a unified list. Additionally, users can upload photos, edit their profile (tagline, currently working on, work, school, birthday, neighborhood, city), and present themselves authentically for IRL meetups.

**Entry Criteria:** Phase 4 complete (sessions with invite flow, dual-lock, auto-cancel)

---

## Friend Model (Phase 5)

Friends in CoWork Connect come from two sources:

- **Auto-friends:** Mutual swipe match in discovery. Already stored in the `matches` table. No additional action needed.
- **Manual friends:** One user searches for another by username, email, or phone number, and sends a friend request. The recipient accepts or declines. On acceptance, a `matches` row is auto-created to enable chat.

The Friends screen shows a **unified list** of both types. The `friendships` table only tracks manual friend connections. The `matches` table (unchanged) is the shared infrastructure for chat.

---

## Tickets

### P5-01: Database — friendships Table, phone_number Column, RPCs

**Goal:** Store manual friend connections with request/accept lifecycle and enable user search by phone number.

**Scope:**
- Included: Create `friendships` table (requester_id, recipient_id, status, timestamps)
- Included: Add optional `phone_number` column to `profiles` table
- Included: Create `send_friend_request(p_requester_id, p_recipient_id)` RPC
- Included: Create `respond_to_friend_request(p_friendship_id, p_user_id, p_response)` RPC (auto-creates match on accept)
- Included: Create `get_pending_requests_count(p_user_id)` RPC
- Included: RLS policies restricting reads to own friendships
- Included: Enable Supabase Realtime on `friendships` table
- Excluded: Unique constraint on phone_number
- Excluded: Phone number format validation or normalization
- Excluded: Re-request after decline

**Dependencies:** None

**Definition of Done:**
- [ ] `friendships` table created with all columns, constraints, and indexes
- [ ] `profiles.phone_number` column added (nullable TEXT)
- [ ] `send_friend_request` checks for existing friendships in both directions; handles mutual pending (auto-accept + match creation); inserts new pending request otherwise
- [ ] `send_friend_request` returns error if request already exists, already friends, or previously declined
- [ ] `respond_to_friend_request` with 'accept' sets status='accepted', updated_at=NOW(), and calls `create_match(requester_id, recipient_id)` internally
- [ ] `respond_to_friend_request` with 'decline' sets status='declined', updated_at=NOW()
- [ ] `respond_to_friend_request` rejects if caller is not the recipient
- [ ] `respond_to_friend_request` rejects if friendship is not pending
- [ ] `get_pending_requests_count` returns count of friendships WHERE recipient_id = p_user_id AND status = 'pending'
- [ ] RLS: Users can only SELECT friendships where they are requester or recipient
- [ ] Realtime enabled on `friendships` table
- [ ] SQL committed as `supabase/006_friendships_table.sql`

---

### P5-02: Phase 5 TypeScript Types

**Goal:** Define type definitions for friendships, friend list items, and search results.

**Scope:**
- Included: `FriendshipStatus` union type ('pending' | 'accepted' | 'declined')
- Included: `Friendship` type matching friendships table schema
- Included: `FriendListItem` type for unified friend display (photo, name, match_id, has_intent_today, available_from, available_until, location_type, location_name)
- Included: `UserSearchResult` type for search results (profile + relationship status)
- Included: `RelationshipStatus` union type ('none' | 'pending_sent' | 'pending_received' | 'friends')
- Excluded: Modifying existing Phase 3 or Phase 4 types

**Dependencies:** P5-01

**Definition of Done:**
- [ ] All types added to `src/types/index.ts`
- [ ] Types are exported and available for import
- [ ] No TypeScript compilation errors

---

### P5-03: Friends Service Layer

**Goal:** Provide API functions for friend requests, user search, and friend list retrieval.

**Scope:**
- Included: `searchUsers(query, currentUserId)` — queries profiles by username, email, or phone_number (min 3 characters)
- Included: `sendFriendRequest(requesterId, recipientId)` — calls send_friend_request RPC
- Included: `respondToFriendRequest(friendshipId, userId, response)` — calls respond_to_friend_request RPC
- Included: `fetchFriends(userId)` — returns unified list of friends (all matches) with today's availability status
- Included: `fetchPendingRequests(userId)` — returns pending incoming friend requests with requester profile info
- Included: `getPendingRequestsCount(userId)` — calls get_pending_requests_count RPC
- Included: `getRelationshipStatuses(currentUserId, userIds)` — returns relationship status for each user (for search result buttons)
- Excluded: Friendship deletion or blocking
- Excluded: Real-time subscription for friend requests (polling on screen focus is sufficient for MVP)

**Dependencies:** P5-01, P5-02

**Definition of Done:**
- [ ] Service created at `src/services/friendsService.ts`
- [ ] `searchUsers` returns profiles matching query across username, email, and phone_number fields; excludes self; max 20 results
- [ ] `sendFriendRequest` returns friendship id on success, or error message on failure
- [ ] `respondToFriendRequest` updates status and creates match on accept
- [ ] `fetchFriends` returns unified deduplicated list from matches table, sorted by name, with today's work_intent data per friend (has_intent_today, available_from, available_until, location_type, location_name)
- [ ] `fetchPendingRequests` returns pending incoming requests with requester profile info (id, name, photo_url, username)
- [ ] `getPendingRequestsCount` returns integer count
- [ ] `getRelationshipStatuses` checks both matches and friendships tables to determine status per user
- [ ] All functions handle errors gracefully (return error message, no unhandled rejections)

---

### P5-04: Set Up 4-Tab Navigation + Stack Navigators

**Goal:** Set up 4-tab navigation (Discover, Friends, Chat, Profile) and create necessary stack navigators.

**Scope:**
- Included: Change MainTabs from 3 tabs to 4: Discover, Friends, Chat, Profile
- Included: Rename existing MatchesStack tab label from "Matches" to "Chat" (keep existing MatchesStack behavior)
- Included: Create `FriendsStack` navigator with screens: Friends (initial), AddFriend
- Included: Create `ProfileStack` navigator with screens: Profile (initial), EditProfile
- Included: Define param lists for each stack
- Excluded: Chat tab restructuring (keep existing MatchesStack behavior, just rename tab)
- Excluded: Deep linking

**Dependencies:** None

**Definition of Done:**
- [ ] MainTabs has 4 tabs: Discover, Friends, Chat, Profile
- [ ] FriendsStack created at `src/navigation/FriendsStack.tsx`
- [ ] ProfileStack created at `src/navigation/ProfileStack.tsx` with 2 screens
- [ ] Friends tab renders FriendsStack
- [ ] Chat tab renders existing MatchesStack (renamed label)
- [ ] Profile tab renders ProfileStack
- [ ] Back navigation works in all stacks

---

### P5-05: Build Add Friend Screen

**Goal:** Allow users to search for and send friend requests to other users.

**Scope:**
- Included: Search input with placeholder text
- Included: Debounced search (300ms delay, minimum 3 characters)
- Included: Results list with photo, name, username, and action button per result
- Included: Action button adapts to relationship status: "Add" / "Requested" / "Accept" / "Friends"
- Included: Loading state during search
- Included: Empty state when query returns 0 results
- Included: Initial state with search prompt when input is empty
- Excluded: Contact import (expo-contacts)
- Excluded: Invite non-users via share link

**Dependencies:** P5-03, P5-04

**Definition of Done:**
- [ ] Screen created at `src/screens/friends/AddFriendScreen.tsx`
- [ ] Search input triggers debounced query after 3+ characters typed
- [ ] Results show correct action button based on relationship status
- [ ] Tapping "Add" calls `sendFriendRequest`, button changes to "Requested" immediately (optimistic)
- [ ] Tapping "Accept" (for pending_received) calls `respondToFriendRequest('accept')`, button changes to "Friends"
- [ ] Empty state shows when query returns 0 results ("No users found")
- [ ] Initial state shows when input is empty ("Search by username, email, or phone")
- [ ] Loading spinner shows during search
- [ ] Error alert on failed request send
- [ ] Back button returns to previous screen

---

### P5-06: Build Friends Screen

**Goal:** Show pending friend requests (collapsed) and friends split into two collapsible categories — "Available Today" and "Not Available" — in a dedicated Friends tab.

**Scope:**
- Included: Pending requests section at top, **collapsed by default**, with red dot indicator when count > 0; tap header to expand/collapse
- Included: Each request (when expanded) shows photo/initials, name, username, Accept and Decline buttons
- Included: "Available Today" collapsible section — **expanded by default** — showing friends with today's work_intent
- Included: Each available friend shows photo/initials, name, and intent summary (availability time window + location type/name)
- Included: "Not Available" collapsible section — **collapsed by default** — showing friends without today's intent
- Included: Each not-available friend shows photo/initials and name only
- Included: Section headers are tappable to expand/collapse with chevron indicator (▼ expanded, ▶ collapsed)
- Included: Section headers show count (e.g. "Available Today (3)")
- Included: Tap a friend → navigate to Chat tab
- Included: "+" button in header to navigate to AddFriendScreen
- Included: Pull-to-refresh
- Included: Empty state when no friends yet
- Included: Loading state
- Included: Refresh on screen focus (useFocusEffect)
- Excluded: Friend removal or blocking
- Excluded: Real-time updates for friend list (polling on focus)

**Dependencies:** P5-03, P5-04

**Definition of Done:**
- [ ] Screen created at `src/screens/friends/FriendsScreen.tsx`
- [ ] Pending requests section: collapsed by default, red dot on header when count > 0, tap to expand/collapse
- [ ] When expanded, pending requests show Accept/Decline buttons per request
- [ ] Accept button calls `respondToFriendRequest('accept')`, removes from pending, adds to friends list
- [ ] Decline button calls `respondToFriendRequest('decline')`, removes from pending list
- [ ] "Available Today" section: expanded by default, shows friends with today's work_intent
- [ ] Each available friend shows: profile photo/initials, name, availability time + location (e.g. "14:00–18:00 · Blue Bottle Coffee")
- [ ] "Not Available" section: collapsed by default, shows friends without today's intent
- [ ] Each not-available friend shows: profile photo/initials, name only
- [ ] All three sections have tappable headers with chevron + count
- [ ] Tapping a friend navigates to Chat tab
- [ ] "+" header button navigates to AddFriendScreen
- [ ] Pull-to-refresh reloads pending requests and both friend categories
- [ ] Empty state shows when no friends and no pending requests
- [ ] Screen refreshes on focus (useFocusEffect)
- [ ] Friends tab shows pending request badge count

---

### P5-07: Pending Requests Badge on Friends Tab

**Goal:** Show badge for pending friend requests on the Friends tab.

**Scope:**
- Included: Friends tab in MainTabs shows numeric badge when pending request count > 0
- Included: Badge updates on tab focus (useFocusEffect)
- Excluded: Phone number UI on Profile screen (deferred)
- Excluded: Friends list on Profile screen (moved to Friends tab)

**Dependencies:** P5-03, P5-04

**Definition of Done:**
- [ ] Friends tab shows numeric badge when pending request count > 0
- [ ] Badge updates on tab focus
- [ ] Badge disappears when no pending requests

---

### P5-08: Polish — Loading States, Error Handling, Empty States

**Goal:** Ensure all Phase 5 screens have proper loading, error, and empty states with appropriate feedback.

**Scope:**
- Included: Loading spinners on FriendsScreen and AddFriendScreen during data fetch
- Included: Error alerts for failed operations (search, send request, accept, decline, save phone number)
- Included: Empty states with helpful text for Friends screen ("No friends yet — match with people on Discover or add them here!") and search ("No users found")
- Included: Pull-to-refresh visual feedback on Friends screen
- Included: Haptic feedback on friend request sent and accepted (expo-haptics, if already installed)
- Included: Smooth navigation transitions between ProfileStack screens
- Excluded: Animations on friend cards (card appear/disappear)
- Excluded: Polish on non-Phase-5 screens

**Dependencies:** P5-05, P5-06, P5-07

**Definition of Done:**
- [ ] All data-fetching states show appropriate loading indicators
- [ ] All mutation failures show user-friendly Alert messages
- [ ] Empty states render with Digital Matcha design system colors and typography
- [ ] Pull-to-refresh shows RefreshControl on Friends screen
- [ ] Haptic feedback fires on "Add" and "Accept" taps (if expo-haptics available)
- [ ] Navigation transitions are smooth (default React Navigation stack transitions)
- [ ] No crashes or unhandled promise rejections in Phase 5 flows

---

---

## Profile Redesign

The profile redesign adds a photo system, richer profile fields, and profile editing — making the app feel real enough for people to trust meeting IRL. The scope covers: own profile screen, edit profile screen, Discover card updates, and onboarding changes.

**Design decisions:**
- Photos: soft requirement — 1 required at onboarding, up to 5 total
- Storage: Supabase Storage buckets (public `avatars` bucket)
- Scope: Profile screen + Discover cards only (no full profile modal when tapping Discover cards)
- Interest tags: not included in this redesign (existing interests stay in DB but not surfaced in new profile UI)

---

### P5-09: Database & Storage — profile_photos Table, Profile Columns, Avatars Bucket

**Goal:** Store profile photos with position-based ordering and add new profile text fields. Set up Supabase Storage for photo uploads.

**Scope:**
- Included: Add columns to `profiles` table: `tagline TEXT`, `currently_working_on TEXT`, `work TEXT`, `school TEXT`, `birthday DATE`, `neighborhood TEXT`, `city TEXT`
- Included: Create `profile_photos` table (id, user_id, photo_url, position 0-4, created_at)
- Included: `UNIQUE(user_id, position)` constraint on `profile_photos`
- Included: RLS on `profile_photos`: anyone SELECT, owner INSERT/UPDATE/DELETE
- Included: Create `avatars` storage bucket (public, 5MB limit, jpeg/png/webp)
- Included: Storage RLS: public read, owner-only write to `{userId}/` folder
- Included: File path pattern: `avatars/{userId}/{position}.jpg`
- Excluded: Photo cropping or resizing server-side
- Excluded: Photo moderation

**Dependencies:** None

**Definition of Done:**
- [ ] `profiles` table has `tagline`, `currently_working_on`, `work`, `school` columns (nullable TEXT)
- [ ] `profiles` table has `birthday` (nullable DATE), `neighborhood` (nullable TEXT), `city` (nullable TEXT) columns
- [ ] `profile_photos` table created with all columns, constraints, and indexes
- [ ] RLS on `profile_photos`: public SELECT, owner INSERT/UPDATE/DELETE
- [ ] `avatars` storage bucket created (public, 5MB limit)
- [ ] Storage policies: public read, owner-only write to own folder
- [ ] SQL committed as `supabase/007_profile_photos.sql`

---

### P5-10: Profile Redesign TypeScript Types

**Goal:** Add type definitions for profile photos and extended profile fields.

**Scope:**
- Included: `ProfilePhoto` type: `{ id, user_id, photo_url, position, created_at }`
- Included: Add fields to `Profile` type: `tagline`, `currently_working_on`, `work`, `school`, `birthday`, `neighborhood`, `city` (all `string | null`)
- Excluded: Modifying existing Phase 5 friend types

**Dependencies:** P5-09

**Definition of Done:**
- [ ] `ProfilePhoto` type exported from `src/types/index.ts`
- [ ] `Profile` type updated with new nullable fields (`tagline`, `currently_working_on`, `work`, `school`, `birthday`, `neighborhood`, `city`)
- [ ] No TypeScript compilation errors

---

### P5-11: Photo Service

**Goal:** Provide functions for picking, uploading, deleting, and reordering profile photos.

**Scope:**
- Included: Install `expo-image-picker` via `npx expo install expo-image-picker`
- Included: `pickImage()` — launch image picker (library, square crop, 0.8 quality)
- Included: `uploadPhoto(userId, imageUri, position)` — upload to Supabase Storage, upsert `profile_photos` row, sync `profiles.photo_url` if position=0
- Included: `deletePhoto(userId, position)` — remove from storage + DB, promote next photo if deleting primary
- Included: `getPhotos(userId)` — fetch all photos ordered by position
- Included: `setPrimaryPhoto(userId, fromPosition)` — swap positions, update `profiles.photo_url`
- Excluded: Camera capture (library only)
- Excluded: Photo editing or filters

**Dependencies:** P5-09, P5-10

**Definition of Done:**
- [ ] `expo-image-picker` installed
- [ ] Service created at `src/services/photoService.ts`
- [ ] `pickImage` launches device photo library with square crop
- [ ] `uploadPhoto` uploads to `avatars/{userId}/{position}.jpg`, upserts DB row, syncs `profiles.photo_url` for position 0
- [ ] `deletePhoto` removes from storage and DB, promotes next photo if primary deleted
- [ ] `getPhotos` returns photos ordered by position
- [ ] `setPrimaryPhoto` swaps positions and updates `profiles.photo_url`
- [ ] All functions handle errors gracefully

---

### P5-12: Profile Service

**Goal:** Provide functions for updating and fetching extended profile data.

**Scope:**
- Included: `updateProfile(userId, fields)` — update profiles table with any subset of text fields
- Included: `getFullProfile(userId)` — parallel fetch of profile + photos
- Excluded: Modifying `friendsService.ts` functions

**Dependencies:** P5-10, P5-11

**Definition of Done:**
- [ ] Service created at `src/services/profileService.ts`
- [ ] `updateProfile` updates any subset of profile text fields (name, tagline, currently_working_on, work, school, work_type, birthday, neighborhood, city)
- [ ] `getFullProfile` returns profile data + photos array in a single call
- [ ] Follows existing service patterns (e.g., `discoveryService.ts`)

---

### P5-13: PhotoSlots Component + Onboarding Step 4

**Goal:** Create a reusable photo grid component and add a photo upload step to onboarding.

**Scope:**
- Included: Create `PhotoSlots` component shared between onboarding and edit profile
- Included: Props: `photos`, `totalSlots (5)`, `onAddPhoto`, `onRemovePhoto?`, `onSetPrimary?`, `prompts[]`, `editable?`
- Included: Layout: large primary slot (position 0) + 4 smaller slots in 2x2 grid
- Included: Empty slots: dashed border + prompt text ("A clear photo of your face", etc.)
- Included: Modify onboarding: change `totalSteps` from 3 to 4
- Included: Add Step 4: photo upload with PhotoSlots (1 required to proceed)
- Excluded: Photo cropping within the app
- Excluded: Changes to existing onboarding steps (name, work type, interests)

**Dependencies:** P5-11

**Definition of Done:**
- [ ] Component created at `src/components/profile/PhotoSlots.tsx`
- [ ] Layout: large primary slot + 4 smaller slots in 2x2 grid
- [ ] Empty slots show dashed border with prompt text
- [ ] Filled slots show photo via expo-image
- [ ] Onboarding has 4 steps (name → work type → interests → photos)
- [ ] Step 4 requires at least 1 photo to proceed
- [ ] Photos upload via `uploadPhoto()` on completion

---

### P5-14: ProfileStack + ProfileScreen Redesign

**Goal:** Redesign the Profile screen with Hinge-style interleaved photos and info cards.

**Scope:**
- Included: Create `ProfileStack` with 2 screens: Profile, EditProfile
- Included: Rewrite `ProfileScreen` with ScrollView layout:
  - Lead photo (~400px) with name overlaid at bottom-left (white text, text shadow)
  - Age · Neighborhood · City line below lead photo
  - Info card: work type + tagline + currently working on + work + school
  - Additional photos (2-5) interspersed after info card
  - "Edit Profile" button
  - Sign Out at bottom
- Included: `useFocusEffect` → `getFullProfile()` for fresh data
- Included: Migration banner if no photos
- Excluded: Phone Number row (removed)
- Excluded: My Friends row (moved to Friends tab)
- Excluded: Full profile modal from Discover

**Dependencies:** P5-10, P5-11, P5-12

**Definition of Done:**
- [ ] ProfileStack has 2 screens: Profile, EditProfile
- [ ] ProfileScreen shows lead photo with name overlay
- [ ] Age, neighborhood, city shown below photo
- [ ] Info card with work type, tagline, currently working on, work, school
- [ ] Additional photos shown below info card
- [ ] Edit Profile button navigates to EditProfile
- [ ] Sign Out at bottom
- [ ] Screen refreshes on focus
- [ ] Migration banner shows when no photos
- [ ] No Phone Number or My Friends rows

---

### P5-15: EditProfileScreen

**Goal:** Allow users to edit their profile photos and text fields.

**Scope:**
- Included: Header: Cancel (left) / Save (right)
- Included: PhotoSlots grid (editable=true, action sheet on tap: Change/Remove/Set Primary)
- Included: TextInputs: Name, Tagline, Currently Working On, Work, School, Neighborhood, City
- Included: Birthday date picker
- Included: Work type single-select pills
- Included: Photos upload/delete immediately (not batched with save) for instant feedback
- Included: Save button updates text fields only via `updateProfile()`, then `refreshProfile()` + `goBack()`
- Excluded: Interest tag editing
- Excluded: Email or username editing
- Excluded: Profile photo cropping within the app

**Dependencies:** P5-11, P5-12, P5-13 (PhotoSlots), P5-14 (navigation)

**Definition of Done:**
- [ ] Screen created at `src/screens/profile/EditProfileScreen.tsx`
- [ ] PhotoSlots shows current photos with add/remove/set-primary actions
- [ ] TextInputs for name, tagline, currently working on, work, school, neighborhood, city
- [ ] Birthday date picker
- [ ] Work type pills for single selection
- [ ] Photos upload/delete immediately on interaction
- [ ] Save updates text fields and navigates back
- [ ] Cancel navigates back without saving text changes
- [ ] Photos already uploaded persist even if Cancel is tapped

---

### P5-16: SwipeCard Tagline + Age + Neighborhood Update

**Goal:** Show user tagline, age, and neighborhood on Discover cards.

**Scope:**
- Included: Add tagline below work_type in the card overlay (13px, white, italic)
- Included: Add age + neighborhood to the card overlay
- Included: Photos already handled (existing `photo_url` support on SwipeCard)
- Excluded: Changes to tags row (keep existing work_style + location_type tags)
- Excluded: Interest tags display

**Dependencies:** P5-10

**Definition of Done:**
- [ ] Tagline displays below work_type in SwipeCard overlay
- [ ] Age and neighborhood display in SwipeCard overlay
- [ ] Tagline styled: 13px, white, italic
- [ ] No tagline/age/neighborhood → nothing renders (graceful null handling)
- [ ] Existing card layout and behavior unchanged

---

### P5-17: Verify Avatar Components

**Goal:** Confirm that existing avatar components work automatically once `profiles.photo_url` is populated by the photo service.

**Scope:**
- Included: Verify `MatchCard.tsx` displays photos when `photo_url` exists
- Included: Verify `MatchModal.tsx` displays photos when `photo_url` exists
- Included: Verify `fetch_match_previews` RPC returns `photo_url`
- Excluded: Code changes (verification only — components already handle `photo_url`)

**Dependencies:** P5-09, P5-11

**Definition of Done:**
- [ ] MatchCard shows user's primary photo instead of initials when photo_url is set
- [ ] MatchModal shows both users' photos when photo_url is set
- [ ] `fetch_match_previews` RPC returns photo_url in results

---

### P5-18: Editable Username (Unique Handle)

**Goal:** Allow users to customize their username while preserving uniqueness and existing search behavior.

**Scope:**
- Included: Add username input to Edit Profile screen
- Included: Client-side username validation (format + length)
- Included: Save username via profile update flow in Edit Profile
- Included: Show clear error if username is already taken
- Included: Ensure friend search continues to work with updated usernames
- Excluded: Username change history
- Excluded: Reserved-word blacklist beyond basic validation
- Excluded: @mention system

**Dependencies:** P5-15

**Definition of Done:**
- [ ] Username field appears in Edit Profile
- [ ] Username field is pre-populated from current profile
- [ ] Validation blocks invalid usernames (empty/too short/invalid characters)
- [ ] Duplicate username returns user-friendly error ("Username is already taken")
- [ ] Successful save updates `profiles.username`
- [ ] Updated username is visible in Add Friend search and user cards

---

## Exit Criteria

Phase 5 is complete when all tickets are done and:

### Friends
1. Users can search for other users by username, email, or phone number
2. Users can send friend requests
3. Recipients can accept or decline friend requests
4. Accepting a friend request creates a match row (enables chat)
5. Mutual pending requests auto-accept
6. Friends tab shows pending requests section and unified friends list
7. Friends show availability status (green dot + task if they have today's intent)
8. Tapping a friend navigates to their chat
9. Friends tab badge shows pending request count

### Profile Redesign
10. New users upload at least 1 photo during onboarding (Step 4)
11. Users can set birthday, neighborhood, and city on their profile
12. Users can edit their profile (name, tagline, currently working on, work, school, work type)
13. Users can upload up to 5 photos, with position 0 synced to `profiles.photo_url`
14. Profile screen shows Hinge-style layout with name on photo, age/location line, interleaved photos and info cards
15. Edit Profile screen allows photo management (add/remove/set primary) and text field editing
16. Discover cards display tagline below work type
17. Existing avatar components (MatchCard, MatchModal) show photos automatically
18. Existing users without photos see a migration banner on Profile screen
19. App runs without crashes on iOS simulator
20. Users can customize username with uniqueness enforced

---

## Verification

### Friends Test Flow

Run the app and complete this test flow:

1. Login as User A, navigate to Friends tab
2. Verify empty state ("No friends yet")
3. Tap "+" to add friend
4. Search for User B by email
5. Verify User B appears in results with "Add" button
6. Tap "Add" → verify button changes to "Requested"
7. Login as User B, navigate to Friends tab
8. Verify badge shows "1" on Friends tab
9. Verify pending request from User A
10. Tap "Accept" → verify User A moves to friends list with availability
11. Tap User A → verify chat screen opens
12. Login as User A, navigate to Friends tab
13. Verify User B now appears in friends list
14. Test decline: User A searches for User C, sends request, User C declines
15. Verify declined request disappears from User C's pending list
16. Test mutual request auto-accept: User D requests User E, then User E requests User D → both become friends immediately

### Profile Redesign Test Flow

1. **New user onboarding** — create account, complete all 4 steps (name → work type → interests → photo upload), verify photo uploads and profile creates correctly
2. **Profile screen** — verify Hinge-style layout with name overlay on lead photo, age/location line, info card, interleaved photos
3. **Edit profile** — tap "Edit Profile", change all text fields, verify saves persist after navigation
4. **Photo management** — add/remove/reorder photos in Edit Profile, verify primary syncs to `profiles.photo_url`
5. **Discover cards** — verify photo and tagline appear on SwipeCard
6. **Match avatars** — verify MatchCard and MatchModal show photos automatically once photo_url is set
7. **Existing user migration** — log in as user without photos, verify migration banner appears and links to Edit Profile
8. **Run app** — `npm start`, test on iOS simulator via Expo Go
