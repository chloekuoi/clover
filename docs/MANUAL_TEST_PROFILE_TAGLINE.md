# Manual Test: Profile Tagline Schema Drift Fix

**Date created:** 2026-06-05  
**Scope:** Verify that `tagline` is the only source for the profile About card.

## Preconditions

- Use an account with onboarding completed.
- The account can open Edit Profile.
- Have at least one other test account available for Discovery or Friend Profile testing.

## Test 1: Tagline Appears

1. Open the Profile tab.
2. Tap **Edit**.
3. Enter distinctive text in the **About** field, such as:
   `Testing the canonical tagline field.`
4. Save the profile.
5. Return to the Profile tab.

Expected:

- The About card displays the saved text.
- No error appears while saving or loading the profile.

## Test 2: Shared Profile Views

View the updated account from another test account in:

1. Discovery.
2. Friend Profile, if the accounts are friends.

Expected:

- The About card displays the same saved tagline in each available view.
- The card content is consistent across Profile, Discovery, and Friend Profile.

## Test 3: Empty Tagline

1. Open Edit Profile.
2. Clear the **About** field.
3. Save the profile.
4. Check Profile, Discovery, and Friend Profile again.

Expected:

- The About card is hidden.
- Old `bio` or `one_liner` content does not appear as fallback text.
- The surrounding feed layout has no unexpected blank card or gap.

## Test 4: Persistence

1. Add an About value again and save.
2. Fully close and reopen Clover.
3. Return to the Profile tab.

Expected:

- The saved tagline still appears in the About card.

## Results

| Test | Result | Notes |
|---|---|---|
| Tagline appears | Not tested | |
| Shared profile views | Not tested | |
| Empty tagline hides card | Not tested | |
| Tagline persists after restart | Not tested | |

---

# Manual Test: Messages RLS Policy

**Date added:** 2026-06-07  
**Scope:** Verify that active matches can message normally and unmatched users cannot send new messages.

## Preconditions

- Use two test accounts, Account A and Account B.
- Account A and Account B must have an active match.
- Both accounts must be available on separate devices, simulators, or alternating authenticated sessions.

## Test 1: Send and Receive

1. Sign in as Account A.
2. Open the chat with Account B.
3. Send a distinctive message.
4. Open the same chat as Account B.
5. Confirm the message appears.
6. Reply from Account B.
7. Confirm Account A receives the reply.

Expected:

- Both accounts can send messages while the match is active.
- Messages appear for the recipient through Realtime or after refresh.
- No RLS or permission error appears.

## Test 2: Message Persistence

1. Close the chat on both accounts.
2. Reopen the conversation.

Expected:

- Messages from both accounts remain visible.
- Messages appear in the correct order.

## Test 3: Unread State

1. Keep Account B outside the conversation.
2. Send a new message from Account A.
3. Confirm Account B receives an unread indicator.
4. Open the conversation as Account B.
5. Return to the Matches list.

Expected:

- The unread indicator appears after receiving the message.
- The unread indicator clears after Account B opens the chat.

## Test 4: Messaging After Unmatch

1. Unmatch Account A and Account B.
2. If the old conversation is still accessible, attempt to send another message.
3. Refresh or reopen the Matches list.

Expected:

- The former match cannot send a new message.
- The app may show a failed-to-send message or remove the conversation.
- No new message row is created in Supabase.

## Results

| Test | Result | Notes |
|---|---|---|
| Active match sends and receives | Not tested | |
| Messages persist after reopening | Not tested | |
| Unread indicator clears correctly | Not tested | |
| Messaging blocked after unmatch | Not tested | |
