# Phase 4: Sessions — CERTIFICATION

**Status:** CERTIFIED COMPLETE
**Certified:** 2026-02-15
**Phase completed:** 2026-02-15

---

## Guaranteed Behaviors

The following behaviors are verified and must not regress:

1. **"Send Cowork Invite" button** — Visible in chat header (right side) when no pending/active session exists for this match. Tapping creates a pending session with a date selector (today + next 6 days).
2. **Invite card with date selection** — Inline card in chat timeline shows a date picker. Selected date is stored as `scheduled_date` on the session.
3. **Initiator view (pending)** — Session card shows "You invited [Name] to co-work [date]", "Waiting for response..." text, and a "Cancel" button.
4. **Invitee view (pending)** — Session card shows "[Name] wants to co-work with you [date]" with "Accept" and "Decline" buttons.
5. **Accept flow** — Invitee taps Accept → session status changes to 'active', `accepted_at` set, system message bubble inserted: "You can now plan coworking details with [Name] 😀". Dual-lock card appears.
6. **Decline flow** — Invitee taps Decline → session status changes to 'declined'. Card updates to dimmed "Session Declined" state with no action buttons.
7. **Cancel flow** — Initiator taps Cancel on pending session → session status changes to 'cancelled'. Card updates to dimmed "Session Cancelled" state. Only initiator can cancel; invitee cannot.
8. **Dual-lock confirmation** — After acceptance, a "Locked in 🔒 | Locked in 🔒" card replaces the active session UI. Each user can tap their lock. Lock timestamps are stored per-user (`locked_by_initiator_at`, `locked_by_invitee_at`).
9. **Session completion via dual-lock** — When both users lock in → `status='completed'`, `completed_ack=true`, `completed_at` set. A "🔒❤️" toast appears for ~3 seconds.
10. **Auto-cancel after 24h** — Active sessions with `accepted_at` older than 24 hours that are not fully locked are auto-cancelled (`status='cancelled'`, `completed_ack=false`, lock timestamps cleared). A "Missed this one 💔" toast appears when the affected chat is opened.
11. **Multiple pending invites** — Users can send multiple pending invites across different matches simultaneously. No one-per-user constraint.
12. **Session cards in chat timeline** — Session records render inline in the chat message list, ordered by `created_at`, alongside messages and system events. Six visual variants: pending-initiator, pending-invitee, active (dual-lock), declined, completed, cancelled.
13. **Session events (system messages)** — `session_events` table stores system messages (e.g., acceptance message). Rendered as centered bubbles in the chat timeline.
14. **Realtime updates** — Sessions table has Realtime enabled. Chat subscribes to UPDATE events on session id for live status changes. Session events subscribe to INSERT for system messages.
15. **Auto-cancel on app load** — `autoCancelStaleSessions()` called silently on app startup after authentication. Fire-and-forget pattern (does not block app loading).
16. **Sessions, session_participants, session_events tables** — All three tables created with RLS policies, indexes, and constraints as documented in API_CONTRACT.md.
17. **All session RPCs** — `create_session`, `respond_to_session`, `complete_session`, `cancel_session`, `lock_in_session`, `auto_cancel_sessions` (plus `auto_complete_sessions` backward-compat alias) all functional.

---

## Explicit Exclusions (Out of Scope for Phase 4)

These were intentionally NOT implemented:

- No live timer or Pomodoro feature
- No session notes, ratings, or feedback
- No Active Session dedicated screen (removed in Revision 01; replaced by dual-lock in chat)
- No Session Complete dedicated screen (removed in Revision 01; completion acknowledged in chat)
- No streak UI or streak tracking
- No session history screen (sessions only visible inline in their respective chat)
- No add-friend prompt after session completion (deferred to Phase 5)
- No push notifications for session invites or status changes
- No scheduled pg_cron job for auto-cancel (client-side only)
- No session search or filtering
- No group sessions (only 1:1 between matched users)

---

## Hard Constraints Phase 5 Must Respect

1. **`sessions` table schema is frozen** — Do not add, remove, or rename columns. All fields documented in API_CONTRACT.md Phase 4 section.
2. **Session RPCs are frozen** — Do not modify the logic or signatures of `create_session`, `respond_to_session`, `complete_session`, `cancel_session`, `lock_in_session`, `auto_cancel_sessions`.
3. **`session_events` table is frozen** — Schema and RLS as documented. Phase 5 may read events but must not modify the table structure.
4. **Chat timeline merges three data sources** — Messages + sessions + session_events, sorted by `created_at`. Phase 5 must not alter this merge logic.
5. **`sessionService.ts` is the session API layer** — Functions: `createSession`, `respondToSession`, `completeSession`, `cancelSession`, `lockInSession`, `fetchSessionsForMatch`, `autoCancelStaleSessions`, `subscribeToSession`, `subscribeToSessionEvents`. Phase 5 must not modify these functions.
6. **SessionRequestCard renders 6 status variants** — Phase 5 must not change the component's visual states or props interface.
7. **StartSessionButton ("Send Cowork Invite")** — Renders in chat header. Phase 5 must not change this component.
8. **All Phase 3 constraints still apply:**
   - `matches` table uses ordered user IDs (`user1_id < user2_id`)
   - `messages` table is immutable (no UPDATE/DELETE, no schema changes)
   - MatchesStack has `MatchesList` and `Chat` screens
   - `Chat` screen expects `{ matchId: string; otherUser: MatchPreviewOtherUser }` params
   - `messagingService.ts` functions are frozen
   - `MatchesStackContext` provides `refreshUnreadCount()`
   - Realtime pattern: INSERT on messages filtered by match_id
   - Three tabs: Discover, Matches, Profile
   - Design system "Digital Matcha" for all new UI
   - Supabase client at `lib/supabase.ts`
   - React Navigation 7 (navigators require `id` prop)

---

## Profile Redesign Compliance Notes

The Phase 5 Profile Redesign (P5-09 through P5-17) adds photos, extended profile fields, and profile editing. These changes are fully compliant with Phase 4 constraints:

| Constraint | Profile Redesign Impact |
|------------|------------------------|
| `sessions` table frozen | No changes to sessions table |
| Session RPCs frozen | No changes to session RPCs |
| `session_events` frozen | No changes to session_events |
| Chat timeline merge | No changes to chat timeline logic |
| `sessionService.ts` frozen | No changes to session service |
| SessionRequestCard frozen | No changes to session card component |
| StartSessionButton frozen | No changes to start session button |
| `matches` table ordering | No changes to matches table |
| `messages` immutable | No changes to messages table |
| MatchesStack screens | No changes to MatchesStack (stays `MatchesList` + `Chat`) |
| Chat screen params | No changes to Chat screen params |
| `messagingService.ts` frozen | No changes to messaging service |
| Three tabs preserved | Profile tab still exists (ProfileStack gains EditProfile screen) |
| Design system | Profile redesign uses Digital Matcha design tokens |

**Changes made by profile redesign:**
- `profiles` table: 4 new nullable columns (tagline, currently_working_on, work, school) — additive, no existing column changes
- `profile_photos` table: new table, does not affect existing tables
- `avatars` storage bucket: new bucket, does not affect existing storage
- `ProfileStack`: gains `EditProfile` screen (additive — existing Profile, Friends, AddFriend screens unchanged)
- `ProfileScreen`: rewritten (layout changes only, existing P5-07 rows preserved)
- `SwipeCard`: minor addition (tagline line in overlay, existing layout preserved)
- `OnboardingScreen`: Step 4 added (Steps 1-3 unchanged)
- `src/types/index.ts`: `Profile` type extended with nullable fields, `ProfilePhoto` type added — existing types unchanged

---

## Known Non-Issues (Intentionally Not Handled)

| Item | Reason |
|------|--------|
| Stale pending sessions from previous days remain pending | Initiator can cancel manually; auto-cancel only affects active sessions |
| Auto-cancel runs client-side only | Acceptable for MVP; sessions may stay stale if no user opens the app |
| Flow 18 (auto-cancel) not fully verified in PHASE_4_IMPLEMENTED | Auto-cancel RPC confirmed working via SQL; end-to-end toast verification is best-effort |
| No undo on session actions (accept/decline/cancel) | Actions are intentionally final for MVP |
| Session cards don't animate on status change | Realtime updates the card content; no transition animation |
| Multiple pending invites can create many cards in chat | Acceptable for MVP; users self-regulate invite frequency |
