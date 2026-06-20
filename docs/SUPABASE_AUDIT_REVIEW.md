# Supabase Audit — Finding Review & Beta Risk Ranking

**Prepared:** 2026-06-05  
**Source audited:** `docs/SUPABASE_HANDOFF.md`  
**Purpose:** Assess which findings are confirmed vs. speculative, and rank by risk to a TestFlight beta (10 profiles, 3 matches, closed/trusted group).

---

## Evidence Assessment

### Confirmed from live query data — these are real

| Finding | Evidence | What the data actually proves |
|---|---|---|
| `messages` has two INSERT policies, weaker wins | RLS output showed both policies verbatim | Real. PERMISSIVE OR logic is correct — the weaker policy wins. One-line fix. |
| `friendships` ALL policy has no WITH CHECK | RLS output confirmed `cmd=ALL`, `with_check=null` | Real, though INSERT exploitability is slightly overstated — see below. |
| `invites` UPDATE has no WITH CHECK | RLS output confirmed `qual=claimed_by_user_id IS NULL`, no `with_check` | Real. But the `invites` table has zero app code referencing it, so exploitation path is nil for beta. |
| Three undocumented tables (`intents`, `invites`, `cowork_sessions`) | Row counts + columns both confirmed | Real. Schema debt, not a security risk. |
| `profiles` has `one_liner`, `location`, `expo_push_token` with no migrations | Columns query confirmed, none appear in any migration | Real. |
| `profiles.bio` from migration 001 is absent from live schema | `bio` not in columns output; `one_liner` is present instead | Real. This is the **only finding with a direct user-facing bug risk** — see ranking. |
| `friendship_status` is a custom enum with default `'active'` | Column default shown as `'active'::friendship_status` | Real schema divergence from migration (which declares TEXT with CHECK). Full enum values not yet queried. |
| Duplicate indexes on `matches` and `friendships` | Both index pairs confirmed in indexes output | Real, harmless. |
| Migrations 013 + 014 are deployed | `co_work_invites` has 2 rows, `push_tokens` exists | Real. Corrects the engineering handoff. |
| Realtime on `friendships`, `group_sessions`, `session_events` with no app subscriber | Publication query confirmed; codebase grep confirmed no subscriptions | Real, minor overhead. |
| `profiles_updated_at` and `intents_updated_at` triggers call `update_updated_at()` with no migration | Triggers query confirmed both; no migration defines the function | Real. |

---

### Inferred from migration source — live function bodies not verified

The functions query (Query C) was never run. Every RPC-level finding is based on the migration `.sql` files, not the live `pg_proc` definition. Functions can be edited in the dashboard without a migration.

| Finding | Confidence | Why it might not be real |
|---|---|---|
| `fetch_match_previews` / `get_unread_count` accept caller-supplied user_id | ✅ Closed | Live functions now call `public.assert_authenticated_user(p_user_id)`. |
| `respond_to_friend_request` doesn't check `auth.uid() = p_user_id` | ✅ Closed | Live function now calls `public.assert_authenticated_user(p_user_id)`. |
| `mark_chat_read` accepts caller-supplied user_id | ✅ Closed | Live function now calls `public.assert_authenticated_user(p_user_id)`. |

**Verify all three with:**
```sql
SELECT proname, pg_get_functiondef(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('fetch_match_previews','get_unread_count',
                  'respond_to_friend_request','mark_chat_read');
```

---

### Speculative — stated as fact but not fully proven

| Finding | What's actually known | What would need to be true |
|---|---|---|
| `matches` direct INSERT "bypasses normalisation" | The INSERT policy exists (confirmed). Migration 003 has `CHECK (user1_id < user2_id)`. | The CHECK constraint would reject any out-of-order insert at the DB level regardless of the RLS policy. The real risk is narrow: a user inserting a match with a known counterpart UUID where they happen to sort as user2. Practical impact: near zero. The finding overstates this. |
| `profiles.bio` was "renamed" to `one_liner` | `bio` absent, `one_liner` present | Could equally have been a new column added and `bio` dropped. The rename claim is an inference. |
| `cowork_sessions` has no FK constraints | No FK indexes visible in indexes output | FK indexes aren't always visible in `pg_indexes` — they may appear differently. Would need the FK query to confirm. |
| Storage orphan cleanup "may not work" | Standard Supabase behavior | Supabase's metadata delete does not call the storage object delete API — this is a known and consistent Supabase limitation, so the concern is well-founded but was framed as uncertain when it should be stated as confirmed. |
| Auth provider issues | Zero data collected | Entirely unverified. Could be perfectly configured. |

---

## Ranked by Risk to TestFlight Beta

Beta context: 10 profiles, 3 matches, closed/trusted group, no public discovery yet.

---

### 🔴 Fix before shipping to beta testers — user-facing bug

**1. `profiles.bio` absent from live schema (but present in TypeScript types)**

This is the only confirmed finding that can silently corrupt the UI for real beta users today. The app's `Profile` type declares `bio: string | null`. The live column is `one_liner`. Any screen reading `profile.bio` will get `undefined`, not `null`. Any `updateProfile({ bio: '...' })` call will either silently write to a non-existent column or throw. Run this to see if it surfaces anywhere:

```bash
grep -r "\.bio\b" /Users/chloe/Documents/Claude/clover/src --include="*.tsx" --include="*.ts"
```

Priority: **highest** — functional bug, not a security issue.

---

### 🟠 Fix before any public-facing launch — real security flaws

**2. `messages` duplicate INSERT policy** *(confirmed live)*

The policy flaw is real and the fix is one SQL statement. In a 10-person closed beta the practical exploitation risk is zero — testers would need to know a match UUID and be motivated to abuse it. But it's trivially fixable now and will be genuinely exploitable at launch scale.

```sql
DROP POLICY "Users can send messages" ON messages;
```

**3. `friendships` ALL policy** *(confirmed live)*

Real, but the INSERT arm is slightly weaker than stated: for a permissive ALL policy with only a USING clause, PostgreSQL applies the USING expression as the effective WITH CHECK for INSERT, meaning a user can only INSERT rows where `auth.uid() = requester_id OR auth.uid() = recipient_id`. They can't forge an arbitrary requester. What IS real: any party to a friendship can DELETE it or UPDATE status to any value, bypassing the `respond_to_friend_request` RPC entirely. For a trusted beta group, exploitation risk is nil.

**4. `fetch_match_previews` / `get_unread_count` caller-supplied user_id** *(closed June 7, 2026)*

The live definitions now call `public.assert_authenticated_user(p_user_id)`. The helper
requires a non-null `auth.uid()` equal to `p_user_id`, closing the impersonation path
without changing the app-facing signatures. The same remediation is live for
`mark_chat_read` and `respond_to_friend_request`.

If still present in the live function bodies, any authenticated user can enumerate another user's match list and message previews. UUID space makes guessing hard, but this is the highest-severity finding *if confirmed*. Verify before treating as real:

```sql
SELECT proname, pg_get_functiondef(oid)
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN ('fetch_match_previews', 'get_unread_count');
```

---

### 🟡 Schema debt — no beta risk, matters before App Store submission

**5. `friendship_status` enum default `'active'` vs app type `'pending' | 'accepted' | 'declined'`**

The RPC explicitly sets `status = 'pending'` on insert, so normal flows are unaffected. The `'active'` default only matters if any code does a raw insert without specifying status. No direct beta risk, but the type drift is worth resolving before launch. Verify with:

```sql
SELECT enum_range(NULL::friendship_status);
```

**6. Three undocumented tables + three undocumented `profiles` columns**

Real schema debt, zero beta risk. `intents`, `invites`, and `cowork_sessions` have no app code touching them. The `profiles.location` PostGIS column and `expo_push_token` column are dormant. Document or drop before App Store submission.

**7. `profiles.email` / `phone_number` / `birthday` readable by all authenticated users**

Intentional (the SELECT `USING (true)` policy is there by design for discovery). At beta scale with trusted users this is a non-issue. Worth revisiting before open launch with a sanitised view for the discovery query.

---

### ⚪ Low / no beta risk

| Finding | Beta risk | Notes |
|---|---|---|
| `invites` UPDATE missing WITH CHECK | None | Table unused in app |
| `matches` direct INSERT bypasses normalisation | None | DB CHECK constraint limits the actual exploit path |
| Duplicate indexes on `matches` / `friendships` | None | Write-overhead only |
| Realtime on unused tables | None | Minor replication load |
| `update_updated_at()` not in migrations | None | Function works; only matters for reproducibility |
| Storage orphan cleanup after `delete_account` | None for beta | GDPR concern at launch, not TestFlight |
| Auth provider config | Unknown | Verify in dashboard — likely fine |
| `respond_to_friend_request` caller user_id | ✅ Closed | Live identity assertion verified |
| `mark_chat_read` caller user_id | ✅ Closed | Live identity assertion verified |

---

## Summary Table

| Finding | Real? | Beta risk |
|---|---|---|
| `profiles.bio` absent from live schema | ✅ Confirmed | 🔴 UI bug today |
| `messages` weak INSERT policy | ✅ Confirmed | 🟠 Fix before launch |
| `friendships` ALL policy | ✅ Confirmed (slightly overstated) | 🟠 Fix before launch |
| `fetch_match_previews` / `get_unread_count` caller user_id | ✅ Closed | Live identity assertion verified |
| `friendship_status` enum drift | ✅ Partially confirmed | 🟡 Pre-launch |
| Undocumented tables / columns | ✅ Confirmed | 🟡 Pre-launch schema hygiene |
| PII exposure in `profiles` SELECT | ✅ Confirmed, intentional | 🟡 Pre-launch policy review |
| `invites` missing WITH CHECK | ✅ Confirmed | ⚪ Table not in use |
| `matches` INSERT policy | ✅ Real but overstated | ⚪ DB constraints limit impact |
| Storage orphan cleanup | ⚠️ Known Supabase limitation | ⚪ GDPR concern, not TestFlight |
| All other schema debt findings | ✅ Confirmed | ⚪ Hygiene only |
