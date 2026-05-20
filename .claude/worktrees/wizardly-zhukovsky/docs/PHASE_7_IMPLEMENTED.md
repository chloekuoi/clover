# PHASE 7 — Group Chat: Implementation Map

**Status:** NOT STARTED
**Phase:** 7

> This document is a pre-implementation scaffold. After Codex implements each ticket, update the Status field and Verification column with actual results.

---

## Baseline Findings

> To be completed by Codex before implementation begins.

- Branch: `feat/phase7-group-chat`
- Commands to run:
  - `npm install`
  - `npx tsc --noEmit`
  - `CI=1 npx expo start --clear --port 8082`
- Expected baseline: 0 TypeScript errors, Metro starts cleanly

---

## P7-01 — Database: group_chats schema + RPCs

**Status:** NOT STARTED

**Files to create:**
- `supabase/008_group_chats.sql`

**Intended Behavior:**
Creates 5 new tables (`group_chats`, `group_members`, `group_messages`, `group_sessions`, `group_session_rsvps`) with RLS policies enforcing membership-based access. Six SECURITY DEFINER RPCs handle all mutations. Realtime is enabled on `group_messages` and `group_sessions`.

**Verification:** RUNBOOK Phase 7 — Flow 39 (Verify Phase 7 Database)

**Known Risks / TODOs:**
- `create_group_chat` must be atomic (use a transaction or single RPC that inserts group + members together)
- `leave_group` should handle the case where the leaving user is the last member (leave group record in place — no hard delete)
- `fetch_group_chat_previews` must return `last_message_at` as null-safe (groups with no messages yet should still appear in list with null preview)

---

## P7-02 — Types: group chat TypeScript types

**Status:** NOT STARTED

**Files to modify:**
- `src/types/index.ts`

**Intended Behavior:**
Adds `GroupChat`, `GroupMember`, `GroupMessage`, `GroupSession`, `GroupSessionRsvp`, `GroupChatPreview`, `GroupTimelineItem` types. Extends `MatchesStackParamList` with `CreateGroup`, `GroupChat`, and `GroupInfo` routes.

**Verification:** `npx tsc --noEmit` passes after changes

**Known Risks / TODOs:**
- `GroupTimelineItem` must be a discriminated union to allow type-safe rendering in the FlatList

---

## P7-03 — Service: `groupChatsService.ts`

**Status:** NOT STARTED

**Files to create:**
- `src/services/groupChatsService.ts`

**Intended Behavior:**
Full service layer for group chats. `subscribeToGroupMessages` and `subscribeToGroupSessions` use the same Supabase `postgres_changes` realtime pattern as `messagingService.subscribeToMessages`. `fetchGroupMessages` ordered `created_at ASC`. `sendGroupMessage` validates trimmed content before insert.

**Verification:** `npx tsc --noEmit` passes; service imported by GroupChatScreen without errors

**Known Risks / TODOs:**
- `rsvpGroupSession` uses a SECURITY DEFINER RPC to enforce the `UNIQUE(group_session_id, user_id)` constraint correctly (upsert behavior)
- `fetchGroupChats` result should include `lastMessageAt: null` for new groups with no messages (sort these last)

---

## P7-04 — Component: `GroupChatCard`

**Status:** NOT STARTED

**Files to create:**
- `src/components/matches/GroupChatCard.tsx`

**Intended Behavior:**
Chat list card with 👥 icon circle, group name, member count, last message preview ("SenderName: content"), and unread dot. Visual style consistent with existing `MatchCard`.

**Verification:** RUNBOOK Phase 7 — Flow 40 (Create Group Chat)

**Known Risks / TODOs:**
- 👥 icon background color should use `primary` or `secondary` from design system (not hardcoded)
- Last message preview should truncate to 1 line

---

## P7-05 — Component: `GroupMessageBubble`

**Status:** NOT STARTED

**Files to create:**
- `src/components/matches/GroupMessageBubble.tsx`

**Intended Behavior:**
Received messages show 40pt avatar + sender name (12px muted) above the bubble on the left. Sent messages (mine) are right-aligned with no name/avatar — identical to existing `MessageBubble`.

**Verification:** RUNBOOK Phase 7 — Flow 41 (Send and Receive Group Messages)

**Known Risks / TODOs:**
- Avatar initials fallback: use first letter of sender name, same pattern as existing avatar components
- `onAvatarPress` must be optional (undefined when caller doesn't pass it)

---

## P7-06 — Component: `GroupSessionRSVPCard`

**Status:** NOT STARTED

**Files to create:**
- `src/components/session/GroupSessionRSVPCard.tsx`

**Intended Behavior:**
Inline card with 4 render states based on `session.status` and whether `currentUserId` has an RSVP in the `rsvps` array. Cancelled sessions return `null`. RSVP counts derived from `rsvps` array passed by caller.

**Verification:** RUNBOOK Phase 7 — Flow 43 (Propose Group Session and RSVP)

**Known Risks / TODOs:**
- Caller must re-fetch or optimistically update `rsvps` array after RSVP to reflect new counts immediately
- `proposedByName` is passed in as a prop (caller is responsible for resolving the name from group members)

---

## P7-07 — Component: `MemberChip`

**Status:** NOT STARTED

**Files to create:**
- `src/components/friends/MemberChip.tsx`

**Intended Behavior:**
Small chip with avatar/initials + name + ✕. Displayed in a horizontal `ScrollView` in `CreateGroupScreen`. ✕ fires `onRemove(userId)`.

**Verification:** Visual verification during P7-08 (CreateGroupScreen) implementation

**Known Risks / TODOs:**
- Chip width should be flexible (name truncates at max-width ~120pt)

---

## P7-08 — Screen: `CreateGroupScreen`

**Status:** NOT STARTED

**Files to create:**
- `src/screens/matches/CreateGroupScreen.tsx`

**Intended Behavior:**
Group name input + friend search + member chip selection. Friends sorted: `has_intent_today` first → A-Z. "Create" button disabled until name non-empty and ≥1 member selected. On success: `navigation.replace('GroupChat', { groupChatId, groupName })`.

**Verification:** RUNBOOK Phase 7 — Flow 40 (Create Group Chat)

**Known Risks / TODOs:**
- Use `navigation.replace` not `navigation.navigate` to prevent back-navigating to CreateGroupScreen after the group is created
- Debounce the search filter at 300ms to avoid jank on large friend lists

---

## P7-09 — Screen: `GroupChatScreen`

**Status:** NOT STARTED

**Files to create:**
- `src/screens/matches/GroupChatScreen.tsx`

**Intended Behavior:**
Real-time group chat. FlatList inverted with `GroupTimelineItem[]`. `subscribeToGroupMessages` and `subscribeToGroupSessions` active on mount. Date picker (📅) reuses InviteComposerCard pattern. Avatar taps open `UserProfileModal`. Marks group as read on mount and on received message.

**Verification:** RUNBOOK Phase 7 — Flows 41, 42, 43

**Known Risks / TODOs:**
- Session subscription: when `subscribeToGroupSessions` fires, find and replace the matching session in state by `session.id`
- After RSVP, re-fetch `fetchGroupSessions` (or optimistically update) to refresh `GroupSessionRSVPCard` counts
- Member count in header: use length of `fetchGroupMembers` result, cached on mount and after `addGroupMembers`

---

## P7-10 — Screen: `GroupInfoScreen`

**Status:** NOT STARTED

**Files to create:**
- `src/screens/matches/GroupInfoScreen.tsx`

**Intended Behavior:**
Rename group (inline edit with save/cancel), members list, "+ Add Members" (filters out existing members), "Leave Group" (confirmation → `leaveGroup` → `navigation.popToTop()`).

**Verification:** RUNBOOK Phase 7 — Flow 44 (Group Info and Management)

**Known Risks / TODOs:**
- After rename, `GroupChatScreen` header must update: use `navigation.setParams` or re-navigate with new name
- "+ Add Members" picker: `fetchFriends` then filter out user_ids already in `fetchGroupMembers` result

---

## P7-11 — Screen: `MatchesListScreen` modifications

**Status:** NOT STARTED

**Files to modify:**
- `src/screens/matches/MatchesListScreen.tsx`

**Intended Behavior:**
`fetchGroupChats` called in parallel with `fetchMatches`. Results merged and sorted by `lastMessageAt` descending. `GroupChatCard` rendered for group items. Tab badge = DM unread + group unread totals. "+" button in header → `CreateGroupScreen`.

**Verification:** RUNBOOK Phase 7 — Flows 40, 45 (Groups in Unified List, Unread Badge)

**Known Risks / TODOs:**
- Sort: items with `lastMessageAt: null` (new groups) should sort last
- Tab badge: `getUnreadCount` (existing DM RPC) + sum of `GroupChatPreview.unreadCount` values

---

## P7-12 — Navigation: `MatchesStack` updates

**Status:** NOT STARTED

**Files to modify:**
- `src/navigation/MatchesStack.tsx`

**Intended Behavior:**
Registers `CreateGroupScreen`, `GroupChatScreen`, and `GroupInfoScreen` as new screens in the existing `MatchesStack` navigator. All existing routes unchanged.

**Verification:** Navigation between all new screens works; back navigation correct

**Known Risks / TODOs:**
- `MatchesStack` uses `id` prop on navigator (React Navigation 7 requirement) — ensure it is preserved

---

## P7-13 — Documentation

**Status:** IN PROGRESS (Claude completing as Product + UX Lead)

**Files:**
- `docs/PHASE_6_CERTIFICATION.md` — CREATE ✓
- `docs/PHASE_7_PLAN.md` — CREATE ✓
- `docs/PHASE_7_IMPLEMENTED.md` — CREATE ✓ (this file)
- `docs/UI_SPEC.md` — APPEND Phase 7 section
- `docs/API_CONTRACT.md` — APPEND Phase 7 section
- `docs/RUNBOOK.md` — APPEND Phase 7 flows
- `docs/plans/2026-03-07-group-chat-design.md` — CREATE ✓

---

## TypeScript

All new and modified files must pass `npx tsc --noEmit` with zero errors before marking any ticket complete.

---

## Phase 7 Exit Gate

**Exit Gate Status:** NOT STARTED

**Required to pass:**
- `npx tsc --noEmit` — 0 errors
- Expo Metro starts without fatal errors
- RUNBOOK Flows 39–45 verified (manual in-app + Supabase dashboard verification)
- All P7 tickets marked DONE
