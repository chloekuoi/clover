# PHASE 7 — Group Chat

**Status:** PLANNED
**Phase:** 7
**Depends on:** Phase 6 (CERTIFIED COMPLETE — 2026-03-07)

---

## Goal

Users can create named group chats with multiple friends/matches, send real-time messages as a group, propose a co-working date with lightweight RSVP, and manage group membership. Groups and 1:1 chats appear together in the Chats tab sorted by most recent activity.

---

## Scope

### In
- 5 new Supabase tables: `group_chats`, `group_members`, `group_messages`, `group_sessions`, `group_session_rsvps`
- New `groupChatsService.ts` service layer
- 3 new screens: `CreateGroupScreen`, `GroupChatScreen`, `GroupInfoScreen`
- 3 new navigation routes in `MatchesStack`: `CreateGroup`, `GroupChat`, `GroupInfo`
- 4 new components: `GroupChatCard`, `GroupMessageBubble`, `GroupSessionRSVPCard`, `MemberChip`
- `MatchesListScreen` modified to show groups + 1:1 chats in one unified list
- All Phase 7 Phase Execution Workflow documentation artifacts

### Out
- No changes to any frozen schemas (`matches`, `messages`, `sessions`, `friendships`, etc.)
- No admin roles — equal members for MVP
- No escalation of 1:1 chats to groups
- No group photo
- No push notifications for group messages
- No adding non-friends/matches to groups
- No group message reactions or reply threads
- No group session completion flow beyond RSVP counts

---

## Tickets

---

### P7-01 — Database: group_chats schema + RPCs

**Goal:** Create all 5 group chat tables with RLS policies and SECURITY DEFINER RPCs in a single migration file.

**Scope:**
- IN: New file `supabase/008_group_chats.sql`
- IN: Tables: `group_chats`, `group_members`, `group_messages`, `group_sessions`, `group_session_rsvps`
- IN: RLS: all access gated on `group_members` membership check
- IN: RPCs: `create_group_chat`, `fetch_group_chat_previews`, `add_group_members`, `leave_group`, `rsvp_group_session`, `mark_group_read`
- IN: Realtime enabled on `group_messages` and `group_sessions`
- OUT: No changes to any existing table, policy, or RPC

**Dependencies:** None

**Definition of Done:**
- SQL file executes without errors on Supabase dashboard
- A user who is NOT in `group_members` cannot SELECT from `group_messages` (RLS verified)
- A user who IS in `group_members` can INSERT into `group_messages`
- `create_group_chat` atomically creates the `group_chats` row AND all `group_members` rows in a single transaction
- `npx tsc --noEmit` passes (no TypeScript changes in this ticket)

---

### P7-02 — Types: group chat TypeScript types

**Goal:** Add all group chat types to `src/types/index.ts` and add new routes to `MatchesStackParamList`.

**Scope:**
- IN: New types: `GroupChat`, `GroupMember`, `GroupMessage`, `GroupSession`, `GroupSessionRsvp`, `GroupChatPreview`, `GroupTimelineItem`
- IN: `MatchesStackParamList` extended with: `CreateGroup: undefined`, `GroupChat: { groupChatId: string; groupName: string }`, `GroupInfo: { groupChatId: string }`
- OUT: No changes to existing types (`Match`, `Message`, `Session`, `MatchPreview`, etc.)

**Type specifications:**
```typescript
GroupChatPreview: {
  groupChatId: string;
  name: string;
  memberCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastSenderName: string | null;
  unreadCount: number;
}

GroupTimelineItem:
  | { type: 'message'; message: GroupMessage }
  | { type: 'session'; session: GroupSession }
```

**Dependencies:** P7-01

**Definition of Done:**
- All new types exported from `src/types/index.ts`
- `GroupTimelineItem` is a discriminated union (not a loose object type)
- `MatchesStackParamList` includes all 3 new routes
- `npx tsc --noEmit` passes

---

### P7-03 — Service: `groupChatsService.ts`

**Goal:** Implement the full group chat service layer with all data access and real-time subscription functions.

**Scope:**
- IN: New file `src/services/groupChatsService.ts`
- IN: Functions:
  - `fetchGroupChats(userId: string): Promise<GroupChatPreview[]>` — calls `fetch_group_chat_previews` RPC
  - `createGroupChat(name: string, creatorId: string, memberIds: string[]): Promise<string | null>` — calls `create_group_chat` RPC; returns `groupChatId`
  - `fetchGroupMessages(groupChatId: string): Promise<GroupMessage[]>` — ordered by `created_at ASC`
  - `fetchGroupMembers(groupChatId: string): Promise<GroupMember[]>`
  - `fetchGroupSessions(groupChatId: string): Promise<GroupSession[]>`
  - `sendGroupMessage(groupChatId: string, senderId: string, content: string): Promise<GroupMessage | null>`
  - `proposeGroupSession(groupChatId: string, proposedBy: string, scheduledDate: string): Promise<GroupSession | null>`
  - `rsvpGroupSession(groupSessionId: string, userId: string, response: 'yes' | 'no'): Promise<boolean>` — calls `rsvp_group_session` RPC
  - `cancelGroupSession(groupSessionId: string, userId: string): Promise<boolean>`
  - `addGroupMembers(groupChatId: string, userIds: string[]): Promise<boolean>` — calls `add_group_members` RPC
  - `leaveGroup(groupChatId: string, userId: string): Promise<boolean>` — calls `leave_group` RPC
  - `renameGroup(groupChatId: string, newName: string): Promise<boolean>`
  - `markGroupRead(groupChatId: string, userId: string): Promise<void>` — calls `mark_group_read` RPC
  - `subscribeToGroupMessages(groupChatId: string, callback: (msg: GroupMessage) => void): () => void`
  - `subscribeToGroupSessions(groupChatId: string, callback: (session: GroupSession) => void): () => void`
- OUT: No changes to existing services (`messagingService`, `friendsService`, `sessionService`, etc.)

**Dependencies:** P7-01, P7-02

**Definition of Done:**
- All functions return correct TypeScript types with no `any`
- Both `subscribe*` functions return a `() => void` unsubscribe cleanup function
- `sendGroupMessage` validates `content.trim() !== ''` before inserting
- `npx tsc --noEmit` passes

---

### P7-04 — Component: `GroupChatCard`

**Goal:** Chat list card for group chats, rendered in `MatchesListScreen` alongside 1:1 `MatchCard` rows.

**File:** `src/components/matches/GroupChatCard.tsx`

**Scope:**
- IN: Left section: 👥 icon in a circle (same size as `MatchCard` avatar)
- IN: Right section: group name (bold) + "N members" label + "SenderName: last message" preview (1 line, truncated)
- IN: Green unread dot (✦) when `unreadCount > 0`, right-aligned (same position as `MatchCard`)
- IN: `onPress` prop — caller navigates to GroupChatScreen
- IN: Empty last message state: show "No messages yet" in muted style
- OUT: No changes to existing `MatchCard` component

**Dependencies:** P7-02

**Definition of Done:**
- Renders correctly with and without unread indicator
- Last message preview shows "SenderName: content" or "No messages yet" when null
- Touch target ≥ 44pt
- `npx tsc --noEmit` passes

---

### P7-05 — Component: `GroupMessageBubble`

**Goal:** Message bubble for group chats that shows sender name + avatar for received messages.

**File:** `src/components/matches/GroupMessageBubble.tsx`

**Scope:**
- IN: Sent (mine): right-aligned bubble, no name/avatar shown — identical visual to `MessageBubble`
- IN: Received: left side shows circular avatar (40pt, `photo_url` or initials fallback), sender name (12px, muted color) above the bubble, then message bubble
- IN: `onAvatarPress?: () => void` prop — caller opens `UserProfileModal`
- IN: Timestamp (11px, muted) below bubble, same as `MessageBubble`
- OUT: No changes to existing `MessageBubble` component

**Dependencies:** P7-02

**Definition of Done:**
- Sent messages: right-aligned, no name/avatar
- Received messages: avatar + name above bubble, left-aligned
- Avatar is tappable when `onAvatarPress` is provided
- Initials shown when `photo_url` is null
- `npx tsc --noEmit` passes

---

### P7-06 — Component: `GroupSessionRSVPCard`

**Goal:** Inline card in `GroupChatScreen` timeline for a proposed group co-work session with RSVP controls.

**File:** `src/components/session/GroupSessionRSVPCard.tsx`

**Scope:**
- IN: State — `proposed`, user has NOT responded:
  - ☕ icon + "Group Session" title
  - Date line: formatted scheduled date (e.g., "Friday, Mar 13")
  - "Proposed by [Name]" subtitle
  - RSVP count line: "3 going · 1 not going · 1 pending"
  - Yes (✓) and No (✗) buttons
- IN: State — `proposed`, user HAS responded:
  - Same header + date + proposed-by
  - RSVP count line updated
  - Response pill: "You're going ✓" (success green) or "You can't make it ✗" (error red)
  - Cancel button shown only to the session proposer (`proposed_by === currentUserId`)
- IN: State — `completed`: "Session confirmed 🎉" read-only card (no buttons)
- IN: State — `cancelled`: component returns `null` (not rendered in timeline)
- IN: Props: `session: GroupSession`, `rsvps: GroupSessionRsvp[]`, `currentUserId: string`, `proposedByName: string`, `onRsvp: (response: 'yes'|'no') => void`, `onCancel: () => void`
- OUT: No lock-in mechanic
- OUT: No connection to `SessionRequestCard` or `sessions` table

**Dependencies:** P7-02, P7-03

**Definition of Done:**
- All 4 states render correctly
- Cancelled returns `null`
- RSVP counts update immediately (caller passes updated rsvps array)
- `npx tsc --noEmit` passes

---

### P7-07 — Component: `MemberChip`

**Goal:** Small removable chip showing a selected member in `CreateGroupScreen`.

**File:** `src/components/friends/MemberChip.tsx`

**Scope:**
- IN: Circular avatar (28pt, `photo_url` or initials fallback)
- IN: Name label (12px, single line, truncated)
- IN: ✕ remove button (right side of chip, 20pt touch area minimum)
- IN: `userId: string`, `name: string`, `photoUrl: string | null`, `onRemove: (userId: string) => void` props
- OUT: Not used outside `CreateGroupScreen`

**Dependencies:** None

**Definition of Done:**
- Renders with photo or initials
- ✕ tap calls `onRemove(userId)`
- Fits in a horizontal `ScrollView` row
- `npx tsc --noEmit` passes

---

### P7-08 — Screen: `CreateGroupScreen`

**Goal:** Screen for naming a group and selecting initial members before creation.

**File:** `src/screens/matches/CreateGroupScreen.tsx`

**Scope:**
- IN: Header: "← Create Group" (left, back) + "Create" (right, disabled state)
- IN: Group name `TextInput` — required; `Create` button disabled when empty
- IN: Friend search `TextInput` — debounced 300ms, filters `fetchFriends` result locally
- IN: Friends list sorted: `has_intent_today=true` first → A-Z by name
- IN: "Available Today" / "Others" collapsible sections (reuse `CollapsibleSection`)
- IN: Selected members shown as a horizontally scrolling `MemberChip` row below search
- IN: Tapping a friend in list: adds to selected (chip appears); tapping again: removes
- IN: `Create` button also disabled when 0 members selected
- IN: On create: call `createGroupChat(name, user.id, memberIds)` → on success, `navigation.replace('GroupChat', { groupChatId, groupName: name })`
- OUT: No validation on group name length for MVP (just non-empty)
- OUT: Only existing friends/matches shown — no search of all users

**Reuses:** `fetchFriends` (friendsService), `MemberChip` (P7-07), `CollapsibleSection`

**Dependencies:** P7-03, P7-07

**Definition of Done:**
- Create button disabled until name is non-empty AND ≥1 member selected
- Friends sorted: available today first → A-Z
- Successful creation navigates to GroupChatScreen, replacing CreateGroupScreen in stack
- On error: shows inline error message
- `npx tsc --noEmit` passes

---

### P7-09 — Screen: `GroupChatScreen`

**Goal:** Real-time group chat screen showing messages and session RSVP cards in a combined timeline.

**File:** `src/screens/matches/GroupChatScreen.tsx`

**Route params:** `{ groupChatId: string; groupName: string }`

**Scope:**
- IN: Header: `← GroupName (N members)` + `[📅]` (Propose Date) + `[ⓘ]` (Group Info)
- IN: Header member count fetched on mount via `fetchGroupMembers`
- IN: FlatList inverted timeline: `GroupTimelineItem[]` sorted by `created_at` ASC, rendered bottom-up
- IN: `GroupMessageBubble` for message items; `GroupSessionRSVPCard` for session items
- IN: `subscribeToGroupMessages` called on mount; new messages appended to state
- IN: `subscribeToGroupSessions` called on mount; updates overwrite session in state
- IN: `ChatInputBar` reused as-is (unchanged component)
- IN: `📅` tap: open date picker (reuse `InviteComposerCard` date pill pattern) with 7-day options → `proposeGroupSession` on confirm
- IN: `ⓘ` tap: `navigation.navigate('GroupInfo', { groupChatId })`
- IN: `markGroupRead(groupChatId, user.id)` called on mount and when a received message arrives
- IN: Avatar tap on `GroupMessageBubble` → open `UserProfileModal` (same pattern as ChatScreen in Phase 6)
- IN: Empty state: "No messages yet. Say hi! 👋" centered
- OUT: No `SessionRequestCard`, no lock-in, no `session_events`
- OUT: No read receipts shown per-message (just marking read for badge purposes)

**Dependencies:** P7-03, P7-05, P7-06

**Definition of Done:**
- Messages appear in real-time from other members
- Proposing a session via 📅 creates RSVP card inline in timeline
- RSVP Yes/No updates the RSVP card immediately (re-fetch or optimistic update)
- `markGroupRead` is called correctly (unread dot clears)
- `npx tsc --noEmit` passes

---

### P7-10 — Screen: `GroupInfoScreen`

**Goal:** Group settings screen for renaming the group, viewing/adding members, and leaving.

**File:** `src/screens/matches/GroupInfoScreen.tsx`

**Route params:** `{ groupChatId: string }`

**Scope:**
- IN: Header: "← Group Info"
- IN: Group name display — tap to enter edit mode (inline `TextInput`); checkmark button to save (calls `renameGroup`); ✕ to cancel edit; loading indicator while saving
- IN: "Created by [name]" subtitle (display only)
- IN: MEMBERS section: FlatList of `GroupMember` items (avatar + name + "You" badge for current user)
- IN: "+ Add Members" button below members list → opens a modal or pushes screen: search friends not already in group → `addGroupMembers` on confirm
- IN: "Leave Group" button at bottom (red text) → `Alert.alert` for confirmation → `leaveGroup(groupChatId, user.id)` → `navigation.popToTop()`
- IN: Soft leave — if the last member leaves, group row persists in DB (no hard delete for MVP)
- OUT: No member removal by others
- OUT: No group photo
- OUT: No group deletion

**Dependencies:** P7-03, P7-09

**Definition of Done:**
- Rename saves and is reflected in `GroupChatScreen` header when navigating back
- Members list shows all current members with "You" badge
- "+ Add Members" filters out already-in-group friends
- Leave group → confirmation → navigates to MatchesList (group no longer visible)
- `npx tsc --noEmit` passes

---

### P7-11 — Screen: `MatchesListScreen` modifications

**Goal:** Add group chats to the unified Chats list, with a "+" button to create groups.

**File:** `src/screens/matches/MatchesListScreen.tsx` (modify)

**Scope:**
- IN: Add `+` `Pressable` to screen header (right side) → `navigation.navigate('CreateGroup')`
- IN: On load and `useFocusEffect`: call `fetchGroupChats(user.id)` in parallel with existing `fetchMatches(user.id)`
- IN: Merge results into a `ChatListItem` union type: `{ type: 'dm'; data: MatchPreview } | { type: 'group'; data: GroupChatPreview }`
- IN: Sort merged list by `lastMessageAt` descending (null values sorted last)
- IN: Render `GroupChatCard` for group items; existing `MatchCard` for DM items (no changes to `MatchCard`)
- IN: Tab badge total = existing DM unread count + sum of group `unreadCount` values
- OUT: No separate "Groups" section — unified mixed list
- OUT: No changes to existing `MatchCard`, swipe-to-delete, or other MatchesList behaviors

**Reuses:** Existing `fetchMatches`, `MatchCard`, unread count / `refreshUnreadCount` logic

**Dependencies:** P7-03, P7-04

**Definition of Done:**
- Group chats appear in list with correct sort order alongside 1:1 chats
- `+` button in header navigates to `CreateGroupScreen`
- Tab badge total includes group unread counts
- Empty state (no DMs and no groups) unchanged from Phase 5
- `npx tsc --noEmit` passes

---

### P7-12 — Navigation: `MatchesStack` updates

**Goal:** Register the three new group chat routes in the MatchesStack navigator.

**File:** `src/navigation/MatchesStack.tsx` (modify)

**Scope:**
- IN: Import and register `CreateGroupScreen`, `GroupChatScreen`, `GroupInfoScreen`
- IN: Add `<Stack.Screen name="CreateGroup" component={CreateGroupScreen} />`
- IN: Add `<Stack.Screen name="GroupChat" component={GroupChatScreen} />`
- IN: Add `<Stack.Screen name="GroupInfo" component={GroupInfoScreen} />`
- OUT: No changes to existing `MatchesList` or `Chat` screen registrations

**Dependencies:** P7-02, P7-08, P7-09, P7-10

**Definition of Done:**
- `navigation.navigate('CreateGroup')` navigates to `CreateGroupScreen`
- `navigation.navigate('GroupChat', { groupChatId, groupName })` navigates to `GroupChatScreen`
- `navigation.navigate('GroupInfo', { groupChatId })` navigates to `GroupInfoScreen`
- Back navigation exits each screen correctly
- `npx tsc --noEmit` passes

---

### P7-13 — Documentation: Phase 7 docs + Phase 6 certification

**Goal:** Write all Phase 7 documentation artifacts per the Phase Execution Workflow.

**Scope:**
- IN: Create `docs/PHASE_6_CERTIFICATION.md`
- IN: Create `docs/PHASE_7_PLAN.md` (this file)
- IN: Create `docs/PHASE_7_IMPLEMENTED.md` (scaffold)
- IN: Append Phase 7 section to `docs/UI_SPEC.md`
- IN: Append Phase 7 section to `docs/API_CONTRACT.md`
- IN: Append Phase 7 section to `docs/RUNBOOK.md`
- IN: Create `docs/plans/2026-03-07-group-chat-design.md`
- OUT: No changes to existing sections in any global contract file

**Dependencies:** All P7 tickets (written after implementation by Codex)

**Definition of Done:**
- All 7 files created/updated
- No existing phase sections modified in `UI_SPEC.md`, `API_CONTRACT.md`, or `RUNBOOK.md`

---

## Key Utilities to Reuse

| Utility | File | Notes |
|---------|------|-------|
| `fetchFriends(userId)` | `src/services/friendsService.ts` | Used in CreateGroupScreen + GroupInfoScreen add-member flow |
| `ChatInputBar` | `src/components/matches/ChatInputBar.tsx` | Reused as-is in GroupChatScreen |
| `InviteComposerCard` | `src/components/session/InviteComposerCard.tsx` | Date pill pattern reused for 📅 date picker |
| `CollapsibleSection` | `src/components/friends/CollapsibleSection.tsx` | "Available Today" / "Others" sections in CreateGroupScreen |
| `UserProfileView` | `src/components/profile/UserProfileView.tsx` | Profile modal from GroupChatScreen avatar taps |

---

## No Changes to Frozen Infrastructure

Phase 7 does NOT modify:
- `matches`, `messages`, `sessions`, `session_participants`, `session_events` tables
- `friendships`, `profile_photos`, `profiles`, `work_intents`, `swipes` tables
- Any existing RPCs
- `messagingService.ts`, `sessionService.ts`, `friendsService.ts`, `profileService.ts`
- `ChatScreen.tsx`, `MatchCard`, `MessageBubble`, `ChatInputBar`, `SessionRequestCard`
- `FriendCard`, `FriendProfileModal`, `UserProfileView`
- 4-tab MainTabs structure
