# Phase 4: Sessions — Implementation Map (Scaffold)

**Status:** PENDING IMPLEMENTATION
**Created:** 2026-02-08

> This document will be updated by Codex after implementation.

---

## Baseline Findings

- `npm install` completed with no vulnerabilities reported.
- `npx expo start` detected an existing dev server on port 8081 and prompted for a new port in non-interactive mode.
- Started Metro in CI mode on port 8082 (`CI=1 npx expo start --port 8082`); no build/runtime errors observed within the 5s window before the command timed out in this environment.

---

## P4-01: Database Tables (sessions, session_participants, RPCs)

### Intended Behavior
- `sessions` table stores session records with match_id, initiated_by, status lifecycle, and timestamps
- `session_participants` table links users to sessions with role (initiator/invitee)
- `create_session` RPC enforces one-active-session-per-user, inserts session + 2 participants
- `respond_to_session` RPC handles accept/decline (invitee only)
- `complete_session` RPC manually ends an active session (any participant)
- `cancel_session` RPC cancels a pending session (initiator only)
- `auto_complete_sessions` RPC completes stale active sessions from previous days
- RLS restricts reads to own matches' sessions
- Realtime enabled on `sessions` table

### Expected File Paths
- `supabase/004_sessions_tables.sql` (created)

### Verification
- RUNBOOK: Phase 4 Flow 13 — Database setup verification (PASS)

### Known Risks / TODOs
- Realtime must be explicitly enabled in Supabase Dashboard for the `sessions` table
- One-per-user check in `create_session` relies on joining session_participants — ensure performance with index
- Verify SECURITY DEFINER functions bypass RLS correctly

### Status
- DONE

### Files Changed
- `supabase/004_sessions_tables.sql`
- `docs/API_CONTRACT.md`

### Verification Performed
- Flow 13 — Database setup verification: PASS

---

## P4-02: Phase 4 TypeScript Types

### Intended Behavior
- `SessionStatus` union type: 'pending' | 'active' | 'declined' | 'completed' | 'cancelled'
- `Session` type mirrors `sessions` table schema
- `SessionParticipant` type mirrors `session_participants` table schema
- `ChatTimelineItem` discriminated union for rendering messages and session cards in one list

### Expected File Paths
- `src/types/index.ts` (modified — append new types)

### Verification
- `npx tsc --noEmit` passes with no errors

### Known Risks / TODOs
- `ChatTimelineItem` needs a `type` discriminator field ('message' | 'session') for the FlatList renderItem

### Status
- DONE

### Files Changed
- `src/types/index.ts`

### Verification Performed
- `npx tsc --noEmit` — PASS

---

## P4-03: Session Service

### Intended Behavior
- `createSession(matchId, initiatorId)` calls `create_session` RPC, returns session id or error
- `respondToSession(sessionId, userId, response)` calls `respond_to_session` RPC
- `completeSession(sessionId, userId)` calls `complete_session` RPC
- `cancelSession(sessionId, userId)` calls `cancel_session` RPC
- `fetchSessionsForMatch(matchId)` returns all sessions for a match (for chat timeline)
- `fetchActiveSession(userId)` returns user's current active/pending session, or null
- `autoCompleteStaleSessions()` calls `auto_complete_sessions` RPC
- `subscribeToSession(sessionId, callback)` returns unsubscribe function for Realtime updates

### Expected File Paths
- `src/services/sessionService.ts` (created)

### Verification
- RUNBOOK: Phase 4 Flows 14–17
- Console log verification of all function returns

### Known Risks / TODOs
- `fetchActiveSession` requires joining sessions + session_participants, may need a dedicated query
- Realtime subscription cleanup on unmount is critical
- Error messages from RPC exceptions need to be user-friendly

### Status
- DONE (verification deferred)

### Files Changed
- `src/services/sessionService.ts`

### Verification Performed
- Deferred until P4-06 (requires chat UI integration to exercise flows 14–17)

---

## P4-04: SessionRequestCard Component

### Intended Behavior
- Renders inline in chat timeline as a card (not a message bubble)
- 6 visual variants based on status + user role
- Pending/invitee: Accept + Decline buttons
- Pending/initiator: Cancel button + "Waiting for response..." text
- Active: "View Session" button with green border
- Declined: Dimmed, informational, no actions
- Completed: "View Summary" button
- Cancelled: Dimmed, informational, no actions

### Expected File Paths
- `src/components/session/SessionRequestCard.tsx` (created)

### Verification
- Visual inspection in ChatScreen for all 6 states
- RUNBOOK: Phase 4 Flows 14–17

### Known Risks / TODOs
- Card must not interfere with FlatList inverted scroll behavior
- Action button callbacks must update session state immediately (optimistic or via Realtime)

### Status
- DONE (verification deferred)

### Files Changed
- `src/components/session/SessionRequestCard.tsx`

### Verification Performed
- Deferred until P4-06 (requires chat timeline integration to render cards)

---

## P4-05: Add "Start Session" Button to ChatScreen

### Intended Behavior
- "Start Session" button/label in chat header, right side
- Hidden when an active/pending session exists for this match
- Disabled when user has an active/pending session in any other match
- Tapping calls `createSession` and refreshes session data in chat
- Error alert if creation fails

### Expected File Paths
- `src/screens/matches/ChatScreen.tsx` (modified — add header button)
- `src/components/session/StartSessionButton.tsx` (created)

### Verification
- RUNBOOK: Phase 4 Flow 14 — Start session
- Test button visibility/disability states

### Known Risks / TODOs
- Need to fetch user's active session status on chat mount to determine button state
- Header layout must accommodate the new button without crowding

### Status
- DONE (verification deferred)

### Files Changed
- `src/components/session/StartSessionButton.tsx`
- `src/screens/matches/ChatScreen.tsx`

### Verification Performed
- Deferred until P4-06 (requires session cards in chat timeline to validate full flow)

---

## P4-06: Integrate Session Cards into Chat Timeline

### Intended Behavior
- ChatScreen fetches both messages and sessions for the match
- Combined into a single timeline array sorted by created_at
- FlatList renderItem checks item type and renders MessageBubble or SessionRequestCard
- Accept/Decline/Cancel actions call service functions and update card in place
- Realtime subscription on sessions table updates card status

### Expected File Paths
- `src/screens/matches/ChatScreen.tsx` (modified — timeline merging, renderItem update)

### Verification
- RUNBOOK: Phase 4 Flows 14–17
- Verify session cards appear at correct timestamps in message history

### Known Risks / TODOs
- Merging two data sources (messages + sessions) requires careful key management for FlatList
- Realtime subscription for sessions is separate from messages subscription — two channels active
- Inverted FlatList: session cards must render correctly in inverted mode
- Performance: combining and sorting on every render — memoize with useMemo

### Status
- DONE (verification pending)

### Files Changed
- `src/components/session/SessionRequestCard.tsx`
- `src/screens/matches/ChatScreen.tsx`
- `src/services/sessionService.ts`

- `npx tsc --noEmit` — PASS
- RUNBOOK Flow 14 — PASS (manual)
- RUNBOOK Flow 15 — PASS (manual)
- RUNBOOK Flow 16 — PASS (manual)
- RUNBOOK Flow 17 — PASS (manual)

---

## P4-07: Active Session Screen

### Intended Behavior
- Shows co-worker's profile photo (or initials) and name
- Shows session status (Active), start time (accepted_at), date
- "End Session" button calls `completeSession` and navigates to Session Complete
- Helper text about auto-complete
- Back button returns to chat

### Expected File Paths
- `src/screens/session/ActiveSessionScreen.tsx` (created)

### Verification
- RUNBOOK: Phase 4 Flow 16 — Active Session view

### Known Risks / TODOs
- Need to pass session data and co-worker profile via route params or fetch on mount
- If session is completed by other user while viewing, Realtime should navigate away

---

## P4-08: Session Complete Screen

### Intended Behavior
- Shows co-worker's profile photo (or initials) and name
- "Session Complete!" heading
- Session date and approximate duration
- "Back to Chat" button pops back to ChatScreen

### Expected File Paths
- `src/screens/session/SessionCompleteScreen.tsx` (created)

### Verification
- RUNBOOK: Phase 4 Flow 16 — Session complete summary

### Known Risks / TODOs
- Duration calculation: `completed_at - accepted_at`, formatted as hours/minutes
- Auto-completed sessions may have `completed_at` set to end of day (23:59)
- Very short sessions (< 5 min) show "< 5 minutes"

---

## P4-09: Add Session Screens to Navigation

### Intended Behavior
- `ActiveSession` and `SessionComplete` added to MatchesStack
- MatchesStackParamList updated with route params:
  - `ActiveSession: { sessionId: string; otherUser: MatchPreviewOtherUser }`
  - `SessionComplete: { sessionId: string; otherUser: MatchPreviewOtherUser }`
- Navigation from session card → ActiveSession → SessionComplete → back to Chat

### Expected File Paths
- `src/navigation/MatchesStack.tsx` (modified — add screens and param types)

### Verification
- Navigate from Chat → ActiveSession → SessionComplete → back to Chat
- Verify back button behavior on each screen

### Known Risks / TODOs
- React Navigation 7 requires `id` prop — ensure new screens are registered correctly
- Deep navigation from session card actions needs correct param passing
- Screen headers should be consistent with existing MatchesStack screens

---

## P4-10: Handle Session Auto-Complete on App Load

### Intended Behavior
- `autoCompleteStaleSessions()` called once after user authenticates
- Silent, fire-and-forget — does not block app loading
- Called on Matches tab focus as a fallback
- Stale sessions (status='active', session_date < today) are completed server-side

### Expected File Paths
- `src/context/AuthContext.tsx` (modified — add auto-complete call after auth)
  OR `src/navigation/index.tsx` (modified — add call in root navigator)

### Verification
- RUNBOOK: Phase 4 Flow 18 — Auto-complete verification

### Known Risks / TODOs
- Must not block app loading — use fire-and-forget pattern (no await)
- If the call fails silently, stale sessions persist until next app open
- Consider also calling on ChatScreen mount for extra reliability

---

## P4-11: Phase 4 Revision Doc + Plan Updates

### Status
- DONE

### Files Changed
- `docs/PHASE_4_REVISION_01.md`
- `docs/PHASE_4_PLAN.md`
- `docs/RUNBOOK.md`
- `MVP-PLAN.md`

### Verification Performed
- Documentation-only update (no RUNBOOK flow)

### Notes
- `PHASE_5_PLAN.md` not present; update deferred until file exists.

---

## P4-12: Revision Schema / RPC Changes

### Status
- DONE

### Files Changed
- `supabase/005_sessions_revision.sql`
- `docs/API_CONTRACT.md`

### Verification Performed
- SQL executed in Supabase SQL Editor (user confirmed)
- Verification queries: columns present, `session_events` exists, RPCs exist, Realtime enabled (PASS)

---

## P4-13: Revision UI & State Machine Updates

### Status
- DONE (verification pending)

### Files Changed
- `src/components/session/InviteComposerCard.tsx`
- `src/components/session/SessionEventBubble.tsx`
- `src/components/session/SessionRequestCard.tsx`
- `src/components/session/StartSessionButton.tsx`
- `src/screens/matches/ChatScreen.tsx`
- `src/services/sessionService.ts`
- `src/types/index.ts`

### Verification Performed
- `npx tsc --noEmit` — PASS
- RUNBOOK Flow 14 — PASS (manual)
- RUNBOOK Flow 15 — PASS (manual)
- RUNBOOK Flow 16 — PASS (manual)
- RUNBOOK Flow 17 — PASS (manual)
- RUNBOOK Flow 19 — PASS (manual)
- RUNBOOK Flow 18 — PENDING (manual)

---

## Quick Verification Checklist

```bash
# 1. TypeScript compiles
npx tsc --noEmit

# 2. App starts
npm start
# Press 'i' for iOS

# 3. Database ready (run in Supabase SQL Editor)
# Contents of supabase/004_sessions_tables.sql
```

### End-to-End Test Flow
1. Login as User A, open chat with matched User B
2. Tap "Start Session" → verify card appears (pending, initiator view)
3. Login as User B, open same chat → verify card shows Accept/Decline
4. Tap "Accept" → verify card updates to "Session Active"
5. Tap "View Session" → verify Active Session screen
6. Tap "End Session" → verify Session Complete screen
7. Tap "Back to Chat" → verify return to chat with "Session Completed" card
8. Test decline: new session → User B declines → card shows declined
9. Test cancel: new session → User A cancels → card shows cancelled
10. Test one-per-user: while session active, verify "Start Session" disabled in other chats
11. Test auto-complete: manipulate session_date to yesterday → reopen app → verify completed
