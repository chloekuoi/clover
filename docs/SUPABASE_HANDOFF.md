# Supabase Audit Handoff — Clover

**Prepared:** 2026-06-05  
**Project URL:** `https://fyjnqnzrtfuuwrkfksof.supabase.co`  
**EAS Project ID:** `d5366a10-1846-4ee3-a7ac-2e5148494c52`  
**Data sources:** Live queries run against the production database via the Supabase SQL Editor, cross-referenced against all 14 migration files in `supabase/`.

**Confidence key:**  
✅ Verified from live DB query · ⚠️ Discrepancy between DB and migrations · ❌ Security concern · ❓ Not queried / unknown

---

## 1. Migration Deployment Status

All 14 migration files are deployed. The engineering handoff incorrectly stated migrations 013 and 014 were undeployed — both are live.

| File | Description | Status |
|---|---|---|
| `001_profiles_table.sql` | `profiles`, `handle_new_user` trigger | ✅ Deployed |
| `002_discovery_tables.sql` | `work_intents`, `swipes`, `check_match` | ✅ Deployed |
| `003_matching_tables.sql` | `matches`, `messages`, match RPCs | ✅ Deployed |
| `004_sessions_tables.sql` | `sessions`, `session_participants`, `session_events` | ✅ Deployed |
| `005_sessions_revision.sql` | Session schema revision + RPCs | ✅ Deployed |
| `006_friendships_table.sql` | `friendships`, friendship RPCs | ✅ Deployed |
| `007_profile_photos.sql` | `profile_photos`, `avatars` bucket, storage policies | ✅ Deployed |
| `008_group_chats.sql` | `group_chats`, `group_members`, `group_messages`, `group_sessions`, `group_session_rsvps` | ✅ Deployed |
| `009_unmatch_matches.sql` | `status`/`unmatched_by`/`unmatched_at` on `matches`, unmatch RPCs | ✅ Deployed |
| `010_contact_sync.sql` | `phone_number` on `profiles`, `lookup_users_by_phone` RPC | ✅ Deployed |
| `011_desired_roles.sql` | `desired_roles` on `profiles` | ✅ Deployed |
| `012_delete_account.sql` | `delete_account()` RPC | ✅ Deployed |
| `013_co_work_invites.sql` | `co_work_invites`, `push_tokens`, `respond_to_invite` RPC | ✅ Deployed |
| `014_relax_intent_fields.sql` | Drops NOT NULL from `work_intents.work_style` and `work_intents.location_type` | ✅ Deployed |

---

## 2. Repository-vs-Production Differences

### 2a. Tables That Exist in Production but Have No Migration File

Three tables were created entirely via the Supabase dashboard and are **completely absent from version control**.

#### `intents`
A second, parallel intent system — structurally different from `work_intents`. One row per user (not per user+date). Uses custom enum types not defined in any migration.

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_id` | uuid | YES | — |
| `task` | text | NO | — |
| `location_pref` | enum `location_pref` | NO | `'anywhere'` |
| `area` | text | YES | — |
| `time_prefs` | array of enum `time_pref` | NO | `'{}'` |
| `is_available` | boolean | NO | `false` |
| `created_at` | timestamptz | YES | `now()` |
| `updated_at` | timestamptz | YES | `now()` |

Indexes: primary key, unique on `user_id`, `idx_intents_available` on `(is_available, updated_at)`.  
Trigger: `intents_updated_at` BEFORE UPDATE → `update_updated_at()`.  
RLS: enabled. Policies: SELECT `USING (true)` (all intents visible to all authenticated users); ALL `USING (auth.uid() = user_id)`.  
⚠️ This table is not referenced anywhere in the application codebase (`src/`). Its purpose and relationship to `work_intents` is unknown. It may be an abandoned prototype of a simpler availability toggle, or infrastructure for a planned future feature.

---

#### `invites`
An invite-code system. The primary key is TEXT (not UUID), suggesting it holds human-readable or short alphanumeric invite codes.

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | text | NO | — |
| `from_user_id` | uuid | NO | — |
| `claimed_by_user_id` | uuid | YES | — |
| `created_at` | timestamptz | YES | `now()` |
| `claimed_at` | timestamptz | YES | — |

RLS: enabled. Policies: INSERT `WITH CHECK (auth.uid() = from_user_id)`; SELECT `USING (auth.uid() = from_user_id)`; UPDATE `USING (claimed_by_user_id IS NULL)` with **no WITH CHECK**.  
❌ **Security concern:** The UPDATE policy allows any authenticated user to claim any unclaimed invite, and the absence of a WITH CHECK clause means they can set `claimed_by_user_id` to any UUID — including another user's ID. See §5.  
⚠️ Not referenced in the application codebase.

---

#### `cowork_sessions`
A simple two-user session confirmation table, far simpler than the `sessions`/`session_participants`/`session_events` system.

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` |
| `user_1_id` | uuid | NO | — |
| `user_2_id` | uuid | NO | — |
| `confirmed_at` | timestamptz | YES | `now()` |

RLS: enabled. Policies: INSERT `WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id)`; SELECT `USING (auth.uid() = user_1_id OR auth.uid() = user_2_id)`.  
⚠️ No foreign key constraints are visible on `user_1_id`/`user_2_id` (not verifiable without FK query results, but not listed in indexes). No UPDATE or DELETE policies. Not referenced in the application codebase.

---

### 2b. Columns That Exist in Production but Have No Migration

The following columns exist on `profiles` and have no corresponding `ALTER TABLE` in any migration file:

| Column | Type | Notes |
|---|---|---|
| `one_liner` | text | Not in any migration. Migration 001 defines `bio` (text) — `bio` does **not appear** in the live column list, suggesting it was renamed to `one_liner` via the dashboard. The app's `Profile` type in `src/types/index.ts` references neither `bio` nor `one_liner`. |
| `location` | geography (PostGIS) | PostGIS geometry column, nullable. An index `idx_profiles_location` (GiST) exists on it. No migration adds this column or enables the `postgis` extension. Likely added dashboard-side for a proximity feature. Not referenced in app code — `discoveryService.ts` uses client-side Haversine distance calculation instead. |
| `expo_push_token` | text | A push token stored directly on the profile row, separate from the `push_tokens` table introduced in migration 013. Indexed with a partial index (`WHERE expo_push_token IS NOT NULL`). Both storage locations exist simultaneously, which is redundant and a potential consistency hazard. |

The column `bio` from migration 001 is **absent** from the live schema. It was likely renamed to `one_liner` via the dashboard without a migration. The app's TypeScript type `Profile` (`src/types/index.ts`) has neither column — `tagline` and `bio` are referenced in app types but the live column is `one_liner` and `tagline`. This is a latent data-mapping bug.

---

### 2c. Functions That Exist in Production but Have No Migration

#### `update_updated_at()`
Called by the `intents_updated_at` and `profiles_updated_at` triggers. Not defined in any migration file. Definition unknown (not queried). Because this function is used by both the undocumented `intents` table and the core `profiles` table, losing it (e.g., in a project reset) would silently break `profiles.updated_at` maintenance.

---

### 2d. Enum Types That Exist in Production but Have No Migration

Three custom PostgreSQL enum types are deployed with no migration source:

| Type | Used by | Known values |
|---|---|---|
| `location_pref` | `intents.location_pref` | includes `'anywhere'` (default); full set unknown |
| `time_pref` | `intents.time_prefs[]` | unknown |
| `friendship_status` | `friendships.status` (default) | unknown; default is `'active'` |

The `friendship_status` enum is particularly notable: migration 006 defines `friendships.status` as `TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined'))`. The live column uses the `friendship_status` enum type with a default of `'active'` — a value that does not appear in the migration's CHECK constraint. Either the CHECK constraint was dropped, the column type was altered, or the enum includes different values than the migration intends. The app's `FriendshipStatus` TypeScript type (`'pending' | 'accepted' | 'declined'`) does not include `'active'`, creating a potential runtime mismatch.

---

### 2e. Indexes That Differ from Migrations

| Table | Extra index in production | Notes |
|---|---|---|
| `matches` | `matches_user_1_id_user_2_id_key` | Duplicate of `matches_user_pair_unique` — both are UNIQUE on `(user1_id, user2_id)`. One is redundant. |
| `friendships` | `friendships_user_id_friend_id_key` | Duplicate of `idx_friendships_pair_unique` — both are UNIQUE on `LEAST/GREATEST(requester_id, recipient_id)`. One is redundant. |
| `messages` | `idx_messages_conversation` on `(match_id, created_at DESC)` | Replaces/supplements the `idx_messages_match_id` and `idx_messages_created_at` from migration 003 with a composite covering index. |
| `profiles` | `idx_profiles_location` (GiST), `idx_profiles_expo_push_token` (partial btree) | Correspond to undocumented columns `location` and `expo_push_token`. |

---

### 2f. Triggers That Differ from Migrations

| Trigger | Table | Function | In migrations? |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | `handle_new_user()` | ✅ Migration 001 |
| `intents_updated_at` | `intents` | `update_updated_at()` | ❌ No migration |
| `profiles_updated_at` | `profiles` | `update_updated_at()` | ❌ No migration |

Migration 001 creates an `updated_at` trigger via `handle_new_user`, but no migration creates `update_updated_at()` or attaches it to `profiles`. The `profiles.updated_at` column is maintained by a trigger sourced entirely from the dashboard.

---

## 3. Tables and Sensitive Columns

All tables in production with RLS status and sensitive column callouts:

| Table | RLS | Sensitive columns | Notes |
|---|---|---|---|
| `profiles` | ✅ ON | `email`, `phone_number`, `birthday`, `location` (geography), `expo_push_token` | SELECT policy is `USING (true)` — **all columns are readable by any authenticated user**, including email, phone number, birthday, and precise location. |
| `work_intents` | ✅ ON | `latitude`, `longitude`, `location_name` | SELECT policy is `USING (true)` — location history readable by any authenticated user for any date. |
| `intents` | ✅ ON | `area` (free-text location) | SELECT policy is `USING (true)`. |
| `matches` | ✅ ON | — | |
| `messages` | ✅ ON | `content` | ❌ Duplicate INSERT policies (see §5). |
| `sessions` | ✅ ON | — | No INSERT/UPDATE/DELETE policies — writes gated through RPCs only. |
| `session_participants` | ✅ ON | — | SELECT only shows the authenticated user's own row — other participant not visible directly. |
| `session_events` | ✅ ON | — | |
| `friendships` | ✅ ON | — | ❌ ALL policy with no WITH CHECK (see §5). |
| `profile_photos` | ✅ ON | — | SELECT is `USING (true)` — all photos public. |
| `co_work_invites` | ✅ ON | — | No UPDATE policy — changes only via `respond_to_invite` RPC. |
| `push_tokens` | ✅ ON | — | |
| `invites` | ✅ ON | — | ❌ UPDATE policy missing WITH CHECK (see §5). |
| `cowork_sessions` | ✅ ON | — | No UPDATE/DELETE policies. |
| `group_chats` | ✅ ON | — | |
| `group_members` | ✅ ON | — | No INSERT/DELETE policies — managed via RPCs. |
| `group_messages` | ✅ ON | `content` | |
| `group_sessions` | ✅ ON | — | |
| `group_session_rsvps` | ✅ ON | — | No INSERT/UPDATE policy visible — managed via RPCs. |
| `swipes` | ✅ ON | — | No UPDATE/DELETE policies. |

**Note on `profiles` SELECT exposure:** Every authenticated user can read `email`, `phone_number`, `birthday`, `location`, and `expo_push_token` for every other user. This was likely intentional for discovery but is broader than typical social app privacy norms. Consider a sanitised view or column-level security for the discovery query.

---

## 4. RLS Policies — Full Inventory

### Public Schema

| Table | Policy | Cmd | USING clause | WITH CHECK |
|---|---|---|---|---|
| `co_work_invites` | insert own invites | INSERT | — | `sender_id = auth.uid()` |
| `co_work_invites` | read own invites | SELECT | `sender_id = auth.uid() OR receiver_id = auth.uid()` | — |
| `cowork_sessions` | Users can create sessions | INSERT | — | `auth.uid() = user_1_id OR auth.uid() = user_2_id` |
| `cowork_sessions` | Users can see own sessions | SELECT | `auth.uid() = user_1_id OR auth.uid() = user_2_id` | — |
| `friendships` | Users can manage friendships ❌ | ALL | `auth.uid() = requester_id OR auth.uid() = recipient_id` | *(none)* |
| `friendships` | Users can read own friendships | SELECT | `auth.uid() = requester_id OR auth.uid() = recipient_id` | — |
| `friendships` | Users can see own friendships | SELECT | `auth.uid() = requester_id` | — |
| `group_chats` | Users can read own group chats | SELECT | `is_group_member(id)` | — |
| `group_chats` | Users can update own group chats | UPDATE | `is_group_member(id)` | `is_group_member(id)` |
| `group_members` | Users can read own group memberships | SELECT | `is_group_member(group_chat_id)` | — |
| `group_messages` | Users can insert own group messages | INSERT | — | `sender_id = auth.uid() AND is_group_member(group_chat_id)` |
| `group_messages` | Users can read own group messages | SELECT | `is_group_member(group_chat_id)` | — |
| `group_session_rsvps` | Users can read own group session RSVPs | SELECT | EXISTS on `group_sessions` + `is_group_member` | — |
| `group_sessions` | Users can insert own group sessions | INSERT | — | `proposed_by = auth.uid() AND is_group_member(group_chat_id)` |
| `group_sessions` | Users can read own group sessions | SELECT | `is_group_member(group_chat_id)` | — |
| `group_sessions` | Users can update own group sessions | UPDATE | `is_group_member(group_chat_id)` | `is_group_member(group_chat_id)` |
| `intents` | Available intents are viewable | SELECT | `true` | — |
| `intents` | Users can manage own intent | ALL | `auth.uid() = user_id` | *(none)* |
| `invites` | Anyone can claim invite ❌ | UPDATE | `claimed_by_user_id IS NULL` | *(none)* |
| `invites` | Users can create invites | INSERT | — | `auth.uid() = from_user_id` |
| `invites` | Users can see own invites | SELECT | `auth.uid() = from_user_id` | — |
| `matches` | System can create matches ⚠️ | INSERT | — | `auth.uid() = user1_id OR auth.uid() = user2_id` |
| `matches` | Users can see own matches | SELECT | `auth.uid() = user1_id OR auth.uid() = user2_id` | — |
| `messages` | Users can insert own messages | INSERT | — | `sender_id = auth.uid() AND EXISTS (match membership check)` |
| `messages` | Users can send messages ❌ | INSERT | — | `auth.uid() = sender_id` *(weaker — wins under PERMISSIVE logic)* |
| `messages` | Users can read own messages | SELECT | EXISTS match membership check | — |
| `profile_photos` | Anyone can view profile photos | SELECT | `true` | — |
| `profile_photos` | Users can delete own photos | DELETE | `auth.uid() = user_id` | — |
| `profile_photos` | Users can insert own photos | INSERT | — | `auth.uid() = user_id` |
| `profile_photos` | Users can update own photos | UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `profiles` | Profiles are viewable by everyone | SELECT | `true` | — |
| `profiles` | Users can insert own profile | INSERT | — | `auth.uid() = id` |
| `profiles` | Users can update own profile | UPDATE | `auth.uid() = id` | `auth.uid() = id` |
| `push_tokens` | manage own push token | ALL | `user_id = auth.uid()` | `user_id = auth.uid()` |
| `session_events` | Users can read own session events | SELECT | EXISTS on `session_participants` | — |
| `session_participants` | Users can read own session participants | SELECT | `user_id = auth.uid()` | — |
| `sessions` | Users can read own sessions | SELECT | EXISTS on `session_participants` | — |
| `swipes` | Users can insert own swipes | INSERT | — | `auth.uid() = swiper_id` |
| `swipes` | Users can read own swipes | SELECT | `auth.uid() = swiper_id OR auth.uid() = swiped_id` | — |
| `work_intents` | Users can delete own intents | DELETE | `auth.uid() = user_id` | — |
| `work_intents` | Users can insert own intents | INSERT | — | `auth.uid() = user_id` |
| `work_intents` | Users can read all intents | SELECT | `true` | — |
| `work_intents` | Users can update own intents | UPDATE | `auth.uid() = user_id` | `auth.uid() = user_id` |

### Storage Schema (`storage.objects`)

| Policy | Cmd | USING | WITH CHECK |
|---|---|---|---|
| Avatars are publicly viewable | SELECT | `bucket_id = 'avatars'` | — |
| Users can delete own avatar | DELETE | `bucket_id = 'avatars' AND auth.uid()::text = foldername(name)[1]` | — |
| Users can update own avatar | UPDATE | same | same |
| Users can upload own avatar | INSERT | — | `bucket_id = 'avatars' AND auth.uid()::text = foldername(name)[1]` |

Storage policies match migration 007 exactly. ✅

---

## 5. Security Concerns

### ❌ Critical — `messages`: Duplicate INSERT Policies, Weaker One Wins

Two PERMISSIVE INSERT policies exist on `messages`:
- **"Users can insert own messages"** — checks `sender_id = auth.uid()` AND verifies the user is a participant in the match (correct)
- **"Users can send messages"** — checks only `auth.uid() = sender_id` (no match membership check)

Under Supabase's PERMISSIVE (OR) policy evaluation, the weaker policy wins. **Any authenticated user can send a message to any match in the system simply by knowing the match UUID, as long as they set themselves as `sender_id`.** This is a significant data leakage and spam vector.

**Fix:** Drop the "Users can send messages" policy.

```sql
DROP POLICY "Users can send messages" ON messages;
```

---

### ❌ High — `friendships`: ALL Policy Has No WITH CHECK

The "Users can manage friendships" policy grants ALL operations (`INSERT`, `UPDATE`, `DELETE`) to any user who is the `requester_id` OR `recipient_id`, with no `WITH CHECK` clause. This means:
- The **recipient** of a friend request can delete it, update its status to anything, or insert new friendship rows.
- A user can INSERT a new friendship row claiming any other user is the `recipient_id` (bypassing the `send_friend_request` RPC entirely).

The migration defines only one SELECT policy. The three policies in production are entirely dashboard-created and are in conflict with each other (two SELECT policies and one overbroad ALL policy).

**Fix:** Drop the ALL policy and the redundant "Users can see own friendships" policy; add targeted INSERT/UPDATE/DELETE policies that match the RPC contract.

---

### ❌ High — `invites`: UPDATE Policy Missing WITH CHECK

The "Anyone can claim invite" UPDATE policy uses `USING (claimed_by_user_id IS NULL)` with no `WITH CHECK`. This allows any authenticated user to:
1. Claim any unclaimed invite code
2. Set `claimed_by_user_id` to **any UUID**, not just their own

**Fix:** Add `WITH CHECK (claimed_by_user_id = auth.uid())`.

---

### ⚠️ Medium — `matches`: Direct INSERT Bypasses `create_match` Normalisation

The "System can create matches" INSERT policy allows any authenticated user to directly insert a row into `matches` where they appear as `user1_id` or `user2_id`. The `create_match` SECURITY DEFINER RPC enforces that `user1_id < user2_id` (lexicographic ordering) to guarantee uniqueness. A direct INSERT bypasses this, potentially creating duplicate match rows with swapped user order, breaking the `UNIQUE(user1_id, user2_id)` + `CHECK (user1_id < user2_id)` constraint or introducing confusion.

**Fix:** Remove the INSERT policy entirely; all match creation should go through the `create_match` RPC.

---

### ✅ Closed — `respond_to_friend_request` Caller-Supplied `p_user_id`

**Closed June 7, 2026.** The live function now calls
`public.assert_authenticated_user(p_user_id)` before processing the request. The helper
rejects unauthenticated calls and requires `auth.uid() = p_user_id`, preventing callers
from responding on another user's behalf.

The existing signature is retained for app compatibility. Execute permission was verified
as granted to `authenticated` and denied to `anon`.

---

### ✅ Closed — Match Preview, Unread Count, and Read-State Caller Identity

**Closed June 7, 2026.** The live `fetch_match_previews(p_user_id)`,
`get_unread_count(p_user_id)`, and `mark_chat_read(p_match_id, p_user_id)` functions now
call `public.assert_authenticated_user(p_user_id)`. The helper confirms that `auth.uid()`
is not null and equals `p_user_id`.

The functions retain their existing signatures for app compatibility. Execute permissions
were verified as granted to `authenticated` and denied to `anon`.

---

### ⚠️ Low — `profiles` SELECT Exposes All PII to All Authenticated Users

`email`, `phone_number`, `birthday`, `location` (precise GPS), and `expo_push_token` are all returned by the `USING (true)` SELECT policy. Any logged-in user can read this data for every other user. This is intentional for the discovery feature but is broader than needed — the discovery query only needs `name`, `city`, `photo_url`, `work_type`, and intent data.

---

## 6. RPC Signatures and SECURITY DEFINER Usage

All public functions use SECURITY DEFINER unless noted. Functions not verified via live query — sourced from migration files. The `update_updated_at()` function exists in production but has no migration source.

| Function | Defined in | SECURITY | Notes |
|---|---|---|---|
| `handle_new_user()` | 001 | DEFINER | Trigger fn; creates profile on signup |
| `check_match(swiper, swiped)` | 002 | DEFINER | Returns bool; checks mutual right swipe |
| `create_match(user1, user2)` | 003/009 | DEFINER | Idempotent; normalises user order |
| `mark_chat_read(match_id, user_id)` | 003 | DEFINER | ✅ Live function validates `p_user_id` with `assert_authenticated_user` |
| `fetch_match_previews(user_id)` | 003 | DEFINER | ✅ Live function validates `p_user_id` with `assert_authenticated_user` |
| `get_unread_count(user_id)` | 003 | DEFINER | ✅ Live function validates `p_user_id` with `assert_authenticated_user` |
| Session proposal RPCs (×5) | 004/005 | DEFINER | Propose, accept, decline, complete, lock |
| `send_friend_request(requester, recipient)` | 006 | DEFINER | Takes explicit UUIDs; safe (both verified in function) |
| `respond_to_friend_request(friendship_id, user_id, response)` | 006 | DEFINER | ✅ Live function validates `p_user_id` with `assert_authenticated_user` |
| `get_pending_requests_count(user_id)` | 006 | DEFINER | |
| Group chat RPCs (×8) | 008 | DEFINER | Create chat, add/remove members, send message, propose/update session, RSVP, get previews |
| `unmatch_user(match_id, user_id)` | 009 | DEFINER | ✅ Does verify `auth.uid() IS NOT DISTINCT FROM p_user_id` |
| `fetch_match_previews_v2` (and related) | 009 | DEFINER | Updated version from unmatch migration |
| `lookup_users_by_phone(phones)` | 010 | DEFINER | Bulk phone lookup across all profiles |
| `delete_account()` | 012 | DEFINER | Uses `auth.uid()` internally; no params ✅ |
| `respond_to_invite(invite_id, response)` | 013 | DEFINER | ✅ Uses `auth.uid()` to verify receiver |
| `update_updated_at()` | ❌ No migration | UNKNOWN | Called by `intents_updated_at` and `profiles_updated_at` triggers |

---

## 7. Triggers

| Trigger | Table | Timing | Event | Function | In migrations |
|---|---|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER | INSERT | `handle_new_user()` | ✅ Migration 001 |
| `profiles_updated_at` | `profiles` | BEFORE | UPDATE | `update_updated_at()` | ❌ Dashboard only |
| `intents_updated_at` | `intents` | BEFORE | UPDATE | `update_updated_at()` | ❌ Dashboard only |

---

## 8. Storage Buckets and Policies

| Bucket | Public | Size limit | Allowed types |
|---|---|---|---|
| `avatars` | ✅ Yes | 5 MB | `image/jpeg`, `image/png`, `image/webp` |

One bucket. Configuration matches migration 007 exactly. Four storage policies (SELECT/INSERT/UPDATE/DELETE) are all present and correct. The SELECT policy applies to the `public` role, meaning **anyone without authentication can read avatar URLs** — this is intentional (public bucket) and consistent with how `expo-image` renders photos.

**Residual-object risk:** The `delete_account()` RPC deletes rows from `storage.objects` but does not call the Supabase Storage API to remove the underlying object file. Whether Supabase auto-garbage-collects orphaned objects after the metadata row is deleted should be verified in the project's Supabase version release notes.

---

## 9. Realtime Configuration

Six tables are in the `supabase_realtime` publication:

| Table | In-app subscription | Notes |
|---|---|---|
| `messages` | ✅ Yes — `ChatScreen.tsx` | Core DM chat |
| `group_messages` | ✅ Yes — `GroupChatScreen.tsx` | Group chat |
| `friendships` | ❌ No subscription in code | Enabled but unused |
| `group_sessions` | ❌ No subscription in code | Enabled but unused |
| `session_events` | ❌ No subscription in code | Enabled but unused |
| `sessions` | ❌ No subscription in code | Enabled but unused |

Tables that receive in-code subscriptions but have **no Realtime publication**:
- None found — in-app subscriptions match or are a subset of the enabled tables.

The three enabled-but-unsubscribed tables (`friendships`, `group_sessions`, `session_events`) add replication overhead with no current consumer. They may be intentional (reserved for future push notification triggers or webhook consumers) or accidental. Consider removing them from the publication if unused.

---

## 10. Auth Providers and Redirect Configuration

❓ **Not queried** — Auth provider configuration (enabled providers, redirect URLs, email templates, PKCE settings, JWT expiry) is only accessible via the Supabase Dashboard → Authentication settings and was not queried during this audit.

**Known from application code:**
- Email/password: used (`signInWithPassword`, `signUp`)
- Apple Sign-In: used (`signInWithIdToken` with provider `'apple'`)
- All other providers: not referenced in code

**Action required:** Verify in Dashboard → Authentication → Providers that:
- Only Email and Apple are enabled
- Apple OAuth credentials (Service ID, Team ID, Key ID, private key) are correctly configured
- Redirect URLs are locked to the app's scheme only (no wildcard `*` entries)
- "Confirm email" setting matches the behaviour expected by `signUp` (the code handles both confirmed and unconfirmed flows)

---

## 11. Edge Functions

❓ **Not queried** — The `supabase/functions/` directory exists in the repository but contains no source files. No Edge Functions are deployed based on migration content. Actual deployment status must be verified in Dashboard → Edge Functions.

---

## 12. Database Extensions

Not queried in full. Known required extensions based on live column types:

| Extension | Evidence | In migrations |
|---|---|---|
| `postgis` | `profiles.location` column of type `geography` and GiST index | ❌ No migration enables this |
| `uuid-ossp` or `pgcrypto` | `gen_random_uuid()` used as default throughout | ❓ May be pre-enabled by Supabase |

Run `SELECT extname, extversion FROM pg_extension ORDER BY extname;` to verify.

---

## 13. Unverified Assumptions

| Area | Assumption | How to verify |
|---|---|---|
| Auth providers | Only Email + Apple are enabled | Dashboard → Authentication → Providers |
| Redirect URLs | No wildcard entries | Dashboard → Authentication → URL Configuration |
| Edge Functions | None deployed | Dashboard → Edge Functions |
| Function definitions | `update_updated_at()` is a standard timestamp trigger | Run: `SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'update_updated_at'` |
| `friendship_status` enum values | Includes more than `'pending'`, `'accepted'`, `'declined'` | Run: `SELECT enum_range(NULL::friendship_status)` |
| `location_pref` enum values | Includes at least `'anywhere'` | Run: `SELECT enum_range(NULL::location_pref)` |
| `time_pref` enum values | Unknown | Run: `SELECT enum_range(NULL::time_pref)` |
| `postgis` extension | Enabled (evidenced by `geography` column type) | Run: `SELECT extname FROM pg_extension WHERE extname = 'postgis'` |
| Storage orphan cleanup | Supabase auto-cleans storage objects when metadata row deleted | Check Supabase release notes for project's version |
| `cowork_sessions` FK constraints | No foreign keys on `user_1_id`/`user_2_id` | Run FK query from audit script |
| Function bodies for 013/014 RPCs | Match migration source exactly | Run: Query 4 from audit script (full function definitions) |
| Service-role key rotation | Key has never been rotated or exposed | Dashboard → Settings → API |
| RLS on `auth` schema tables | Standard Supabase defaults apply | Supabase manages these; verify no custom policies added |

---

## 14. Recommended Immediate Actions

Priority order for the engineering handoff:

1. **Fix `messages` duplicate INSERT policy** — drop "Users can send messages"; any authenticated user can currently message any match. (1 SQL statement)
2. **Fix `friendships` ALL policy** — drop "Users can manage friendships" and "Users can see own friendships"; add explicit INSERT/UPDATE/DELETE policies. (3–5 SQL statements)
3. **Fix `invites` UPDATE policy** — add `WITH CHECK (claimed_by_user_id = auth.uid())`. (1 SQL statement)
4. **Record the live RPC authentication fixes in a migration** so `assert_authenticated_user` and the four secured function definitions can be reproduced outside production.
5. **Write migrations for dashboard-only objects:** `intents`, `invites`, `cowork_sessions`, `update_updated_at()`, three enum types, three undocumented `profiles` columns, `profiles_updated_at` trigger. Either capture them as migration 015+ or document them as intentional dead infrastructure to be dropped.
6. **Resolve `profiles.bio` vs `profiles.one_liner`** — determine which is canonical and reconcile the live schema in a migration.
7. **Verify and document Auth provider configuration** — confirm only Email + Apple are enabled, redirect URLs are scoped correctly.
8. **Remove duplicate indexes** on `matches` and `friendships` — pick one name for each pair and drop the other.
9. **Decide on Realtime scope** — remove `friendships`, `group_sessions`, `session_events` from the publication if no consumer is planned, or document the intended consumer (webhook, Edge Function, etc.).
