# Discover Redesign + Co-work Invite Flow

**Date:** 2026-05-30  
**Status:** Approved for implementation

---

## Context

The existing Discover screen shows one profile at a time in a Hinge-style swipe stack with Pass / Connect buttons. This is being replaced with a location-aware list that lets users browse everyone working nearby today, invite specific people to co-work, and — crucially — plan ahead by searching a venue they haven't arrived at yet.

The core insight: users are often at home wanting to know who will be at a café before they leave. The new screen supports "Here" (GPS) and any searched location.

---

## What We're Building

Three screens, one new flow:

1. **Discover tab** — card list of people working nearby today, with a location picker
2. **Profile view** — existing DiscoverProfileView, with Pass/Connect replaced by "Invite to co-work today"
3. **Requests inbox** — new tab on the Matches screen for pending invites (Accept / Decline)

---

## Screen 1: Discover Tab (full replacement)

### Layout
- Header: "Discover" title (left) + "N working nearby" count (right, violet)
- **Focus pill** (first row, below header): tappable, shows today's work intent
  - Unset state: white pill, dashed lavender border, 🌿 icon, grey italic placeholder "What are you working on today?", "Set →" link — cards below are blurred to nudge the user
  - Set state: dark green pill (#1e3d28), 🌿 icon, white task name (truncated), "Edit" link in muted lavender
  - Tapping either state opens the existing `IntentScreen` bottom sheet
- **Location picker pill** (second row, below focus pill): tappable, shows current browse center
  - Default state: 📍 **Here** / "your current location" / "Change →" (white pill, lavender border)
  - Custom state: ☕ **Venue Name** / address · "Clear ✕" (dark green pill, white text)
- **Card list**: scrollable FlatList, sorted by distance from the browse center, 12px gap between cards
- Cards are blurred when focus is not yet set (visual nudge only — they are still tappable)

### Each card contains
- Square-ish photo thumbnail (48×48, rounded 10px corners)
- Name + distance from browse center (right-aligned)
- Venue + availability window (violet, smaller)
- Work intent text (1–2 lines, dark, the hook for reaching out)
- Users who have already been invited today are omitted from the list (filtered client-side)

### Empty state
- "No one working nearby today" message with a note to check back or try a different location

### Tapping a card
- Opens the profile in a **pageSheet modal** (same pattern as `FriendProfileModal` in `src/screens/friends/FriendsScreen.tsx`)
- The modal passes `onInvite` — no `onPass` or `onConnect`
- Closing the modal returns to the card list (no card advance, no index change)

### Data fetching
- Calls `fetchDiscoveryCards(userId, lat, lng)` from `src/services/discoveryService.ts`
  - When "Here": pass current GPS coords
  - When custom location: pass the coords of the searched place
- Also calls `getSentInvitesToday(userId)` from `inviteService` — returns array of receiver user IDs invited today; these are filtered out of the card list on the client
- `getSentInvitesToday` queries `co_work_invites WHERE sender_id = userId AND expires_at = CURRENT_DATE`

---

## Location Picker

### Pill (always visible on Discover screen)
- Tapping opens a full-screen search modal

### Search modal
- Text input, autofocused on open
- First row always: 📍 "Here (current location)" — clears custom location and reverts to GPS
- Below: autocomplete results from Google Places API

### Google Places integration
- **Package:** `react-native-google-places-autocomplete`
- **API key setup:**
  1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Enable **Places API**
  2. Create an API key; add an iOS app restriction using the app's bundle ID (from `app.config.js`)
  3. Store the key in `.env` as `GOOGLE_PLACES_API_KEY`
  4. Expose it in `app.config.js` under `extra.googlePlacesApiKey`
  5. Access at runtime via `Constants.expoConfig?.extra?.googlePlacesApiKey`
- If the key is absent or empty, the search modal should show a "Location search unavailable" message and disable the input rather than crashing
- The autocomplete component is configured with `fetchDetails: true` to get lat/lng from the result
- Selecting a result stores `{ name, address, latitude, longitude }` in local component state; dismisses modal; refreshes card list

### Distance labels
- When in custom location mode, distance on each card is calculated from the searched place's coords, not the user's GPS — labelled as "X km from [Venue Name]" below the count

---

## Screen 2: Profile View (updated)

- Uses existing `DiscoverProfileView` in `src/components/discover/UserProfileModal.tsx`
- Add new optional prop: `onInvite?: () => void`
- `onPass` and `onConnect` remain but become optional: `onPass?: () => void`, `onConnect?: () => void`
- Render logic for the action area:
  - If `onInvite` is provided → render single full-width **"Invite to co-work today"** button (forest green, white text)
  - Otherwise → render existing Pass/Connect pair (Profile tab and FriendProfileModal are unaffected)
- After tapping Invite: button shows "Invite sent ✓" and disables for the session

---

## Screen 3: Requests Inbox (new)

### Location
- New **"Requests"** tab added to `src/screens/matches/MatchesListScreen.tsx` alongside DMs and Groups
- Tab label shows a badge count when there are pending invites

### Badge count lifecycle
- On mount: fetch count from `getIncomingInvites(userId)` to seed the badge immediately
- Then subscribe to `co_work_invites` via Supabase Realtime for live updates (filter: `receiver_id=eq.{userId} AND status=eq.pending`)
- Unsubscribe on unmount

### Each request card shows
- Sender avatar + name
- Venue + time context ("☕ Blue Bottle today")
- Time since sent (relative, e.g. "2 min ago")
- **Decline** (light background) and **Accept** (dark green) buttons
- Only show invites where `expires_at >= CURRENT_DATE` (today's invites only; stale ones are hidden)

### On Accept
- Calls `respondToInvite(inviteId, 'accepted')` — implemented as a Supabase RPC (see Data Model)
- The RPC updates the invite status to `accepted`, inserts a `matches` row, and returns `{ match_id }`
- Client navigates to `ChatScreen` with the returned `match_id`
- Request disappears from inbox (real-time subscription fires)

### On Decline
- Calls `respondToInvite(inviteId, 'declined')` — updates status only, no match created
- Request disappears from inbox silently; no notification sent to sender

---

## Push Notifications

### Setup
- Add `expo-notifications` to the project
- Request push permission on first app open after onboarding completes
- Register the Expo push token in `push_tokens` table (upsert on `user_id`)

### Triggering notifications
- A **Supabase Edge Function** (`send-invite-notification`) is triggered by a database webhook on `co_work_invites` INSERT
- The Edge Function reads the receiver's push token from `push_tokens` and calls the Expo Push API (`https://exp.host/--/expobase/push/send`)
- Notification body: "**[Sender name]** wants to co-work with you today"
- Notification payload: `{ data: { screen: 'Requests' } }`

### Deep-link handling
- In `App.tsx` (or the root navigator), add a `Notifications.addNotificationResponseReceivedListener` in a `useEffect`
- When `response.notification.request.content.data.screen === 'Requests'`, navigate to the Matches tab and set the active tab index to "Requests"
- For the **killed state** (app launched via notification tap): read `Notifications.getLastNotificationResponseAsync()` on startup and apply the same navigation logic after the navigator is ready
- React Navigation's `ref` pattern (already used in the project if any deep-link exists) is the right approach — use `navigationRef.navigate('Matches', { initialTab: 'Requests' })`

### Simulator note
- Push notifications do not fire on the iOS Simulator. During development, verify by checking that the `co_work_invites` row is inserted with `status = pending` and that the Requests inbox updates via the Realtime subscription.

---

## Data Model

### New table: `co_work_invites`

```sql
CREATE TABLE co_work_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at DATE NOT NULL DEFAULT CURRENT_DATE  -- UTC server date, set at insert time
);

CREATE UNIQUE INDEX co_work_invites_pair_day
  ON co_work_invites (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id), expires_at);
```

**RLS policies:**
```sql
ALTER TABLE co_work_invites ENABLE ROW LEVEL SECURITY;
-- sender can insert their own invites
CREATE POLICY "insert own" ON co_work_invites FOR INSERT WITH CHECK (sender_id = auth.uid());
-- both parties can read the invite
CREATE POLICY "read own" ON co_work_invites FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());
-- only the RPC (via service role) can update status
```

### New table: `push_tokens`

```sql
CREATE TABLE push_tokens (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own token only" ON push_tokens USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
```

### New RPC: `respond_to_invite(invite_id UUID, response TEXT)`

Runs as `SECURITY DEFINER` (bypasses RLS to insert into `matches`):

```sql
CREATE OR REPLACE FUNCTION respond_to_invite(invite_id UUID, response TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invite co_work_invites;
  v_match_id UUID;
BEGIN
  SELECT * INTO v_invite FROM co_work_invites WHERE id = invite_id AND receiver_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'invite not found'; END IF;

  UPDATE co_work_invites SET status = response WHERE id = invite_id;

  IF response = 'accepted' THEN
    INSERT INTO matches (user1_id, user2_id)
    VALUES (v_invite.sender_id, v_invite.receiver_id)
    RETURNING id INTO v_match_id;
    RETURN json_build_object('match_id', v_match_id);
  END IF;

  RETURN json_build_object('match_id', null);
END;
$$;
```

### New service: `src/services/inviteService.ts`

- `sendInvite(senderId, receiverId)` → inserts into `co_work_invites`; on unique-constraint conflict (pair already invited today), silently ignores the error and returns `{ alreadyInvited: true }` — the button should already be disabled in this case but this is a safety net
- `getSentInvitesToday(userId)` → array of receiver user IDs invited today
- `getIncomingInvites(userId)` → pending invites where `receiver_id = userId AND expires_at = CURRENT_DATE`, joined with sender profile + intent
- `respondToInvite(inviteId, 'accepted' | 'declined')` → calls the `respond_to_invite` RPC, returns `{ match_id }`

---

## What Stays the Same

- `DiscoverProfileView` component structure — only the action buttons area changes (props become optional)
- `fetchDiscoveryCards` RPC — no changes needed
- Friends, Profile tabs — completely unchanged
- Match → chat flow — accept invite creates a `matches` row via RPC and navigates to existing `ChatScreen`

---

## Out of Scope

- Map view (no map library added)
- Saving/pinning favourite locations
- Filtering by venue type or work style
- Sending a message with the invite

---

## Verification

1. Run `npm run ios`
2. Set a work intent for today on test account A
3. On test account B, open Discover — card list shows account A
4. Tap the location pill → search a venue → confirm cards refresh; distance label updates to "X km from [Venue]"
5. Tap a card → pageSheet modal opens with "Invite to co-work today" button
6. Tap invite → button shows "Invite sent ✓" and disables; check Supabase `co_work_invites` has a row with `status = pending`
7. Account A: open Matches → Requests tab — invite appears immediately (Realtime); badge count visible
8. Tap Accept → `matches` row created, chat screen opens with the correct `match_id`
9. Back on account B's Discover — account A no longer appears in the card list
10. Tap Invite on account B again for the same person → no duplicate row inserted (unique constraint)
11. Run `npx tsc --noEmit` — no type errors
