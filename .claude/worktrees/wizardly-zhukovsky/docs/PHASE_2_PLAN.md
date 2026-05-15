# Phase 2: Discovery

**Goal:** User can set their daily work intent and swipe through nearby co-workers to find matches.

**Entry Criteria:** Phase 1 complete (auth flow, profiles, navigation, design system)

---

## Tickets

### P2-01: Install Gesture & Animation Libraries

**Goal:** Add the dependencies required for swipe gestures and smooth animations.

**Scope:**
- Included: Install react-native-gesture-handler, react-native-reanimated, expo-image
- Included: Configure babel plugin for Reanimated
- Included: Wrap app root with GestureHandlerRootView
- Excluded: Any UI implementation

**Definition of Done:**
- [ ] All three packages installed via `npx expo install`
- [ ] `babel.config.js` includes `react-native-reanimated/plugin`
- [ ] App.js wraps content in `<GestureHandlerRootView style={{ flex: 1 }}>`
- [ ] App launches without errors on iOS simulator

**Dependencies:** None

---

### P2-02: Create work_intents Database Table

**Goal:** Store users' daily availability and work preferences in Supabase.

**Scope:**
- Included: Create `work_intents` table with columns for task, availability window, work style, location, and coordinates
- Included: Add unique constraint on (user_id, intent_date) to enforce one intent per day
- Included: Create indexes for location and date queries
- Included: Configure Row Level Security policies
- Excluded: Application code to interact with table

**Definition of Done:**
- [ ] Table created in Supabase with all columns
- [ ] Unique constraint prevents duplicate daily intents
- [ ] RLS policy: Anyone can SELECT (needed for discovery)
- [ ] RLS policy: Users can only INSERT/UPDATE/DELETE their own records
- [ ] Test: Manual insert via Supabase dashboard succeeds

**Dependencies:** None

---

### P2-03: Create swipes Database Table

**Goal:** Track swipe actions to enable match detection.

**Scope:**
- Included: Create `swipes` table with swiper_id, swiped_id, direction, and date
- Included: Add unique constraint on (swiper_id, swiped_id, swipe_date)
- Included: Create indexes for lookup queries
- Included: Configure Row Level Security policies
- Included: Create `check_match` SQL function to detect mutual swipes
- Excluded: Application code to interact with table

**Definition of Done:**
- [ ] Table created with direction CHECK constraint ('right' or 'left')
- [ ] Unique constraint prevents duplicate swipes per day
- [ ] RLS policy: Users can SELECT swipes where they are swiper or swiped
- [ ] RLS policy: Users can only INSERT swipes as themselves
- [ ] `check_match(swiper_id, swiped_id)` function returns true when mutual right swipes exist
- [ ] Test: Function returns expected results with test data

**Dependencies:** None

---

### P2-04: Add Phase 2 TypeScript Types

**Goal:** Define type definitions for work intents, swipes, and discovery cards.

**Scope:**
- Included: Add `WorkStyle` union type
- Included: Add `LocationType` union type
- Included: Add `WorkIntent` type matching database schema
- Included: Add `Swipe` type matching database schema
- Included: Add `DiscoveryCard` type combining profile + intent + distance
- Excluded: Modifying existing types

**Definition of Done:**
- [ ] All types added to `src/types/index.ts`
- [ ] Types are exported and available for import
- [ ] No TypeScript compilation errors

**Dependencies:** P2-02, P2-03

---

### P2-05: Create Location Hook

**Goal:** Provide a reusable hook for accessing user location with permission handling.

**Scope:**
- Included: Create `useLocation` hook with permission request
- Included: Return latitude, longitude, loading state, error state
- Included: Expose `requestPermission` function for retry
- Included: Create `calculateDistance` utility (Haversine formula)
- Excluded: Background location tracking
- Excluded: Location caching or persistence

**Definition of Done:**
- [ ] Hook created at `src/hooks/useLocation.ts`
- [ ] Hook requests foreground permission on mount
- [ ] Returns current coordinates when permission granted
- [ ] Returns descriptive error when permission denied
- [ ] `calculateDistance(lat1, lon1, lat2, lon2)` returns distance in km
- [ ] Test: Hook works in iOS simulator with simulated location

**Dependencies:** P2-01

---

### P2-06: Create Discovery Service

**Goal:** Provide API layer for intent and swipe operations.

**Scope:**
- Included: `getTodayIntent(userId)` - fetch user's intent for current date
- Included: `upsertIntent(userId, data)` - create or update today's intent
- Included: `fetchDiscoveryCards(userId, lat, lon, maxKm)` - get nearby users with intents, excluding already-swiped
- Included: `recordSwipe(swiperId, swipedId, direction)` - save swipe and check for match
- Excluded: Real-time subscriptions
- Excluded: Pagination

**Definition of Done:**
- [ ] Service created at `src/services/discoveryService.ts`
- [ ] `getTodayIntent` returns null when no intent exists (handles PGRST116)
- [ ] `upsertIntent` uses onConflict for idempotent updates
- [ ] `fetchDiscoveryCards` joins profiles with intents and calculates distance
- [ ] `fetchDiscoveryCards` excludes current user and already-swiped users
- [ ] `recordSwipe` returns `{ isMatch: boolean }` after checking mutual swipes
- [ ] Test: All functions work with Supabase (verify via console logs)

**Dependencies:** P2-02, P2-03, P2-04, P2-05

---

### P2-07: Build Reusable Button Component

**Goal:** Create a consistent button component with variants for use across the app.

**Scope:**
- Included: Primary variant (solid sage green)
- Included: Secondary variant (outlined)
- Included: Ghost variant (text only)
- Included: Loading state with ActivityIndicator
- Included: Disabled state styling
- Excluded: Icon support
- Excluded: Size variants

**Definition of Done:**
- [ ] Component created at `src/components/common/Button.tsx`
- [ ] Accepts: title, onPress, variant, disabled, loading, style props
- [ ] Minimum touch target of 44pt
- [ ] Uses design system colors from constants
- [ ] Visual: Primary has white text on sage background
- [ ] Visual: Loading shows spinner instead of text

**Dependencies:** P2-01

---

### P2-08: Build Reusable Tag Component

**Goal:** Create a selectable chip/tag component for work style and location options.

**Scope:**
- Included: Default and selected states
- Included: Optional onPress for selection
- Included: Small and medium size variants
- Excluded: Icon support
- Excluded: Dismissible/removable tags

**Definition of Done:**
- [ ] Component created at `src/components/common/Tag.tsx`
- [ ] Accepts: label, selected, onPress, size props
- [ ] Minimum touch target when tappable
- [ ] Uses pill shape (borderRadius.full)
- [ ] Visual: Selected state uses primary color
- [ ] Visual: Unselected has border with white background

**Dependencies:** P2-01

---

### P2-09: Build Intent Screen

**Goal:** Allow users to set their daily work intent before discovering others.

**Scope:**
- Included: Task description text input
- Included: Work style selection (Deep focus, Chat mode, Flexible)
- Included: Location type selection (Cafe, Library, Anywhere)
- Included: Optional specific location name input
- Included: Load existing intent if user already set one today
- Included: Location permission error state with retry
- Excluded: Time picker for availability (use default 9-5 for MVP)
- Excluded: Map-based location selection

**Definition of Done:**
- [ ] Screen created at `src/screens/discover/IntentScreen.tsx`
- [ ] Shows loading state while fetching location and existing intent
- [ ] Pre-fills form if user has existing intent for today
- [ ] Validates task description is not empty
- [ ] Shows error screen with retry if location permission denied
- [ ] Saves intent with current coordinates on submit
- [ ] Calls `onComplete` callback after successful save
- [ ] Visual: Matches Digital Matcha design system

**Dependencies:** P2-05, P2-06, P2-07, P2-08

---

### P2-10: Build SwipeCard Component

**Goal:** Display a user's profile and intent information in a swipeable card format.

**Scope:**
- Included: Profile photo with initial fallback
- Included: Name and distance display
- Included: Work type label
- Included: Today's task description
- Included: Work style and location type tags
- Included: Availability time range
- Included: Animated rotation based on drag position
- Included: "LIKE" and "NOPE" labels that appear while swiping
- Excluded: Tap to expand full profile
- Excluded: Social links or detailed bio

**Definition of Done:**
- [ ] Component created at `src/components/discover/SwipeCard.tsx`
- [ ] Accepts: card (DiscoveryCard), index, translateX (shared value), isTopCard
- [ ] Card rotates up to 15 degrees based on horizontal drag
- [ ] LIKE label appears with opacity on right drag
- [ ] NOPE label appears with opacity on left drag
- [ ] Cards behind top card are scaled down slightly
- [ ] Distance formatted as "Xm away" or "X.Xkm away"
- [ ] Visual: White card with shadow, rounded corners (xl)

**Dependencies:** P2-01, P2-04, P2-08

---

### P2-11: Build CardStack Component

**Goal:** Manage a stack of swipeable cards with gesture handling.

**Scope:**
- Included: Pan gesture recognition for swipe
- Included: Swipe threshold detection (30% of screen width)
- Included: Spring animation to reset or complete swipe
- Included: Swipe action buttons as alternative to gestures
- Included: Empty state when no cards remain
- Included: Render optimization (max 3 cards visible)
- Excluded: Undo last swipe
- Excluded: Super-like gesture

**Definition of Done:**
- [ ] Component created at `src/components/discover/CardStack.tsx`
- [ ] Accepts: cards array, onSwipe callback, onEmpty callback
- [ ] Swipe past threshold triggers swipe completion
- [ ] Swipe below threshold springs back to center
- [ ] X button triggers left swipe programmatically
- [ ] Checkmark button triggers right swipe programmatically
- [ ] Shows "No one nearby" message when cards array is empty
- [ ] onSwipe called with (card, direction) on each swipe

**Dependencies:** P2-01, P2-10

---

### P2-12: Implement DiscoverScreen State Machine

**Goal:** Orchestrate the discovery flow with proper state management.

**Scope:**
- Included: Loading state while checking intent and location
- Included: Redirect to IntentScreen if no intent set today
- Included: Show CardStack when intent exists
- Included: Show empty state when no users nearby
- Included: Record swipes to database
- Included: Detect and display matches via alert
- Excluded: Match modal with messaging CTA (Phase 3)
- Excluded: Pull-to-refresh

**Definition of Done:**
- [ ] DiscoverScreen fully rewritten at `src/screens/discover/DiscoverScreen.tsx`
- [ ] Shows loading indicator on initial load
- [ ] Redirects to IntentScreen when user has no intent today
- [ ] Fetches and displays discovery cards after intent is set
- [ ] Each swipe is recorded to database in background
- [ ] Right swipe triggers match check
- [ ] Match shows alert with other user's name
- [ ] Handles transition to empty state gracefully
- [ ] No crashes on any user flow

**Dependencies:** P2-06, P2-09, P2-11

---

## Exit Criteria

Phase 2 is complete when all tickets are done and:

1. User can set daily intent with task, work style, and location preference
2. User location is captured when setting intent
3. Discovery shows cards for nearby users who have set intents today
4. Cards display name, photo, task, work style, location type, and distance
5. Swipe gestures work smoothly with visual feedback
6. Swipe buttons work as alternative input method
7. All swipes are persisted to database
8. Mutual right swipes trigger match notification
9. Empty state displays when no users are nearby
10. App runs without crashes on iOS simulator

---

## Verification

Run the app and complete this test flow:

1. Login with test account
2. Navigate to Discover tab
3. Verify IntentScreen appears (no intent set)
4. Fill out and submit intent form
5. Verify CardStack appears (may need seed data in Supabase)
6. Swipe several cards left and right
7. Verify swipes appear in Supabase `swipes` table
8. Create mutual swipe scenario to verify match alert
9. Continue swiping until empty state appears
