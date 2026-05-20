# Phase 2: Discovery - Implementation Map

**Completed:** 2026-02-06

---

## P2-01: Gesture Libraries Setup

### What Changed
- Installed react-native-gesture-handler, react-native-reanimated, expo-image
- Created babel.config.js with reanimated plugin
- Wrapped App root in GestureHandlerRootView

### Files Touched
- `package.json`
- `babel.config.js` (created)
- `App.js`

### How to Verify
1. Run `npm list react-native-gesture-handler react-native-reanimated expo-image`
2. **Expected:** All three packages listed with versions
3. Run `npx tsc --noEmit`
4. **Expected:** No TypeScript errors

---

## P2-02: Database Schema

### What Changed
- Created SQL schema for `work_intents` table (user's daily work intent)
- Created SQL schema for `swipes` table (swipe history)
- Created `check_match` function for mutual match detection
- Added RLS policies for both tables

### Files Touched
- `supabase/002_discovery_tables.sql` (created)

### How to Verify
1. Open Supabase SQL Editor
2. Run contents of `supabase/002_discovery_tables.sql`
3. **Expected:** Tables created without errors
4. Go to Table Editor, verify `work_intents` and `swipes` tables exist
5. Check Authentication > Policies, verify RLS policies are applied

---

## P2-03: TypeScript Types

### What Changed
- Added WorkStyle union type (4 options)
- Added LocationType union type (4 options)
- Added WorkIntent, Swipe, and DiscoveryCard types

### Files Touched
- `src/types/index.ts`

### How to Verify
1. Open `src/types/index.ts`
2. **Expected:** Types `WorkStyle`, `LocationType`, `WorkIntent`, `Swipe`, `DiscoveryCard` are defined
3. Run `npx tsc --noEmit`
4. **Expected:** No TypeScript errors

---

## P2-04: Location Hook

### What Changed
- Created useLocation hook with permission request
- Implemented getCurrentPosition with balanced accuracy
- Added Haversine formula for distance calculation
- Added formatDistance helper (meters/kilometers)

### Files Touched
- `src/hooks/useLocation.ts` (created)

### How to Verify
1. Run app on iOS simulator
2. Navigate to Discover tab
3. **Expected:** Location permission prompt appears
4. Grant permission
5. **Expected:** Loading state resolves (no "Location Required" error)

---

## P2-05: Discovery Service

### What Changed
- Created getTodayIntent() to fetch user's current day intent
- Created upsertIntent() to create/update today's intent
- Created fetchDiscoveryCards() to get nearby users with distance filtering
- Created recordSwipe() with match detection via RPC

### Files Touched
- `src/services/discoveryService.ts` (created)

### How to Verify
1. Set intent via IntentScreen
2. Check Supabase Table Editor > work_intents
3. **Expected:** New row with today's date, user_id, and form data
4. Swipe on a card
5. Check Supabase Table Editor > swipes
6. **Expected:** New row with swiper_id, swiped_id, direction

---

## P2-06: Reusable Components (Button, Tag)

### What Changed
- Created Button component with primary/secondary/ghost variants
- Created Tag component for selectable chips
- Both follow design system tokens (colors, spacing, borderRadius)

### Files Touched
- `src/components/common/Button.tsx` (created)
- `src/components/common/Tag.tsx` (created)

### How to Verify
1. Open IntentScreen (set intent flow)
2. **Expected:** Work style tags are tappable, selected state shows filled background
3. **Expected:** "Start Discovering" button has sage green background
4. Tap a tag
5. **Expected:** Selection toggles with visual feedback

---

## P2-07: Intent Screen

### What Changed
- Built form with task description input (multiline)
- Added work style selection (4 tag options)
- Added location type selection (4 tag options)
- Optional location name field (hidden only for Video Call)
- Availability uses selectable start/end times (7:00–23:00, 30‑min intervals)
- Prefills form if today's intent already exists

### Files Touched
- `src/screens/discover/IntentScreen.tsx` (created)

### How to Verify
1. Login to app, navigate to Discover tab
2. **Expected:** IntentScreen appears (first visit of day)
3. Leave task empty, tap "Find Co-Workers"
4. **Expected:** Alert "Missing info" appears
5. Fill in task, select work style and location type
6. Tap "Find Co-Workers"
7. **Expected:** Screen transitions to card stack or empty state

---

## P2-08: Swipe Card Component

### What Changed
- Created card layout with photo area (or initials placeholder)
- Added name, distance, work type overlay
- Added task description section
- Added work style and location type tags
- Added availability time display

### Files Touched
- `src/components/discover/SwipeCard.tsx` (created)

### How to Verify
1. Have test data in work_intents for another user
2. Navigate to Discover with intent set
3. **Expected:** Card shows profile name at top
4. **Expected:** Distance displayed (e.g., "1.2km away")
5. **Expected:** Task description visible in "Working on" section
6. **Expected:** Two tags shown (work style + location type)

---

## P2-09: Card Stack with Gestures

### What Changed
- Implemented pan gesture for swipe detection
- Added rotation animation while dragging
- Added "LIKE" and "NOPE" stamp overlays inside SwipeCard with opacity animation
- Added multi-card scale animation (up to 3 cards)
- Created SwipeButtons for tap-based swiping

### Files Touched
- `src/components/discover/CardStack.tsx` (created)
- `src/components/discover/SwipeButtons.tsx` (created)

### How to Verify
1. With cards in stack, drag card to the right
2. **Expected:** Card rotates, green "LIKE" stamp fades in
3. Release before threshold
4. **Expected:** Card snaps back to center
5. Drag past threshold or with velocity
6. **Expected:** Card animates off screen, next card scales up
7. Tap OK button
8. **Expected:** Card swipes right automatically
9. Tap X button
10. **Expected:** Card swipes left automatically

---

## P2-10: Discover Screen State Machine

### What Changed
- Implemented 4 states: loading, needs_intent, discovering, empty
- Integrated location hook for permission flow (errors shown within IntentScreen)
- Integrated discovery service for data fetching
- Added match alert on mutual right swipes
- Added empty state copy aligned to UI spec (no refresh action)

### Files Touched
- `src/screens/discover/DiscoverScreen.tsx` (rewritten)

### How to Verify
1. **Loading state:** Open Discover tab
   - **Expected:** Spinner with "Finding co-workers nearby..."
2. **Needs intent:** First visit of day (no intent)
   - **Expected:** IntentScreen form appears
3. **Location denied:** Deny location permission
   - **Expected:** IntentScreen shows "Location Required" with "Enable Location" button
4. **Discovering:** After setting intent with nearby users
   - **Expected:** Card stack with header showing "Working on: [task]"
5. **Empty:** No nearby users or all cards swiped
   - **Expected:** "No one nearby right now" message with spec subtitle
6. **Match:** Both users swipe right on each other
   - **Expected:** Alert "It's a Match!" appears

---

## P2-11: Navigation Fixes (React Navigation 7)

### What Changed
- Added required `id` prop to Stack.Navigator
- Added required `id` prop to Tab.Navigator

### Files Touched
- `src/navigation/AuthStack.tsx`
- `src/navigation/MainTabs.tsx`

### How to Verify
1. Run `npx tsc --noEmit`
2. **Expected:** No errors about missing 'id' property
3. Run app
4. **Expected:** Navigation works without crashes

---

## Quick Verification Checklist

```bash
# 1. TypeScript compiles
npx tsc --noEmit

# 2. App starts
npm start
# Press 'i' for iOS

# 3. Database ready (run in Supabase SQL Editor)
# Contents of supabase/002_discovery_tables.sql
```

### End-to-End Test Flow
1. Login with existing account
2. Navigate to Discover tab
3. Grant location permission
4. Fill out intent form, tap "Start Discovering"
5. See card stack (or empty state if no test data)
6. Swipe cards left and right
7. Verify swipes in Supabase > swipes table
8. Test match by having two users swipe right on each other
