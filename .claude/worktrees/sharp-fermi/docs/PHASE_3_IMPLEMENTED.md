# Phase 3: Matching & Messaging — Implementation Map (Scaffold)

**Status:** PENDING IMPLEMENTATION
**Created:** 2026-02-07

> This document will be updated by Codex after implementation.

---

## Baseline Findings

- `npm install` requires elevated permissions to write `package-lock.json` and npm logs.
- `npx expo start` fails inside the sandbox with `RangeError [ERR_SOCKET_BAD_PORT]: ... Received type number (65536)` from `freeport-async`.
- Running `npx expo start --port 19000` outside the sandbox starts Metro successfully (logs show "Starting Metro Bundler" and "Waiting on http://localhost:19000").
- Supabase schema required alignment: existing `matches`/`messages` had different columns and required migration to Phase 3 spec (renames, UUID type, last_read fields, RPCs, and policies).

---

## Verification Results (2026-02-08)

- Flow 7: DB tables present, RPCs created, RLS policies updated, Realtime enabled for `messages`.
- Flow 8: Mutual right swipe creates `matches` row.
- Flow 9: MatchModal appears; "Send Message" navigates to chat; "Keep Swiping" dismisses (note: empty-state text visible behind modal).
- Flow 10: Chat send/receive works, messages persist, realtime delivers updates.
- Flow 11: Matches list shows previews, timestamps, unread dot.
- Flow 12: Matches tab unread badge updates and clears after reading.

---

## P3-01: Database Tables (matches, messages, RPCs)

### Intended Behavior
- `matches` table stores persistent match records with ordered user IDs and per-user last_read_at timestamps
- `messages` table stores chat messages linked to a match
- `create_match` RPC orders user IDs and inserts (or returns existing) match
- `mark_chat_read` RPC updates the correct last_read column
- RLS restricts access to own matches and messages only
- Realtime enabled on `messages` table

### Expected File Paths
- `supabase/003_matching_tables.sql` (created)

### Verification
- RUNBOOK: Phase 3 Flow 7 — Database setup verification

### Known Risks / TODOs
- Realtime must be explicitly enabled in Supabase Dashboard for the `messages` table
- Verify that SECURITY DEFINER functions bypass RLS correctly

---

## P3-02: Phase 3 TypeScript Types

### Intended Behavior
- `Match` type mirrors `matches` table schema
- `Message` type mirrors `messages` table schema
- `MatchPreview` type combines match data + other user's profile + last message + unread count

### Expected File Paths
- `src/types/index.ts` (modified — append new types)

### Verification
- `npx tsc --noEmit` passes with no errors

### Known Risks / TODOs
- None

---

## P3-03: Messaging Service

### Intended Behavior
- `fetchMatches(userId)` returns `MatchPreview[]` sorted by most recent activity
- `fetchMessages(matchId)` returns `Message[]` in chronological order
- `sendMessage(matchId, senderId, content)` inserts and returns the message
- `markChatRead(matchId, userId)` calls `mark_chat_read` RPC
- `getUnreadCount(userId)` returns total unread integer
- `subscribeToMessages(matchId, callback)` returns unsubscribe function

### Expected File Paths
- `src/services/messagingService.ts` (created)

### Verification
- RUNBOOK: Phase 3 Flow 10 — Chat send/receive
- Console log verification of all function returns

### Known Risks / TODOs
- `fetchMatches` requires joining matches → profiles → messages (complex query, may need RPC)
- Unread count calculation may need a dedicated RPC for efficiency
- Real-time subscription cleanup on unmount is critical

---

## P3-04: Update Swipe Flow to Persist Matches

### Intended Behavior
- `recordSwipe` in discoveryService calls `create_match` RPC when `check_match` returns true
- Return type extended to include `matchId` and `matchedUser`
- Left swipes unchanged

### Expected File Paths
- `src/services/discoveryService.ts` (modified — update `recordSwipe`)

### Verification
- RUNBOOK: Phase 3 Flow 8 — Match creation
- Check `matches` table in Supabase after mutual right swipe

### Known Risks / TODOs
- Must handle the case where `create_match` RPC doesn't exist yet (dependency on P3-01)
- Need to fetch matched user's profile for the modal

---

## P3-05: Match Modal

### Intended Behavior
- Full-screen overlay with semi-transparent background
- Shows both users' photos/initials side by side
- "It's a Match!" heading with subtitle
- "Send Message" button navigates to chat
- "Keep Swiping" dismisses modal

### Expected File Paths
- `src/components/matches/MatchModal.tsx` (created)

### Verification
- RUNBOOK: Phase 3 Flow 9 — Match modal
- Visual inspection of modal layout and buttons

### Known Risks / TODOs
- Modal must not interfere with gesture handler on card stack
- Cross-tab navigation from modal may be tricky

---

## P3-06: MatchCard Component

### Intended Behavior
- Shows circular profile photo or initials
- Name, last message preview (or "Say hello!"), relative timestamp
- Green unread dot when unread_count > 0
- Bold name when unread

### Expected File Paths
- `src/components/matches/MatchCard.tsx` (created)

### Verification
- Visual inspection in MatchesListScreen
- Verify unread dot appears/disappears correctly

### Known Risks / TODOs
- Relative time formatting needs a utility function (e.g., "2m ago", "1h ago", "Yesterday")

---

## P3-07: Matches List Screen

### Intended Behavior
- FlatList of MatchCard components
- Loading, empty, and list states
- Pull-to-refresh
- Tap navigates to ChatScreen
- Refreshes on screen focus

### Expected File Paths
- `src/screens/matches/MatchesListScreen.tsx` (created)
- `src/screens/matches/MatchesScreen.tsx` (deleted or replaced)

### Verification
- RUNBOOK: Phase 3 Flow 11 — Matches list
- Test empty state, loading state, and populated list

### Known Risks / TODOs
- Existing `MatchesScreen.tsx` is a placeholder — safe to replace entirely

---

## P3-08: Chat Screen

### Intended Behavior
- Header with other user's name and back button
- Message list (inverted FlatList, newest at bottom)
- Sent messages right-aligned sage, received left-aligned cream
- Text input bar with send button
- Realtime subscription for incoming messages
- Marks chat as read on mount

### Expected File Paths
- `src/screens/matches/ChatScreen.tsx` (created)
- `src/components/matches/MessageBubble.tsx` (created)
- `src/components/matches/ChatInputBar.tsx` (created)

### Verification
- RUNBOOK: Phase 3 Flow 10 — Chat send/receive
- Test real-time with two accounts

### Known Risks / TODOs
- KeyboardAvoidingView behavior differs between iOS and Android
- Inverted FlatList with Realtime inserts needs careful state management
- Must unsubscribe from Realtime on unmount

---

## P3-09: Matches Stack Navigator

### Intended Behavior
- Stack navigator with MatchesList (initial) and Chat screens
- MainTabs Matches tab uses MatchesStack
- Route params pass matchId and otherUser to Chat

### Expected File Paths
- `src/navigation/MatchesStack.tsx` (created)
- `src/navigation/MainTabs.tsx` (modified — import MatchesStack)

### Verification
- Navigate from matches list to chat and back
- Cross-tab navigation from match modal to chat

### Known Risks / TODOs
- React Navigation 7 requires `id` prop on navigators
- Cross-tab navigation pattern: `navigation.navigate('Matches', { screen: 'Chat', params: {...} })`

---

## P3-10: Integrate Match Modal in Discover Flow

### Intended Behavior
- DiscoverScreen shows MatchModal instead of Alert.alert on match
- Modal receives current user profile, matched user profile, and matchId
- "Send Message" navigates to Matches → Chat
- "Keep Swiping" dismisses and continues

### Expected File Paths
- `src/screens/discover/DiscoverScreen.tsx` (modified — replace Alert with MatchModal)

### Verification
- RUNBOOK: Phase 3 Flow 9 — Match modal
- Test both "Send Message" and "Keep Swiping" paths

### Known Risks / TODOs
- Need access to current user's profile in DiscoverScreen (from AuthContext)
- Cross-tab navigation requires parent navigator access

---

## P3-11: Unread Message Badge

### Intended Behavior
- Matches tab icon shows numeric badge when unread count > 0
- Badge updates on tab focus
- Badge disappears when all messages are read

### Expected File Paths
- `src/navigation/MainTabs.tsx` (modified — add tabBarBadge logic)

### Verification
- RUNBOOK: Phase 3 Flow 12 — Unread badge
- Test badge appears, updates, and disappears

### Known Risks / TODOs
- Fetching unread count on every tab focus adds latency — acceptable for MVP
- Consider a context or global state for unread count if performance is an issue

---

## Quick Verification Checklist

```bash
# 1. TypeScript compiles
npx tsc --noEmit

# 2. App starts
npm start
# Press 'i' for iOS

# 3. Database ready (run in Supabase SQL Editor)
# Contents of supabase/003_matching_tables.sql
```

### End-to-End Test Flow
1. Login with User A, set intent, swipe right on User B
2. Login with User B, set intent, swipe right on User A
3. Verify Match modal appears (not native Alert)
4. Tap "Send Message" → verify Chat screen opens
5. Send message from User B → verify it appears
6. Switch to User A → verify Matches tab badge shows "1"
7. Open Matches list → verify match with message preview
8. Open chat → verify User B's message is visible
9. Send reply → verify it appears
10. Switch to User B → verify reply appears in real time
11. Verify badge updates correctly after reading messages
