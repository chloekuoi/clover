# Phase 4 Revision 01 — Sessions UX Update

## 1. Executive Summary

**Why:** UX testing indicated users want more explicit invite intent (date selection) and a lightweight post-acceptance confirmation that feels rewarding and streak-like.

**What is changing:**
- Replace "Start Session" label with "Send Cowork Invite".
- Add date selection to the invite card (today + next 6 days).
- After invite acceptance, show a system message bubble: "You can now plan coworking details with xxx 😀".
- Remove the "Session Active" card/screen and replace with a dual-lock confirmation card ("Locked in 🔒 | Locked in 🔒").
- When both users lock in, show a temporary "🔒❤️" toast and complete the session.
- Allow multiple pending invites across different matches.
- Auto-cancel accepted sessions after 24 hours if both users do not lock in.
- When auto-cancel happens, show a temporary toast: "Missed this one 💔".

**Breaking behavior:** Yes. This changes the certified Phase 4 interaction flow and removes the Active Session screen from the user path.

## 2. Behavior Delta Table

| Area | Certified Phase 4 Behavior | Revised Behavior | Rationale | Downstream Impact |
|------|-----------------------------|------------------|-----------|-------------------|
| Invite CTA | "Start Session" button in chat header | "Send Cowork Invite" button in chat header | Clearer intent for invite action | UI copy updates in Chat header |
| Invite details | No date selection | Invite card includes date selection (today + next 6 days) | Encourage concrete planning | Requires `scheduled_date` storage |
| Acceptance feedback | Session Active card + View Session | System message bubble + "Did we lock in?" card | Reduced friction, gamified confirmation | Removes Active Session screen from flow |
| Completion | Manual End Session from Active Session screen | Dual-lock confirmation (both users tap "Locked in 🔒") | Simpler completion & streak tracking | Adds dual-lock timestamps |
| System messaging | No system message in chat | System message bubble after acceptance | Promote next step in chat | New `session_events` table |
| Invite limit | One active/pending per user | Multiple pending invites across matches | Increased flexibility | RPC constraint change |
| Auto-complete | End-of-day completion | Auto-cancel after 24h if not locked | Avoid stale sessions | New auto-cancel logic |
| Auto-cancel feedback | None | Toast "Missed this one 💔" on chat open | Clarify outcome | UI toast on affected chats |

## 3. Updated Product Semantics

### State Model (Revised)
- **Invite Pending** — session created with `status='pending'`, `scheduled_date` set by initiator.
- **Invite Accepted** — session updated to `status='active'`; system message posted; "Did we lock in?" card shown.
- **Invite Declined** — session updated to `status='declined'`.
- **Locked (both users)** — session updated to `status='completed'` and `completed_ack=true`.
- **Missed** — session updated to `status='cancelled'` and `completed_ack=false`.

### Terminology
- **Invite**: A pending cowork request with a proposed date.
- **Locked**: Both users acknowledge the session happened.
- **Missed**: The session did not happen and is dismissed.

### Object Relationships
- **Match** → **Session** (1:many)
- **Session** → **Session Participants** (1:many)
- **Session** → **Session Events** (1:many) for system messages

## 4. Updated State Machine

Pending → Accepted (active)
  ↘ Declined

Accepted (active) → Locked by user A
Accepted (active) → Locked by user B
Locked by both → Completed (completed_ack=true)
Accepted (active) → Missed (auto-cancel after 24h, completed_ack=false)

## 5. Data Model Impact

**Schema changes:**
- `sessions.scheduled_date` (DATE) — planned coworking date
- `sessions.completed_ack` (BOOLEAN) — true if "Locked" pressed
- `sessions.locked_by_initiator_at` (TIMESTAMPTZ) — initiator lock timestamp
- `sessions.locked_by_invitee_at` (TIMESTAMPTZ) — invitee lock timestamp
- New table: `session_events` (id, session_id, event_type, message, created_at)

**RPC updates (planned):**
- `create_session` to accept and store `scheduled_date`
- `respond_to_session` to insert system event on accept
- New RPC for lock-in action (sets per-user lock timestamp)
- New RPC for auto-cancel of un-locked sessions after 24 hours

**Realtime impact:**
- Add realtime on `session_events` for system message delivery

**Migration requirements:**
- Backfill `scheduled_date` for existing rows with `session_date`
- Backfill `completed_ack` to NULL for existing rows
- Backfill `locked_by_initiator_at` / `locked_by_invitee_at` to NULL

## 6. Impacted Tickets Map

- **P4-11** Revision doc + plan updates (new)
- **P4-12** Schema / RPC changes (new)
- **P4-13** UI & state machine updates (new)
- **P4-14** RUNBOOK & regression updates (new)
- **P4-07 / P4-08 / P4-09** require replanning due to removal of Active Session screen from flow

---

**Notes:** `PHASE_5_PLAN.md` does not exist yet; reference will be added when created.
