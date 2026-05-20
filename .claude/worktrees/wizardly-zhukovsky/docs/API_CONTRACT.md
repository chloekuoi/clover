# API Contract — Supabase Backend

**Last Updated:** 2026-02-06 (Phase 2)

---

## Tables Overview

| Table | RLS | Purpose |
|-------|-----|---------|
| `profiles` | Enabled | User profile data |
| `work_intents` | Enabled | Daily work intentions for discovery |
| `swipes` | Enabled | Swipe history (right/left) |
| `sessions` | Enabled | Co-working session records |
| `session_participants` | Enabled | Session participants and roles |

---

## Table: `profiles`

**Purpose:** Stores user profile information, linked to `auth.users`

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | — | Primary key, matches `auth.users.id` |
| `email` | `TEXT` | Yes | `NULL` | User's email (from auth) |
| `username` | `TEXT` | No | — | Unique username (auto-generated if not set) |
| `name` | `TEXT` | Yes | `NULL` | Display name |
| `photo_url` | `TEXT` | Yes | `NULL` | Profile photo URL |
| `work_type` | `TEXT` | Yes | `NULL` | How they work (Freelancer, Remote Employee, etc.) |
| `interests` | `TEXT[]` | Yes | `NULL` | Array of interest tags |
| `bio` | `TEXT` | Yes | `NULL` | Short bio (not used in UI yet) |
| `onboarding_complete` | `BOOLEAN` | No | `FALSE` | Whether onboarding finished |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time |

### Indexes
| Name | Columns | Type |
|------|---------|------|
| `profiles_pkey` | `id` | Primary Key |
| `profiles_username_key` | `username` | Unique |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can view all profiles | `SELECT` | `true` (public read) |
| Users can insert own profile | `INSERT` | `auth.uid() = id` |
| Users can update own profile | `UPDATE` | `auth.uid() = id` |

### Foreign Keys
| Column | References |
|--------|------------|
| `id` | `auth.users(id)` ON DELETE CASCADE |

---

## Table: `work_intents`

**Purpose:** Stores daily work intentions for the discovery feature

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `task_description` | `TEXT` | No | — | What user is working on |
| `available_from` | `TIME` | No | — | Start of availability window |
| `available_until` | `TIME` | No | — | End of availability window |
| `work_style` | `TEXT` | No | — | One of: Deep focus, Chat mode, Flexible |
| `location_type` | `TEXT` | No | — | One of: Cafe, Library, Anywhere |
| `location_name` | `TEXT` | Yes | `NULL` | Specific place name (optional) |
| `latitude` | `DOUBLE PRECISION` | No | — | User's latitude when intent was set |
| `longitude` | `DOUBLE PRECISION` | No | — | User's longitude when intent was set |
| `intent_date` | `DATE` | No | `CURRENT_DATE` | Date of the intent |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `work_intents_pkey` | `id` |
| Unique | `work_intents_user_id_intent_date_key` | `(user_id, intent_date)` |
| Foreign Key | — | `user_id` → `profiles(id)` ON DELETE CASCADE |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_work_intents_date` | `intent_date` | Filter by date |
| `idx_work_intents_user_date` | `user_id, intent_date` | Lookup user's daily intent |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read all intents | `SELECT` | `true` | Discovery requires reading others' intents |
| Users can insert own intents | `INSERT` | `auth.uid() = user_id` | Only create your own |
| Users can update own intents | `UPDATE` | `auth.uid() = user_id` | Only edit your own |
| Users can delete own intents | `DELETE` | `auth.uid() = user_id` | Only delete your own |

---

## Table: `swipes`

**Purpose:** Records swipe actions for match detection

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `swiper_id` | `UUID` | No | — | FK to `profiles.id` (who swiped) |
| `swiped_id` | `UUID` | No | — | FK to `profiles.id` (who was swiped on) |
| `direction` | `TEXT` | No | — | `'right'` or `'left'` |
| `swipe_date` | `DATE` | No | `CURRENT_DATE` | Date of swipe |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `swipes_pkey` | `id` |
| Unique | `swipes_swiper_id_swiped_id_swipe_date_key` | `(swiper_id, swiped_id, swipe_date)` |
| Check | — | `direction IN ('right', 'left')` |
| Foreign Key | — | `swiper_id` → `profiles(id)` ON DELETE CASCADE |
| Foreign Key | — | `swiped_id` → `profiles(id)` ON DELETE CASCADE |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_swipes_swiper_date` | `swiper_id, swipe_date` | Get user's swipes for today |
| `idx_swipes_match_check` | `swiper_id, swiped_id, direction, swipe_date` | Efficient match lookup |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own swipes | `SELECT` | `auth.uid() = swiper_id OR auth.uid() = swiped_id` | See swipes where you are involved |
| Users can insert own swipes | `INSERT` | `auth.uid() = swiper_id` | Only record your own swipes |

**Note:** Users cannot see who swiped on them (privacy). Match detection happens via RPC.

---

## Table: `sessions`

**Purpose:** Stores co-working session lifecycle records for matches

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | No | — | FK to `matches.id` |
| `initiated_by` | `UUID` | No | — | FK to `profiles.id` |
| `status` | `TEXT` | No | — | One of: `pending`, `active`, `declined`, `completed`, `cancelled` |
| `session_date` | `DATE` | No | `CURRENT_DATE` | Session date (day-level) |
| `scheduled_date` | `DATE` | No | `CURRENT_DATE` | Planned coworking date |
| `accepted_at` | `TIMESTAMPTZ` | Yes | `NULL` | When invitee accepted |
| `completed_at` | `TIMESTAMPTZ` | Yes | `NULL` | When session completed |
| `completed_ack` | `BOOLEAN` | Yes | `NULL` | True when both users locked in |
| `locked_by_initiator_at` | `TIMESTAMPTZ` | Yes | `NULL` | Initiator lock timestamp |
| `locked_by_invitee_at` | `TIMESTAMPTZ` | Yes | `NULL` | Invitee lock timestamp |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `sessions_pkey` | `id` |
| Check | — | `status IN ('pending','active','declined','completed','cancelled')` |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_sessions_match_id` | `match_id` | Lookup sessions for a match |
| `idx_sessions_status` | `status` | Filter by active/pending |
| `idx_sessions_session_date` | `session_date` | Auto-complete stale sessions |
| `idx_sessions_scheduled_date` | `scheduled_date` | Filter by planned date |
| `idx_sessions_accepted_at` | `accepted_at` | Auto-cancel after 24h |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can read own sessions | `SELECT` | `EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = sessions.id AND sp.user_id = auth.uid())` |

### Foreign Keys
| Column | References |
|--------|------------|
| `match_id` | `matches(id)` ON DELETE CASCADE |
| `initiated_by` | `profiles(id)` ON DELETE CASCADE |

---

## Table: `session_participants`

**Purpose:** Links users to sessions with their role

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `role` | `TEXT` | No | — | One of: `initiator`, `invitee` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `session_participants_pkey` | `id` |
| Unique | `session_participants_session_id_user_id_key` | `(session_id, user_id)` |
| Check | — | `role IN ('initiator','invitee')` |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_session_participants_user_id` | `user_id` | Lookup sessions for a user |
| `idx_session_participants_session_id` | `session_id` | Lookup participants for a session |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can read own session participants | `SELECT` | `user_id = auth.uid()` |

### Foreign Keys
| Column | References |
|--------|------------|
| `session_id` | `sessions(id)` ON DELETE CASCADE |
| `user_id` | `profiles(id)` ON DELETE CASCADE |

---

## Table: `session_events`

**Purpose:** System events associated with a session (e.g., acceptance message)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `event_type` | `TEXT` | No | — | Event type (e.g., `accepted`) |
| `message` | `TEXT` | No | — | Reserved for optional payload (empty for accepted) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints
| Type | Name | Definition |
|------|------|------------|
| Primary Key | `session_events_pkey` | `id` |

### Indexes
| Name | Columns | Purpose |
|------|---------|---------|
| `idx_session_events_session_id` | `session_id` | Lookup events for session |
| `idx_session_events_created_at` | `created_at` | Timeline ordering |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Users can read own session events | `SELECT` | `EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = session_events.session_id AND sp.user_id = auth.uid())` |

### Foreign Keys
| Column | References |
|--------|------------|
| `session_id` | `sessions(id)` ON DELETE CASCADE |

### Realtime: **ENABLED**

Supabase Realtime should be enabled on the `session_events` table. The client subscribes to `INSERT` events filtered by `session_id` for system messages.

---

## Functions (RPC)

### `check_match(p_swiper_id UUID, p_swiped_id UUID)`

**Purpose:** Check if a mutual match exists (both users swiped right on each other today)

**Returns:** `BOOLEAN`

**Security:** `SECURITY DEFINER` (runs with elevated privileges to read both users' swipes)

**Logic:**
```sql
SELECT EXISTS (
  SELECT 1 FROM swipes
  WHERE swiper_id = p_swiped_id      -- Other user swiped
  AND swiped_id = p_swiper_id        -- On current user
  AND direction = 'right'            -- Right swipe
  AND swipe_date = CURRENT_DATE      -- Today only
);
```

**Usage (from client):**
```typescript
const { data: isMatch } = await supabase
  .rpc('check_match', {
    p_swiper_id: currentUserId,
    p_swiped_id: swipedUserId,
  });
```

---

### `create_session(p_match_id UUID, p_initiator_id UUID, p_scheduled_date DATE)`

**Purpose:** Create a pending session for a match with a scheduled date (multiple pending invites allowed)

**Returns:** `UUID` (new session ID)

**Security:** `SECURITY DEFINER`

---

### `respond_to_session(p_session_id UUID, p_user_id UUID, p_response TEXT)`

**Purpose:** Invitee accepts or declines a pending session (accept inserts a session_event)

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `complete_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Manually complete an active session (participant only, legacy)

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `cancel_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Cancel a pending session (initiator only)

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `auto_complete_sessions()`

**Purpose:** Backward-compatible alias for `auto_cancel_sessions()`

**Returns:** `INTEGER` (count of completed sessions)

**Security:** `SECURITY DEFINER`

---

### `lock_in_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Record the user's lock-in; when both users lock, session is completed

**Returns:** `VOID`

**Security:** `SECURITY DEFINER`

---

### `auto_cancel_sessions()`

**Purpose:** Auto-cancel active sessions not fully locked after 24 hours

**Returns:** `INTEGER` (count of cancelled sessions)

**Security:** `SECURITY DEFINER`

---

## Triggers

### `profiles` — Auto-create on signup

**Status:** ⚠️ MAY NEED MANUAL SETUP (clickops)

If not already configured, create this trigger to auto-create profile rows:

```sql
-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, onboarding_complete)
  VALUES (
    NEW.id,
    NEW.email,
    'user_' || REPLACE(NEW.id::TEXT, '-', '')::TEXT,
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Storage Buckets

### `avatars`

**Status:** Implemented in Phase 5 (Profile Redesign). See Phase 5 section for full configuration, policies, and file path pattern.

---

## SQL Files Committed

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql` — Creates profiles table, RLS, and signup trigger
2. `002_discovery_tables.sql` — Creates discovery tables and match function

---

## Clickops Audit

Items that may have been configured via Supabase Dashboard:

| Item | Location | Status |
|------|----------|--------|
| `profiles` table | Table Editor | ✅ Now documented in `001_profiles_table.sql` |
| `profiles` RLS policies | Auth → Policies | ✅ Now documented in `001_profiles_table.sql` |
| `handle_new_user` trigger | Database → Triggers | ✅ Now documented in `001_profiles_table.sql` |
| Auth email templates | Auth → Email Templates | ⚠️ Not committed (use defaults) |
| Auth redirect URLs | Auth → URL Configuration | ⚠️ Not committed (document if customized) |

### To Verify Dashboard Matches SQL

1. Go to Supabase Dashboard → SQL Editor
2. Run: `SELECT * FROM pg_tables WHERE schemaname = 'public';`
3. Verify tables match SQL files
4. Run: `SELECT * FROM pg_policies;`
5. Verify policies match SQL files

---

## TypeScript Type Mapping

| Supabase Type | TypeScript Type | Notes |
|---------------|-----------------|-------|
| `UUID` | `string` | |
| `TEXT` | `string` | |
| `TEXT[]` | `string[]` | |
| `BOOLEAN` | `boolean` | |
| `DATE` | `string` | Format: `YYYY-MM-DD` |
| `TIME` | `string` | Format: `HH:MM:SS` |
| `TIMESTAMPTZ` | `string` | ISO 8601 format |
| `DOUBLE PRECISION` | `number` | |

---

## API Endpoints Used

All via `@supabase/supabase-js` client:

### Auth
| Method | Purpose |
|--------|---------|
| `supabase.auth.signUp()` | Create account |
| `supabase.auth.signInWithPassword()` | Login |
| `supabase.auth.signOut()` | Logout |
| `supabase.auth.getSession()` | Get current session |
| `supabase.auth.onAuthStateChange()` | Listen for auth changes |

### Database
| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('profiles').select()` | profiles | Fetch profile |
| `supabase.from('profiles').upsert()` | profiles | Create/update profile |
| `supabase.from('work_intents').select()` | work_intents | Fetch intents |
| `supabase.from('work_intents').upsert()` | work_intents | Create/update intent |
| `supabase.from('swipes').select()` | swipes | Get user's swipes |
| `supabase.from('swipes').insert()` | swipes | Record swipe |
| `supabase.rpc('check_match')` | — | Check for mutual match |

---

## Data Flow Diagrams

### Discovery Flow
```
1. User opens Discover tab
   ↓
2. GET work_intents WHERE user_id = me AND intent_date = today
   ↓
3. If no intent → Show IntentScreen
   ↓
4. User submits intent
   ↓
5. UPSERT work_intents (user_id, intent_date)
   ↓
6. GET work_intents
   WHERE intent_date = today
   AND user_id != me
   JOIN profiles ON user_id
   ↓
7. Client filters by distance (Haversine)
   ↓
8. GET swipes WHERE swiper_id = me AND swipe_date = today
   ↓
9. Client excludes already-swiped users
   ↓
10. Display card stack
```

### Swipe + Match Flow
```
1. User swipes right on profile X
   ↓
2. INSERT swipes (swiper_id=me, swiped_id=X, direction='right')
   ↓
3. RPC check_match(me, X)
   ↓
4. Function checks: EXISTS swipe WHERE swiper=X, swiped=me, direction='right', today
   ↓
5. If true → Return match, show alert
   ↓
6. If false → Continue to next card
```

---

## Security Notes

1. **RLS is enabled on all tables** — No anonymous access
2. **Swipes are private** — Users can't see who swiped on them
3. **Match check uses SECURITY DEFINER** — Bypasses RLS to check both sides
4. **Location data is stored** — Consider privacy policy implications
5. **No rate limiting** — Consider adding for production
6. **Anon key is publishable** — Safe to include in client code

---
---

# Phase 3 Additions

**Added:** 2026-02-07

---

## Tables Overview (Updated)

| Table | RLS | Purpose | Phase |
|-------|-----|---------|-------|
| `profiles` | Enabled | User profile data | 1 |
| `work_intents` | Enabled | Daily work intentions for discovery | 2 |
| `swipes` | Enabled | Swipe history (right/left) | 2 |
| `matches` | Enabled | Persistent mutual matches | **3** |
| `messages` | Enabled | Chat messages between matched users | **3** |

---

## Table: `matches`

**Purpose:** Stores persistent match records when two users mutually swipe right

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `user1_id` | `UUID` | No | — | FK to `profiles.id` (lower UUID of the pair) |
| `user2_id` | `UUID` | No | — | FK to `profiles.id` (higher UUID of the pair) |
| `matched_at` | `TIMESTAMPTZ` | No | `NOW()` | When the match was created |
| `user1_last_read_at` | `TIMESTAMPTZ` | No | `NOW()` | Last time user1 read this chat |
| `user2_last_read_at` | `TIMESTAMPTZ` | No | `NOW()` | Last time user2 read this chat |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `matches_pkey` | `id` |
| Unique | `matches_user_pair_key` | `(user1_id, user2_id)` |
| Check | `matches_different_users` | `user1_id <> user2_id` |
| Foreign Key | — | `user1_id` → `profiles(id)` ON DELETE CASCADE |
| Foreign Key | — | `user2_id` → `profiles(id)` ON DELETE CASCADE |

### Business Rules

- **User ordering:** `user1_id` is always the lower UUID value. The `create_match` function enforces this ordering. This prevents `(A,B)` and `(B,A)` from being stored as separate rows.
- **One match per pair:** The unique constraint on `(user1_id, user2_id)` prevents duplicate matches.
- **Lifecycle:** Matches are permanent for MVP. No unmatch or delete from UI.
- **Last read tracking:** `user1_last_read_at` and `user2_last_read_at` default to `matched_at` on creation, updated via `mark_chat_read` RPC.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_matches_user1` | `user1_id` | Find matches for a user |
| `idx_matches_user2` | `user2_id` | Find matches for a user |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own matches | `SELECT` | `auth.uid() = user1_id OR auth.uid() = user2_id` | Only see your own matches |

**Note:** No INSERT/UPDATE/DELETE policies for direct client access. All mutations go through SECURITY DEFINER RPC functions (`create_match`, `mark_chat_read`).

### UI Assumptions

- Frontend can rely on `user1_id < user2_id` ordering to determine which `last_read_at` column belongs to the current user
- Frontend can join with `profiles` on `user1_id` or `user2_id` to get the other user's info
- `matched_at` is used as the initial `last_read_at` value (messages before match creation are impossible)

---

## Table: `messages`

**Purpose:** Stores individual chat messages between matched users

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | No | — | FK to `matches.id` |
| `sender_id` | `UUID` | No | — | FK to `profiles.id` (who sent the message) |
| `content` | `TEXT` | No | — | Message text content |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When message was sent |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `messages_pkey` | `id` |
| Foreign Key | — | `match_id` → `matches(id)` ON DELETE CASCADE |
| Foreign Key | — | `sender_id` → `profiles(id)` ON DELETE CASCADE |
| Check | `messages_content_not_empty` | `TRIM(content) <> ''` |

### Business Rules

- **Messages are immutable:** No editing or deleting messages for MVP.
- **Content must not be empty:** CHECK constraint enforces non-empty trimmed content.
- **Ordering:** Messages are always fetched ordered by `created_at ASC` (oldest first).
- **No pagination:** All messages for a match are fetched at once (acceptable for MVP).

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_messages_match_id` | `match_id` | Fetch messages for a conversation |
| `idx_messages_match_created` | `match_id, created_at` | Ordered fetch + last message lookup |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read messages for own matches | `SELECT` | `match_id IN (SELECT id FROM matches WHERE auth.uid() = user1_id OR auth.uid() = user2_id)` | Only read messages in your conversations |
| Users can insert messages to own matches as themselves | `INSERT` | `auth.uid() = sender_id AND match_id IN (SELECT id FROM matches WHERE auth.uid() = user1_id OR auth.uid() = user2_id)` | Only send as yourself to your matches |

### Realtime: **ENABLED**

Supabase Realtime must be enabled on the `messages` table to support live chat. The client subscribes to `INSERT` events filtered by `match_id`.

### UI Assumptions

- Frontend can rely on `created_at` ordering for display
- Frontend uses `sender_id` to determine sent vs received styling
- Frontend subscribes to Realtime `INSERT` events on `messages` filtered by `match_id` for live updates
- No message IDs are shown to users (internal only)

---

## Functions (RPC) — Phase 3

### `create_match(p_user1 UUID, p_user2 UUID)`

**Purpose:** Create a persistent match record with properly ordered user IDs

**Returns:** `UUID` (the match ID)

**Security:** `SECURITY DEFINER` (bypasses RLS to insert into matches table)

**Logic:**
```
1. Order user IDs: u1 = LEAST(p_user1, p_user2), u2 = GREATEST(p_user1, p_user2)
2. INSERT INTO matches (user1_id, user2_id) VALUES (u1, u2) ON CONFLICT DO NOTHING
3. If insert succeeded → return new match id
4. If conflict (already exists) → SELECT and return existing match id
```

**Usage (from client):**
```typescript
const { data: matchId } = await supabase
  .rpc('create_match', {
    p_user1: currentUserId,
    p_user2: otherUserId,
  });
```

---

### `mark_chat_read(p_match_id UUID, p_user_id UUID)`

**Purpose:** Update the last_read_at timestamp for a user in a match

**Returns:** `void`

**Security:** `SECURITY DEFINER` (bypasses RLS to update matches table)

**Logic:**
```
1. Check if p_user_id is user1_id or user2_id in the match
2. If user1 → UPDATE matches SET user1_last_read_at = NOW() WHERE id = p_match_id
3. If user2 → UPDATE matches SET user2_last_read_at = NOW() WHERE id = p_match_id
4. If neither → no-op (user not in match)
```

**Usage (from client):**
```typescript
await supabase.rpc('mark_chat_read', {
  p_match_id: matchId,
  p_user_id: currentUserId,
});
```

---

## Updated API Endpoints

### Database — Phase 3 Additions

| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('matches').select()` | matches | Fetch user's matches |
| `supabase.from('messages').select()` | messages | Fetch messages for a match |
| `supabase.from('messages').insert()` | messages | Send a message |
| `supabase.rpc('create_match')` | — | Create match on mutual swipe |
| `supabase.rpc('mark_chat_read')` | — | Update last read timestamp |

### Realtime — Phase 3

| Channel | Event | Filter | Purpose |
|---------|-------|--------|---------|
| `messages:{matchId}` | `INSERT` | `match_id=eq.{matchId}` | Live incoming messages in chat |

---

## Updated Data Flow Diagrams

### Match Creation Flow (Phase 3)
```
1. User B swipes right on User A
   ↓
2. INSERT swipes (swiper=B, swiped=A, direction='right')
   ↓
3. RPC check_match(B, A) → true (A already swiped right on B)
   ↓
4. RPC create_match(B, A) → orders as (LEAST, GREATEST) → inserts match row
   ↓
5. Returns matchId to client
   ↓
6. MatchModal shown with matchId, User A profile, User B profile
```

### Chat Flow (Phase 3)
```
1. User opens chat for match_id
   ↓
2. RPC mark_chat_read(match_id, user_id) → updates last_read_at
   ↓
3. SELECT messages WHERE match_id = X ORDER BY created_at ASC
   ↓
4. Subscribe to Realtime INSERT on messages WHERE match_id = X
   ↓
5. User types message and taps send
   ↓
6. INSERT messages (match_id, sender_id, content)
   ↓
7. Realtime delivers to other user's subscription
   ↓
8. On leave: unsubscribe from channel
```

### Unread Count Flow (Phase 3)
```
1. Matches tab gains focus
   ↓
2. For each match where user is user1 or user2:
   - Get user's last_read_at (user1_last_read_at or user2_last_read_at)
   - Count messages WHERE created_at > last_read_at AND sender_id != user
   ↓
3. Sum = total unread count → set as tab badge
```

---

## SQL Files — Phase 3

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |
| `supabase/003_matching_tables.sql` | matches, messages, create_match, mark_chat_read (Phase 3) | 📋 To be created |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql`
2. `002_discovery_tables.sql`
3. `003_matching_tables.sql`

---

## To Be Confirmed

| Item | Question | Impact |
|------|----------|--------|
| Message length limit | Should there be a max character count? | CHECK constraint on content length |
| Realtime connection limits | How many concurrent subscriptions does Supabase free tier support? | May need connection pooling |
| Match notification for first user | When User A swiped first and User B triggers the match, only User B sees the modal. Should User A be notified? | Would need push notifications (deferred) |

---

## Phase 3 Security Notes

1. **Matches use SECURITY DEFINER functions** — No direct INSERT by clients, prevents spoofed matches
2. **Messages RLS checks match membership** — Users can only read/write messages for their own matches
3. **No message editing or deletion** — Immutable messages prevent tampering
4. **Content validation** — CHECK constraint prevents empty messages at the database level
5. **Realtime filtered by match_id** — Users only subscribe to their own conversations

---
---

# Phase 4 Additions

**Added:** 2026-02-08

---

## Tables Overview (Updated)

| Table | RLS | Purpose | Phase |
|-------|-----|---------|-------|
| `profiles` | Enabled | User profile data | 1 |
| `work_intents` | Enabled | Daily work intentions for discovery | 2 |
| `swipes` | Enabled | Swipe history (right/left) | 2 |
| `matches` | Enabled | Persistent mutual matches | 3 |
| `messages` | Enabled | Chat messages between matched users | 3 |
| `sessions` | Enabled | Co-working session records with lifecycle status | **4** |
| `session_participants` | Enabled | Links users to sessions with role | **4** |
| `session_events` | Enabled | System events for session timeline | **4** |

---

## Table: `sessions`

**Purpose:** Stores co-working session records between matched users, tracking the full lifecycle from invitation to completion.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `match_id` | `UUID` | No | — | FK to `matches.id` |
| `initiated_by` | `UUID` | No | — | FK to `profiles.id` (who sent the invite) |
| `status` | `TEXT` | No | `'pending'` | One of: pending, active, declined, completed, cancelled |
| `session_date` | `DATE` | No | `CURRENT_DATE` | Date the session is for |
| `scheduled_date` | `DATE` | No | `CURRENT_DATE` | Planned coworking date |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When the invite was sent |
| `accepted_at` | `TIMESTAMPTZ` | Yes | `NULL` | When the invitee accepted |
| `completed_at` | `TIMESTAMPTZ` | Yes | `NULL` | When the session ended |
| `completed_ack` | `BOOLEAN` | Yes | `NULL` | True when both users locked in |
| `locked_by_initiator_at` | `TIMESTAMPTZ` | Yes | `NULL` | Initiator lock timestamp |
| `locked_by_invitee_at` | `TIMESTAMPTZ` | Yes | `NULL` | Invitee lock timestamp |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `sessions_pkey` | `id` |
| Foreign Key | — | `match_id` → `matches(id)` ON DELETE CASCADE |
| Foreign Key | — | `initiated_by` → `profiles(id)` ON DELETE CASCADE |
| Check | `sessions_status_check` | `status IN ('pending', 'active', 'declined', 'completed', 'cancelled')` |

### Business Rules

- **Multiple pending invites allowed:** No one-per-user constraint.
- **Status transitions:**
  - `pending` → `active` (via `respond_to_session` with 'accept')
  - `pending` → `declined` (via `respond_to_session` with 'decline')
  - `pending` → `cancelled` (via `cancel_session`, initiator only)
  - `active` → `completed` (when both users lock in)
  - `active` → `cancelled` (via `auto_cancel_sessions` after 24h)
- **Invalid transitions:** Any other status change is rejected by the RPC functions.
- **Scheduled date:** Provided at creation. Backfilled from `session_date` for older rows.
- **Auto-cancel:** Sessions with status='active' and accepted_at older than 24 hours are cancelled if not fully locked.
- **Lifecycle:** No reactivation. Once a session is completed, declined, or cancelled, it is final.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_sessions_match` | `match_id` | Find sessions for a match |
| `idx_sessions_status` | `status` | Filter by session status (for auto-complete query) |
| `idx_sessions_initiated_by` | `initiated_by` | Find sessions initiated by a user |
| `idx_sessions_scheduled_date` | `scheduled_date` | Filter by planned date |
| `idx_sessions_accepted_at` | `accepted_at` | Auto-cancel after 24h |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read sessions for own matches | `SELECT` | `match_id IN (SELECT id FROM matches WHERE auth.uid() = user1_id OR auth.uid() = user2_id)` | Only see sessions in your own matches |

**Note:** No INSERT/UPDATE/DELETE policies for direct client access. All mutations go through SECURITY DEFINER RPC functions.

### Realtime: **ENABLED**

Supabase Realtime must be enabled on the `sessions` table. The client subscribes to `UPDATE` events filtered by `id` to receive session status changes.
Realtime should also be enabled on `session_events` for system messages.

### UI Assumptions

- Frontend can determine the invitee by checking which user in the match is NOT `initiated_by`
- Frontend uses `status` field to determine which SessionRequestCard variant to render
- Frontend uses `created_at` to position session cards in the chat timeline
- `accepted_at` is used as the start time for lock-in eligibility
- Dual-lock UI uses lock timestamps to display each user's state

---

## Table: `session_participants`

**Purpose:** Links users to sessions with their role. Supports future expansion to group sessions (Phase 5+).

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `role` | `TEXT` | No | — | `'initiator'` or `'invitee'` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When this participant was added |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `session_participants_pkey` | `id` |
| Unique | `session_participants_session_user_key` | `(session_id, user_id)` |
| Foreign Key | — | `session_id` → `sessions(id)` ON DELETE CASCADE |
| Foreign Key | — | `user_id` → `profiles(id)` ON DELETE CASCADE |
| Check | `session_participants_role_check` | `role IN ('initiator', 'invitee')` |

### Business Rules

- **Two participants per session:** `create_session` inserts exactly two rows (initiator + invitee).
- **Roles are immutable:** Once set, role does not change.
- **Derived from match:** Both participants are determined from the `matches` table (user1_id and user2_id). The initiator is `initiated_by`, the other is the invitee.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_session_participants_session` | `session_id` | Find participants for a session |
| `idx_session_participants_user` | `user_id` | Find sessions a user is part of |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own session participations | `SELECT` | `auth.uid() = user_id` | Only see your own participations |

**Note:** All mutations go through SECURITY DEFINER RPC functions.

---

## Table: `session_events`

**Purpose:** System events associated with a session (e.g., acceptance message)

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `session_id` | `UUID` | No | — | FK to `sessions.id` |
| `event_type` | `TEXT` | No | — | Event type (e.g., `accepted`) |
| `message` | `TEXT` | No | — | Reserved for optional payload (empty for accepted) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own session events | `SELECT` | `EXISTS (SELECT 1 FROM session_participants sp WHERE sp.session_id = session_events.session_id AND sp.user_id = auth.uid())` | Only see events for your sessions |

### Realtime: **ENABLED**

Supabase Realtime must be enabled on `session_events`. Clients subscribe to INSERT events filtered by `session_id`.

---

## Functions (RPC) — Phase 4

### `create_session(p_match_id UUID, p_initiator_id UUID, p_scheduled_date DATE)`

**Purpose:** Create a new pending invite between matched users with a planned date.

**Returns:** `UUID` (the session ID) or raises an exception.

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. Verify p_initiator_id is user1_id or user2_id in the match
2. Determine the invitee (the other user in the match)
3. INSERT INTO sessions (match_id, initiated_by, status, session_date, scheduled_date)
4. INSERT two session_participants rows (initiator + invitee)
5. RETURN new session id
```

**Usage (from client):**
```typescript
const { data: sessionId, error } = await supabase
  .rpc('create_session', {
    p_match_id: matchId,
    p_initiator_id: currentUserId,
    p_scheduled_date: selectedDate,
  });
```

---

### `respond_to_session(p_session_id UUID, p_user_id UUID, p_response TEXT)`

**Purpose:** Accept or decline a pending session invitation.

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT session WHERE id = p_session_id AND status = 'pending'
2. If not found → RAISE EXCEPTION 'Session not found or not pending'
3. Verify p_user_id is NOT initiated_by (must be the invitee)
4. If p_response = 'accept':
   - UPDATE sessions SET status = 'active', accepted_at = NOW() WHERE id = p_session_id
   - INSERT INTO session_events (session_id, event_type, message) VALUES (p_session_id, 'accepted', '')
5. If p_response = 'decline':
   - UPDATE sessions SET status = 'declined' WHERE id = p_session_id
6. Otherwise → RAISE EXCEPTION 'Invalid response'
```

**Usage (from client):**
```typescript
await supabase.rpc('respond_to_session', {
  p_session_id: sessionId,
  p_user_id: currentUserId,
  p_response: 'accept', // or 'decline'
});
```

---

### `complete_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Manually end an active session.

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT session WHERE id = p_session_id AND status = 'active'
2. If not found → RAISE EXCEPTION 'Session not found or not active'
3. Verify p_user_id is a participant (via session_participants)
4. UPDATE sessions SET status = 'completed', completed_at = NOW() WHERE id = p_session_id
```

**Usage (from client):**
```typescript
await supabase.rpc('complete_session', {
  p_session_id: sessionId,
  p_user_id: currentUserId,
});
```

---

### `cancel_session(p_session_id UUID, p_user_id UUID)`

**Purpose:** Cancel a pending session (initiator only).

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT session WHERE id = p_session_id AND status = 'pending'
2. If not found → RAISE EXCEPTION 'Session not found or not pending'
3. Verify p_user_id = initiated_by (only initiator can cancel)
4. UPDATE sessions SET status = 'cancelled' WHERE id = p_session_id
```

**Usage (from client):**
```typescript
await supabase.rpc('cancel_session', {
  p_session_id: sessionId,
  p_user_id: currentUserId,
});
```

---

### `auto_cancel_sessions()`

**Purpose:** Cancel active sessions not fully locked after 24 hours.

**Returns:** `INTEGER` (number of sessions cancelled)

**Security:** `SECURITY DEFINER`

**Usage (from client):**
```typescript
await supabase.rpc('auto_cancel_sessions');
```

---

## Updated API Endpoints

### Database — Phase 4 Additions

| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('sessions').select()` | sessions | Fetch sessions for a match |
| `supabase.from('session_participants').select()` | session_participants | Fetch user's sessions |
| `supabase.rpc('create_session')` | — | Create a session invitation |
| `supabase.rpc('respond_to_session')` | — | Accept or decline a session |
| `supabase.rpc('complete_session')` | — | Manually end a session |
| `supabase.rpc('cancel_session')` | — | Cancel a pending session |
| `supabase.rpc('lock_in_session')` | — | Record user's lock-in |
| `supabase.rpc('auto_cancel_sessions')` | — | Auto-cancel stale sessions |

### Realtime — Phase 4

| Channel | Event | Filter | Purpose |
|---------|-------|--------|---------|
| `sessions` | UPDATE | `id=eq.<session_id>` | Session status updates |
| `session_events` | INSERT | `session_id=eq.<session_id>` | System messages |
| `sessions:{sessionId}` | `UPDATE` | `id=eq.{sessionId}` | Session status changes (accept, decline, complete) |

---

## Updated Data Flow Diagrams

### Session Invitation Flow (Phase 4)
```
1. User A taps "Start Session" in chat with User B
   ↓
2. RPC create_session(match_id, User A)
   ↓
3. Function checks: neither user has pending/active session
   ↓
4. INSERT sessions (match_id, initiated_by=A, status='pending')
   ↓
5. INSERT session_participants: (session, A, 'initiator'), (session, B, 'invitee')
   ↓
6. Return session id → client renders session card in chat
```

### Session Accept Flow (Phase 4)
```
1. User B opens chat → sees session request card (pending)
   ↓
2. User B taps "Accept"
   ↓
3. RPC respond_to_session(session_id, User B, 'accept')
   ↓
4. Function verifies: B is invitee, session is pending
   ↓
5. UPDATE sessions SET status='active', accepted_at=NOW()
   ↓
6. Realtime delivers update → card changes to "Session Active"
```

### Session Complete Flow (Phase 4)
```
1. User taps "End Session" on Active Session screen
   ↓
2. RPC complete_session(session_id, user_id)
   ↓
3. Function verifies: user is participant, session is active
   ↓
4. UPDATE sessions SET status='completed', completed_at=NOW()
   ↓
5. Navigate to Session Complete screen
   ↓
6. Realtime delivers update → other user's card changes to "Session Completed"
```

### Auto-Cancel Flow (Phase 4)
```
1. App starts, user is authenticated
   ↓
2. Call RPC auto_cancel_sessions()
   ↓
3. UPDATE all sessions WHERE status='active' AND accepted_at < now - 24h AND not fully locked
   ↓
4. Clear lock timestamps, set completed_ack=false
   ↓
5. Return count of cancelled sessions (logged, not shown to user)
```

---

## SQL Files — Phase 4

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |
| `supabase/003_matching_tables.sql` | matches, messages, create_match, mark_chat_read (Phase 3) | ✅ Committed |
| `supabase/004_sessions_tables.sql` | sessions, session_participants, all session RPCs (Phase 4) | 📋 To be created |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql`
2. `002_discovery_tables.sql`
3. `003_matching_tables.sql`
4. `004_sessions_tables.sql`

---

## To Be Confirmed

| Item | Question | Impact |
|------|----------|--------|
| Stale pending sessions | Should pending sessions from previous days auto-cancel, or remain pending? | Currently they remain pending. May want a cleanup RPC. |
| Session history | Should users be able to see all past sessions, or only the most recent per match? | Phase 4 only shows inline in chat. History screen deferred. |
| Multiple sessions per match per day | Can users start a new session after completing one with the same match in the same day? | Currently allowed (one-per-user check only covers pending/active). |

---

## Phase 4 Security Notes

1. **All session mutations via SECURITY DEFINER** — No direct INSERT/UPDATE by clients
2. **Multiple pending invites allowed** — `create_session` does not enforce a one-per-user constraint
3. **Role-based access** — Only invitee can accept/decline; only initiator can cancel
4. **Participant verification** — All RPCs verify the calling user is a session participant
5. **RLS restricts reads** — Users can only see sessions for their own matches
6. **Realtime filtered by session id** — Users only subscribe to their own sessions

---
---

# Phase 5 Additions

**Added:** 2026-02-15

---

## Tables Overview (Updated)

| Table | RLS | Purpose | Phase |
|-------|-----|---------|-------|
| `profiles` | Enabled | User profile data | 1 (**modified Phase 5: phone_number, tagline, currently_working_on, work, school, birthday, neighborhood, city**) |
| `work_intents` | Enabled | Daily work intentions for discovery | 2 |
| `swipes` | Enabled | Swipe history (right/left) | 2 |
| `matches` | Enabled | Persistent mutual matches | 3 |
| `messages` | Enabled | Chat messages between matched users | 3 |
| `sessions` | Enabled | Co-working session records with lifecycle status | 4 |
| `session_participants` | Enabled | Links users to sessions with role | 4 |
| `session_events` | Enabled | System events for session timeline | 4 |
| `friendships` | Enabled | Manual friend requests with accept/decline lifecycle | **5** |
| `profile_photos` | Enabled | User profile photos with position ordering | **5** |

---

## Modification to Existing Table: `profiles`

**Phase 5 adds eight columns. All existing columns, constraints, indexes, and policies remain unchanged.**

### New Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `phone_number` | `TEXT` | Yes | `NULL` | User's phone number (for friend search) |
| `tagline` | `TEXT` | Yes | `NULL` | Short bio/tagline (1-2 sentences) |
| `currently_working_on` | `TEXT` | Yes | `NULL` | Single-line casual description of current project |
| `work` | `TEXT` | Yes | `NULL` | Work context (company, role — low-pressure, not credentials) |
| `school` | `TEXT` | Yes | `NULL` | School context (optional, low-pressure) |
| `birthday` | `DATE` | Yes | `NULL` | User's date of birth (used to calculate age) |
| `neighborhood` | `TEXT` | Yes | `NULL` | Neighborhood or area (e.g. "East Village") |
| `city` | `TEXT` | Yes | `NULL` | City (e.g. "New York") |

### Business Rules (phone_number)

- **Not unique:** Multiple users could theoretically enter the same number. No uniqueness constraint for MVP.
- **No format validation:** Stored as entered. No normalization or formatting at the database level.
- **Max length:** Not enforced at database level. UI limits input to 20 characters.
- **Searchable:** Used as a search target in Add Friend flow (ILIKE query).
- **Optional:** Users are not required to set a phone number.

### Business Rules (profile text fields)

- **All optional:** Users are not required to fill in tagline, currently_working_on, work, or school.
- **No length limits at database level:** UI provides reasonable input constraints.
- **Publicly readable:** Existing `SELECT` policy (`true`) means all authenticated users can see these fields.
- **Owner-editable:** Existing `UPDATE` policy (`auth.uid() = id`) restricts editing to the profile owner.

### Business Rules (location & birthday)

- **All optional:** Users are not required to fill in birthday, neighborhood, or city.
- **Birthday stored as DATE:** Client calculates age from birthday. Not displayed directly.
- **No geocoding:** Neighborhood and city are free-text. No location validation or autocomplete at database level.
- **Publicly readable:** Same as other profile fields (public SELECT policy).

### Updated RLS Notes

- The existing `SELECT` policy on profiles (`true` — public read) means all new columns are readable by all authenticated users. This is acceptable for MVP.
- The existing `UPDATE` policy (`auth.uid() = id`) means users can only edit their own profile fields.

### Migration

```sql
ALTER TABLE profiles ADD COLUMN phone_number TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN tagline TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN currently_working_on TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN work TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN school TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN birthday DATE DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN neighborhood TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN city TEXT DEFAULT NULL;
```

---

## Table: `friendships`

**Purpose:** Stores manual friend requests between users, tracking the request/accept/decline lifecycle. One row per directional request (requester → recipient).

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `requester_id` | `UUID` | No | — | FK to `profiles.id` (who sent the request) |
| `recipient_id` | `UUID` | No | — | FK to `profiles.id` (who received the request) |
| `status` | `TEXT` | No | `'pending'` | One of: `pending`, `accepted`, `declined` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When the request was sent |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last status change |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `friendships_pkey` | `id` |
| Unique | `friendships_requester_recipient_key` | `(requester_id, recipient_id)` |
| Check | `friendships_no_self_request` | `requester_id <> recipient_id` |
| Check | `friendships_status_check` | `status IN ('pending', 'accepted', 'declined')` |
| Foreign Key | — | `requester_id` → `profiles(id)` ON DELETE CASCADE |
| Foreign Key | — | `recipient_id` → `profiles(id)` ON DELETE CASCADE |

### Business Rules

- **One request per direction:** Unique constraint on `(requester_id, recipient_id)` prevents duplicate requests from A to B.
- **Mutual request handling:** If A requests B and a pending request from B to A already exists, the `send_friend_request` RPC auto-accepts the existing B→A request (sets it to 'accepted') and creates a match. No A→B row is created in this case.
- **No re-request after decline:** Once declined, the requester cannot send a new request to the same recipient. The `send_friend_request` RPC returns an error.
- **Status transitions:**
  - `pending` → `accepted` (via `respond_to_friend_request` with 'accept')
  - `pending` → `declined` (via `respond_to_friend_request` with 'decline')
- **Invalid transitions:** No other status changes are allowed.
- **Match creation on accept:** When a friendship is accepted, a `matches` row is auto-created via `create_match` (idempotent — if they already matched via swiping, this is a no-op). This enables the existing chat infrastructure for manual friends.
- **Lifecycle:** Friendships are permanent once accepted for MVP. No unfriend or block.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_friendships_requester` | `requester_id` | Find requests sent by a user |
| `idx_friendships_recipient` | `recipient_id` | Find requests received by a user |
| `idx_friendships_status` | `status` | Filter by pending/accepted |
| `idx_friendships_recipient_status` | `recipient_id, status` | Efficient pending count query |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Users can read own friendships | `SELECT` | `auth.uid() = requester_id OR auth.uid() = recipient_id` | Only see friendships you are part of |

**Note:** No INSERT/UPDATE/DELETE policies for direct client access. All mutations go through SECURITY DEFINER RPC functions.

### Realtime: **ENABLED**

Supabase Realtime should be enabled on the `friendships` table. Not actively subscribed to in Phase 5 (polling on screen focus), but enabled for future real-time notifications.

### UI Assumptions

- Frontend uses `requester_id` vs `recipient_id` to determine who sent the request
- Frontend uses `status` to determine which action buttons to show
- Frontend can join `friendships` with `profiles` on `requester_id` to get the requester's name/photo for pending requests
- The `matches` table is the source of truth for the unified friends list (all accepted friends have a match row)
- The `friendships` table is only needed for pending/declined request queries and determining whether a friendship was manual vs swipe-based

---

## Table: `profile_photos`

**Purpose:** Stores user profile photos with position-based ordering. Position 0 is the primary photo (synced to `profiles.photo_url`).

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `UUID` | No | — | FK to `profiles.id` |
| `photo_url` | `TEXT` | No | — | Public URL of the uploaded photo |
| `position` | `INTEGER` | No | — | Display order (0-4, 0 is primary) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | When the photo was uploaded |

### Constraints

| Type | Name | Definition |
|------|------|------------|
| Primary Key | `profile_photos_pkey` | `id` |
| Unique | `profile_photos_user_position_key` | `(user_id, position)` |
| Check | `profile_photos_position_check` | `position >= 0 AND position <= 4` |
| Foreign Key | — | `user_id` → `profiles(id)` ON DELETE CASCADE |

### Business Rules

- **Position-based ordering:** Photos are ordered by position (0-4). Position 0 is the primary/lead photo.
- **Max 5 photos:** Positions 0 through 4. The CHECK constraint prevents positions outside this range.
- **One photo per position:** The UNIQUE constraint on `(user_id, position)` prevents duplicates.
- **Primary sync:** When position 0 is uploaded, `profiles.photo_url` is updated to match. This denormalized field enables fast reads on Discover cards and match lists.
- **Promotion on delete:** When the primary photo (position 0) is deleted, the next photo is promoted to position 0 and `profiles.photo_url` is updated. This is handled client-side in `photoService.ts`.
- **Immediate upload:** Photos are uploaded immediately when selected (not batched with a save action). This gives users instant visual feedback.
- **Lifecycle:** Photos are permanent until explicitly deleted by the owner.

### Indexes

| Name | Columns | Purpose |
|------|---------|---------|
| `idx_profile_photos_user` | `user_id` | Find all photos for a user |
| `idx_profile_photos_user_position` | `user_id, position` | Ordered photo lookup |

### RLS: **ENABLED**

### Policies

| Policy Name | Operation | Rule | Reason |
|-------------|-----------|------|--------|
| Anyone can view profile photos | `SELECT` | `true` | Photos are public (like profile data) |
| Users can insert own photos | `INSERT` | `auth.uid() = user_id` | Only upload your own photos |
| Users can update own photos | `UPDATE` | `auth.uid() = user_id` | Only modify your own photos |
| Users can delete own photos | `DELETE` | `auth.uid() = user_id` | Only remove your own photos |

### UI Assumptions

- Frontend uses `position` to determine display order (0 = lead photo, 1-4 = thumbnails)
- Frontend syncs `profiles.photo_url` with position 0 photo URL after upload/delete
- Frontend handles photo promotion when primary is deleted (reorder remaining photos)
- Photo URLs are public Supabase Storage URLs (no authentication required to load images)

---

## Storage Bucket: `avatars` (Phase 5)

**Purpose:** Stores user profile photo files uploaded via `expo-image-picker`.

### Configuration

| Setting | Value |
|---------|-------|
| Bucket Name | `avatars` |
| Public | Yes |
| File Size Limit | 5MB |
| Allowed MIME Types | `image/jpeg`, `image/png`, `image/webp` |

### File Path Pattern

```
avatars/{userId}/{position}.jpg
```

Example: `avatars/abc-123-def/0.jpg` (primary photo for user abc-123-def)

### Storage Policies

```sql
-- Anyone can view avatar images (public bucket)
CREATE POLICY "Avatars are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Business Rules

- **Folder per user:** Each user's photos are stored in `avatars/{userId}/` directory. Storage RLS uses `foldername` to verify ownership.
- **Position-based naming:** Files are named by position (`0.jpg`, `1.jpg`, etc.). When uploading a new photo to a position, the old file is overwritten.
- **Public URLs:** Since the bucket is public, photo URLs are accessible without authentication tokens. The URL format is `{SUPABASE_URL}/storage/v1/object/public/avatars/{userId}/{position}.jpg`.
- **Cleanup on delete:** When a photo is deleted from the DB, the corresponding file should also be removed from storage. This is handled client-side in `photoService.ts`.

---

## Functions (RPC) — Phase 5

### `send_friend_request(p_requester_id UUID, p_recipient_id UUID)`

**Purpose:** Send a friend request from one user to another. Handles mutual pending requests by auto-accepting.

**Returns:** `UUID` (the friendship id) or raises an exception.

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. Check p_requester_id <> p_recipient_id → RAISE 'Cannot send request to yourself'
2. Check if (requester=p_requester_id, recipient=p_recipient_id) row exists:
   a. If status = 'pending' → RAISE 'Friend request already sent'
   b. If status = 'accepted' → RAISE 'Already friends'
   c. If status = 'declined' → RAISE 'Cannot send request to this user'
3. Check if (requester=p_recipient_id, recipient=p_requester_id) row exists:
   a. If status = 'pending' → AUTO-ACCEPT:
      - UPDATE that row SET status = 'accepted', updated_at = NOW()
      - CALL create_match(p_requester_id, p_recipient_id)
      - RETURN that row's id
   b. If status = 'accepted' → RAISE 'Already friends'
   c. If status = 'declined' → RAISE 'Cannot send request to this user'
4. INSERT INTO friendships (requester_id, recipient_id, status) VALUES (p_requester_id, p_recipient_id, 'pending')
5. RETURN new friendship id
```

**Usage (from client):**
```typescript
const { data: friendshipId, error } = await supabase
  .rpc('send_friend_request', {
    p_requester_id: currentUserId,
    p_recipient_id: targetUserId,
  });
```

---

### `respond_to_friend_request(p_friendship_id UUID, p_user_id UUID, p_response TEXT)`

**Purpose:** Accept or decline a pending friend request. On accept, creates a match row to enable chat.

**Returns:** `void`

**Security:** `SECURITY DEFINER`

**Logic:**
```
1. SELECT friendship WHERE id = p_friendship_id AND status = 'pending'
2. If not found → RAISE 'Friend request not found or not pending'
3. Verify p_user_id = recipient_id → RAISE 'Only the recipient can respond'
4. If p_response = 'accept':
   a. UPDATE friendships SET status = 'accepted', updated_at = NOW() WHERE id = p_friendship_id
   b. CALL create_match(requester_id, recipient_id) — idempotent, creates match if not exists
5. If p_response = 'decline':
   a. UPDATE friendships SET status = 'declined', updated_at = NOW() WHERE id = p_friendship_id
6. Otherwise → RAISE 'Invalid response (must be accept or decline)'
```

**Usage (from client):**
```typescript
await supabase.rpc('respond_to_friend_request', {
  p_friendship_id: friendshipId,
  p_user_id: currentUserId,
  p_response: 'accept', // or 'decline'
});
```

---

### `get_pending_requests_count(p_user_id UUID)`

**Purpose:** Count pending incoming friend requests for badge display.

**Returns:** `INTEGER`

**Security:** `SECURITY DEFINER`

**Logic:**
```
SELECT COUNT(*) FROM friendships
WHERE recipient_id = p_user_id AND status = 'pending'
```

**Usage (from client):**
```typescript
const { data: count } = await supabase
  .rpc('get_pending_requests_count', {
    p_user_id: currentUserId,
  });
```

---

## Updated API Endpoints

### Database — Phase 5 Additions

| Method | Table | Purpose |
|--------|-------|---------|
| `supabase.from('profiles').update({ phone_number })` | profiles | Save phone number |
| `supabase.from('profiles').select().or(...)` | profiles | Search users by username/email/phone |
| `supabase.from('friendships').select()` | friendships | Fetch pending requests |
| `supabase.from('matches').select()` | matches | Fetch unified friends list (reuses existing) |
| `supabase.from('work_intents').select()` | work_intents | Check friends' availability (reuses existing) |
| `supabase.rpc('send_friend_request')` | — | Send a friend request |
| `supabase.rpc('respond_to_friend_request')` | — | Accept or decline a request |
| `supabase.rpc('get_pending_requests_count')` | — | Badge count for Profile tab |
| `supabase.from('profile_photos').select()` | profile_photos | Fetch user's photos |
| `supabase.from('profile_photos').upsert()` | profile_photos | Insert/update photo record |
| `supabase.from('profile_photos').delete()` | profile_photos | Remove photo record |
| `supabase.from('profiles').update()` | profiles | Update profile text fields (tagline, birthday, neighborhood, city, etc.) |
| `supabase.storage.from('avatars').upload()` | avatars bucket | Upload photo file |
| `supabase.storage.from('avatars').remove()` | avatars bucket | Delete photo file |
| `supabase.storage.from('avatars').getPublicUrl()` | avatars bucket | Get public URL for uploaded photo |

---

## Updated Data Flow Diagrams

### Friend Request Flow (Phase 5)
```
1. User A opens Add Friend screen, types query
   ↓
2. SELECT profiles WHERE username ILIKE '%query%' OR email ILIKE '%query%' OR phone_number ILIKE '%query%'
   AND id != User A
   LIMIT 20
   ↓
3. Client fetches existing matches + friendships for result user IDs
   ↓
4. Client determines relationship status per result (none / pending_sent / pending_received / friends / declined)
   ↓
5. User A taps "Add" on User B
   ↓
6. RPC send_friend_request(A, B)
   ↓
7. Function checks: no existing friendship in either direction
   ↓
8. INSERT friendships (requester=A, recipient=B, status='pending')
   ↓
9. Return friendship id → client updates button to "Requested"
```

### Friend Accept Flow (Phase 5)
```
1. User B opens Friends screen
   ↓
2. SELECT friendships WHERE recipient_id = B AND status = 'pending'
   JOIN profiles ON requester_id
   ↓
3. Shows pending requests section
   ↓
4. User B taps "Accept" on User A's request
   ↓
5. RPC respond_to_friend_request(friendship_id, B, 'accept')
   ↓
6. UPDATE friendships SET status = 'accepted'
   ↓
7. CALL create_match(A, B) → orders IDs, inserts match row (idempotent)
   ↓
8. Client moves card from pending to friends list
   ↓
9. Both users can now chat via the match row
```

### Unified Friends List Flow (Phase 5)
```
1. User opens Friends screen
   ↓
2. SELECT matches WHERE user1_id = me OR user2_id = me
   JOIN profiles ON other_user_id
   ↓
3. For each friend: SELECT work_intents WHERE user_id = friend AND intent_date = today
   ↓
4. Merge into FriendListItem[] with availability flag
   ↓
5. Sort by name alphabetically
   ↓
6. Display in friends list with green dot for available friends
```

### Pending Count Badge Flow (Phase 5)
```
1. Profile tab gains focus
   ↓
2. RPC get_pending_requests_count(user_id)
   ↓
3. Returns integer → set as tabBarBadge on Profile tab
   ↓
4. After accepting/declining requests → re-fetch count on next focus
```

---

### Photo Upload Flow (Phase 5 — Profile Redesign)
```
1. User taps empty slot in PhotoSlots (Edit Profile or Onboarding)
   ↓
2. expo-image-picker launches (library, square crop, 0.8 quality)
   ↓
3. User selects image → returns local URI
   ↓
4. Upload to Supabase Storage: avatars/{userId}/{position}.jpg
   ↓
5. Get public URL from storage
   ↓
6. UPSERT profile_photos (user_id, photo_url, position)
   ↓
7. If position = 0: UPDATE profiles SET photo_url = public_url WHERE id = userId
   ↓
8. UI updates immediately (photo appears in slot)
```

### Profile Edit Flow (Phase 5 — Profile Redesign)
```
1. User opens Edit Profile screen
   ↓
2. SELECT profiles + profile_photos for current user
   ↓
3. User modifies text fields (name, tagline, currently_working_on, work, school, work_type)
   ↓
4. User taps Save
   ↓
5. UPDATE profiles SET tagline=?, currently_working_on=?, work=?, school=?, name=?, work_type=?, birthday=?, neighborhood=?, city=? WHERE id = userId
   ↓
6. refreshProfile() → AuthContext updates
   ↓
7. goBack() → ProfileScreen refreshes via useFocusEffect
```

---

## SQL Files — Phase 5

| File | Purpose | Status |
|------|---------|--------|
| `supabase/001_profiles_table.sql` | Profiles table + trigger (Phase 1) | ✅ Committed |
| `supabase/002_discovery_tables.sql` | work_intents, swipes, check_match (Phase 2) | ✅ Committed |
| `supabase/003_matching_tables.sql` | matches, messages, create_match, mark_chat_read (Phase 3) | ✅ Committed |
| `supabase/004_sessions_tables.sql` | sessions, session_participants, session RPCs (Phase 4) | ✅ Committed |
| `supabase/005_sessions_revision.sql` | Session revision: scheduled_date, dual-lock, auto-cancel (Phase 4) | ✅ Committed |
| `supabase/006_friendships_table.sql` | friendships table, phone_number column, friend RPCs (Phase 5) | 📋 To be created |
| `supabase/007_profile_photos.sql` | profile_photos table, profile columns, avatars bucket, storage policies (Phase 5) | 📋 To be created |

### Run Order

Execute in Supabase SQL Editor in this order:
1. `001_profiles_table.sql`
2. `002_discovery_tables.sql`
3. `003_matching_tables.sql`
4. `004_sessions_tables.sql`
5. `005_sessions_revision.sql`
6. `006_friendships_table.sql`
7. `007_profile_photos.sql`

---

## To Be Confirmed

| Item | Question | Impact |
|------|----------|--------|
| Phone number privacy | Should phone_number be visible to all authenticated users via the public SELECT policy on profiles? | Currently yes (needed for search). May want a dedicated search RPC that doesn't expose full phone numbers in results. |
| Phone number uniqueness | Should phone numbers be unique across users? | Currently no. Could cause confusion if two users enter the same number. |
| Re-request after decline | Should a requester be able to send a new request after being declined? | Currently no. May want a cooldown or allow after X days. |
| Friendship deletion | Should users be able to unfriend someone? | Not implemented in Phase 5. Would need a new RPC and UI. |
| Username editability | Auto-generated usernames (`user_abc123...`) are not user-friendly for sharing. Should users be able to set custom usernames? | Not in Phase 5 scope. Would need edit profile UI + uniqueness validation. |

---

## Phase 5 Security Notes

1. **All friendship mutations via SECURITY DEFINER** — No direct INSERT/UPDATE by clients on friendships table
2. **Recipient-only response** — `respond_to_friend_request` verifies caller is the recipient, not the requester
3. **No re-request after decline** — Prevents harassment; declined is permanent for MVP
4. **Phone number publicly readable** — Acceptable for MVP; all profile data is public read. Consider restricting in future.
5. **Search rate limiting** — No server-side rate limiting on profile search. Client debounces at 300ms. Consider adding for production.
6. **Match creation is idempotent** — `create_match` uses ON CONFLICT DO NOTHING, safe to call multiple times for same pair
7. **RLS restricts friendship reads** — Users can only see friendships where they are requester or recipient
8. **Profile photos publicly readable** — `profile_photos` table has public SELECT policy (same as `profiles`). Photos stored in public storage bucket.
9. **Storage folder ownership** — Storage RLS restricts writes to `avatars/{userId}/` folder. Users cannot modify other users' photos.
10. **Photo URLs are permanent** — Public storage URLs do not expire. Deleted photos should have their files removed from storage to prevent stale URLs.

---

# Phase 6 Additions

**Added:** 2026-02-27

---

## No New Tables or RPCs

Phase 6 introduces no schema changes. It reads exclusively from existing tables established in earlier phases.

---

## Tables Read by Phase 6

| Table | Phase Introduced | Phase 6 Usage |
|-------|-----------------|---------------|
| `profiles` | Phase 1 | Full profile fetch via `getFullProfile(userId)` |
| `profile_photos` | Phase 5 | Photo array fetch via `getFullProfile(userId)` |
| `work_intents` | Phase 2 | Today's intent fetch via `getTodayIntent(userId)` |

---

## Service Functions Used (No Changes)

### `getFullProfile(userId: string)` — `src/services/profileService.ts`

**Used by:** `FriendsScreen.handleOpenProfile`

Queries:
1. `profiles` — `SELECT * WHERE id = userId`
2. `profile_photos` — `SELECT * WHERE user_id = userId ORDER BY position ASC`

Returns: `ServiceResult<{ profile: Profile | null; photos: ProfilePhoto[] }>`

No changes to this function. Phase 6 calls it from a new location (`FriendsScreen`).

---

### `getTodayIntent(userId: string)` — `src/services/discoveryService.ts`

**Used by:** `FriendsScreen.handleOpenProfile`

Queries:
1. `work_intents` — `SELECT * WHERE user_id = userId AND intent_date = today`

Returns: `WorkIntent | null`

No changes to this function. Phase 6 calls it from a new location (`FriendsScreen`).

---

## UI Assumptions for Phase 6

The frontend is allowed to rely on the following guarantees from the data layer:

- `getFullProfile` always returns an object (never throws); `data.profile` may be null if the user has been deleted
- `getTodayIntent` always returns either a `WorkIntent` or `null`; never throws on a missing intent (`PGRST116` error is swallowed)
- `profile_photos` rows are ordered by `position ASC` — position 0 is always the primary photo
- `profiles.photo_url` reflects the primary photo URL and serves as fallback when `profile_photos` is empty

---

## To Be Confirmed

| Item | Status |
|------|--------|
| `profiles` RLS for public SELECT | Confirmed public READ in Phase 1 — no change needed |
| `profile_photos` RLS for public SELECT | Confirmed public READ in Phase 5 — no change needed |

---

---

# Phase 7 — Group Chat

---

## Tables Overview (Phase 7 Additions)

| Table | RLS | Purpose |
|-------|-----|---------|
| `group_chats` | Enabled | Group conversation metadata (name, creator) |
| `group_members` | Enabled | Membership roster with per-member read tracking |
| `group_messages` | Enabled | Messages sent in a group chat |
| `group_sessions` | Enabled | Co-work session proposals for groups |
| `group_session_rsvps` | Enabled | Per-member RSVP responses to group sessions |

---

## Table: `group_chats`

**Purpose:** Stores group chat metadata. One row per group conversation.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `name` | `TEXT` | No | — | Group display name |
| `created_by` | `UUID` | No | — | FK to `profiles.id` — creator (display only, no special role) |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Row creation time |
| `updated_at` | `TIMESTAMPTZ` | No | `NOW()` | Last update time (name changes) |

### Indexes
| Name | Columns | Type |
|------|---------|------|
| `group_chats_pkey` | `id` | Primary Key |

### RLS: ENABLED

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Members can read own group chats | `SELECT` | `id IN (SELECT group_chat_id FROM group_members WHERE user_id = auth.uid())` |
| No direct INSERT | — | All mutations via `create_group_chat` RPC |

### Business Rules
- `name` must be non-empty
- `created_by` has no special permissions at DB level (equal members)
- `updated_at` updated whenever name changes

---

## Table: `group_members`

**Purpose:** Links users to group chats they belong to. Controls access and tracks read state.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `group_chat_id` | `UUID` | No | — | FK to `group_chats.id` ON DELETE CASCADE |
| `user_id` | `UUID` | No | — | FK to `profiles.id` ON DELETE CASCADE |
| `last_read_at` | `TIMESTAMPTZ` | No | `NOW()` | Per-member read position |
| `joined_at` | `TIMESTAMPTZ` | No | `NOW()` | When user joined |

### Constraints
| Name | Definition |
|------|------------|
| `group_members_unique_pair` | `UNIQUE(group_chat_id, user_id)` |

### Indexes
| Name | Columns |
|------|---------|
| `idx_group_members_group_chat_id` | `group_chat_id` |
| `idx_group_members_user_id` | `user_id` |

### RLS: ENABLED

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Members can read own membership rows | `SELECT` | `user_id = auth.uid()` |
| No direct INSERT/DELETE | — | All mutations via SECURITY DEFINER RPCs |

### Business Rules
- Unread count for a member = `COUNT(group_messages WHERE created_at > last_read_at AND sender_id != member.user_id)`
- `mark_group_read` RPC updates `last_read_at = NOW()` for the calling user in the specified group

---

## Table: `group_messages`

**Purpose:** Individual messages in a group chat.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `group_chat_id` | `UUID` | No | — | FK to `group_chats.id` ON DELETE CASCADE |
| `sender_id` | `UUID` | No | — | FK to `profiles.id` ON DELETE CASCADE |
| `content` | `TEXT` | No | — | Message content — CHECK: `TRIM(content) <> ''` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Send time |

### Indexes
| Name | Columns |
|------|---------|
| `idx_group_messages_group_chat_id` | `group_chat_id` |
| `idx_group_messages_created_at` | `(group_chat_id, created_at)` — for ordered fetch |

### RLS: ENABLED

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Members can read group messages | `SELECT` | `group_chat_id IN (SELECT group_chat_id FROM group_members WHERE user_id = auth.uid())` |
| Members can insert messages | `INSERT` | `auth.uid() = sender_id AND group_chat_id IN (SELECT group_chat_id FROM group_members WHERE user_id = auth.uid())` |

### Realtime
- **ENABLED** — `INSERT` events subscribed to via Supabase `postgres_changes`, filtered by `group_chat_id`

### Business Rules
- Messages are **immutable** — no editing or deletion
- Fetched in `created_at ASC` order (oldest first), rendered newest-at-bottom via inverted FlatList
- No pagination for MVP (all messages fetched on load)

---

## Table: `group_sessions`

**Purpose:** Co-work session proposals within a group chat. Any member can propose a date; others RSVP.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `group_chat_id` | `UUID` | No | — | FK to `group_chats.id` ON DELETE CASCADE |
| `proposed_by` | `UUID` | No | — | FK to `profiles.id` — who proposed it |
| `scheduled_date` | `DATE` | No | — | The proposed co-work date |
| `status` | `TEXT` | No | `'proposed'` | CHECK: `status IN ('proposed','completed','cancelled')` |
| `created_at` | `TIMESTAMPTZ` | No | `NOW()` | Proposal time |

### Indexes
| Name | Columns |
|------|---------|
| `idx_group_sessions_group_chat_id` | `group_chat_id` |
| `idx_group_sessions_status` | `status` |

### RLS: ENABLED

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Members can read group sessions | `SELECT` | `group_chat_id IN (SELECT group_chat_id FROM group_members WHERE user_id = auth.uid())` |
| No direct INSERT/UPDATE | — | All mutations via RPCs |

### Realtime
- **ENABLED** — `UPDATE` events subscribed to via Supabase `postgres_changes`, filtered by `id`

### Business Rules
- Any group member can propose a session — no restriction on `proposed_by`
- Only the proposer (`proposed_by = auth.uid()`) can cancel (enforced in RPC)
- `completed` status set manually by any member (or future automation) — not auto-triggered
- A group can have multiple sessions in `proposed` status simultaneously (no limit for MVP)

---

## Table: `group_session_rsvps`

**Purpose:** Per-member RSVP response to a group session proposal.

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `UUID` | No | `gen_random_uuid()` | Primary key |
| `group_session_id` | `UUID` | No | — | FK to `group_sessions.id` ON DELETE CASCADE |
| `user_id` | `UUID` | No | — | FK to `profiles.id` ON DELETE CASCADE |
| `response` | `TEXT` | No | — | CHECK: `response IN ('yes','no')` |
| `responded_at` | `TIMESTAMPTZ` | No | `NOW()` | Response time |

### Constraints
| Name | Definition |
|------|------------|
| `group_session_rsvps_unique` | `UNIQUE(group_session_id, user_id)` — one response per member per session |

### Indexes
| Name | Columns |
|------|---------|
| `idx_group_session_rsvps_session_id` | `group_session_id` |

### RLS: ENABLED

### Policies

| Policy Name | Operation | Rule |
|-------------|-----------|------|
| Members can read RSVPs for their group sessions | `SELECT` | `group_session_id IN (SELECT id FROM group_sessions WHERE group_chat_id IN (SELECT group_chat_id FROM group_members WHERE user_id = auth.uid()))` |
| No direct INSERT/UPDATE | — | All mutations via `rsvp_group_session` RPC (handles upsert) |

### Business Rules
- A member can change their RSVP (RPC upserts on `UNIQUE` constraint)
- RSVP counts are derived client-side from the `rsvps` array fetched per session
- Pending count = group member count minus responded count

---

## RPCs (Phase 7)

All Phase 7 RPCs are `SECURITY DEFINER` and validate membership before performing mutations.

---

### `create_group_chat(p_name TEXT, p_creator_id UUID, p_member_ids UUID[]) → UUID`

**Purpose:** Atomically create a new group chat and add all initial members.

**Logic:**
1. Validate `p_name` is non-empty
2. Validate `auth.uid() = p_creator_id`
3. `INSERT INTO group_chats (name, created_by)` → get `group_chat_id`
4. `INSERT INTO group_members (group_chat_id, user_id)` for creator + each `p_member_ids` element
5. Return `group_chat_id`

**Returns:** `UUID` — the new group chat ID

---

### `fetch_group_chat_previews(p_user_id UUID) → TABLE`

**Purpose:** Return all group chats for a user with preview data for the chat list.

**Returns:**
```
group_chat_id UUID
name TEXT
member_count INTEGER
last_message TEXT
last_message_at TIMESTAMPTZ
last_sender_name TEXT
unread_count INTEGER
```

**Logic:**
- Finds all `group_members` rows for `p_user_id`
- For each group: counts members, finds latest `group_messages` row, counts unread messages (`created_at > group_members.last_read_at AND sender_id != p_user_id`)
- Returns null-safe (groups with no messages return `last_message = null`, `last_message_at = null`)

---

### `add_group_members(p_group_chat_id UUID, p_user_ids UUID[]) → VOID`

**Purpose:** Add new members to an existing group chat.

**Validation:**
- `auth.uid()` must be an existing member of `p_group_chat_id`
- Silently skips user IDs already in `group_members` (idempotent)

---

### `leave_group(p_group_chat_id UUID, p_user_id UUID) → VOID`

**Purpose:** Remove a user from a group chat.

**Validation:**
- `auth.uid() = p_user_id`
- `p_user_id` must be a member of `p_group_chat_id`

**Behavior:**
- Deletes the `group_members` row for `(p_group_chat_id, p_user_id)`
- Group chat record is NOT deleted even if no members remain (soft leave)

---

### `rsvp_group_session(p_group_session_id UUID, p_user_id UUID, p_response TEXT) → VOID`

**Purpose:** Record or update a user's RSVP to a group session proposal.

**Validation:**
- `auth.uid() = p_user_id`
- `p_response IN ('yes', 'no')`
- User must be a member of the group the session belongs to

**Logic:**
- `INSERT INTO group_session_rsvps ... ON CONFLICT (group_session_id, user_id) DO UPDATE SET response = p_response, responded_at = NOW()`

---

### `mark_group_read(p_group_chat_id UUID, p_user_id UUID) → VOID`

**Purpose:** Update `last_read_at` for a member to clear their unread count.

**Validation:**
- `auth.uid() = p_user_id`
- User must be a member of `p_group_chat_id`

**Logic:**
- `UPDATE group_members SET last_read_at = NOW() WHERE group_chat_id = p_group_chat_id AND user_id = p_user_id`

---

## Service Functions (Phase 7)

### `groupChatsService.ts` — `src/services/groupChatsService.ts`

All functions use the `supabase` client from `lib/supabase.ts`.

| Function | Returns | Notes |
|----------|---------|-------|
| `fetchGroupChats(userId)` | `GroupChatPreview[]` | Calls `fetch_group_chat_previews` RPC |
| `createGroupChat(name, creatorId, memberIds[])` | `string \| null` | Calls `create_group_chat` RPC; returns groupChatId |
| `fetchGroupMessages(groupChatId)` | `GroupMessage[]` | `created_at ASC` |
| `fetchGroupMembers(groupChatId)` | `GroupMember[]` | All members of a group |
| `fetchGroupSessions(groupChatId)` | `GroupSession[]` | All sessions for a group |
| `sendGroupMessage(groupChatId, senderId, content)` | `GroupMessage \| null` | Direct `INSERT` with RLS |
| `proposeGroupSession(groupChatId, proposedBy, scheduledDate)` | `GroupSession \| null` | Direct `INSERT` |
| `rsvpGroupSession(groupSessionId, userId, response)` | `boolean` | Calls `rsvp_group_session` RPC |
| `cancelGroupSession(groupSessionId, userId)` | `boolean` | UPDATE status='cancelled'; validates proposer |
| `addGroupMembers(groupChatId, userIds[])` | `boolean` | Calls `add_group_members` RPC |
| `leaveGroup(groupChatId, userId)` | `boolean` | Calls `leave_group` RPC |
| `renameGroup(groupChatId, newName)` | `boolean` | Direct `UPDATE` on `group_chats` (RLS allows member to update) |
| `markGroupRead(groupChatId, userId)` | `void` | Calls `mark_group_read` RPC |
| `subscribeToGroupMessages(groupChatId, callback)` | `() => void` | Realtime INSERT on `group_messages` filtered by `group_chat_id` |
| `subscribeToGroupSessions(groupChatId, callback)` | `() => void` | Realtime UPDATE on `group_sessions` filtered by `id` |

---

## UI Assumptions for Phase 7

The frontend is allowed to rely on the following guarantees from the data layer:

- `fetch_group_chat_previews` always returns an array (empty if user has no groups); never throws
- `create_group_chat` atomically inserts group + all members; either all succeed or none do
- `group_members.last_read_at` is always non-null (defaults to `NOW()` on insert)
- `group_messages` are immutable — no UPDATE or DELETE via API
- `rsvp_group_session` is idempotent — safe to call multiple times (upserts)
- `leave_group` is idempotent — calling for a non-member is a no-op (or returns silently)
- `group_session_rsvps` for a session can be fetched alongside the session; counts are derived client-side
- `renameGroup` is allowed for any member (no admin check) — RLS allows any member to UPDATE `group_chats.name`

---

## To Be Confirmed

| Item | Status |
|------|--------|
| Max group size | Not enforced at DB level for MVP — accept unlimited |
| `renameGroup` RLS | Confirm UPDATE policy on `group_chats` allows any member (not just `created_by`) |
| Group session `completed` trigger | For MVP, manually set via RPC call from client — no auto-trigger |
| `work_intents` RLS for public SELECT | Confirmed public READ in Phase 2 — no change needed |
