# Phase 4: Sessions

**Goal:** Users can invite a match to a co-working session, accept or decline, and track the session through completion.

**Entry Criteria:** Phase 3 complete (matching, messaging, real-time chat)

---

## Session Concept (Phase 4)

A session is a lightweight co-working agreement between two matched users:

- **Initiation:** User A taps "Start Session" in chat → a session request card appears inline in the chat
- **Response:** User B sees the card and taps Accept or Decline. Details (where, when) are discussed via regular chat messages.
- **Active:** Once accepted, the session is active for the day
- **Completion:** Session auto-completes at end of day. Either user can also end it manually.
- **Constraint:** One active or pending session per user at a time

There is **no live timer** in Phase 4. Sessions track that a co-working agreement exists, not elapsed time.

---

## Tickets

### P4-01: Create sessions and session_participants Database Tables

**Goal:** Store session records with lifecycle status and link participants to sessions.

**Scope:**
- Included: Create `sessions` table with match_id, initiated_by, status, session_date, timestamps
- Included: Create `session_participants` table with session_id, user_id, role
- Included: Create `create_session(p_match_id, p_initiator_id)` RPC that enforces one-active-session-per-user
- Included: Create `respond_to_session(p_session_id, p_user_id, p_response)` RPC for accept/decline
- Included: Create `complete_session(p_session_id, p_user_id)` RPC for manual end
- Included: Create `cancel_session(p_session_id, p_user_id)` RPC for initiator cancellation
- Included: Create `auto_complete_sessions()` RPC to complete stale sessions from previous days
- Included: RLS policies restricting access to own sessions
- Included: Enable Supabase Realtime on `sessions` table (for status updates)
- Excluded: Scheduled pg_cron job (auto-complete is called client-side)
- Excluded: Session rating or feedback

**Dependencies:** None

**Definition of Done:**
- [ ] `sessions` table created with all columns, constraints, and indexes
- [ ] `session_participants` table created with all columns and constraints
- [ ] `create_session` checks both users in the match have no active/pending session, inserts session + participants, returns session id
- [ ] `create_session` returns error if either user already has an active/pending session
- [ ] `respond_to_session` with 'accept' sets status to 'active' and accepted_at
- [ ] `respond_to_session` with 'decline' sets status to 'declined'
- [ ] `respond_to_session` rejects if user is the initiator (not the invitee)
- [ ] `complete_session` sets status to 'completed' and completed_at
- [ ] `cancel_session` sets status to 'cancelled' (only from 'pending')
- [ ] `auto_complete_sessions` completes all sessions with status='active' AND session_date < CURRENT_DATE
- [ ] RLS: Users can only SELECT sessions where they are a participant
- [ ] Realtime enabled on `sessions` table
- [ ] SQL committed as `supabase/004_sessions_tables.sql`

---

### P4-02: Add Phase 4 TypeScript Types

**Goal:** Define type definitions for sessions and session participants.

**Scope:**
- Included: `SessionStatus` union type
- Included: `Session` type matching sessions table schema
- Included: `SessionParticipant` type matching session_participants table schema
- Included: `ChatTimelineItem` union type for messages + session cards in chat
- Excluded: Modifying existing Phase 3 types

**Dependencies:** P4-01

**Definition of Done:**
- [ ] All types added to `src/types/index.ts`
- [ ] Types are exported and available for import
- [ ] No TypeScript compilation errors

---

### P4-03: Create Session Service

**Goal:** Provide API layer for all session lifecycle operations.

**Scope:**
- Included: `createSession(matchId, initiatorId)` — calls create_session RPC
- Included: `respondToSession(sessionId, userId, response)` — calls respond_to_session RPC
- Included: `completeSession(sessionId, userId)` — calls complete_session RPC
- Included: `cancelSession(sessionId, userId)` — calls cancel_session RPC
- Included: `fetchSessionForMatch(matchId)` — get active or pending session for a match
- Included: `fetchActiveSession(userId)` — get user's current active session (if any)
- Included: `autoCompleteStaleSessions()` — calls auto_complete_sessions RPC
- Included: `subscribeToSession(sessionId, callback)` — Realtime subscription for session status changes
- Excluded: Session history or listing past sessions
- Excluded: Session search

**Dependencies:** P4-01, P4-02

**Definition of Done:**
- [ ] Service created at `src/services/sessionService.ts`
- [ ] `createSession` returns session id on success, or error message if user already has active/pending session
- [ ] `respondToSession` accepts 'accept' or 'decline' and updates status
- [ ] `completeSession` sets status to completed
- [ ] `cancelSession` sets status to cancelled (only from pending)
- [ ] `fetchSessionForMatch` returns the active/pending session for a match, or null
- [ ] `fetchActiveSession` returns user's current active session with co-worker profile info, or null
- [ ] `autoCompleteStaleSessions` completes any stale sessions (called on app load)
- [ ] `subscribeToSession` returns unsubscribe function
- [ ] All functions handle errors gracefully

---

### P4-04: Build SessionRequestCard Component

**Goal:** Render session status cards inline in the chat timeline with status-dependent UI and action buttons.

**Scope:**
- Included: Pending state for invitee (Accept / Decline buttons)
- Included: Pending state for initiator (waiting message + Cancel button)
- Included: Active state (session active indicator + View Session link)
- Included: Declined state (informational, no actions)
- Included: Completed state (summary + View Summary link)
- Included: Cancelled state (informational, no actions)
- Excluded: Animation on status change
- Excluded: Countdown timer

**Dependencies:** P4-02

**Definition of Done:**
- [ ] Component created at `src/components/session/SessionRequestCard.tsx`
- [ ] Accepts: session (Session), currentUserId (string), onAccept, onDecline, onCancel, onViewSession, onViewSummary
- [ ] Renders correct UI for each status + user role combination
- [ ] Accept/Decline buttons call respective callbacks
- [ ] Cancel button only visible to initiator in pending state
- [ ] Card uses Digital Matcha design system
- [ ] Minimum touch target 44pt on all buttons

---

### P4-05: Add "Start Session" Button to ChatScreen

**Goal:** Allow a user to initiate a session invitation from within a chat.

**Scope:**
- Included: "Start Session" button in chat header (right side)
- Included: Button disabled when user has an active or pending session (any match)
- Included: Tapping calls `createSession` and shows session card in chat
- Included: Error alert if session creation fails (e.g., other user has active session)
- Excluded: Session creation from outside chat
- Excluded: Changing existing chat header layout for name/back button

**Dependencies:** P4-03

**Definition of Done:**
- [ ] "Start Session" icon/button added to ChatScreen header (right side)
- [ ] Button is hidden when an active or pending session already exists for this match
- [ ] Button is disabled (with visual feedback) when user has an active/pending session in any match
- [ ] Tapping creates a session and the card appears in the timeline
- [ ] Error case shows Alert with reason
- [ ] Button does not interfere with existing header elements

---

### P4-06: Integrate Session Cards into Chat Timeline

**Goal:** Merge session events into the chat message list so they appear inline, ordered by timestamp.

**Scope:**
- Included: Fetch sessions for the current match alongside messages
- Included: Combine into a single timeline sorted by created_at
- Included: Render SessionRequestCard for session items, MessageBubble for message items
- Included: Realtime subscription for session status changes (update card in place)
- Included: Handle accept/decline/cancel actions from the inline card
- Excluded: Modifying the messages FlatList structure (still inverted)
- Excluded: Changing MessageBubble component

**Dependencies:** P4-03, P4-04, P4-05

**Definition of Done:**
- [ ] ChatScreen fetches both messages and sessions for the match
- [ ] Combined timeline renders in chronological order
- [ ] Session cards appear at the correct position based on created_at
- [ ] Accept action updates session to active (card updates in place)
- [ ] Decline action updates session to declined (card updates in place)
- [ ] Cancel action updates session to cancelled (card updates in place)
- [ ] Realtime subscription updates session card when status changes
- [ ] Existing message display and send flow unchanged

---

### P4-07: Build Active Session Screen

**Goal:** Removed in Revision 01 (replaced by dual-lock confirmation in chat).

**Scope:**
- Excluded: Active Session screen (deprecated)

**Dependencies:** P4-13

**Definition of Done:**
- [ ] Ticket removed from implementation path (no Active Session screen)

---

### P4-08: Build Session Complete Screen

**Goal:** Removed in Revision 01 (completion acknowledged in chat).

**Scope:**
- Excluded: Session Complete screen (deprecated)

**Dependencies:** P4-13

**Definition of Done:**
- [ ] Ticket removed from implementation path (no Session Complete screen)

---

### P4-09: Add Session Screens to Navigation

**Goal:** Update navigation to remove session screens and keep chat-only flow.

**Scope:**
- Included: Remove `ActiveSession` and `SessionComplete` routes from MatchesStack (if added)
- Included: Remove navigation calls to those screens from chat
- Excluded: Adding new tabs
- Excluded: Deep linking
- Excluded: Changing existing MatchesList or Chat screen registrations

**Dependencies:** P4-13

**Definition of Done:**
- [ ] MatchesStackParamList does not include `ActiveSession` or `SessionComplete`
- [ ] Chat screen no longer navigates to removed screens
- [ ] Back button behavior unchanged for MatchesList/Chat

---

### P4-10: Handle Session Auto-Complete on App Load

**Goal:** Replace auto-complete with auto-cancel for un-locked sessions after 24 hours.

**Scope:**
- Included: Replace with `autoCancelStaleSessions()` (accepted + not fully locked after 24h)
- Included: Call on app startup and Matches tab focus (best-effort)
- Excluded: Supabase pg_cron scheduled job
- Excluded: Push notification for auto-completed sessions

**Dependencies:** P4-12

**Definition of Done:**
- [ ] `autoCancelStaleSessions` called once on app startup after authentication
- [ ] Stale sessions (active + not fully locked, accepted_at older than 24h) are marked cancelled
- [ ] No user-visible error if the call fails (silent, best-effort)
- [ ] Does not block app loading (fire-and-forget)

---

### P4-11: Phase 4 Revision Doc + Plan Updates

**Goal:** Document the Phase 4 revision and update planning artifacts.

**Scope:**
- Included: Create `docs/PHASE_4_REVISION_01.md` (revision spec)
- Included: Annotate `MVP-PLAN.md` Phase 4 section with revised behavior
- Included: Add P4-12 through P4-14 tickets
- Included: Note that Phase 4 certification remains immutable and `PHASE_5_PLAN.md` will be updated when created
- Excluded: Any code changes

**Dependencies:** None

**Definition of Done:**
- [ ] `docs/PHASE_4_REVISION_01.md` created with required sections
- [ ] `MVP-PLAN.md` updated Phase 4 bullets to reflect revision
- [ ] P4-12, P4-13, P4-14 added to this plan

---

### P4-12: Revision Schema / RPC Changes

**Goal:** Update schema and RPCs for the revised invite flow.

**Scope:**
- Included: Add `scheduled_date` column to `sessions`
- Included: Add `completed_ack` column to `sessions`
- Included: Add `locked_by_initiator_at` and `locked_by_invitee_at` timestamps
- Included: Create `session_events` table for system messages
- Included: Update RPCs to handle `scheduled_date`, dual-lock actions, and auto-cancel
- Included: Remove one-active/pending-per-user constraint to allow multiple pending invites
- Included: Realtime enablement for `session_events`
- Included: Data migration/backfill for existing sessions
- Excluded: UI changes

**Dependencies:** P4-11

**Definition of Done:**
- [ ] Migration SQL committed (new migration file)
- [ ] `sessions.scheduled_date` and `sessions.completed_ack` added with defaults/backfill
- [ ] `sessions.locked_by_initiator_at` / `sessions.locked_by_invitee_at` added with defaults/backfill
- [ ] `session_events` table created with RLS policies
- [ ] RPCs updated/added per revision spec
- [ ] Create session allows multiple pending invites across matches
- [ ] Realtime enabled for `session_events`

---

### P4-13: Revision UI & State Machine Updates

**Goal:** Implement revised invite UX and completion confirmation.

**Scope:**
- Included: Rename header CTA to \"Send Cowork Invite\"
- Included: Invite card includes date selection (today + next 6 days)
- Included: System message bubble after acceptance
- Included: Replace \"Session Active\" UI with dual-lock card (\"Locked in 🔒 | Locked in 🔒\")
- Included: Show \"🔒❤️\" toast when both users locked
- Included: Show \"Missed this one 💔\" toast when auto-cancelled chat is opened
- Excluded: Streak UI or profile display (deferred)

**Dependencies:** P4-12

**Definition of Done:**
- [ ] Chat header shows \"Send Cowork Invite\"
- [ ] Invite card date selector persists `scheduled_date`
- [ ] Acceptance inserts system message bubble with emoji
- [ ] Dual-lock card replaces Active Session UI
- [ ] Each user lock sets their respective lock timestamp
- [ ] Both locks set → `status='completed'` + `completed_ack=true` + \"🔒❤️\" toast
- [ ] Auto-cancel clears lock timestamps and sets `completed_ack=false`
- [ ] Auto-cancel toast appears for both users upon opening affected chat (3 seconds)

---

### P4-14: RUNBOOK Updates + Regression Verification

**Goal:** Update verification flows to reflect revised behavior and confirm no regressions.

**Scope:**
- Included: Update RUNBOOK Flows 14–17 for revised flow
- Included: Add new verification steps for date selection and \"Did we lock in?\" card
- Included: Regression verification for Phases 1–3
- Excluded: New automation or CI

**Dependencies:** P4-13

**Definition of Done:**
- [ ] RUNBOOK updated with revised flow steps
- [ ] Revision verification steps completed manually
- [ ] Regression checks for Phases 1–3 pass

---

## Exit Criteria

Phase 4 is complete when all tickets are done and:

1. "Send Cowork Invite" button visible in chat header when appropriate
2. Tapping "Send Cowork Invite" creates an invite card with date selection
3. Invitee sees Accept/Decline buttons on the invite card
4. Accepting shows system message with emoji and dual-lock card
5. Declining changes card to "Session Declined" state
6. Initiator can cancel a pending session
7. Dual-lock card records each user's "Locked in 🔒" action
8. When both locked, session completes and "🔒❤️" toast appears
9. Sessions auto-cancel after 24h if not fully locked
10. Multiple pending invites across matches are allowed
11. App runs without crashes on iOS simulator

---

## Verification

Run the app and complete this test flow:

1. Login as User A, open chat with matched User B
2. Tap "Send Cowork Invite" in header
3. Select a date (today + next 6 days) and send invite
4. Verify invite card appears in chat
5. Login as User B, open same chat
6. Verify invite card shows Accept/Decline buttons
7. Tap "Accept"
8. Verify system message: "You can now plan coworking details with xxx 😀"
9. Verify dual-lock card appears with "Locked in 🔒 | Locked in 🔒"
10. User A taps their lock → User B sees left lock set
11. User B taps their lock → session completes + "🔒❤️" toast
12. Verify invite card is gone and session status is completed
13. Test decline flow: new invite → User B declines → card updates
14. Test cancel flow: new invite → User A cancels → card updates
15. Test multiple pending: send invites to two matches → both remain pending
16. Test auto-cancel: accept invite, wait 24h (or set accepted_at back), verify session cancelled and locks cleared
