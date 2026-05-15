# Phase 3: Matching & Messaging — CERTIFICATION

**Status:** CERTIFIED COMPLETE
**Certified:** 2026-02-08
**Phase completed:** 2026-02-08

---

## Guaranteed Behaviors

The following behaviors are verified and must not regress:

1. **Match persistence** — Mutual right swipe creates a persistent row in the `matches` table. `create_match` RPC orders user IDs (`user1_id < user2_id`) and is idempotent (duplicate calls return the existing match).
2. **Custom match modal** — MatchModal component replaces the native Alert. Shows both users' profile photos (or initials), "It's a Match!" heading, subtitle, "Send Message" and "Keep Swiping" buttons.
3. **Send Message navigation** — "Send Message" in MatchModal navigates cross-tab from Discover to Matches tab → Chat screen with correct `matchId` and `otherUser` params.
4. **Keep Swiping** — "Keep Swiping" dismisses the modal and discovery continues with the next card (or empty state).
5. **Matches list** — MatchesListScreen shows all user's matches as a FlatList of MatchCard components, sorted by most recent activity.
6. **MatchCard display** — Each card shows circular profile photo (or initials fallback), name, last message preview (or "Say hello!"), relative timestamp, and green unread dot when `unread_count > 0`. Name is bold when unread.
7. **Matches empty state** — Shows "No matches yet" with encouragement text when user has zero matches.
8. **Chat screen** — ChatScreen opens from MatchCard tap with real-time messaging. Header shows other user's name and back button.
9. **Message send** — User types message, send button enables. Tap send inserts to `messages` table, clears input, appends to list, scrolls to bottom.
10. **Message receive (real-time)** — Supabase Realtime subscription on `messages` table delivers incoming messages without manual refresh.
11. **Message styling** — Sent messages: right-aligned, sage green (`#A8B5A2`) background, white text. Received messages: left-aligned, cream (`#E8DCD0`) background, dark text.
12. **Mark as read** — Chat marks as read on screen open and on incoming messages via `mark_chat_read` RPC. Updates the correct `last_read_at` column based on user position in match.
13. **Unread badge** — Matches tab shows numeric badge when unread count > 0. Badge updates on tab focus and after opening a chat.
14. **Pull-to-refresh** — Matches list supports pull-to-refresh. Also refreshes on screen focus via `useFocusEffect`.
15. **Keyboard handling** — KeyboardAvoidingView pushes chat input bar above keyboard on iOS.
16. **Send button state** — Send button disabled (opacity 0.4) when input is empty (trimmed). Enabled when text present.
17. **Chat empty state** — Shows "Start the conversation!" with wave emoji when no messages exist.

---

## Explicit Exclusions (Out of Scope for Phase 3)

These were intentionally NOT implemented:

- No message editing or deletion (messages are immutable)
- No message pagination (all messages fetched at once)
- No typing indicators
- No push notifications for new messages
- No image or file attachments in chat
- No message reactions
- No search within matches or messages
- No unmatch or delete match functionality
- No online/offline status indicators
- No message length limit (no CHECK constraint on content length)
- No confetti or sound effects on match modal
- No real-time badge updates (polling on tab focus only)
- No per-message read receipts

---

## Hard Constraints Phase 4 Must Respect

1. **`matches` table uses ordered user IDs** — `user1_id < user2_id`. Any join or lookup must account for this ordering.
2. **`messages` table is immutable** — No UPDATE or DELETE policies. No `type` column. Phase 4 must NOT alter the `messages` table schema.
3. **MatchesStack has two screens** — `MatchesList` and `Chat`. Phase 4 may add screens to this stack but must not rename or remove existing ones.
4. **MatchesStackParamList defines route params** — `Chat` screen expects `{ matchId: string; otherUser: MatchPreviewOtherUser }`. Phase 4 must not change this contract.
5. **`messagingService.ts` is the messaging API layer** — Functions: `fetchMatches`, `fetchMessages`, `sendMessage`, `markChatRead`, `getUnreadCount`, `subscribeToMessages`. Phase 4 must not modify these functions.
6. **MatchesStackContext provides `refreshUnreadCount()`** — Used by ChatScreen and MainTabs for badge updates. Phase 4 may call this but must not change its interface.
7. **Realtime pattern** — Subscribe to INSERT events on `messages` filtered by `match_id`. Phase 4 may add additional subscriptions for sessions but must not alter the message subscription.
8. **Cross-tab navigation** — Pattern: `navigation.navigate('Matches', { screen: 'Chat', params: {...} })`. Phase 4 may extend with new screen targets.
9. **Three tabs remain** — Discover, Matches, Profile. Phase 4 must not add or remove tabs.
10. **Design system "Digital Matcha"** — All new UI must use established color tokens, spacing scale, typography, and border radius from `src/constants/`.
11. **Supabase client at `lib/supabase.ts`** — All database access goes through this client.
12. **React Navigation 7** — Stack and Tab navigators require `id` prop.

---

## Known Non-Issues (Intentionally Not Handled)

| Item | Reason |
|------|--------|
| No real-time badge updates | Polling on tab focus is sufficient for MVP |
| 100+ messages not paginated | FlatList handles it; no performance issue at MVP scale |
| Empty-state text visible behind match modal | Cosmetic — modal overlay covers it, minor visual leak |
| No notification for first swiper when match occurs | Would need push notifications (deferred) |
| No message search | Not needed for MVP |
| Realtime subscription not reconnecting on disconnect | Messages still load on manual refresh or screen re-mount |
