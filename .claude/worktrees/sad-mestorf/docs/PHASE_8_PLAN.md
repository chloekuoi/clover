# PHASE 8 — Unmatch

**Status:** PLANNED
**Phase:** 8
**Depends on:** Phase 7 (Group Chat)

---

## Goal

Users can unmatch a person from either the Chats list or Friends list via swipe-left. Unmatching removes that person from active Chats and Friends, hides prior DM messages and match sessions from the app UI, preserves historical records in the database, and allows the same user to appear again in Discover later.

---

## Scope

### In
- Soft-unmatch support on `matches`
- New Supabase migration `supabase/009_unmatch_matches.sql`
- New RPC `unmatch_user`
- Swipe-left destructive unmatch action on 1:1 DM rows in `MatchesListScreen`
- Swipe-left destructive unmatch action on match-backed friend rows in `FriendsScreen`
- Shared confirmation alert copy for both entry points
- Query filtering so unmatched rows disappear from Chats, Friends, unread counts, and match session UI
- Discovery updated so unmatched users may appear again
- Chat stale-route guard for unmatched chats
- Phase 8 documentation artifacts

### Out
- No unmatch action for group chats
- No remove-manual-friend feature
- No hard delete of matches, messages, or sessions
- No block/report system
- No undo flow after unmatch
- No hidden archive screen for unmatched users

---

## Product Rules

- Unmatch removes the other user from active Chats and Friends
- Manual friendships are not removable in this phase
- Unmatched users may appear again in Discover
- Old messages remain in DB but are hidden from UI
- Old sessions remain in DB but are hidden from UI
- Group chats are unaffected

---

## Tickets

---

### P8-01 — Database: unmatch schema + RPC

**Goal:** Add soft-unmatch support to `matches` and expose an idempotent RPC for the destructive action.

**Scope:**
- IN: New file `supabase/009_unmatch_matches.sql`
- IN: Add columns to `matches`:
  - `status TEXT NOT NULL DEFAULT 'active'`
  - `unmatched_by UUID NULL`
  - `unmatched_at TIMESTAMPTZ NULL`
- IN: Constraint: `status IN ('active', 'unmatched')`
- IN: RPC: `unmatch_user(p_match_id UUID, p_user_id UUID) RETURNS BOOLEAN`
- IN: RPC validates caller belongs to the match
- IN: RPC sets `status='unmatched'`, `unmatched_by=p_user_id`, `unmatched_at=NOW()`
- OUT: No hard delete of matches/messages/sessions

**Dependencies:** None

**Definition of Done:**
- SQL executes without errors in Supabase SQL Editor
- Existing active matches backfill safely to `status='active'`
- `unmatch_user` is idempotent
- `npx tsc --noEmit` passes

---

### P8-02 — Service: unmatch API

**Goal:** Add a typed service function for unmatching and centralize the backend call.

**Scope:**
- IN: Add `unmatchMatch(matchId: string, userId: string): Promise<boolean>` to `src/services/messagingService.ts`
- IN: Service calls `unmatch_user`
- IN: Clear error logging and boolean success return
- OUT: No UI changes in this ticket

**Dependencies:** P8-01

**Definition of Done:**
- `unmatchMatch` calls the RPC correctly
- No `any`
- `npx tsc --noEmit` passes

---

### P8-03 — Query filtering: hide unmatched from active UI

**Goal:** Ensure unmatched relationships disappear from active Chats/Friends/session views but remain in DB.

**Scope:**
- IN: Update active match preview logic to only include `matches.status = 'active'`
- IN: Update unread count logic to ignore unmatched rows
- IN: Update `fetchFriends` to exclude unmatched auto-friends
- IN: Update DM/session read paths so unmatched match history is not shown in app UI
- IN: Preserve DB rows for old messages/sessions
- OUT: No Discover changes in this ticket

**Dependencies:** P8-01

**Definition of Done:**
- Unmatched users no longer appear in Chats
- Unmatched users no longer appear in Friends
- Old message/session rows stay in DB
- `npx tsc --noEmit` passes

---

### P8-04 — Discovery: allow unmatched users to reappear

**Goal:** Ensure Discover excludes only active matches, not unmatched rows.

**Scope:**
- IN: Update discovery filtering so previously unmatched users may appear again
- OUT: No rematch history UI

**Dependencies:** P8-01

**Definition of Done:**
- A user with `matches.status = 'unmatched'` is eligible to reappear in Discover
- Users with `matches.status = 'active'` remain excluded
- `npx tsc --noEmit` passes

---

### P8-05 — Component: reusable swipe action row

**Goal:** Create a shared destructive swipe wrapper used by both Chats and Friends.

**File:** `src/components/common/SwipeActionRow.tsx`

**Scope:**
- IN: Reusable wrapper using `Swipeable` from `react-native-gesture-handler`
- IN: Props:
  - `enabled: boolean`
  - `actionLabel: string`
  - `onActionPress: () => void`
  - `children: React.ReactNode`
- IN: Red destructive action reveal on swipe-left
- OUT: No delete/remove-manual-friend variants

**Dependencies:** None

**Definition of Done:**
- Swipe-left reveals destructive action
- Disabled rows do not swipe
- `npx tsc --noEmit` passes

---

### P8-06 — Chats: swipe-left to unmatch DMs

**Goal:** Allow unmatching directly from the Chats list for 1:1 DMs only.

**File:** `src/screens/matches/MatchesListScreen.tsx`

**Scope:**
- IN: Wrap DM rows in `SwipeActionRow`
- IN: Swipe-left action label: `Unmatch`
- IN: Group rows do NOT show swipe action
- IN: Tapping `Unmatch` shows confirmation alert
- IN: On confirm: call `unmatchMatch`, refresh Chats list, refresh unread count
- OUT: No swipe action on group rows

**Dependencies:** P8-02, P8-03, P8-05

**Definition of Done:**
- Only DM rows can be swiped to unmatch
- Group rows are unaffected
- Successful unmatch removes row from Chats list
- `npx tsc --noEmit` passes

---

### P8-07 — Friends: swipe-left to unmatch match-backed rows

**Goal:** Allow unmatching from Friends for auto-friends backed by an active match.

**File:** `src/screens/friends/FriendsScreen.tsx`

**Scope:**
- IN: Wrap match-backed friend rows in `SwipeActionRow`
- IN: Pending request cards do not show swipe action
- IN: Manual-only friends do not show swipe action
- IN: Tapping `Unmatch` shows same confirmation alert as Chats
- IN: On confirm: call `unmatchMatch`, refresh Friends list
- OUT: No remove-manual-friend flow

**Dependencies:** P8-02, P8-03, P8-05

**Definition of Done:**
- Only active match-backed friend rows can be swiped to unmatch
- Unmatched person disappears from Friends after success
- `npx tsc --noEmit` passes

---

### P8-08 — Chat guard: stale unmatched route handling

**Goal:** Prevent users from staying inside or re-opening a now-unmatched chat.

**File:** `src/screens/matches/ChatScreen.tsx`

**Scope:**
- IN: If a route opens an unmatched match, show alert and `navigation.goBack()` or `navigation.popToTop()`
- IN: Hide unmatched match session/message UI from active experience
- OUT: No archive/restore UI

**Dependencies:** P8-03

**Definition of Done:**
- Stale unmatched chat routes fail gracefully
- No active session card remains visible for unmatched chat
- `npx tsc --noEmit` passes

---

### P8-09 — Documentation

**Goal:** Write all Phase 8 planning and implementation docs plus verification guidance.

**Scope:**
- IN: Create `docs/PHASE_8_PLAN.md` (this file)
- IN: Create `docs/PHASE_8_IMPLEMENTED.md`
- IN: Append Phase 8 sections to `docs/API_CONTRACT.md`
- IN: Append Phase 8 sections to `docs/RUNBOOK.md`
- OUT: No rewriting previous phase sections

**Dependencies:** All P8 tickets

**Definition of Done:**
- All docs updated
- No previous phase sections modified

---

## Verification Flows

- Flow 47 — Verify unmatch database
- Flow 48 — Unmatch from Chats
- Flow 49 — Unmatch from Friends
- Flow 50 — Discover after unmatch
- Flow 51 — Hidden history remains in DB
- Flow 52 — Group chats unaffected

---

## Key Files Likely Touched

- `supabase/009_unmatch_matches.sql`
- `src/services/messagingService.ts`
- `src/services/friendsService.ts`
- `src/services/discoveryService.ts`
- `src/screens/matches/MatchesListScreen.tsx`
- `src/screens/friends/FriendsScreen.tsx`
- `src/screens/matches/ChatScreen.tsx`
- `src/components/common/SwipeActionRow.tsx`
