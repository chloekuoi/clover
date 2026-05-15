# CoWork Connect — Runbook

## Quick Start

### Install
```bash
npm install
```

### Run
```bash
npx expo start
```

Then press:
- `i` — Open iOS Simulator
- `a` — Open Android Emulator
- `w` — Open in web browser

### Clear Cache (if issues)
```bash
npx expo start --clear
```

---

## Environment Variables

Currently hardcoded in `lib/supabase.ts`. For production, move to env vars:

| Variable | Description | Where Used |
|----------|-------------|------------|
| `SUPABASE_URL` | Supabase project URL | `lib/supabase.ts` |
| `SUPABASE_ANON_KEY` | Supabase publishable anon key | `lib/supabase.ts` |

### Future (not yet implemented)
| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_SENTRY_DSN` | Error tracking |
| `EXPO_PUBLIC_MIXPANEL_TOKEN` | Analytics |

---

## Database Setup

Before testing, run the SQL migrations in Supabase SQL Editor:

1. `supabase/001_profiles_table.sql` — Profiles table + signup trigger
2. `supabase/002_discovery_tables.sql` — Discovery tables (work_intents, swipes)

---

## Test Flows

### 1. Create Account

**Preconditions:** Fresh app install or signed out

**Steps:**
1. Open app
2. See Welcome screen with "Find your people" tagline
3. Tap "Get Started"
4. Enter email address
5. Enter password (min 6 characters)
6. Tap "Create Account"

**Success Criteria:**
- [ ] No error alerts
- [ ] Redirected to Onboarding screen (Step 1: "What's your name?")
- [ ] Check Supabase: `auth.users` table has new row with email
- [ ] Check Supabase: `profiles` table has new row (may be empty until onboarding)

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "User already registered" | Email exists | Use different email or login |
| "Invalid email" | Malformed email | Check email format |
| "Password too short" | < 6 chars | Use longer password |
| Network error | No connection | Check wifi/cellular |

---

### 2. Complete Onboarding

**Preconditions:** Signed up, on Onboarding screen

**Steps:**
1. **Step 1 — Name**
   - Enter your name (e.g., "Alex Chen")
   - Tap "Continue"

2. **Step 2 — Work Type**
   - Select one option (e.g., "Freelancer")
   - Tap "Continue"

3. **Step 3 — Interests**
   - Select 1+ interests (e.g., "Deep Focus", "Pomodoro")
   - Tap "Get Started"

**Success Criteria:**
- [ ] Progress dots advance with each step
- [ ] Can go back with "Back" button
- [ ] After "Get Started", redirected to main app (Discover tab)
- [ ] Check Supabase: `profiles` table row has:
  - `name` = entered name
  - `work_type` = selected type
  - `interests` = array of selected interests
  - `onboarding_complete` = true

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "Name required" alert | Empty name field | Enter a name |
| "Work type required" | No selection in step 2 | Tap an option |
| "Failed to save profile" | Database error | Check Supabase logs |
| Stuck on loading | Network timeout | Check connection, retry |

---

### 3. Create Intent

**Preconditions:** Logged in, onboarding complete, on Discover tab

**Steps:**
1. Grant location permission when prompted
2. See "Set Your Intent" form
3. Enter task description (e.g., "Writing blog posts about productivity")
4. Select work style (e.g., "Deep focus")
5. Select location type (e.g., "Cafe")
6. Optionally enter spot name (e.g., "Blue Bottle Coffee")
7. Select start and end times
8. Tap "Find Co-Workers"

**Success Criteria:**
- [ ] Location permission granted (or "Enable Location" screen if denied)
- [ ] Form accepts input without errors
- [ ] After submit, transitions to either:
  - Card stack (if other users nearby), OR
  - Empty state ("No one nearby")
- [ ] Check Supabase: `work_intents` table has new row with:
  - `user_id` = your user ID
  - `task_description` = entered text
  - `work_style` = selected style
  - `location_type` = selected type
  - `intent_date` = today's date
  - `latitude` / `longitude` = your coordinates

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "Location Required" screen | Permission denied | Tap "Enable Location", grant in iOS Settings |
| "Missing info" alert | Empty task description | Enter a task |
| "Failed to save" | Database error | Check Supabase RLS policies |
| Spinner never stops | Network issue | Check connection |

---

### 4. See Discovery Feed

**Preconditions:** Intent created for today, other users have intents nearby

**Steps:**
1. After creating intent, feed loads automatically
2. See header: "Discover" + "Working on: [your task]"
3. See card stack with top card visible
4. Card shows: name, distance, task, work style, location type

**Success Criteria:**
- [ ] Header shows "Working on: [your task]"
- [ ] Top card displays:
  - Profile photo OR initials placeholder
  - Name (or "Anonymous")
  - Distance in km or m (with "away")
  - Task description
  - Two tags (work style + location)
- [ ] Next two cards visible behind (slightly smaller, offset)

**To Create Test Data:**
1. Create second user account
2. Complete onboarding
3. Create intent with nearby coordinates (within 50km)
4. Switch back to first account
5. Pull to refresh or reopen Discover tab

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| "No one nearby" | No other users with intents | Create test data (see above) |
| Cards show wrong distance | Test user too far | Use coordinates within 50km |
| Blank cards | Missing profile data | Check `profiles` table has name |

---

### 5. Swipe Left / Right

**Preconditions:** Discovery feed showing with cards

**Steps — Gesture Swipe:**
1. Touch and drag card horizontally
2. See card rotate and stamp appear:
   - Right drag → green "LIKE" stamp
   - Left drag → red "NOPE" stamp
3. Release past threshold → card flies off
4. Release before threshold → card springs back

**Steps — Button Swipe:**
1. Tap X button (left side) → swipe left
2. Tap OK button (right side) → swipe right

**Success Criteria:**
- [ ] Card rotates while dragging (max ±15°)
- [ ] LIKE/NOPE stamps fade in based on direction
- [ ] Swiping past 30% screen width completes swipe
- [ ] Card animates off screen smoothly
- [ ] Next card scales up to replace it
- [ ] Check Supabase: `swipes` table has new row with:
  - `swiper_id` = your user ID
  - `swiped_id` = swiped user's ID
  - `direction` = "right" or "left"
  - `swipe_date` = today

**Match Detection:**
1. User A swipes right on User B
2. User B swipes right on User A
3. User B sees: Alert "It's a Match!"

**To Test Match:**
1. With User A: swipe right on User B
2. Log out, log in as User B
3. Find User A in feed, swipe right
4. **Expected:** Alert appears: "It's a Match! You and [name] both want to co-work today!"

**Common Failures:**
| Symptom | Cause | Fix |
|---------|-------|-----|
| Card doesn't move | Gesture not registering | Ensure GestureHandlerRootView wraps app |
| No snap back | Animation broken | Check reanimated babel plugin |
| Swipe not recorded | Database error | Check Supabase `swipes` RLS policies |
| No match alert | RPC not created | Run `check_match` function SQL |
| Match alert for every swipe | Mutual swipe exists | Expected if both swiped right |

---

### 6. Messaging

**Status:** NOT IMPLEMENTED (Phase 3)

**Placeholder Behavior:**
- Matches tab exists but shows placeholder content
- No chat functionality yet
- No way to communicate after matching

**Coming in Phase 3:**
- Match list with last message preview
- 1:1 chat thread
- Push notifications for new messages
- Typing indicators

---

## Quick Verification Checklist

Run through this after any major changes:

```
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database
[ ] Match detection works
```

---

## Debugging Tips

### Check Logs
```bash
# Metro bundler logs
npx expo start

# Simulator logs
# Xcode → Window → Devices and Simulators → Open Console
```

### Check Database
1. Go to Supabase Dashboard
2. Table Editor → Select table
3. Verify rows exist with correct data

### Check RLS Policies
1. Supabase → Authentication → Policies
2. Ensure policies allow your operations
3. Test with SQL Editor using `auth.uid()`

### Reset Local State
```bash
# Clear AsyncStorage (sign out)
# Delete app from simulator
# Reinstall
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` |
| Bundler cache issues | Run `npx expo start --clear` |
| Gesture handler not working | Check `babel.config.js` has reanimated plugin |
| Location not working | Check iOS Settings → Privacy → Location Services |
| Database operations fail | Check Supabase RLS policies |
| Match not triggering | Verify `check_match` RPC exists in Supabase |

---

## Simulator Locations

For testing with specific coordinates:

**iOS Simulator:**
1. Features → Location → Custom Location
2. Enter lat/long

**Test Coordinates (San Francisco):**
- User A: 37.7749, -122.4194 (Downtown)
- User B: 37.7849, -122.4094 (~1.5km away)
- User C: 37.8049, -122.4294 (~3.5km away)

---

## Support

- **GitHub Issues:** https://github.com/anthropics/claude-code/issues
- **Supabase Docs:** https://supabase.com/docs
- **Expo Docs:** https://docs.expo.dev

---
---

# Phase 3: Matching & Messaging — Verification Flows

**Added:** 2026-02-07

---

## Database Setup (Phase 3)

Before testing Phase 3, run the SQL migration in Supabase SQL Editor:

3. `supabase/003_matching_tables.sql` — matches table, messages table, create_match, mark_chat_read

After running, verify:
1. Go to Table Editor → verify `matches` and `messages` tables exist
2. Go to Authentication → Policies → verify RLS policies on both tables
3. Go to Database → Functions → verify `create_match` and `mark_chat_read` exist
4. Go to Database → Replication → verify `messages` table has Realtime enabled

---

### 7. Verify Phase 3 Database

**Preconditions:** SQL migration `003_matching_tables.sql` executed

**Steps:**
1. Open Supabase SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **Expected:** `matches` and `messages` listed alongside existing tables
4. Run: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
5. **Expected:** `create_match` and `mark_chat_read` listed alongside `check_match` and `handle_new_user`
6. Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('matches', 'messages');`
7. **Expected:** RLS policies listed for both tables
8. Test create_match function:
   ```sql
   -- Use two existing user IDs from profiles table
   SELECT create_match('USER_A_UUID'::uuid, 'USER_B_UUID'::uuid);
   ```
9. **Expected:** Returns a UUID (the match ID)
10. Run the same call again
11. **Expected:** Returns the same UUID (idempotent)
12. Check matches table: `SELECT * FROM matches;`
13. **Expected:** One row with ordered user IDs

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "function create_match does not exist" | SQL not run | Execute `003_matching_tables.sql` |
| "permission denied for table matches" | RLS blocking | Verify SECURITY DEFINER on functions |
| Realtime not working | Not enabled | Dashboard → Database → Replication → enable `messages` |

---

### 8. Match Creation via Swipe

**Preconditions:** Both users have accounts, Phase 3 database set up, both users have today's intents

**Steps:**
1. Login as User A
2. Navigate to Discover tab, set intent
3. Swipe right on User B
4. Check Supabase `swipes` table
5. **Expected:** Row with swiper_id=A, swiped_id=B, direction='right'
6. Check Supabase `matches` table
7. **Expected:** No match row yet (only one-sided swipe)
8. Logout, login as User B
9. Navigate to Discover tab, set intent
10. Swipe right on User A
11. Check Supabase `swipes` table
12. **Expected:** Row with swiper_id=B, swiped_id=A, direction='right'
13. Check Supabase `matches` table
14. **Expected:** New row with user1_id=LEAST(A,B), user2_id=GREATEST(A,B)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No match row after mutual swipe | `create_match` not called in recordSwipe | Check discoveryService.ts update |
| Duplicate match rows | User ordering not working | Check `create_match` function uses LEAST/GREATEST |
| Match row but no modal | Modal not integrated | Check DiscoverScreen uses MatchModal |

---

### 9. Match Modal

**Preconditions:** Mutual right swipe scenario (User B triggers the match)

**Steps:**
1. As User B, swipe right on User A (who already swiped right on B)
2. **Expected:** Match modal appears (NOT native Alert)
3. Verify modal shows:
   - Both users' photos or initials
   - "It's a Match!" heading
   - Subtitle with both names
   - "Send Message" button
   - "Keep Swiping" text
4. Tap "Keep Swiping"
5. **Expected:** Modal dismisses, discovery continues (next card or empty state)
6. Trigger another match (or repeat with different users)
7. Tap "Send Message"
8. **Expected:** Navigates to Matches tab → Chat screen with the matched user

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Native Alert instead of modal | MatchModal not integrated | Check DiscoverScreen renders MatchModal |
| Modal shows but no photos | Profile data not passed | Check matchedUser prop has photo_url/name |
| "Send Message" does nothing | Navigation not set up | Check cross-tab navigation to Matches → Chat |
| Modal behind card stack | zIndex issue | Ensure modal overlay has highest zIndex |

---

### 10. Chat — Send and Receive Messages

**Preconditions:** Two users matched, Chat screen accessible

**Steps:**
1. As User A, navigate to Matches tab
2. Tap on the match with User B
3. **Expected:** Chat screen opens with User B's name in header
4. **Expected:** Empty state: "Start the conversation!" (no messages yet)
5. Type "Hey! Want to work at Blue Bottle today?"
6. **Expected:** Send button becomes active (not grayed out)
7. Tap send
8. **Expected:**
   - Message appears right-aligned in sage green bubble
   - Input field clears
   - Timestamp shows below message
9. Check Supabase `messages` table
10. **Expected:** Row with match_id, sender_id=A, content="Hey!..."
11. Keep chat open on User A's device
12. On User B's device, open the same chat
13. **Expected:** User A's message is visible (left-aligned, cream bubble)
14. As User B, type and send: "Yes! I'll be there at 2pm"
15. **Expected on User B:** Message appears right-aligned sage
16. **Expected on User A:** Message appears in real time (left-aligned cream) without manual refresh

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Start the conversation!" never goes away | Messages not fetching | Check fetchMessages query |
| Message sent but not visible | FlatList not updating | Check state management |
| Other user's message not appearing | Realtime not working | Check Supabase Realtime enabled on messages table |
| Send button always disabled | Trim logic too strict | Check input value trimming |
| Keyboard covers input | KeyboardAvoidingView missing | Wrap chat in KeyboardAvoidingView |

---

### 11. Matches List

**Preconditions:** At least one match exists with messages

**Steps:**
1. Login as User A
2. Navigate to Matches tab
3. **Expected:** Loading spinner briefly, then match list appears
4. Verify match card shows:
   - User B's photo or initials (circular)
   - User B's name
   - Last message text (truncated to 1 line)
   - Relative timestamp (e.g., "2m ago")
5. If User B sent a message that User A hasn't read:
   - **Expected:** Green unread dot visible
   - **Expected:** Name text is bold
6. Tap the match card
7. **Expected:** Chat screen opens with User B's messages
8. Press back
9. **Expected:** Returns to matches list
10. Pull down to refresh
11. **Expected:** List refreshes (loading indicator briefly)

**With No Matches:**
1. Login with a fresh user (no matches)
2. Navigate to Matches tab
3. **Expected:** Empty state: "No matches yet" with encouragement text

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank list | fetchMatches query failing | Check Supabase query joins |
| No last message showing | Last message query not working | Check messaging service |
| "Say hello!" not showing | No fallback for empty messages | Check MatchCard conditional |
| Pull-to-refresh not working | onRefresh not wired | Check FlatList props |

---

### 12. Unread Message Badge

**Preconditions:** Two matched users, messages sent

**Steps:**
1. As User A, send a message to User B in chat
2. Close the chat (go back to matches list or switch tabs)
3. Login as User B
4. Look at the bottom tab bar
5. **Expected:** Matches tab shows a red badge with "1" (or the unread count)
6. Tap the Matches tab
7. **Expected:** Badge still shows (haven't read yet)
8. Open the chat with User A
9. **Expected:** Messages visible, chat marked as read
10. Go back to Matches tab or switch away and back
11. **Expected:** Badge disappears (or count decremented)
12. Have User A send another message
13. Next time User B focuses the Matches tab
14. **Expected:** Badge shows "1" again

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No badge ever | getUnreadCount not called | Check MainTabs badge logic |
| Badge shows wrong count | last_read_at not updating | Check mark_chat_read RPC |
| Badge doesn't clear | markChatRead not called on chat open | Check ChatScreen useEffect |
| Badge shows on fresh account | Query returning wrong count | Check unread count query logic |

---

## Updated Quick Verification Checklist

Run through this after Phase 3 implementation:

```
Phase 1+2 (existing):
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database

Phase 3 (new):
[ ] Mutual right swipe creates match row in database
[ ] Match modal appears (not native Alert)
[ ] Match modal shows both users' info
[ ] "Send Message" navigates to chat
[ ] "Keep Swiping" dismisses modal
[ ] Matches list shows matches with previews
[ ] Matches list empty state works
[ ] Chat screen opens from match card
[ ] Can send a message
[ ] Message appears in database
[ ] Message appears for other user in real time
[ ] Unread badge shows on Matches tab
[ ] Unread badge clears after reading
[ ] Pull-to-refresh works on matches list
[ ] Back navigation from chat works
```

---

## Phase 3 Debugging Tips

### Check Realtime
1. Supabase Dashboard → Database → Replication
2. Verify `messages` table is listed under "Source"
3. If not listed, enable it and restart the app

### Check Match Functions
```sql
-- Test create_match directly
SELECT create_match('USER_A_UUID'::uuid, 'USER_B_UUID'::uuid);

-- Test mark_chat_read directly
SELECT mark_chat_read('MATCH_UUID'::uuid, 'USER_UUID'::uuid);

-- Check unread messages for a user
SELECT m.id, m.content, m.created_at, m.sender_id
FROM messages m
JOIN matches mt ON m.match_id = mt.id
WHERE (mt.user1_id = 'USER_UUID' AND m.created_at > mt.user1_last_read_at AND m.sender_id != 'USER_UUID')
   OR (mt.user2_id = 'USER_UUID' AND m.created_at > mt.user2_last_read_at AND m.sender_id != 'USER_UUID');
```

### Common Phase 3 Issues

| Issue | Solution |
|-------|----------|
| Realtime not delivering messages | Enable Realtime on `messages` table in Supabase Dashboard |
| "function create_match does not exist" | Run `supabase/003_matching_tables.sql` |
| Messages visible to wrong users | Check RLS policies on `messages` table |
| Chat opens but shows wrong messages | Verify `match_id` filter on message query |
| Badge count wrong after reading | Check `mark_chat_read` updates correct column (user1 vs user2) |
| Navigation crash from modal | Check MatchesStack navigator has correct screen names |

---
---

# Phase 4: Sessions — Verification Flows

**Added:** 2026-02-08

---

## Database Setup (Phase 4)

Before testing Phase 4, run the SQL migration in Supabase SQL Editor:

4. `supabase/004_sessions_tables.sql` — sessions table, session_participants table, all session RPC functions

After running, verify:
1. Go to Table Editor → verify `sessions` and `session_participants` tables exist
2. Go to Authentication → Policies → verify RLS policies on both tables
3. Go to Database → Functions → verify `create_session`, `respond_to_session`, `complete_session`, `cancel_session`, `auto_complete_sessions` exist
4. Go to Database → Replication → verify `sessions` table has Realtime enabled

---

### 13. Verify Phase 4 Database

**Preconditions:** SQL migration `004_sessions_tables.sql` executed

**Steps:**
1. Open Supabase SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **Expected:** `sessions` and `session_participants` listed alongside existing tables
4. Run: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
5. **Expected:** `create_session`, `respond_to_session`, `complete_session`, `cancel_session`, `auto_complete_sessions` listed
6. Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('sessions', 'session_participants');`
7. **Expected:** RLS policies listed for both tables
8. Test create_session function (use two user IDs from an existing match):
   ```sql
   -- First, find a match
   SELECT id, user1_id, user2_id FROM matches LIMIT 1;
   -- Then create a session (use match_id and user1_id from above)
   SELECT create_session('MATCH_UUID'::uuid, 'USER1_UUID'::uuid);
   ```
9. **Expected:** Returns a UUID (the session ID)
10. Check sessions table: `SELECT * FROM sessions;`
11. **Expected:** One row with status='pending', initiated_by=USER1
12. Check session_participants: `SELECT * FROM session_participants;`
13. **Expected:** Two rows — one 'initiator', one 'invitee'
14. Try creating another session for the same user:
    ```sql
    SELECT create_session('MATCH_UUID'::uuid, 'USER1_UUID'::uuid);
    ```
15. **Expected:** Error — "User already has an active or pending session"
16. Test respond_to_session:
    ```sql
    SELECT respond_to_session('SESSION_UUID'::uuid, 'USER2_UUID'::uuid, 'accept');
    ```
17. **Expected:** Session status changes to 'active', accepted_at is set
18. Test complete_session:
    ```sql
    SELECT complete_session('SESSION_UUID'::uuid, 'USER1_UUID'::uuid);
    ```
19. **Expected:** Session status changes to 'completed', completed_at is set

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "function create_session does not exist" | SQL not run | Execute `004_sessions_tables.sql` |
| "permission denied for table sessions" | RLS blocking | Verify SECURITY DEFINER on functions |
| Realtime not working for sessions | Not enabled | Dashboard → Database → Replication → enable `sessions` |
| "User already has an active or pending session" | Previous test data | Clean up: `DELETE FROM sessions;` |

---

### 14. Send Cowork Invite from Chat

**Preconditions:** Two matched users (User A and User B) with chat available

**Steps:**
1. Login as User A
2. Navigate to Matches tab → open chat with User B
3. Verify "Send Cowork Invite" button is visible in the chat header
4. Tap "Send Cowork Invite"
5. **Expected:** Invite card appears inline with date selector (today + next 6 days)
6. Select a date and send invite
7. **Expected:** Card shows waiting state + Cancel button for initiator
8. Check Supabase `sessions` table
9. **Expected:** Row with match_id, initiated_by=User A, status='pending', scheduled_date set
10. Check `session_participants` table
11. **Expected:** Two rows — User A as 'initiator', User B as 'invitee'
12. Navigate to a different match's chat (if available)
13. **Expected:** "Send Cowork Invite" is still available (multiple pending invites allowed)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No "Send Cowork Invite" button | Component not added to ChatScreen | Check header rendering |
| Invite card missing date selector | UI not updated | Check invite card component |
| Card doesn't appear | Session not fetched after creation | Check fetchSessionsForMatch call |
| Error creating invite | RPC updated incorrectly | Check create_session RPC |

---

### 15. Accept and Decline Invite

**Preconditions:** User A has sent an invite to User B (pending session exists)

**Accept Flow:**
1. Login as User B
2. Navigate to Matches tab → open chat with User A
3. **Expected:** Invite card visible with "Accept" and "Decline"
4. Tap "Accept"
5. **Expected:** System message bubble: "You can now plan coworking details with xxx 😀"
6. **Expected:** Dual-lock card appears with "Locked in 🔒 | Locked in 🔒"
7. Check Supabase `sessions` table
8. **Expected:** status='active', accepted_at set

**Decline Flow:**
1. Start a new invite (User A invites User B again)
2. Login as User B, open chat with User A
3. Tap "Decline"
4. **Expected:** Card updates to "Session Declined" (dimmed)
5. Check Supabase: status='declined'

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Accept button does nothing | respondToSession not called | Check onAccept handler |
| Card doesn't update after accept | Realtime not subscribed or state not refreshed | Check session subscription |
| "Session not found or not pending" error | Session already responded to | Check session status in DB |
| Initiator can accept own session | Role check missing | Verify respond_to_session checks initiated_by |

---

### 16. Dual-Lock Confirmation

**Preconditions:** An active session between User A and User B (accepted)

**Steps:**
1. In chat, find the dual-lock card
2. User A taps their "Locked in 🔒" (right side)
3. **Expected:** User B sees left side marked as locked
4. User B taps their "Locked in 🔒" (right side)
5. **Expected:** Card remains for ~3 seconds, then disappears
6. **Expected:** "🔒❤️" toast appears
7. Check Supabase: status='completed', completed_ack=true
8. Check Supabase: locked_by_initiator_at and locked_by_invitee_at are set

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "View Session" doesn't navigate | Navigation not set up | Check MatchesStack has ActiveSession screen |
| Active Session screen blank | Route params not passed | Check sessionId and otherUser params |
| "End Session" error | completeSession RPC issue | Check function exists and user is participant |
| Duration shows wrong value | Calculation error | Check accepted_at and completed_at difference |
| "Back to Chat" navigates wrong | Navigation stack issue | Check popToTop or navigate behavior |

---

### 17. Cancel Invite

**Preconditions:** User A has a pending session with User B

**Steps:**
1. Login as User A
2. Open chat with User B
3. Find the pending session card (initiator view)
4. **Expected:** "Cancel" button visible
5. Tap "Cancel"
6. **Expected:** Card updates to "Session Cancelled" (dimmed)
7. Check Supabase: status='cancelled'
8. **Expected:** "Send Cowork Invite" button available again in chat header
9. Login as User B
10. Open chat with User A
11. **Expected:** Session card shows "Session Cancelled" (no action buttons)

**Invitee Cannot Cancel:**
1. Create a new pending session (User A invites User B)
2. Login as User B, view the session card
3. **Expected:** No "Cancel" button visible — only "Accept" and "Decline"

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Cancel button visible for invitee | Role check missing in component | Check currentUserId vs initiated_by |
| "Session not found or not pending" | Session already accepted/declined | Check status before cancel |
| Card doesn't update | State not refreshed | Check Realtime subscription or manual refetch |

---

### 18. Auto-Cancel Stale Sessions

**Preconditions:** An active session exists with accepted_at older than 24 hours and not fully locked

**Setup (via Supabase SQL Editor):**
```sql
-- Create a session and manually set its date to yesterday
UPDATE sessions
SET status = 'active',
    accepted_at = NOW() - INTERVAL '1 day',
    locked_by_initiator_at = NULL,
    locked_by_invitee_at = NULL
WHERE id = 'SESSION_UUID';
```

**Steps:**
1. Close and reopen the app (or login fresh)
2. **Expected:** Auto-cancel runs silently on app load
3. Check Supabase `sessions` table
4. **Expected:** Session status changed to 'cancelled', completed_ack=false
5. **Expected:** Lock timestamps cleared
6. Open the affected chat on User A and User B
7. **Expected:** Toast appears for 3 seconds: "Missed this one 💔"

**Alternative Manual Test:**
```sql
-- Call the RPC directly
SELECT auto_cancel_sessions();
-- Expected: Returns number of sessions cancelled (e.g., 1)
```

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Stale session still active | auto_cancel_sessions not called on app load | Check AuthContext or root navigator |
| Function returns 0 | accepted_at not older than 24h | Verify accepted_at < NOW() - INTERVAL '24 hours' |
| App crashes on load | Auto-complete error not caught | Ensure fire-and-forget with try/catch |

---

### 19. Multiple Pending Invites

**Preconditions:** User A has matches with both User B and User C

**Steps:**
1. Login as User A
2. Open chat with User B
3. Tap "Send Cowork Invite" → invite created (pending)
4. Navigate back, open chat with User C
5. **Expected:** "Send Cowork Invite" is still available
6. Send invite to User C
7. **Expected:** Both invites remain pending in respective chats

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Invite blocked | Old one-per-user constraint still enforced | Update create_session RPC |

---

## Updated Quick Verification Checklist

Run through this after Phase 4 implementation:

```
Phase 1+2 (existing):
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database

Phase 3 (existing):
[ ] Mutual right swipe creates match row in database
[ ] Match modal appears (not native Alert)
[ ] Match modal shows both users' info
[ ] "Send Message" navigates to chat
[ ] "Keep Swiping" dismisses modal
[ ] Matches list shows matches with previews
[ ] Chat screen opens from match card
[ ] Can send and receive messages in real time
[ ] Unread badge shows and clears correctly

Phase 4 (new):
[ ] "Send Cowork Invite" button visible in chat header
[ ] Invite card includes date selection (today + next 6 days)
[ ] Invite card shows correct state for initiator (waiting + cancel)
[ ] Invite card shows correct state for invitee (accept + decline)
[ ] Accepting shows system message with emoji
[ ] Dual-lock card appears after acceptance
[ ] Each user lock updates the opposite side
[ ] Both locks → "🔒❤️" toast and session completed
[ ] Declining changes card to "Session Declined"
[ ] Cancelling changes card to "Session Cancelled"
[ ] Multiple pending invites across matches are allowed
[ ] Stale accepted sessions auto-cancel after 24h
[ ] Session data persists in database correctly
```

---

## Phase 4 Debugging Tips

### Check Session Functions
```sql
-- Test create_session directly (use real match and user IDs)
SELECT create_session('MATCH_UUID'::uuid, 'USER_UUID'::uuid);

-- Test respond_to_session
SELECT respond_to_session('SESSION_UUID'::uuid, 'INVITEE_UUID'::uuid, 'accept');

-- Test complete_session
SELECT complete_session('SESSION_UUID'::uuid, 'USER_UUID'::uuid);

-- Test cancel_session
SELECT cancel_session('SESSION_UUID'::uuid, 'INITIATOR_UUID'::uuid);

-- Test auto_complete
SELECT auto_complete_sessions();

-- Check all sessions
SELECT s.id, s.status, s.session_date, s.initiated_by, s.accepted_at, s.completed_at,
       p1.name as initiator_name
FROM sessions s
JOIN profiles p1 ON s.initiated_by = p1.id
ORDER BY s.created_at DESC;

-- Check session participants
SELECT sp.session_id, sp.role, p.name
FROM session_participants sp
JOIN profiles p ON sp.user_id = p.id;

-- Check one-per-user constraint
SELECT sp.user_id, p.name, s.status, s.session_date
FROM session_participants sp
JOIN sessions s ON sp.session_id = s.id
JOIN profiles p ON sp.user_id = p.id
WHERE s.status IN ('pending', 'active');
```

### Common Phase 4 Issues

| Issue | Solution |
|-------|----------|
| "function create_session does not exist" | Run `supabase/004_sessions_tables.sql` |
| Realtime not delivering session updates | Enable Realtime on `sessions` table in Dashboard |
| Session card not updating in chat | Check Realtime subscription on session id |
| "Start Session" always disabled | Check fetchActiveSession query — may return stale data |
| Session card at wrong position in chat | Check created_at sorting in timeline merge |
| Duration shows negative or NaN | Check accepted_at and completed_at are both non-null |
| Auto-complete not running | Check AuthContext calls autoCompleteStaleSessions after auth |

---
---

# Phase 5: Friends & Polish — Verification Flows

**Added:** 2026-02-15

---

## Database Setup (Phase 5)

Before testing Phase 5, run the SQL migration in Supabase SQL Editor:

6. `supabase/006_friendships_table.sql` — friendships table, phone_number column on profiles, friend RPCs

After running, verify:
1. Go to Table Editor → verify `friendships` table exists
2. Go to Table Editor → verify `profiles` table has `phone_number` column
3. Go to Authentication → Policies → verify RLS policy on `friendships` table
4. Go to Database → Functions → verify `send_friend_request`, `respond_to_friend_request`, `get_pending_requests_count` exist
5. Go to Database → Replication → verify `friendships` table has Realtime enabled

---

### 20. Verify Phase 5 Database

**Preconditions:** SQL migration `006_friendships_table.sql` executed

**Steps:**
1. Open Supabase SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **Expected:** `friendships` listed alongside existing tables
4. Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone_number';`
5. **Expected:** One row: `phone_number`, `text`
6. Run: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public';`
7. **Expected:** `send_friend_request`, `respond_to_friend_request`, `get_pending_requests_count` listed
8. Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'friendships';`
9. **Expected:** At least one RLS policy listed
10. Test send_friend_request:
    ```sql
    -- Use two existing user IDs from profiles table
    SELECT send_friend_request('USER_A_UUID'::uuid, 'USER_B_UUID'::uuid);
    ```
11. **Expected:** Returns a UUID (the friendship ID)
12. Check friendships table: `SELECT * FROM friendships;`
13. **Expected:** One row with requester_id=A, recipient_id=B, status='pending'
14. Test respond_to_friend_request:
    ```sql
    SELECT respond_to_friend_request('FRIENDSHIP_UUID'::uuid, 'USER_B_UUID'::uuid, 'accept');
    ```
15. **Expected:** No error. Friendship status changes to 'accepted'.
16. Check matches table: `SELECT * FROM matches WHERE user1_id = LEAST('USER_A_UUID', 'USER_B_UUID')::uuid AND user2_id = GREATEST('USER_A_UUID', 'USER_B_UUID')::uuid;`
17. **Expected:** A match row exists (created by accept)
18. Test get_pending_requests_count:
    ```sql
    SELECT get_pending_requests_count('USER_B_UUID'::uuid);
    ```
19. **Expected:** Returns 0 (no pending requests left)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "function send_friend_request does not exist" | SQL not run | Execute `006_friendships_table.sql` |
| "permission denied for table friendships" | RLS blocking | Verify SECURITY DEFINER on functions |
| Match not created on accept | `create_match` not called inside RPC | Check `respond_to_friend_request` function body |
| Duplicate friendship error | Previous test data | Clean up: `DELETE FROM friendships;` |

---

### 21. Search Users and Send Friend Request

**Preconditions:** At least two user accounts exist; User B has set email and/or phone_number on their profile

**Steps:**
1. Login as User A
2. Navigate to Friends tab → tap "+" (Add Friend)
3. **Expected:** Add Friend screen with search input and initial prompt
4. Type 2 characters in search input
5. **Expected:** No search triggered (minimum 3 characters)
6. Type User B's email (or partial email, 3+ chars)
7. **Expected:** Loading spinner briefly, then results appear
8. Verify User B appears with:
   - Profile photo or initials
   - Name
   - Username (e.g., @user_abc123...)
   - "Add" button
9. Tap "Add"
10. **Expected:** Button changes to "Requested" immediately
11. Check Supabase `friendships` table
12. **Expected:** Row with requester_id=A, recipient_id=B, status='pending'
13. Try searching for User B again
14. **Expected:** User B appears with "Requested" button (disabled)

**Search by Phone Number:**
1. First, add a phone number to User B's profile: `UPDATE profiles SET phone_number = '555-1234' WHERE id = 'USER_B_UUID';`
2. As User A, search "555-1234"
3. **Expected:** User B appears in results

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No results for valid query | ILIKE not matching | Check query uses `%query%` wildcard |
| Self appears in results | Not filtering current user | Check `neq('id', currentUserId)` in query |
| "Add" does nothing | sendFriendRequest not called | Check onAdd handler |
| Button doesn't change to "Requested" | Optimistic update not implemented | Check local state update after send |
| Error "Cannot send request to this user" | Previously declined | Check friendships table for existing declined row |

---

### 22. Accept Friend Request

**Preconditions:** User A has sent a friend request to User B (pending)

**Steps:**
1. Login as User B
2. Check Friends tab
3. **Expected:** Badge with "1" on Friends tab icon
4. Navigate to Friends tab
5. **Expected:** Friends screen with "Pending Requests (1)" section at top
6. Verify request card shows:
   - User A's photo/initials
   - User A's name
   - User A's username
   - "Accept" and "Decline" buttons
7. Tap "Accept"
8. **Expected:**
   - Request card moves from pending section to friends list
   - User A appears in "Your Friends" section
9. Check Supabase `friendships` table
10. **Expected:** status='accepted', updated_at is recent
11. Check Supabase `matches` table
12. **Expected:** Match row exists for User A + User B (user1_id=LEAST, user2_id=GREATEST)
13. **Expected:** Badge gone on Friends tab (0 pending requests)
14. Login as User A, navigate to Friends tab
16. **Expected:** User B appears in friends list

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No badge on Friends tab | getPendingRequestsCount not called on focus | Check MainTabs useFocusEffect |
| Badge shows wrong number | Count query incorrect | Check get_pending_requests_count RPC |
| Accept does nothing | respondToFriendRequest not called | Check onAccept handler |
| Match not created | create_match not called in RPC | Check respond_to_friend_request function body |
| User A doesn't see User B in friends | Matches query doesn't pick up new match | Check fetchFriends query |

---

### 23. Decline Friend Request

**Preconditions:** User A has sent a friend request to User C (pending)

**Steps:**
1. Login as User C
2. Navigate to Friends tab
3. **Expected:** Pending request from User A visible
4. Tap "Decline"
5. **Expected:** Request card removed from pending section
6. Check Supabase `friendships` table
7. **Expected:** status='declined', updated_at is recent
8. Check Supabase `matches` table
9. **Expected:** No match row created for A + C
10. Login as User A
11. Navigate to Add Friend, search for User C
12. **Expected:** User C appears with "Declined" button (disabled, not tappable)
13. **Expected:** User A cannot re-send a request to User C

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Decline does nothing | respondToFriendRequest not called | Check onDecline handler |
| Request card still visible after decline | State not refreshed | Check local state removal |
| User A can still send request | "Declined" status not checked in search | Check getRelationshipStatuses logic |

---

### 24. Mutual Request Auto-Accept

**Preconditions:** User D and User E both have accounts, not currently friends or matched

**Steps:**
1. Login as User D
2. Navigate to Add Friend, search for User E, tap "Add"
3. **Expected:** Button changes to "Requested"
4. Check Supabase: friendship (D→E, pending)
5. Login as User E
6. Navigate to Add Friend, search for User D
7. **Expected:** User D appears with "Accept" button (because D→E is pending_received from E's perspective)
8. **Alternative test:** Tap "Add" (instead of "Accept")
9. **Expected:** Auto-accept triggers — button changes to "Friends ✓"
10. Check Supabase `friendships` table
11. **Expected:** D→E row status='accepted' (no E→D row created)
12. Check Supabase `matches` table
13. **Expected:** Match row exists for D + E
14. Login as User D, navigate to Friends tab
15. **Expected:** User E appears in friends list

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Second request creates duplicate | Mutual detection not working | Check send_friend_request RPC logic for reverse check |
| "Friend request already sent" error | RPC checking wrong direction | Verify step 3 checks (recipient→requester) direction |
| Match not created on auto-accept | create_match not called in auto-accept path | Check send_friend_request auto-accept branch |

---

### 25. Friends List with Availability

**Preconditions:** User A has at least two friends (matched or manually added). One friend has set a work_intent for today, the other has not.

**Setup:**
1. Ensure User B has a work_intent for today (e.g., "Writing blog posts")
2. Ensure User C does NOT have a work_intent for today

**Steps:**
1. Login as User A
2. Navigate to Friends tab
3. **Expected:** Both User B and User C appear in the friends list
4. Verify User B shows:
   - Profile photo/initials
   - Name
   - Green dot (🟢) on right side
   - Task description: "Writing blog posts..." (truncated, 1 line)
5. Verify User C shows:
   - Profile photo/initials
   - Name
   - No green dot
   - "Not available today" in muted italic text
6. Tap User B
7. **Expected:** Navigates to ChatScreen with User B (Matches tab, Chat screen)
8. Verify chat opens with correct match and user info
9. Press back → returns to Matches list (not Friends screen, since we navigated cross-tab)
10. Pull-to-refresh on Friends screen
11. **Expected:** List refreshes (loading indicator briefly visible)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| No availability indicator | work_intents not fetched | Check fetchFriends joins work_intents |
| All friends show "Not available" | intent_date filter wrong | Check `intent_date = CURRENT_DATE` in query |
| Tap friend doesn't navigate | match_id missing on FriendListItem | Check fetchFriends includes match_id |
| Navigation crash | Wrong params passed to Chat screen | Check matchId and otherUser shape matches MatchesStackParamList |
| Cross-tab navigation fails | Wrong navigator path | Check `navigation.navigate('Matches', { screen: 'Chat', params })` |

---

### 26. Profile Screen Verification

**Preconditions:** Logged in, has at least 1 photo uploaded

**Steps:**
1. Navigate to Profile tab
2. Verify Hinge-style layout:
   - Lead photo (~400px) with name overlaid at bottom-left
   - Age · Neighborhood · City line below photo (if set)
   - Info card with work type, tagline, currently working on
   - Work and school (if set)
   - Additional photos interspersed
3. Tap "Edit Profile"
4. **Expected:** EditProfileScreen opens
5. Navigate back
6. Verify "Sign Out" button at bottom

**No Phone / No Friends rows on this screen.**

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Lead photo not rendering at 400px | Style not applied | Check ProfileScreen lead photo height |
| Name not overlaid on photo | Absolute positioning missing | Check name overlay styles |
| Age not showing | Birthday not set or not calculated | Check birthday-to-age logic |
| Info cards not displaying | Profile data not loaded | Check getFullProfile on focus |

---

## Updated Quick Verification Checklist

Run through this after Phase 5 implementation:

```
Phase 1+2 (existing):
[ ] App launches without crash
[ ] Welcome screen renders
[ ] Can create account
[ ] Onboarding completes
[ ] Main tabs appear
[ ] Discover tab requests location
[ ] Intent form works
[ ] Cards display (with test data)
[ ] Swipe gestures work
[ ] Swipe buttons work
[ ] Swipes recorded in database

Phase 3 (existing):
[ ] Mutual right swipe creates match row in database
[ ] Match modal appears (not native Alert)
[ ] Match modal shows both users' info
[ ] "Send Message" navigates to chat
[ ] "Keep Swiping" dismisses modal
[ ] Matches list shows matches with previews
[ ] Chat screen opens from match card
[ ] Can send and receive messages in real time
[ ] Unread badge shows and clears correctly

Phase 4 (existing):
[ ] "Send Cowork Invite" button visible in chat header
[ ] Invite card includes date selection
[ ] Accepting shows system message with emoji
[ ] Dual-lock card appears after acceptance
[ ] Both locks → "🔒❤️" toast and session completed
[ ] Declining and cancelling update card correctly
[ ] Multiple pending invites across matches allowed
[ ] Stale sessions auto-cancel after 24h

Phase 5 (new):
[ ] Profile screen shows Hinge-style layout with name on photo, info cards
[ ] Friends screen shows empty state when no friends
[ ] Can navigate to Add Friend screen via "+"
[ ] Search works by username, email, and phone number
[ ] Search results show correct relationship-aware buttons
[ ] Can send friend request ("Add" → "Requested")
[ ] Recipient sees badge on Friends tab
[ ] Pending requests section shows on Friends screen
[ ] Can accept friend request → moves to friends list
[ ] Can decline friend request → removed from pending
[ ] Mutual requests auto-accept
[ ] Friends list shows availability status (green dot + task)
[ ] Tapping friend navigates to chat
[ ] Pull-to-refresh works on Friends screen
[ ] No crashes or unhandled errors in all flows
[ ] 4-tab bar: Discover, Friends, Chat, Profile
[ ] Friends tab shows friends list and pending requests
[ ] Profile screen shows Hinge-style interleaved photos and info cards
[ ] Edit profile works (all text fields + photos)
[ ] Birthday, neighborhood, city fields in Edit Profile
```

---

## Phase 5 Debugging Tips

### Check Friend Functions
```sql
-- Test send_friend_request directly
SELECT send_friend_request('USER_A_UUID'::uuid, 'USER_B_UUID'::uuid);

-- Test respond_to_friend_request
SELECT respond_to_friend_request('FRIENDSHIP_UUID'::uuid, 'RECIPIENT_UUID'::uuid, 'accept');

-- Test get_pending_requests_count
SELECT get_pending_requests_count('USER_UUID'::uuid);

-- Check all friendships
SELECT f.id, f.status, f.created_at,
       p1.name as requester_name, p2.name as recipient_name
FROM friendships f
JOIN profiles p1 ON f.requester_id = p1.id
JOIN profiles p2 ON f.recipient_id = p2.id
ORDER BY f.created_at DESC;

-- Check if match was created on accept
SELECT m.id, p1.name as user1, p2.name as user2
FROM matches m
JOIN profiles p1 ON m.user1_id = p1.id
JOIN profiles p2 ON m.user2_id = p2.id
ORDER BY m.created_at DESC;

-- Search users (simulate client search)
SELECT id, name, username, email, phone_number
FROM profiles
WHERE username ILIKE '%query%'
   OR email ILIKE '%query%'
   OR phone_number ILIKE '%query%';

-- Check phone number column exists
SELECT phone_number FROM profiles LIMIT 5;
```

### Common Phase 5 Issues

| Issue | Solution |
|-------|----------|
| "function send_friend_request does not exist" | Run `supabase/006_friendships_table.sql` |
| "Cannot send request to this user" | Check friendships table for existing declined row |
| Match not created on accept | Verify `create_match` is called inside `respond_to_friend_request` |
| Badge not showing on Friends tab | Check `getPendingRequestsCount` call in MainTabs on Friends focus |
| Search returns no results | Check ILIKE wildcards and that profile fields are populated |
| Friends list empty despite matches existing | Check `fetchFriends` query filters (should return ALL matches) |
| Cross-tab navigation crash | Verify Chat screen params match `MatchesStackParamList` |
| Phone number not saving | Check profiles UPDATE RLS policy allows `auth.uid() = id` |
| "Already friends" error on add | Users are already matched via swiping — expected behavior |

---
---

# Phase 5: Profile Redesign — Verification Flows

**Added:** 2026-02-16

---

## Database Setup (Profile Redesign)

Before testing profile redesign features, run the SQL migration in Supabase SQL Editor:

7. `supabase/007_profile_photos.sql` — profile_photos table, profile columns (tagline, currently_working_on, work, school, birthday, neighborhood, city), avatars bucket, storage policies

After running, verify:
1. Go to Table Editor → verify `profile_photos` table exists
2. Go to Table Editor → verify `profiles` table has `tagline`, `currently_working_on`, `work`, `school`, `birthday`, `neighborhood`, `city` columns
3. Go to Authentication → Policies → verify RLS policies on `profile_photos` table
4. Go to Storage → verify `avatars` bucket exists (public)
5. Go to Storage → Policies → verify read/write policies on `avatars` bucket

---

### 27. Verify Profile Redesign Database

**Preconditions:** SQL migration `007_profile_photos.sql` executed

**Steps:**
1. Open Supabase SQL Editor
2. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
3. **Expected:** `profile_photos` listed alongside existing tables
4. Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('tagline', 'currently_working_on', 'work', 'school', 'birthday', 'neighborhood', 'city');`
5. **Expected:** Seven rows: `tagline` (text), `currently_working_on` (text), `work` (text), `school` (text), `birthday` (date), `neighborhood` (text), `city` (text)
6. Run: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profile_photos';`
7. **Expected:** Columns: `id` (uuid), `user_id` (uuid), `photo_url` (text), `position` (integer), `created_at` (timestamp with time zone)
8. Run: `SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profile_photos';`
9. **Expected:** RLS policies for SELECT (public), INSERT, UPDATE, DELETE (owner only)
10. Test inserting a profile photo directly:
    ```sql
    INSERT INTO profile_photos (user_id, photo_url, position)
    VALUES ('USER_UUID'::uuid, 'https://example.com/test.jpg', 0);
    ```
11. **Expected:** Row inserted successfully
12. Test unique constraint:
    ```sql
    INSERT INTO profile_photos (user_id, photo_url, position)
    VALUES ('USER_UUID'::uuid, 'https://example.com/test2.jpg', 0);
    ```
13. **Expected:** Error — duplicate key violation (user_id, position)
14. Verify storage bucket:
    ```sql
    SELECT * FROM storage.buckets WHERE id = 'avatars';
    ```
15. **Expected:** One row, public = true

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| profile_photos table not found | SQL not run | Execute `007_profile_photos.sql` |
| Storage bucket not found | Bucket creation failed or needs Dashboard | Create `avatars` bucket via Supabase Dashboard → Storage |
| Storage upload fails | Storage policies not applied | Apply storage policies via Dashboard → Storage → Policies |
| Profile columns missing | ALTER TABLE failed | Check for syntax errors in migration SQL |

---

### 28. New User Onboarding with Photo Upload

**Preconditions:** Fresh account (not onboarded)

**Steps:**
1. Create a new account (email + password)
2. Complete Step 1 — enter name
3. Complete Step 2 — select work type
4. Complete Step 3 — select interests
5. **Expected:** Step 4 appears: "Add a photo" with PhotoSlots grid
6. **Expected:** "Get Started" button is disabled (no photo uploaded yet)
7. Tap the primary photo slot
8. **Expected:** Photo picker opens (device library)
9. Select a photo
10. **Expected:** Photo appears in the primary slot
11. **Expected:** "Get Started" button becomes enabled
12. Tap "Get Started"
13. **Expected:** Navigated to main app (Discover tab)
14. Check Supabase `profile_photos` table
15. **Expected:** One row with user_id, position=0, photo_url pointing to avatars bucket
16. Check Supabase `profiles` table
17. **Expected:** `photo_url` matches the uploaded photo URL, `onboarding_complete = true`

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Photo picker doesn't open | expo-image-picker not installed | Run `npx expo install expo-image-picker` |
| Photo picker permissions denied | iOS permissions not configured | Check app.json for photo library permission |
| Upload fails | Storage bucket not configured | Check avatars bucket exists and policies are set |
| "Get Started" always disabled | Photo upload state not tracked | Check state management in onboarding Step 4 |
| Profile photo_url not synced | uploadPhoto not updating profiles table | Check photoService.ts syncs photo_url for position 0 |

---

### 29. Profile Screen Visual Verification

**Preconditions:** User is logged in with profile data and at least one photo

**Steps:**
1. Navigate to Profile tab
2. **Expected:** Lead photo displayed prominently (~200px height)
3. If 2+ photos: **Expected:** Thumbnail row visible below lead photo
4. **Expected:** Name displayed (24px, bold)
5. If tagline set: **Expected:** Tagline in italic below name
6. If "currently working on" set: **Expected:** Section with label and text
7. If work/school set: **Expected:** Displayed below working on section
8. **Expected:** Work type badge (pill) visible
9. **Expected:** "Edit Profile" button visible
10. **Expected:** "Phone Number" and "My Friends" rows visible (from P5-07)
11. **Expected:** "Sign Out" button at bottom

**No Photos Test:**
1. Login as user with no photos
2. **Expected:** Initials shown in lead photo area on `#E8E7E4` background
3. **Expected:** Migration banner visible: "Add a photo so people know who they're meeting!"
4. Tap migration banner
5. **Expected:** Navigates to EditProfile screen

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Lead photo not showing | getFullProfile not called on focus | Check useFocusEffect |
| Thumbnails not visible | Only 1 photo exists | Expected — thumbnails only show for 2+ photos |
| Migration banner always visible | Photo check logic wrong | Verify checking profile_photos count, not profiles.photo_url |
| Edit Profile button missing | Layout not updated | Check ProfileScreen rewrite |

---

### 30. Edit Profile Flow

**Preconditions:** User is logged in, on Profile screen

**Steps:**
1. Tap "Edit Profile"
2. **Expected:** Edit Profile screen opens with Cancel/Save header
3. **Expected:** PhotoSlots grid shows current photos (or empty slots)
4. **Expected:** Text fields pre-populated with current values
5. Change tagline to "Building the future"
6. Change currently working on to "A new social app"
7. Change work to "Startup Co"
8. Change school to "MIT"
9. Select a different work type
10. Tap "Save"
11. **Expected:** Navigates back to Profile screen
12. **Expected:** All changes visible on Profile screen
13. Check Supabase `profiles` table
14. **Expected:** Updated values for tagline, currently_working_on, work, school, work_type

**Photo Management in Edit Profile:**
1. Open Edit Profile
2. Tap an empty photo slot
3. **Expected:** Photo picker opens
4. Select a photo
5. **Expected:** Photo appears in the slot immediately (uploaded right away)
6. Check Supabase: new row in `profile_photos`, file in `avatars` bucket
7. Tap a filled photo slot
8. **Expected:** Action sheet: "Change Photo" / "Remove Photo" / "Set as Primary" (if not position 0) / "Cancel"
9. Tap "Remove Photo"
10. **Expected:** Photo removed from slot immediately
11. Check Supabase: row removed from `profile_photos`, file removed from storage
12. Tap "Cancel" (header button)
13. **Expected:** Navigates back — text changes discarded, but photo changes persist

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Fields not pre-populated | Profile data not loaded | Check initial state from navigation params or fetch |
| Save does nothing | updateProfile not called | Check save handler |
| Photo upload fails silently | Storage policy issue | Check avatars bucket policies |
| Changes lost after save | refreshProfile not called before goBack | Check save flow calls refreshProfile |
| Cancel reverts photo uploads | Photos should persist | Ensure photos upload immediately, not batched |

---

### 31. Discover Card with Photo and Tagline

**Preconditions:** User has profile with photo and tagline, another user is discovering

**Steps:**
1. Login as User A (has photo and tagline set)
2. Set a work intent for today
3. Login as User B (different user)
4. Set a work intent, then view Discover feed
5. Find User A's card
6. **Expected:** User A's photo displayed in card photo area (not initials)
7. **Expected:** Tagline visible below work type in overlay (italic, white text)
8. **Expected:** Existing card elements unchanged (name, distance, task, tags, meta)

**No Tagline Test:**
1. Login as User C (has photo but no tagline)
2. Discover User C's card
3. **Expected:** Photo shows, but no tagline line in overlay (graceful null handling)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Photo not showing on card | photo_url not populated on profiles table | Check photoService syncs profiles.photo_url |
| Tagline not visible | Not added to SwipeCard overlay | Check SwipeCard.tsx modification |
| Card layout broken | Tagline line taking too much space | Check numberOfLines={1} and styling |

---

### 32. Avatar Verification (MatchCard + MatchModal)

**Preconditions:** User A has uploaded a photo (profiles.photo_url is set). User A is matched with User B.

**Steps:**
1. Login as User B
2. Navigate to Matches tab
3. Find User A's match card
4. **Expected:** User A's photo visible (circular, 48x48px) instead of initials
5. Trigger a new match with a user who has a photo
6. **Expected:** MatchModal shows the matched user's photo (circular, 80x80px)

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| MatchCard still shows initials | photo_url not set on profiles | Check profiles table for photo_url value |
| MatchModal shows initials | matchedUser prop missing photo_url | Check profile data passed to modal |
| Photo shows as broken image | URL is stale or storage bucket is private | Check avatars bucket is public |

---

### 33. Editable Username (P5-18 Add-On)

**Preconditions:** User is logged in and on Profile screen

**Steps:**
1. Tap "Edit Profile"
2. **Expected:** Username field is visible and pre-populated with current username
3. Change username to a new valid value (example: `chloeguokuoi`)
4. Tap "Save"
5. **Expected:** Navigates back to Profile screen with no error
6. Check Supabase:
   ```sql
   SELECT username
   FROM profiles
   WHERE id = 'USER_UUID';
   ```
7. **Expected:** `username` is updated to the new value
8. Return to Add Friend screen from another user account
9. Search for the updated username
10. **Expected:** User appears in results with updated handle

**Duplicate Username Test:**
1. Open Edit Profile as User B
2. Enter a username already used by User A
3. Tap "Save"
4. **Expected:** Clear user-facing error (e.g., "Username is already taken")
5. **Expected:** Existing username remains unchanged in `profiles`

**Invalid Username Test:**
1. Enter invalid values (too short, spaces, unsupported symbols)
2. Tap "Save"
3. **Expected:** Validation error shown; no update sent/applied

**Common Failures:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Username not saved | Field not included in update payload | Include `username` in update service payload |
| Duplicate username allowed | DB uniqueness missing | Add/verify unique constraint on `profiles.username` |
| Duplicate error shown as generic failure | Conflict not parsed | Map DB conflict to user-friendly "Username is already taken" |
| Search doesn't find updated username | Search query/filter mismatch | Verify user search includes `username` ILIKE filter |

---

## Updated Quick Verification Checklist

Run through this after profile redesign implementation:

```
Phase 5 Profile Redesign (new):
[ ] Database: profile_photos table exists with correct columns
[ ] Database: profiles table has tagline, currently_working_on, work, school columns
[ ] Storage: avatars bucket exists (public, 5MB limit)
[ ] New user onboarding has 4 steps
[ ] Step 4 requires at least 1 photo to proceed
[ ] Photo uploads to Supabase Storage + profile_photos table
[ ] profiles.photo_url synced when position 0 photo uploaded
[ ] Profile screen shows lead photo or initials fallback
[ ] Profile screen shows thumbnail row for 2+ photos
[ ] Profile screen shows tagline, currently working on, work, school
[ ] Migration banner shows for users without photos
[ ] Edit Profile screen opens from Profile screen
[ ] Edit Profile shows PhotoSlots with current photos
[ ] Can upload photos (immediate)
[ ] Can remove photos (immediate)
[ ] Can edit text fields and save
[ ] Save persists changes to database
[ ] Cancel discards text changes, preserves photo changes
[ ] SwipeCard shows photo and tagline
[ ] MatchCard shows photo
[ ] MatchModal shows photos
[ ] Users can update username (valid + unique)
[ ] No crashes or unhandled errors
```

---

## Profile Redesign Debugging Tips

### Check Profile Data
```sql
-- Check profile fields
SELECT id, name, tagline, currently_working_on, work, school, work_type, photo_url
FROM profiles
WHERE id = 'USER_UUID';

-- Check profile photos
SELECT * FROM profile_photos WHERE user_id = 'USER_UUID' ORDER BY position;

-- Check storage files
SELECT name, bucket_id, created_at
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC;
```

### Common Profile Redesign Issues

| Issue | Solution |
|-------|----------|
| Photo picker doesn't open | Run `npx expo install expo-image-picker`, check iOS permissions |
| Upload fails with 403 | Check storage bucket policies, verify user is authenticated |
| Photo URL returns 404 | Check file was actually uploaded, verify bucket is public |
| Profile changes don't persist | Check updateProfile query, verify RLS allows UPDATE |
| Username update fails | Check unique constraint + username validation + update payload |
| Onboarding stuck on Step 3 | Check totalSteps changed from 3 to 4 |
| EditProfile save doesn't navigate back | Check goBack() called after updateProfile resolves |
| Tagline not on SwipeCard | Check SwipeCard.tsx was modified to include tagline |

---

# Phase 6: Friend Profile View — Verification Flows

**Added:** 2026-02-27

---

## No New Database Setup

Phase 6 requires no new SQL migrations. All data is read from tables introduced in Phases 1, 2, and 5. Ensure all prior phase SQL files have been applied before testing.

---

### 34. Open a Friend's Profile from the Friends Tab

**Preconditions:**
- Logged in as User A
- User A has at least one accepted friend visible in the Friends screen
- The friend has a complete profile (name, photo, at least some fields set)

**Steps:**
1. Open app → navigate to Friends tab
2. Locate a friend card in "Available Today" or "Not Available" section
3. Tap the **avatar** (circular photo or initials) on the left side of the card

**Expected:**
- Bottom sheet modal slides up
- While loading: modal body shows centered `ActivityIndicator`
- After load: full profile visible (photos, name, age, pills, Today's Focus if set, field rows)
- `💬` icon visible in top-right corner of modal header throughout

---

### 35. Verify Card Tap Zones Are Distinct

**Preconditions:**
- Same as Test 34

**Steps:**
1. Tap the **avatar** on a friend card → profile modal opens
2. Dismiss modal (swipe down)
3. Tap the **friend's name** or any area of the card body outside the avatar

**Expected:**
- Avatar tap → profile modal opens (does NOT open chat)
- Name / card body tap → chat screen opens (does NOT open profile modal)

---

### 36. Message a Friend from Their Profile Modal

**Preconditions:**
- Same as Test 34
- The friend has an existing chat (`match_id` is set)

**Steps:**
1. Tap a friend's avatar → profile modal opens and loads
2. Tap the `💬` icon in the top-right corner of the modal

**Expected:**
- Modal dismisses
- App navigates to Matches tab → Chat screen for that friend
- Existing conversation is shown

---

### 37. Friend with No Today's Intent

**Preconditions:**
- User A has a friend who has NOT set a Today's Focus for today

**Steps:**
1. Tap the avatar of a friend without today's intent

**Expected:**
- Profile modal loads successfully
- Today's Focus card is NOT shown (no empty CTA, no placeholder card)
- Other profile sections (photos, name, field rows) appear normally

---

### 38. Friend in "Not Available" Section

**Preconditions:**
- User A has a friend in the "Not Available" section

**Steps:**
1. Tap the avatar of a friend in the "Not Available" section

**Expected:**
- Profile modal opens and behaves identically to Test 34
- Section membership (Available / Not Available) does not affect modal behavior

---

## Phase 6 Common Failures

| Issue | Solution |
|-------|----------|
| Avatar tap opens chat instead of profile modal | Check inner `TouchableOpacity` wraps avatar in `FriendCard.tsx`; verify `onProfilePress` prop is passed from `FriendsScreen` |
| Modal stays on spinner indefinitely | Check `handleOpenProfile` sets `profileLoading` to `false` after `Promise.all` resolves; check Supabase RLS allows SELECT on `profiles`, `profile_photos`, `work_intents` |
| `💬` icon not visible | Check modal header layout; verify icon is not hidden behind safe area inset or padding |
| Tapping `💬` doesn't navigate to chat | Check `onMessage` handler closes modal before calling `openChat`; verify `profileModalFriend` is not null at call time |
| TypeScript errors | Ensure `Profile`, `ProfilePhoto`, `WorkIntent` imported from `../../types` in `FriendProfileModal` and `FriendsScreen` |

---

---

## Phase 7 — Group Chat

### Database Migration

Before testing Phase 7, run the new migration in Supabase SQL Editor:

- `supabase/008_group_chats.sql` — group_chats, group_members, group_messages, group_sessions, group_session_rsvps tables + RPCs

---

### 39. Verify Phase 7 Database

**Preconditions:** Supabase dashboard access; `008_group_chats.sql` executed

**Steps:**
1. In Supabase SQL Editor, run:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name LIKE 'group%';
   ```
2. Run:
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE '%group%';
   ```
3. Run:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename LIKE 'group%';
   ```

**Expected:**
- [ ] Tables visible: `group_chats`, `group_members`, `group_messages`, `group_sessions`, `group_session_rsvps`
- [ ] RPCs visible: `create_group_chat`, `fetch_group_chat_previews`, `add_group_members`, `leave_group`, `rsvp_group_session`, `mark_group_read`
- [ ] All 5 tables show `rowsecurity = true`

---

### 40. Create Group Chat

**Preconditions:**
- User A is logged in
- User A has at least 2 friends (matched or manual)

**Steps:**
1. Navigate to the Chats tab
2. Tap the `+` button in the top-right of the screen header
3. Enter group name: "Friday Squad"
4. Tap 2 friends from the list to select them
5. Tap "Create" in the header

**Expected:**
- [ ] `+` button is visible in Chats tab header
- [ ] `CreateGroupScreen` opens
- [ ] "Create" button is disabled initially (name empty + 0 members)
- [ ] Typing name enables "Create" only after ≥1 member also selected
- [ ] Selected friends appear as `MemberChip` row below search
- [ ] Friends with `has_intent_today = true` appear above others in list
- [ ] Tapping "Create" navigates to `GroupChatScreen` with title "Friday Squad"
- [ ] Group name visible in header as "Friday Squad (3 members)"

**Persistence check:**
- In Supabase: `group_chats` table shows new row with `name = 'Friday Squad'`
- `group_members` table shows 3 rows (creator + 2 selected friends) for that group

---

### 41. Send and Receive Group Messages

**Preconditions:**
- User A and User B are both members of the same group
- Both users have the app open to the same `GroupChatScreen`

**Steps:**
1. User A types "Anyone at Blue Bottle Friday?" and taps send
2. User B observes their GroupChatScreen

**Expected:**
- [ ] User A: message appears right-aligned immediately after send
- [ ] User B: message appears left-aligned with User A's avatar and name above bubble
- [ ] Both users see the message in under 2 seconds (real-time subscription)
- [ ] User B: avatar is tappable → opens `UserProfileModal` for User A
- [ ] User B: Chats tab badge clears after opening the group chat

**Persistence check:**
- In Supabase: `group_messages` table shows new row with correct `group_chat_id` and `sender_id`

---

### 42. Group Chat Appears in Unified Chats List

**Preconditions:**
- User A has at least 1 group chat and at least 1 1:1 match

**Steps:**
1. Navigate to the Chats tab
2. Observe the list

**Expected:**
- [ ] Group "Friday Squad" appears in the same list as 1:1 match chats
- [ ] Group row shows 👥 icon, "Friday Squad", member count, and last message preview
- [ ] List is sorted by most recent activity (most recently active at top)
- [ ] If group has no messages: preview shows "No messages yet" in muted italic; sorted last
- [ ] Unread groups show a green dot (✦) on the row

---

### 43. Propose Group Session and RSVP

**Preconditions:**
- User A, User B, and User C are all members of "Friday Squad"
- All three have the app open to the `GroupChatScreen`

**Steps:**
1. User A taps the 📅 button in the `GroupChatScreen` header
2. User A selects "Friday, Mar 13" from the date options
3. User A taps "Send"
4. User B sees the `GroupSessionRSVPCard` appear in the timeline
5. User B taps "Yes ✓"
6. User C taps "No ✗"

**Expected:**
- [ ] User A: `InviteComposerCard` opens with 7-day date options when 📅 tapped
- [ ] User A: Tapping "Send" closes the composer and RSVP card appears in timeline
- [ ] RSVP card shows: "Friday, Mar 13" + "Proposed by Alex" + "0 going · 0 not going · 3 pending"
- [ ] User B sees card appear in real time
- [ ] User B taps Yes → card updates: "1 going · 0 not going · 2 pending"; response pill shows "You're going ✓"
- [ ] User C taps No → card updates: "1 going · 1 not going · 1 pending"; response pill shows "You can't make it ✗"
- [ ] User A sees RSVP counts update in real time
- [ ] Cancel button visible to User A (proposer only)

**Persistence check:**
- In Supabase: `group_sessions` table shows new row with `status = 'proposed'` and `scheduled_date = '2026-03-13'`
- `group_session_rsvps` table shows 2 rows: one `yes` (User B), one `no` (User C)

---

### 44. Group Info and Management

**Preconditions:**
- User A is a member of "Friday Squad" (3 members)
- User A has a 4th friend not currently in the group

**Steps:**
1. In `GroupChatScreen`, tap the ⓘ button
2. Observe `GroupInfoScreen`
3. Tap the group name "Friday Squad" to enter edit mode
4. Rename to "Blue Bottle Crew" and save
5. Navigate back to `GroupChatScreen`
6. Return to `GroupInfoScreen` and tap "+ Add Members"
7. Search for and select the 4th friend
8. Confirm add

**Expected:**
- [ ] `GroupInfoScreen` shows group name + "Created by [name]" + member list (3 members with "You" badge)
- [ ] Tapping name enters edit mode (TextInput appears)
- [ ] Tapping ✓ saves name and returns to display mode
- [ ] `GroupChatScreen` header shows "Blue Bottle Crew" after navigating back
- [ ] "+ Add Members" opens friend search filtered to friends NOT already in group
- [ ] Adding the 4th friend → member list now shows 4 members
- [ ] `npx tsc --noEmit` passes

---

### 45. Leave Group

**Preconditions:**
- User A is a member of "Blue Bottle Crew" (4 members)

**Steps:**
1. In `GroupInfoScreen`, tap "Leave Group"
2. Confirm the alert

**Expected:**
- [ ] Confirmation `Alert` appears with group name
- [ ] Confirming navigates back to MatchesList (`navigation.popToTop()`)
- [ ] "Blue Bottle Crew" no longer appears in User A's Chats list
- [ ] Other members (B, C, D) still see the group in their Chats list

**Persistence check:**
- In Supabase: `group_members` shows no row for `(group_chat_id, user_a_id)`
- `group_chats` row still exists (soft leave)

---

### 46. Group Unread Badge

**Preconditions:**
- User A is a member of "Friday Squad"
- User A is on a different tab (not Chats)
- User B sends a message to the group

**Steps:**
1. While User A is on the Discover tab, User B sends "Are we still on for Friday?"
2. User A switches to Chats tab
3. User A taps the "Friday Squad" group row

**Expected:**
- [ ] Chats tab badge shows a count (or dot) indicating unread messages
- [ ] "Friday Squad" row shows green unread dot (✦) before User A opens it
- [ ] After opening `GroupChatScreen`, the unread dot clears
- [ ] Chats tab badge count decreases (or disappears) after reading

---

## Phase 7 Common Failures

| Issue | Solution |
|-------|---------|
| "+" button missing from Chats tab | Check `MatchesListScreen` header options; ensure Pressable is added to `navigation.setOptions` or inline header |
| Group chats not appearing in list | Check `fetchGroupChats` is called in parallel with `fetchMatches`; verify `fetch_group_chat_previews` RPC exists and user is in `group_members` |
| Real-time messages not appearing | Check `subscribeToGroupMessages` subscription is active; verify `group_messages` table has realtime enabled in Supabase; check `group_chat_id` filter matches |
| RSVP counts not updating | Check `rsvpGroupSession` calls `rsvp_group_session` RPC; verify `group_session_rsvps` `UNIQUE` constraint allows upsert; re-fetch sessions after RSVP |
| GroupChatScreen header still shows old name after rename | Check `GroupInfoScreen` uses `navigation.setParams` or caller re-fetches on `useFocusEffect` |
| TypeScript errors | Run `npx tsc --noEmit`; check all new types exported from `src/types/index.ts`; check `MatchesStackParamList` includes all 3 new routes |
| `create_group_chat` RPC not found | Verify `008_group_chats.sql` was executed in Supabase SQL Editor |
| Avatar in `GroupMessageBubble` not showing photo | Check `sender_id` is joined to `profiles.photo_url` when fetching messages; initials fallback should always render |
| Modal won't swipe-to-dismiss | Verify `onRequestClose={onDismiss}` is set on `<Modal>` and `presentationStyle="pageSheet"` is present |
