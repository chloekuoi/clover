# Phase 3: Matching & Messaging

**Goal:** Matched users can chat in real time.

**Entry Criteria:** Phase 2 complete (discovery, swipe gestures, match detection via RPC)

---

## Tickets

### P3-01: Create matches and messages Database Tables

**Goal:** Persist mutual matches and store chat messages in Supabase.

**Scope:**
- Included: Create `matches` table with user1_id, user2_id, matched_at, last_read tracking
- Included: Create `messages` table with match_id, sender_id, content
- Included: Create `create_match(p_user1, p_user2)` RPC function that orders user IDs and returns match UUID
- Included: Create `mark_chat_read(p_match_id, p_user_id)` RPC function
- Included: Add unique constraint on ordered user pair to prevent duplicate matches
- Included: Configure RLS policies for both tables
- Included: Enable Supabase Realtime on `messages` table
- Excluded: Read receipt per message
- Excluded: Message editing or deletion

**Definition of Done:**
- [ ] `matches` table created with all columns and constraints
- [ ] `messages` table created with all columns and constraints
- [ ] `create_match` function inserts with ordered user IDs and returns match UUID
- [ ] `create_match` returns existing match UUID if pair already matched
- [ ] `mark_chat_read` updates the correct last_read column based on user position
- [ ] RLS: Users can only SELECT matches where they are user1 or user2
- [ ] RLS: Users can only SELECT messages for matches they belong to
- [ ] RLS: Users can only INSERT messages to matches they belong to, as themselves
- [ ] Realtime enabled on `messages` table
- [ ] Test: Manual insert via Supabase dashboard succeeds

**Dependencies:** None

---

### P3-02: Add Phase 3 TypeScript Types

**Goal:** Define type definitions for matches, messages, and chat previews.

**Scope:**
- Included: Add `Match` type matching database schema
- Included: Add `Message` type matching database schema
- Included: Add `MatchPreview` type for the matches list (other user profile + last message + unread count)
- Excluded: Modifying existing Phase 2 types

**Definition of Done:**
- [ ] All types added to `src/types/index.ts`
- [ ] Types are exported and available for import
- [ ] No TypeScript compilation errors

**Dependencies:** P3-01

---

### P3-03: Create Messaging Service

**Goal:** Provide API layer for match and message operations.

**Scope:**
- Included: `fetchMatches(userId)` — get all matches with other user's profile, last message, and unread count
- Included: `fetchMessages(matchId)` — get all messages for a match, ordered by created_at ascending
- Included: `sendMessage(matchId, senderId, content)` — insert message
- Included: `markChatRead(matchId, userId)` — call mark_chat_read RPC
- Included: `getUnreadCount(userId)` — total unread messages across all matches
- Included: `subscribeToMessages(matchId, callback)` — Supabase Realtime subscription for new messages
- Excluded: Pagination of messages
- Excluded: Message search
- Excluded: Typing indicators

**Definition of Done:**
- [ ] Service created at `src/services/messagingService.ts`
- [ ] `fetchMatches` returns array of `MatchPreview` sorted by most recent activity
- [ ] `fetchMessages` returns array of `Message` in chronological order
- [ ] `sendMessage` inserts message and returns the created message
- [ ] `markChatRead` calls RPC and handles errors
- [ ] `getUnreadCount` returns integer count
- [ ] `subscribeToMessages` returns unsubscribe function
- [ ] Test: All functions work with Supabase (verify via console logs)

**Dependencies:** P3-01, P3-02

---

### P3-04: Update Swipe Flow to Persist Matches

**Goal:** When a mutual swipe is detected, create a persistent match record.

**Scope:**
- Included: Update `recordSwipe` in discoveryService to call `create_match` RPC when `check_match` returns true
- Included: Return `matchId` in the swipe result when a match occurs
- Included: Return matched user's profile info for the modal
- Excluded: Changing swipe gesture behavior
- Excluded: Changing swipe recording logic

**Definition of Done:**
- [ ] `recordSwipe` calls `create_match` after detecting a mutual swipe
- [ ] Return type updated to `{ isMatch: boolean; matchId: string | null; matchedUser: Profile | null; error: Error | null }`
- [ ] Match row appears in `matches` table after mutual right swipe
- [ ] Duplicate match attempts are handled gracefully (no error, returns existing match)
- [ ] Left swipes still work unchanged

**Dependencies:** P3-01, P3-03

---

### P3-05: Build "It's a Match!" Modal

**Goal:** Show a celebratory modal when two users match, with option to message immediately.

**Scope:**
- Included: Full-screen overlay modal with semi-transparent background
- Included: Both users' profile photos (or initials) side by side
- Included: "It's a Match!" heading and subtitle
- Included: "Send Message" primary button → navigates to chat
- Included: "Keep Swiping" ghost button → dismisses modal
- Excluded: Confetti animation
- Excluded: Sound effects

**Definition of Done:**
- [ ] Component created at `src/components/matches/MatchModal.tsx`
- [ ] Accepts: visible, currentUser (Profile), matchedUser (Profile), matchId, onSendMessage, onDismiss
- [ ] Shows both users' photos or initials side by side
- [ ] "Send Message" calls onSendMessage with matchId and matchedUser
- [ ] "Keep Swiping" calls onDismiss
- [ ] Modal uses Digital Matcha design system colors
- [ ] Background overlay dims the screen

**Dependencies:** P3-02

---

### P3-06: Build MatchCard Component

**Goal:** Display a match preview in the matches list with last message and unread indicator.

**Scope:**
- Included: Profile photo with initials fallback (circular, 56px)
- Included: Name display
- Included: Last message preview text (truncated to 1 line) or "Say hello!" placeholder
- Included: Relative timestamp (e.g., "2m ago", "1h ago", "Yesterday")
- Included: Unread dot indicator when unread_count > 0
- Excluded: Online/offline status
- Excluded: Typing indicator

**Definition of Done:**
- [ ] Component created at `src/components/matches/MatchCard.tsx`
- [ ] Accepts: matchPreview (MatchPreview), onPress
- [ ] Shows circular photo or initials
- [ ] Shows name in bold
- [ ] Shows last message preview or "Say hello!" if no messages
- [ ] Shows relative time of last message or match time
- [ ] Shows green unread dot when unread_count > 0
- [ ] Name text is bold when unread
- [ ] Minimum touch target 44pt

**Dependencies:** P3-02

---

### P3-07: Build Matches List Screen

**Goal:** Show all matches with last message preview, navigable to individual chat.

**Scope:**
- Included: FlatList of MatchCard components
- Included: Loading state with spinner
- Included: Empty state ("No matches yet" with encouragement to keep swiping)
- Included: Pull-to-refresh
- Included: Tap match → navigate to Chat screen
- Included: Refresh on screen focus (React Navigation)
- Excluded: Search or filter matches
- Excluded: Delete or unmatch
- Excluded: Sections (e.g., "New matches" vs "Messages")

**Definition of Done:**
- [ ] Screen created at `src/screens/matches/MatchesListScreen.tsx`
- [ ] Shows loading spinner on initial fetch
- [ ] Shows list of matches sorted by most recent activity
- [ ] Shows empty state with message when no matches
- [ ] Pull-to-refresh reloads matches
- [ ] Tapping a match navigates to Chat with matchId and other user's profile
- [ ] Refreshes when screen gains focus

**Dependencies:** P3-03, P3-06

---

### P3-08: Build Chat Screen

**Goal:** Allow matched users to send and receive messages in real time.

**Scope:**
- Included: Header with other user's name and back button
- Included: Message list (FlatList, inverted for newest-at-bottom)
- Included: Message bubbles (sent = right-aligned sage, received = left-aligned cream)
- Included: Text input bar with send button at bottom
- Included: Supabase Realtime subscription for incoming messages
- Included: Auto-scroll to newest message on send/receive
- Included: Mark chat as read on screen open and when new messages arrive
- Included: Keyboard-avoiding behavior
- Included: Empty state ("Start the conversation!")
- Excluded: Image or file attachments
- Excluded: Typing indicators
- Excluded: Message reactions
- Excluded: Message deletion

**Definition of Done:**
- [ ] Screen created at `src/screens/matches/ChatScreen.tsx`
- [ ] Header shows other user's name with back navigation
- [ ] Messages render in chronological order (newest at bottom)
- [ ] Sent messages are right-aligned with sage green background
- [ ] Received messages are left-aligned with cream background
- [ ] Text input at bottom with send button
- [ ] Send button disabled when input is empty
- [ ] Sending a message clears input and appends to list
- [ ] Real-time subscription adds incoming messages to list
- [ ] Chat marked as read on mount and on new incoming messages
- [ ] Keyboard pushes input bar up (KeyboardAvoidingView)
- [ ] Shows "Start the conversation!" when no messages exist

**Dependencies:** P3-03

---

### P3-09: Add Matches Stack Navigator

**Goal:** Enable navigation from matches list to individual chat screens.

**Scope:**
- Included: Create MatchesStack with MatchesList and Chat screens
- Included: Update MainTabs to use MatchesStack instead of MatchesScreen
- Included: Pass matchId and other user profile as route params to Chat
- Excluded: Deep linking
- Excluded: Changing other tab navigators

**Definition of Done:**
- [ ] Stack navigator created at `src/navigation/MatchesStack.tsx`
- [ ] Contains MatchesList (initial) and Chat screens
- [ ] MainTabs Matches tab uses MatchesStack
- [ ] Navigation from MatchesList to Chat works with params
- [ ] Back button in Chat returns to MatchesList
- [ ] Cross-tab navigation from Match modal to Chat works

**Dependencies:** P3-07, P3-08

---

### P3-10: Integrate Match Modal in Discover Flow

**Goal:** Replace the native Alert with the custom Match modal and enable navigation to chat.

**Scope:**
- Included: Show MatchModal in DiscoverScreen when match detected
- Included: "Send Message" navigates to Matches tab → Chat screen
- Included: "Keep Swiping" dismisses modal and continues discovery
- Included: Pass current user and matched user profiles to modal
- Excluded: Changing swipe behavior
- Excluded: Changing match detection logic

**Definition of Done:**
- [ ] DiscoverScreen shows MatchModal instead of Alert.alert on match
- [ ] Modal receives current user profile, matched user profile, and matchId
- [ ] "Send Message" navigates to Matches → Chat with correct params
- [ ] "Keep Swiping" dismisses modal, discovery continues
- [ ] Modal does not interfere with card stack underneath

**Dependencies:** P3-04, P3-05, P3-09

---

### P3-11: Add Unread Message Badge to Matches Tab

**Goal:** Show unread message count on the Matches tab icon.

**Scope:**
- Included: Fetch unread count on app load and tab focus
- Included: Display numeric badge on Matches tab when count > 0
- Included: Update badge when new messages arrive (poll on tab focus)
- Excluded: Real-time badge updates via subscription (poll is sufficient for MVP)
- Excluded: Per-match unread counts in the badge

**Definition of Done:**
- [ ] Matches tab shows red badge with number when unread count > 0
- [ ] Badge disappears when unread count is 0
- [ ] Badge updates when Matches tab gains focus
- [ ] Badge updates after returning from a chat (markAsRead reduces count)
- [ ] Uses React Navigation `tabBarBadge` option

**Dependencies:** P3-03, P3-09

---

## Exit Criteria

Phase 3 is complete when all tickets are done and:

1. Mutual right swipes create a persistent match in the `matches` table
2. Custom "It's a Match!" modal appears with both users' info
3. "Send Message" in modal navigates to chat with that match
4. Matches list shows all matches with last message preview and unread indicator
5. Chat screen sends and receives messages in real time
6. Messages persist in the `messages` table
7. Unread badge shows on Matches tab when messages are waiting
8. Pull-to-refresh works on matches list
9. App runs without crashes on iOS simulator

---

## Verification

Run the app and complete this test flow:

1. Login with User A
2. Create intent, swipe right on User B
3. Login with User B, create intent, swipe right on User A
4. Verify Match modal appears with both users' photos
5. Tap "Send Message" → verify Chat screen opens
6. Send a message from User B
7. Switch to User A, navigate to Matches tab
8. Verify match appears with message preview and unread dot
9. Open chat, verify message from User B is visible
10. Send reply from User A
11. Switch to User B, verify reply appears in real time
12. Verify unread badge on Matches tab updates correctly
