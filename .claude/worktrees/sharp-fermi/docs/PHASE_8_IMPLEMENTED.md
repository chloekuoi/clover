# PHASE 8 — Unmatch: Implementation Map

**Status:** NOT STARTED
**Phase:** 8

> This document is a pre-implementation scaffold. After Codex implements each ticket, update the Status field and Verification column with actual results.

---

## Baseline Findings

> To be completed by Codex before implementation begins.

- Branch: `feat/phase8`
- Commands to run:
  - `npm install`
  - `npx tsc --noEmit`
  - `CI=1 npx expo start --clear --port 8082`
- Expected baseline: 0 TypeScript errors, Metro starts cleanly

---

## P8-01 — Database: unmatch schema + RPC

**Status:** DONE

**Files changed:**
- `supabase/009_unmatch_matches.sql`

**Intended Behavior:**
Adds soft-unmatch support to `matches` via `status`, `unmatched_by`, and `unmatched_at`, plus a new `unmatch_user` RPC that marks a match as unmatched instead of deleting it.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Phase 8 Flow 47 — pending manual Supabase SQL Editor verification

**Known Risks / TODOs:**
- Existing matches must backfill safely to `status='active'`
- `unmatch_user` should be idempotent
- Existing preview and unread queries must not regress after schema change

---

## P8-02 — Service: unmatch API

**Status:** DONE

**Files changed:**
- `src/services/messagingService.ts`

**Intended Behavior:**
Adds `unmatchMatch(matchId, userId)` service function calling the `unmatch_user` RPC.

**Verification performed:**
- `npx tsc --noEmit` — PASS

**Known Risks / TODOs:**
- Service should return `false` cleanly on backend error

---

## P8-03 — Query filtering: hide unmatched from active UI

**Status:** DONE

**Files changed:**
- `src/services/messagingService.ts`
- `src/services/friendsService.ts`
- `src/services/sessionService.ts` (no changes required)
- `supabase/009_unmatch_matches.sql`

**Intended Behavior:**
Chats, Friends, unread counts, and active DM session UI exclude unmatched rows while preserving history in the database.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Phase 8 Flows 48, 49, 51 — pending manual app verification

**Known Risks / TODOs:**
- Old data must remain queryable in DB but invisible in UI
- Unread counts must ignore unmatched rows

---

## P8-04 — Discovery: allow unmatched users to reappear

**Status:** DONE

**Files changed:**
- `src/services/discoveryService.ts`

**Intended Behavior:**
Discover excludes only active matches, not unmatched rows, so users can reappear after unmatching.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Phase 8 Flow 50 — pending manual app verification

**Known Risks / TODOs:**
- Active matches must still remain excluded

---

## P8-05 — Component: reusable swipe action row

**Status:** DONE

**Files changed:**
- `src/components/common/SwipeActionRow.tsx`

**Intended Behavior:**
Reusable swipe-left wrapper revealing a destructive `Unmatch` action for eligible list rows.

**Verification performed:**
- `npx tsc --noEmit` — PASS

**Known Risks / TODOs:**
- Disabled rows must not swipe
- Gesture behavior must not break row taps

---

## P8-06 — Chats: swipe-left to unmatch DMs

**Status:** DONE

**Files changed:**
- `src/screens/matches/MatchesListScreen.tsx`
- `src/components/common/SwipeActionRow.tsx`
- `src/services/messagingService.ts`

**Intended Behavior:**
Only 1:1 DM rows support swipe-left to reveal `Unmatch`; group rows remain unchanged.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Phase 8 Flow 48 — pending manual app verification

**Known Risks / TODOs:**
- Group rows must not show swipe action
- Unmatched row should disappear immediately after success

---

## P8-07 — Friends: swipe-left to unmatch match-backed rows

**Status:** DONE

**Files changed:**
- `src/screens/friends/FriendsScreen.tsx`
- `src/components/common/SwipeActionRow.tsx`
- `src/services/messagingService.ts`

**Intended Behavior:**
Only active match-backed friend rows support swipe-left to reveal `Unmatch`; pending requests and manual-only friends remain unchanged.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Phase 8 Flow 49 — pending manual app verification

**Known Risks / TODOs:**
- Must not expose unmatch on pending requests
- Must not expose remove action for manual-only friends

---

## P8-08 — Chat guard: stale unmatched route handling

**Status:** DONE

**Files changed:**
- `src/screens/matches/ChatScreen.tsx`
- `src/services/messagingService.ts`

**Intended Behavior:**
If a user opens a stale unmatched chat route, the app shows an alert and exits the chat screen cleanly.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Phase 8 Flows 48, 49, 51 — pending manual app verification

**Known Risks / TODOs:**
- Avoid showing old messages/sessions in active UI
- Handle stale route without crash

---

## P8-09 — Documentation

**Status:** NOT STARTED

**Files:**
- `docs/PHASE_8_PLAN.md`
- `docs/PHASE_8_IMPLEMENTED.md` (this file)
- `docs/API_CONTRACT.md`
- `docs/RUNBOOK.md`

---

## TypeScript

All new and modified files must pass `npx tsc --noEmit` with zero errors before marking any ticket complete.

---

## Phase 8 Exit Gate

**Exit Gate Status:** NOT STARTED

**Required to pass:**
- `npx tsc --noEmit` — 0 errors
- Expo Metro starts without fatal errors
- RUNBOOK Flows 47–52 verified
- All P8 tickets marked DONE
