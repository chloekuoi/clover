# Manual QA: RPC Security Fixes

**Created:** June 7, 2026  
**Purpose:** Confirm the live RPC authentication fixes did not break normal app behavior.

## Test Accounts

Prepare three completed accounts:

- **User A**
- **User B**
- **User C**

User A and User B should have an active match with at least one existing message. User C
is useful for creating separate pending friend requests.

Monitor the Metro console, device logs, and Supabase network responses during each test.

## 1. Match Previews Load

### Setup

- User A and User B have an active match.
- Their conversation contains at least one message.

### Steps

1. Sign in as User A.
2. Open the Matches tab.
3. Switch to the direct-message list if necessary.
4. Pull to refresh or leave and reopen the tab.

### Expected Result

- The A/B match appears.
- User B's name, photo, latest-message preview, timestamp, and unread badge load correctly.
- The screen does not remain in a loading state or become empty unexpectedly.

### Watch For

- `Error fetching matches`
- `Unauthorized`
- `permission denied for function fetch_match_previews`
- HTTP `401`, `403`, or PostgREST RPC errors for `fetch_match_previews`
- Function-signature or return-column mismatch errors

## 2. Unread Count Loads

### Setup

- User B sends User A a message.
- User A has not opened the conversation since that message was sent.

### Steps

1. Sign in as User A without opening the A/B chat.
2. View the Matches tab badge and match-row unread indicator.
3. Move between another tab and Matches to trigger a refresh.

### Expected Result

- The unread badge appears and shows the expected count.
- The app does not reset the count to zero before the chat is opened.
- Other navigation remains responsive.

### Watch For

- `Error fetching unread count`
- `Unauthorized`
- `permission denied for function get_unread_count`
- HTTP `401`, `403`, or RPC errors for `get_unread_count`
- A count of zero when unread messages definitely exist

## 3. Chat Opens

### Setup

- User A and User B have an active match.
- Their conversation contains existing messages.

### Steps

1. Sign in as User A.
2. Open the Matches tab.
3. Tap the User B match row.
4. Wait for the message history to load.

### Expected Result

- Chat opens without an error alert.
- Existing messages appear in chronological order.
- The message input is available.
- Realtime connection begins without repeatedly reconnecting.

### Watch For

- `Error fetching messages`
- `Error fetching match`
- `Unauthorized`
- RLS or permission errors for `messages` or `matches`
- HTTP `401` or `403`
- An empty conversation when database messages exist

## 4. Messages Mark As Read

### Setup

- User B sends User A at least one unread message.
- Confirm User A has an unread badge before opening the chat.

### Steps

1. Sign in as User A.
2. Note the unread count for User B.
3. Open the User B chat.
4. Return to the Matches list.
5. Refresh the list if the badge does not update immediately.
6. Close and reopen Clover to confirm the state persists.

### Expected Result

- The unread badge clears after User A opens the chat.
- It remains cleared after refresh and app restart.
- User B's read state is not changed by User A opening the chat.

### Watch For

- `Error marking chat as read`
- `Unauthorized`
- `permission denied for function mark_chat_read`
- HTTP `401`, `403`, or RPC errors for `mark_chat_read`
- The unread badge returning after refresh

## 5. Friend Request Accept Works

### Setup

- User C sends a friend request to User A.
- The request remains pending.
- User A and User C do not already have an active match.

### Steps

1. Sign in as User A, the request recipient.
2. Open the Friends tab.
3. Expand Pending Requests if needed.
4. Find User C and tap **Accept**.
5. Return to the friend list and then open Matches.

### Expected Result

- The pending request disappears.
- User C appears as a friend.
- A match is created, allowing User A to open a chat with User C.
- Refreshing the Friends and Matches screens preserves the accepted state.

### Watch For

- `Error responding to friend request`
- `Unauthorized`
- `Only recipient can respond to friend request`
- `Friend request is not pending`
- `permission denied for function respond_to_friend_request`
- HTTP `401`, `403`, duplicate-match, or constraint errors

## 6. Friend Request Decline Works

### Setup

- Create another pending friend request addressed to User A.
- Use User B or reset the User C relationship if needed.

### Steps

1. Sign in as User A, the request recipient.
2. Open the Friends tab and Pending Requests.
3. Tap **Decline** on the pending request.
4. Refresh or reopen the Friends tab.
5. Check the Matches tab.

### Expected Result

- The pending request disappears.
- The sender is not added to User A's friend list.
- No new match or chat is created.
- The request does not return after refresh.

### Watch For

- `Error responding to friend request`
- `Unauthorized`
- `Only recipient can respond to friend request`
- `Friend request is not pending`
- `permission denied for function respond_to_friend_request`
- HTTP `401`, `403`, or unexpected match creation

## Results

| Test | Result | Notes |
|---|---|---|
| Match previews load | Not tested | |
| Unread count loads | Not tested | |
| Chat opens | Not tested | |
| Messages mark as read | Not tested | |
| Friend request accept works | Not tested | |
| Friend request decline works | Not tested | |

## Pass Criteria

All six tests must pass without `Unauthorized`, permission-denied, HTTP `401`/`403`, or
RPC signature errors during legitimate use by the authenticated user.
