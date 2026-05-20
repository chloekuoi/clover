# Phase 2: Discovery — CERTIFICATION

**Status:** CERTIFIED COMPLETE
**Certified:** 2026-02-07
**Phase completed:** 2026-02-06

---

## Guaranteed Behaviors

The following behaviors are verified and must not regress:

1. **Location permission** — App requests foreground location permission on Discover tab. Denied state shows "Location Required" with retry button.
2. **Intent creation** — User can set daily work intent (task, work style, location type, optional spot name). One intent per user per day, enforced by unique constraint `(user_id, intent_date)`.
3. **Intent pre-fill** — If user already set an intent today, the form pre-fills with existing values.
4. **Discovery cards** — After setting intent, nearby users with today's intents appear as swipeable cards. Cards show name, photo/initials, distance, task, work style tag, location type tag, and availability.
5. **Swipe gestures** — Pan gesture with rotation (±15°). LIKE/NOPE stamps fade in based on direction. Threshold: 30% screen width or velocity > 800. Below threshold: spring back.
6. **Swipe buttons** — X (nope) and heart (like) buttons as alternative to gestures.
7. **Swipe persistence** — Every swipe inserts into `swipes` table with `(swiper_id, swiped_id, direction, swipe_date)`. Duplicate swipes per day are silently ignored (unique constraint).
8. **Match detection** — After a right swipe, `check_match` RPC checks for mutual right swipe today. If mutual, returns `true`.
9. **Match notification** — Mutual right swipe triggers `Alert.alert("It's a Match!", ...)`. This is a basic native alert.
10. **Empty state** — Shows "No one nearby right now" when no discovery cards are available.
11. **Distance calculation** — Haversine formula, client-side. `fetchDiscoveryCards` filters by `maxDistanceKm` (default 50km).
12. **Card exclusion** — Already-swiped users and the current user are excluded from discovery cards.

---

## Explicit Exclusions (Out of Scope for Phase 2)

These were intentionally NOT implemented:

- No `matches` table — match detection is ephemeral (RPC check only, no persistence)
- No messaging or chat
- No custom match modal (uses native Alert)
- No undo swipe
- No pagination of discovery cards
- No server-side distance filtering (PostGIS)
- No pull-to-refresh on discovery
- No profile photo upload
- No editable availability time picker (auto-set to now + 4 hours)
- No intent editing after initial set (upsert exists but no UI path to re-edit)
- No push notifications
- No typing indicators
- No read receipts

---

## Hard Constraints Phase 3 Must Respect

1. **`check_match` RPC exists and works** — Phase 3 must use it or extend it, not replace it.
2. **`recordSwipe` returns `{ isMatch: boolean }`** — Phase 3 must extend this to also return `matchId` when persisting matches.
3. **`swipes` table is day-scoped** — Swipes are per-day. Match detection checks today's swipes only.
4. **User IDs come from `auth.uid()`** — All RLS policies use `auth.uid()`. Phase 3 tables must follow this pattern.
5. **MatchesScreen is a placeholder** — Currently at `src/screens/matches/MatchesScreen.tsx` with static text. Phase 3 will replace it entirely.
6. **MainTabs has three tabs** — Discover, Matches, Profile. Phase 3 must not add or remove tabs.
7. **Design system is "Digital Matcha"** — All new UI must use the established color tokens, spacing scale, typography, and border radius from `src/constants/`.
8. **GestureHandlerRootView wraps the app** — Already configured in `App.js`.
9. **Supabase client is at `lib/supabase.ts`** — All database access goes through this client.
10. **Navigation uses React Navigation 7** — Stack and Tab navigators require `id` prop.

---

## Known Non-Issues (Intentionally Not Handled)

| Item | Reason |
|------|--------|
| Card photo uses solid overlay, not gradient | Cosmetic — works, just not as polished |
| Availability is auto-set, not user-editable | MVP simplification — users don't need custom times yet |
| Distance calculated client-side | Acceptable for small user counts (<1000) |
| Cards not paginated | Acceptable for MVP — full fetch works under 100 users |
| Native Alert for match | Will be replaced by custom modal in Phase 3 |
| Only 2 cards rendered in stack | Performance acceptable — visual depth is nice-to-have |
| No offline support | MVP assumes connectivity |
