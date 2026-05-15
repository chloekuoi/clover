# Group Chat Feature Design

**Date:** 2026-03-07
**Phase:** 7
**Status:** APPROVED

---

## Problem

CoWork Connect currently supports only 1:1 co-working coordination. Users who want to plan a group session — e.g., three remote workers meeting at a coffee shop — have no shared space to coordinate. They must use external apps (WhatsApp, iMessage) to plan together, creating friction and pulling users out of the CoWork Connect experience.

## Goal

Add group chats so users can create a named conversation with multiple friends/matches, exchange messages in real time, and propose a group co-working session with lightweight RSVP.

---

## Key Design Decisions

### 1. Parallel system (not an extension of matches)
All existing schemas (`matches`, `messages`, `sessions`) are frozen from Phase 5 certification. Phase 7 introduces 5 new tables purpose-built for group semantics. No frozen code is touched.

### 2. Equal members — no admin roles (MVP)
Creator is tracked for display ("Created by Alex") but has no special powers. Any member can rename the group, add members, or leave. Admin roles can be added in v2.

### 3. Entry point: "+" on Chats tab
Groups are created fresh from the Chats tab (MatchesList). Users cannot escalate a 1:1 chat to a group by adding people (deferred to v2).

### 4. Membership: friends/matches only (initially)
When creating a group or adding members later, the picker shows only the current user's friends and matches. Group members can add people from their own friend networks.

### 5. Lightweight session RSVP (no lock-in)
Any member can propose a co-work date. Others tap Yes or No. No dual-lock confirmation mechanic — groups coordinate loosely via chat messages.

### 6. Mixed unified chat list
Group chats and 1:1 chats appear in the same Chats list, sorted by most recent activity. Groups are visually distinguished by a 👥 icon and member count.

---

## Data Model

### New Tables

```
group_chats
  id           UUID PK
  name         TEXT NOT NULL
  created_by   UUID → profiles.id
  created_at   TIMESTAMPTZ
  updated_at   TIMESTAMPTZ

group_members
  id             UUID PK
  group_chat_id  UUID → group_chats.id
  user_id        UUID → profiles.id
  last_read_at   TIMESTAMPTZ DEFAULT NOW()
  joined_at      TIMESTAMPTZ
  UNIQUE(group_chat_id, user_id)

group_messages
  id             UUID PK
  group_chat_id  UUID → group_chats.id
  sender_id      UUID → profiles.id
  content        TEXT NOT NULL CHECK(TRIM(content) <> '')
  created_at     TIMESTAMPTZ

group_sessions
  id              UUID PK
  group_chat_id   UUID → group_chats.id
  proposed_by     UUID → profiles.id
  scheduled_date  DATE NOT NULL
  status          TEXT CHECK(status IN ('proposed','completed','cancelled'))
  created_at      TIMESTAMPTZ

group_session_rsvps
  id                 UUID PK
  group_session_id   UUID → group_sessions.id
  user_id            UUID → profiles.id
  response           TEXT CHECK(response IN ('yes','no'))
  responded_at       TIMESTAMPTZ
  UNIQUE(group_session_id, user_id)
```

**Unread tracking:** `group_members.last_read_at` per member (same pattern as `matches.user1_last_read_at`).

**RLS:** All access gated on `group_members` membership. All mutations via SECURITY DEFINER RPCs.

**Realtime:** Enabled on `group_messages` and `group_sessions`.

---

## Screens

### CreateGroupScreen
- Group name text input (required)
- Friend/match search with debounce (300ms)
- Friends sorted: available today first → A-Z
- Selected members shown as removable `MemberChip` row
- "Create" header button disabled until name + ≥1 member selected
- On success: navigates to GroupChatScreen (replacing CreateGroup in stack)

### GroupChatScreen
- Header: ← GroupName + "(N members)" + 📅 Propose Date + ⓘ Info
- FlatList (inverted) combining `GroupMessageBubble` and `GroupSessionRSVPCard`
- Received messages show sender avatar + name above bubble
- Sent messages right-aligned, no name shown
- Reuses `ChatInputBar` as-is
- Marks as read on mount and on received message

### GroupSessionRSVPCard
- **Unvoted:** date, "Proposed by X", RSVP counts, Yes / No buttons
- **Voted:** date, RSVP counts, "You're going ✓" or "You can't make it ✗" pill; Cancel for proposer only
- **Completed:** "Session confirmed 🎉" read-only
- **Cancelled:** returns null (not rendered)
- RSVP format: "3 going · 1 not going · 1 pending"

### GroupInfoScreen
- Editable group name (inline TextInput → save)
- Members list (avatar + name + "You" badge)
- "+ Add Members" → search friends not already in group
- "Leave Group" (red, confirmation alert) → pops to MatchesList

### MatchesListScreen (modified)
- "+" button in header → CreateGroupScreen
- `fetchGroupChats` + `fetchMatches` fetched in parallel
- Merged & sorted by `lastMessageAt` descending
- `GroupChatCard` for groups: 👥 icon + name + member count + "SenderName: preview"

---

## Navigation Changes

```typescript
// Additions to MatchesStackParamList (existing routes unchanged)
CreateGroup: undefined;
GroupChat: { groupChatId: string; groupName: string };
GroupInfo: { groupChatId: string };
```

---

## New Service: `groupChatsService.ts`

Functions:
- `fetchGroupChats(userId)` — `GroupChatPreview[]`
- `createGroupChat(name, creatorId, memberIds[])` — `groupChatId`
- `fetchGroupMessages(groupChatId)` — `GroupMessage[]`
- `fetchGroupMembers(groupChatId)` — `GroupMember[]`
- `fetchGroupSessions(groupChatId)` — `GroupSession[]`
- `sendGroupMessage(groupChatId, senderId, content)` — `GroupMessage`
- `proposeGroupSession(groupChatId, proposedBy, scheduledDate)` — `GroupSession`
- `rsvpGroupSession(groupSessionId, userId, response)` — `void`
- `cancelGroupSession(groupSessionId, userId)` — `void`
- `addGroupMembers(groupChatId, userIds[])` — `void`
- `leaveGroup(groupChatId, userId)` — `void`
- `renameGroup(groupChatId, newName)` — `void`
- `markGroupRead(groupChatId, userId)` — `void`
- `subscribeToGroupMessages(groupChatId, callback)` — unsubscribe fn
- `subscribeToGroupSessions(groupChatId, callback)` — unsubscribe fn

---

## Reused Components & Services (Unchanged)

| Item | Used In |
|------|---------|
| `ChatInputBar` | GroupChatScreen |
| `fetchFriends` (friendsService) | CreateGroupScreen, GroupInfoScreen |
| `InviteComposerCard` (date pill pattern) | GroupChatScreen date picker |
| `CollapsibleSection` | CreateGroupScreen friend sections |
| `UserProfileView` | Profile modal from GroupChatScreen |

---

## Out of Scope (MVP)

- Escalating 1:1 chats to groups ("Add people" from inside a 1:1 chat)
- Admin roles and member removal
- Group photo
- Push notifications for group messages
- Adding non-friends to a group
- Group message reactions or replies
- Group session completion flow beyond RSVP counts
