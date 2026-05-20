# UI Specification (As-Built)

**Last Updated:** 2026-02-06 (Phase 2)

---

## Screens

### 1. DiscoverScreen (State Machine)

**File:** `src/screens/discover/DiscoverScreen.tsx`

Renders one of 5 states based on conditions:

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Location loading OR data fetching | Centered spinner + "Finding co-workers nearby..." |
| `needs_location` | Location permission denied/error | Title + explanation + "Enable Location" button |
| `needs_intent` | No intent for today | Renders IntentScreen |
| `discovering` | Has intent + cards available | Header + CardStack |
| `empty` | Has intent + no cards | Magnifying glass emoji + "No one nearby" + Refresh button |

**Layout (discovering state):**
```
┌─────────────────────────┐
│ SafeAreaView            │
│ ┌─────────────────────┐ │
│ │ Header              │ │
│ │ "Discover"          │ │
│ │ "3 people nearby"   │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │                     │ │
│ │    CardStack        │ │
│ │                     │ │
│ │                     │ │
│ └─────────────────────┘ │
│      [X]     [♥]        │
└─────────────────────────┘
```

---

### 2. IntentScreen

**File:** `src/screens/discover/IntentScreen.tsx`

**Purpose:** Form for setting today's work intent

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView            │
│ ┌─────────────────────┐ │
│ │ "Set Your Intent"   │ │
│ │ subtitle            │ │
│ └─────────────────────┘ │
│                         │
│ What are you working on?│
│ ┌─────────────────────┐ │
│ │ TextInput (3 lines) │ │
│ └─────────────────────┘ │
│                         │
│ Work style              │
│ [Deep focus] [Chat mode]│
│ [Flexible]              │
│                         │
│ Location preference     │
│ [Cafe] [Library]        │
│ [Anywhere]              │
│                         │
│ Spot name (conditional) │
│ ┌─────────────────────┐ │
│ │ TextInput           │ │
│ └─────────────────────┘ │
│                         │
│ Available               │
│ "14:00 - 18:00 today"   │
│                         │
│ [Start Discovering]     │
└─────────────────────────┘
```

**Form Fields:**

| Field | Type | Required | Default |
|-------|------|----------|---------|
| Task description | TextInput (multiline, 3 lines, min 100px) | Yes | Empty |
| Work style | Tag selection (single) | Yes | "Flexible" |
| Location type | Tag selection (single) | Yes | "Anywhere" |
| Spot name | TextInput (single line, 48px) | No | Empty |
| Availability | Display only (read-only Text) | Auto | Current hour + 4 hours |

**Conditional Logic:**
- "Spot name" field only shows when Location type is "Cafe" or "Library"
- Availability auto-calculated, not user-editable
- Button shows loading spinner during submission

---

## Components

### Button

**File:** `src/components/common/Button.tsx`

**Variants:**

| Variant | Background | Text Color | Border |
|---------|------------|------------|--------|
| `primary` | `#A8B5A2` (sage) | `#FFFFFF` | None |
| `secondary` | `#E8DCD0` (cream) | `#2D3A2D` | 1px `#A8B5A2` |
| `ghost` | Transparent | `#A8B5A2` | None |

**Props:**
- `title`: string
- `onPress`: () => void
- `variant`: 'primary' | 'secondary' | 'ghost' (default: 'primary')
- `disabled`: boolean (0.5 opacity when true)
- `loading`: boolean (shows ActivityIndicator)
- `style`: ViewStyle (optional)
- `textStyle`: TextStyle (optional)

**Sizing:**
- Min height: 44px (touch target)
- Horizontal padding: 24px
- Vertical padding: 12px
- Border radius: 12px
- Font: 16px, weight 600

---

### Tag

**File:** `src/components/common/Tag.tsx`

**States:**

| State | Background | Border | Text |
|-------|------------|--------|------|
| Unselected | `#FFFFFF` | 1.5px `#E8DCD0` | `#2D3A2D` |
| Selected | `#A8B5A2` | 1.5px `#A8B5A2` | `#FFFFFF` |

**Sizes:**

| Size | Padding H | Padding V | Font |
|------|-----------|-----------|------|
| `sm` | 8px | 4px | 12px |
| `md` | 16px | 8px | 14px |

**Props:**
- `label`: string
- `selected`: boolean (default: false)
- `onPress`: () => void (optional — static display if omitted)
- `size`: 'sm' | 'md' (default: 'md')
- `style`: ViewStyle (optional)

---

### SwipeCard

**File:** `src/components/discover/SwipeCard.tsx`

**Dimensions:**
- Width: `SCREEN_WIDTH - 32px`
- Height: `width × 1.3` (aspect ratio)
- Border radius: 24px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)

**Layout:**
```
┌─────────────────────────┐
│                         │
│   Photo / Initials      │  55% height
│                         │
│ ┌─────────────────────┐ │
│ │ Name          1.2km │ │  Overlay (rgba 0.3)
│ │ Work type           │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ WORKING ON              │  45% height
│ Task description...     │
│                         │
│ [Deep focus] [Cafe]     │
│                         │
│ Coffee House  14:00-18  │
└─────────────────────────┘
```

**Photo Area (55% height):**
- If `photo_url` exists: expo-image with `contentFit="cover"`
- If no photo: `#D4DCD1` background with initials
  - Initials: 64px, weight 700, color `#6F8268`
  - Shows first letters of first/last name, max 2 chars
  - Falls back to "?" if no name
- Overlay: `rgba(0,0,0,0.3)` solid (no gradient)

**Details Section (45% height):**
- Padding: 16px all sides
- "WORKING ON" label: 12px uppercase, `#968D82`, letter-spacing 0.5
- Task: 16px weight 500, max 2 lines with numberOfLines={2}
- Tags row: Two `sm` size tags, selected state, 8px gap
- Meta row: flexDirection row, justifyContent space-between
  - Location name (left, if exists)
  - Availability "HH:MM - HH:MM" (right)

---

### CardStack

**File:** `src/components/discover/CardStack.tsx`

**Structure:**
- Current card: Top layer, gesture-enabled
- Next card: Behind, scale 0.95, zIndex -1
- Only 2 cards rendered at once

**Gesture Thresholds:**
- Position threshold: 30% of screen width
- Velocity threshold: 800

**Animations (react-native-reanimated):**

| Animation | Values | Easing |
|-----------|--------|--------|
| Card rotation | -15° to +15° based on translateX | interpolate, CLAMP |
| LIKE stamp opacity | 0 to 1 as translateX → threshold | interpolate, CLAMP |
| NOPE stamp opacity | 0 to 1 as translateX → -threshold | interpolate, CLAMP |
| Next card scale | 0.95 to 1.0 based on abs(translateX) | interpolate, CLAMP |
| Swipe exit | 1.5× screen width | withTiming, 300ms |
| Snap back | Spring to 0 | withSpring, damping 15 |

**Stamp Styling:**
- Position: absolute, top 50px
- LIKE: left 20px, rotated -15°, green border 4px
- NOPE: right 20px, rotated +15°, red border 4px
- Text: 32px, weight 800, letter-spacing 2

---

### SwipeButtons

**File:** `src/components/discover/SwipeButtons.tsx`

**Layout:**
```
        [X]          [♥]
        64px         64px
        gap: 32px
```

**Button Styling:**

| Button | Size | Background | Border | Icon |
|--------|------|------------|--------|------|
| X (Nope) | 64×64px | `#FFFFFF` | 2px `#B57070` | "✕" 28px `#B57070` |
| Heart (Like) | 64×64px | `#FFFFFF` | 2px `#6B9B6B` | "♥" 28px `#6B9B6B` |

- Border radius: 32px (circular)
- Shadow: 0 2px 8px rgba(0,0,0,0.15)
- Container margin-top: 24px from card stack

---

## Interactions

### Intent Form Submission

1. User taps "Start Discovering"
2. **Validation:** If task empty → `Alert.alert('Missing info', '...')`
3. **Loading:** Button shows ActivityIndicator, disabled
4. **Save:** Calls `upsertIntent()` with form data + coordinates
5. **Success:** Calls `onIntentSet()` → parent reloads discovery data
6. **Error:** `Alert.alert('Error', 'Failed to save...')`

### Card Swiping

**Gesture Flow:**
1. Pan starts → `translateX` and `translateY` update
2. Card rotates, stamps fade in based on direction
3. Pan ends:
   - If `|translateX| > 30%` OR `|velocityX| > 800` → complete swipe
   - Otherwise → spring back to center

**Swipe Completion:**
1. Card animates to `±1.5 × screenWidth` (300ms)
2. `onSwipe(card, direction)` called
3. `currentIndex` increments
4. `translateX/Y` reset to 0
5. If `currentIndex >= cards.length` → `onEmpty()` called

**Match Detection:**
1. After recording right swipe, `check_match` RPC is called
2. If returns true → `Alert.alert("It's a Match!", ...)`

### Location Permission

1. `useLocation` hook mounts → `requestForegroundPermissionsAsync()`
2. **Granted:** `getCurrentPositionAsync()` → state updates with coordinates
3. **Denied:** `error` state set → `needs_location` UI shown
4. **Retry:** User taps "Enable Location" → `refresh()` called → re-requests

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Location permission denied | Shows "Location Required" with retry button |
| Location fetch times out | Treated as error, shows needs_location state |
| No intent for today | Shows IntentScreen automatically |
| Intent exists, 0 nearby users | Shows empty state with magnifying glass emoji |
| All cards swiped | Transitions to empty state via `onEmpty()` |
| Network error on swipe | `console.error`, UI continues (no user alert) |
| Match detected | Native Alert: "It's a Match!" with "Awesome!" button |
| Task text > 2 lines | Truncated with `numberOfLines={2}` |
| No profile photo | Shows initials on sage background |
| No profile name | Shows "Anonymous" |
| Availability would exceed midnight | Capped at 23:00 (`Math.min(fromHour + 4, 23)`) |
| Empty task on submit | Alert prevents submission |
| User not logged in | Alert "You must be logged in" (shouldn't happen in normal flow) |

---

## Known UI Bugs / Compromises

### 1. No True Gradient on Card Photo
**Issue:** React Native doesn't support CSS `background-image: linear-gradient()`.
**Compromise:** Using solid semi-transparent overlay (`rgba(0,0,0,0.3)`) instead.
**Impact:** Photo overlay is uniform rather than fading from transparent to dark.
**Fix:** Install `expo-linear-gradient` and use `<LinearGradient>` component.

### 2. Availability Not User-Editable
**Issue:** No time picker implemented.
**Compromise:** Auto-set to current hour + 4 hours, displayed as read-only text.
**Impact:** Users cannot customize their availability window.
**Fix:** Add time picker modal or inline time selection.

### 3. No Undo on Swipe
**Issue:** Accidental swipes cannot be reversed.
**Compromise:** None implemented.
**Impact:** Users who accidentally swipe left lose that potential match for the day.
**Fix:** Add "Undo" button or swipe-back gesture.

### 4. Stamps Use Text, Not Icons
**Issue:** "LIKE" and "NOPE" are text stamps with borders.
**Compromise:** Styled text instead of checkmark/X iconography.
**Impact:** More text-heavy than typical swipe apps (Tinder uses icons).
**Fix:** Replace with icon assets or SF Symbols.

### 5. Match Alert Uses Native Alert
**Issue:** Match notification is basic `Alert.alert()`.
**Compromise:** No custom modal, animation, or profile preview.
**Impact:** Lacks celebratory feel, no way to immediately message.
**Fix:** Create custom MatchModal component with confetti animation.

### 6. Cards Not Paginated
**Issue:** All cards loaded in single fetch.
**Compromise:** `fetchDiscoveryCards()` returns full array.
**Impact:** May be slow with many users; memory usage scales with count.
**Fix:** Implement cursor-based pagination, fetch 10 at a time.

### 7. Distance Calculated Client-Side
**Issue:** Haversine formula runs in JavaScript.
**Compromise:** Fetches ALL intents for today, then filters by distance.
**Impact:** Inefficient for large datasets; unnecessary data transfer.
**Fix:** Use PostGIS `ST_DWithin()` in Supabase query.

### 8. Button Row May Overlap Safe Area
**Issue:** Swipe buttons use fixed margin from cards.
**Compromise:** No dynamic adjustment for short screens.
**Impact:** On iPhone SE or similar, buttons may feel cramped.
**Fix:** Use flex layout with min spacing, or hide buttons on very small screens.

### 9. Only 2 Cards Rendered
**Issue:** `CardStack` only renders current + next card.
**Compromise:** Third card not pre-rendered.
**Impact:** No visible "depth" to the stack like Tinder shows.
**Fix:** Render 3 cards with progressive scale (1.0, 0.95, 0.9).

---

## Typography Summary

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Screen title | 28px | 700 | `#2D3A2D` |
| Screen subtitle | 16px | 400 | `#756C62` |
| Form label | 16px | 600 | `#2D3A2D` |
| Form input | 16px | 400 | `#2D3A2D` |
| Form placeholder | 16px | 400 | `#968D82` |
| Card name | 24px | 700 | `#FFFFFF` |
| Card work type | 14px | 400 | `rgba(255,255,255,0.8)` |
| Card section label | 12px | 500 | `#968D82` (uppercase) |
| Card task | 16px | 500 | `#2D3A2D` |
| Card meta | 13px | 400 | `#756C62` |
| Stamp text | 32px | 800 | `#6B9B6B` / `#B57070` |
| Tag (sm) | 12px | 500 | varies |
| Tag (md) | 14px | 500 | varies |
| Button | 16px | 600 | varies |
| Empty state title | 24px | 600 | `#2D3A2D` |
| Empty state text | 16px | 400 | `#756C62` |
| Loading text | 16px | 400 | `#756C62` |

---

## Color Reference

| Token | Hex | Usage |
|-------|-----|-------|
| `theme.primary` | `#A8B5A2` | Buttons, selected tags, icons |
| `theme.accent` | `#5C6B57` | Important actions |
| `theme.background` | `#F7F5F2` | Screen backgrounds |
| `theme.surface` | `#FFFFFF` | Cards, inputs |
| `theme.highlight` | `#E8DCD0` | Secondary backgrounds, borders |
| `theme.text` | `#2D3A2D` | Primary text |
| `theme.textSecondary` | `#756C62` | Secondary text |
| `theme.textMuted` | `#968D82` | Placeholders, labels |
| `colors.swipeRight` | `#6B9B6B` | Like button, LIKE stamp |
| `colors.swipeLeft` | `#B57070` | Nope button, NOPE stamp |

---
---

# Phase 3: Matching & Messaging

**Added:** 2026-02-07

---

## Screens

### 3. MatchesListScreen

**File:** `src/screens/matches/MatchesListScreen.tsx`

**Purpose:** Display all matches with last message preview, navigate to chat

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView            │
│ ┌─────────────────────┐ │
│ │ "Matches"           │ │  Screen title
│ │ "X conversations"   │ │  Subtitle with count
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ MatchCard           │ │  FlatList
│ │ ─────────────────── │ │  Separator line
│ │ MatchCard           │ │
│ │ ─────────────────── │ │
│ │ MatchCard           │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Initial fetch in progress | Centered spinner + "Loading matches..." |
| `empty` | No matches exist | Centered illustration + "No matches yet" + "Keep swiping to find co-workers!" |
| `list` | Has matches | FlatList of MatchCard components |

**Interactions:**
- Tap a MatchCard → navigate to ChatScreen with `matchId` and `otherUser` params
- Pull-to-refresh → refetch matches list
- Screen focus → refetch matches list (React Navigation `useFocusEffect`)

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| 0 matches | Empty state with encouragement text |
| Match with no messages | MatchCard shows "Say hello!" as preview |
| New match appears while viewing list | Visible on next pull-to-refresh or tab focus |
| Network error on fetch | Show last loaded data, no error toast for MVP |

---

### 4. ChatScreen

**File:** `src/screens/matches/ChatScreen.tsx`

**Purpose:** Real-time 1:1 messaging between matched users

**Route Params:**
- `matchId`: string (UUID of the match)
- `otherUser`: `{ id, name, photo_url }` (other user's profile subset)

**Layout:**
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │ ← Back   Alex Chen  │ │  Header with name + back button
│ └─────────────────────┘ │
│                         │
│     ┌──────────────┐   │
│     │ Hey! Want to  │   │  Received bubble (left, cream)
│     │ work at Blue  │   │
│     │ Bottle today? │   │
│     └──────────────┘   │
│                         │
│   ┌──────────────┐     │
│   │ Yes! I'll be  │     │  Sent bubble (right, sage)
│   │ there at 2pm  │     │
│   └──────────────┘     │
│                         │
│ ┌─────────────────────┐ │
│ │ [Type a message...]│↑│ │  Input bar + send button
│ └─────────────────────┘ │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetching messages | Centered spinner |
| `empty` | No messages yet | Centered "Start the conversation!" + wave emoji |
| `chatting` | Has messages | Message list + input bar |

**Interactions:**
- Type in input → enables send button
- Tap send → inserts message, clears input, scrolls to bottom
- New message arrives via Realtime → appends to list, scrolls to bottom
- Back button → returns to MatchesListScreen
- Screen mount → calls `markChatRead` to clear unread
- New incoming message while on screen → calls `markChatRead`

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Empty input | Send button is disabled (opacity 0.4) |
| Very long message | TextInput grows up to 4 lines, then scrolls internally |
| Send fails (network) | Message stays in input, `Alert.alert('Failed to send')` |
| Other user sends while typing | New message appears above, does not disrupt typing |
| Keyboard open | KeyboardAvoidingView pushes input bar above keyboard |
| 100+ messages | FlatList (inverted) handles scrolling, no pagination for MVP |

---

## Components

### MatchModal

**File:** `src/components/matches/MatchModal.tsx`

**Purpose:** Celebratory overlay shown when a mutual match is detected

**Props:**
- `visible`: boolean
- `currentUser`: Profile (logged-in user)
- `matchedUser`: Profile (the other person)
- `matchId`: string
- `onSendMessage`: (matchId: string, matchedUser: Profile) => void
- `onDismiss`: () => void

**Layout:**
```
┌─────────────────────────┐
│ ████████████████████████ │  Semi-transparent overlay
│ ██                    ██ │  rgba(0,0,0,0.6)
│ ██   ┌────┐ ┌────┐   ██ │
│ ██   │You │ │Them│   ██ │  Two circular photos, 80px
│ ██   └────┘ └────┘   ██ │  16px gap between
│ ██                    ██ │
│ ██  It's a Match! 🎉  ██ │  28px, weight 700, white
│ ██                    ██ │
│ ██  You and Alex both ██ │  16px, weight 400, white 0.8
│ ██  want to co-work!  ██ │
│ ██                    ██ │
│ ██ [  Send Message  ] ██ │  Primary button (white bg, sage text)
│ ██                    ██ │
│ ██   Keep Swiping     ██ │  Ghost button (white text)
│ ██                    ██ │
│ ████████████████████████ │
└─────────────────────────┘
```

**Photo Circles:**
- Size: 80 x 80px
- Border radius: 40px (circular)
- Border: 3px white
- If no photo_url: show initials on `#D4DCD1` background
- Current user on left, matched user on right

**Button Styling:**
- "Send Message": white background, `#5C6B57` text, weight 600, full width, 48px height, borderRadius 12px
- "Keep Swiping": transparent, white text, weight 500, no border

**Animation:**
- Modal appears with fade-in (opacity 0 → 1, 300ms)
- Content card scales in (0.8 → 1.0, spring)

---

### MatchCard

**File:** `src/components/matches/MatchCard.tsx`

**Purpose:** Single row in the matches list showing a match with message preview

**Props:**
- `matchPreview`: MatchPreview
- `onPress`: () => void

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌────┐  Alex Chen         2m ago   │  Row height: 72px
│ │photo│  Hey! Want to work at...   │  Padding: 16px horizontal
│ └────┘                        ●    │  Unread dot (right)
└─────────────────────────────────────┘
```

**Photo:**
- Size: 48 x 48px
- Border radius: 24px (circular)
- If no photo_url: initials on `#D4DCD1` background
- Initials: 18px, weight 600, color `#6F8268`

**Text Layout:**
- Name: 16px, weight 600, color `#2D3A2D`. Bold (weight 700) when unread.
- Message preview: 14px, weight 400, color `#756C62`. numberOfLines={1}. Shows "Say hello!" in italic if no messages.
- Timestamp: 13px, weight 400, color `#968D82`. Top-right aligned.

**Unread Indicator:**
- Green dot: 10px diameter, `#6B9B6B`
- Positioned right side, vertically centered
- Only visible when `unread_count > 0`

**Separator:**
- 1px line, color `#E2DDD6`
- Left inset: 80px (aligned past the photo)

**Touch:**
- Minimum height: 72px (exceeds 44pt touch target)
- Touchable feedback: opacity reduction on press

---

### MessageBubble

**File:** `src/components/matches/MessageBubble.tsx`

**Purpose:** Individual message in the chat

**Props:**
- `message`: Message
- `isMine`: boolean

**Layout — Sent (isMine = true):**
```
                    ┌──────────────┐
                    │ Message text │  Right-aligned
                    │              │  Background: #A8B5A2 (sage)
                    └──────────────┘  Text: #FFFFFF
                              12:34   Timestamp below, right
```

**Layout — Received (isMine = false):**
```
┌──────────────┐
│ Message text │                      Left-aligned
│              │                      Background: #E8DCD0 (cream)
└──────────────┘                      Text: #2D3A2D
12:34                                 Timestamp below, left
```

**Bubble Styling:**
- Max width: 75% of screen width
- Padding: 12px horizontal, 8px vertical
- Border radius: 16px
- Sent: bottom-right radius 4px (chat tail effect)
- Received: bottom-left radius 4px (chat tail effect)

**Timestamp:**
- Format: "HH:MM" (24-hour)
- Size: 11px, weight 400
- Color: `#968D82`
- Margin-top: 4px from bubble
- Aligned to same side as bubble

**Spacing:**
- Vertical gap between messages: 8px
- Same-sender consecutive: 4px gap (tighter)
- Different-sender: 12px gap (wider, visual grouping)

---

### ChatInputBar

**File:** `src/components/matches/ChatInputBar.tsx`

**Purpose:** Text input and send button at bottom of chat

**Props:**
- `onSend`: (content: string) => void
- `disabled`: boolean (optional, default false)

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌────────────────────────────┐ ┌──┐ │
│ │ Type a message...          │ │ ↑│ │  Input + circular send button
│ └────────────────────────────┘ └──┘ │
└─────────────────────────────────────┘
```

**Input Styling:**
- Background: `#EFEBE6` (neutral.100)
- Border radius: 24px (pill)
- Padding: 12px horizontal, 10px vertical
- Font: 16px, weight 400, color `#2D3A2D`
- Placeholder: "Type a message..." color `#968D82`
- Min height: 40px
- Max height: 100px (4 lines, then scrolls)
- Multiline: true

**Send Button:**
- Size: 40 x 40px
- Border radius: 20px (circular)
- Background: `#A8B5A2` (sage) when enabled
- Background: `#D4DCD1` (sage.200) when disabled
- Icon: "↑" arrow, 20px, white, weight 700
- Margin-left: 8px from input
- Disabled when input is empty (trimmed)

**Container:**
- Background: `#FFFFFF`
- Border-top: 1px `#E2DDD6`
- Padding: 8px horizontal, 8px vertical
- Safe area bottom padding (for devices with home indicator)

---

## Phase 3 Typography Additions

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Match modal title | 28px | 700 | `#FFFFFF` |
| Match modal subtitle | 16px | 400 | `rgba(255,255,255,0.8)` |
| Match modal button | 16px | 600 | `#5C6B57` |
| Match modal ghost button | 16px | 500 | `#FFFFFF` |
| Matches screen title | 28px | 700 | `#2D3A2D` |
| Matches screen subtitle | 16px | 400 | `#756C62` |
| Match card name | 16px | 600 | `#2D3A2D` |
| Match card name (unread) | 16px | 700 | `#2D3A2D` |
| Match card message preview | 14px | 400 | `#756C62` |
| Match card timestamp | 13px | 400 | `#968D82` |
| Chat header name | 18px | 600 | `#2D3A2D` |
| Message text (sent) | 16px | 400 | `#FFFFFF` |
| Message text (received) | 16px | 400 | `#2D3A2D` |
| Message timestamp | 11px | 400 | `#968D82` |
| Chat input text | 16px | 400 | `#2D3A2D` |
| Chat input placeholder | 16px | 400 | `#968D82` |
| Chat empty state | 18px | 500 | `#756C62` |
| Matches empty state title | 24px | 600 | `#2D3A2D` |
| Matches empty state text | 16px | 400 | `#756C62` |

---
---

# Phase 4: Sessions

**Added:** 2026-02-08

---

## Screens

### 5. ActiveSessionScreen

**File:** `src/screens/session/ActiveSessionScreen.tsx`

**Purpose:** Dedicated view of the current active session with co-worker info and manual end option

**Route Params:**
- `sessionId`: string (UUID of the session)
- `otherUser`: `{ id, name, photo_url }` (co-worker's profile subset)

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│ ┌─────────────────────┐  │
│ │ ← Back              │  │  Header with back button
│ │ "Active Session"    │  │
│ └─────────────────────┘  │
│                          │
│        ┌────────┐        │
│        │  photo │        │  80x80px, circular
│        │   or   │        │
│        │initials│        │
│        └────────┘        │
│                          │
│      [Co-worker Name]    │  20px, weight 600, #2D3A2D
│      [Work type]         │  14px, weight 400, #756C62
│                          │
│ ┌──────────────────────┐ │
│ │ Session Details      │ │  Card, white bg, 16px padding
│ │                      │ │  Border radius 16px
│ │ Status    ● Active   │ │  Green dot + "Active"
│ │ Started   2:00 PM    │ │  accepted_at formatted
│ │ Date      Today      │ │  session_date
│ └──────────────────────┘ │
│                          │
│ [    End Session     ]   │  Primary button, full width
│                          │
│ Session will auto-       │  13px, #968D82, centered
│ complete at end of day   │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetching session data | Centered spinner |
| `active` | Session is active | Full layout as above |
| `not_found` | Session not found or already completed | "Session not found" + back button |

**Interactions:**
- "End Session" button → calls `completeSession()` → navigates to SessionComplete screen
- Back button → returns to ChatScreen
- "End Session" shows loading spinner during API call

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Session completed by other user while viewing | Realtime update navigates to SessionComplete |
| Session auto-completed while viewing | Same as above |
| Network error on end session | Alert with error, stays on screen |

---

### 6. SessionCompleteScreen

**File:** `src/screens/session/SessionCompleteScreen.tsx`

**Purpose:** Summary view after a session ends

**Route Params:**
- `sessionId`: string (UUID of the session)
- `otherUser`: `{ id, name, photo_url }` (co-worker's profile subset)

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│                          │
│        ┌────────┐        │
│        │  photo │        │  80x80px, circular
│        │   or   │        │
│        │initials│        │
│        └────────┘        │
│                          │
│   "Session Complete!"    │  24px, weight 700, #2D3A2D
│                          │
│   You co-worked with     │  16px, weight 400, #756C62
│   [Name] today           │
│                          │
│ ┌──────────────────────┐ │
│ │ Date     Feb 8, 2026 │ │  Card, white bg, 16px padding
│ │ Duration ~4 hours    │ │  Approx (accepted_at → completed_at)
│ └──────────────────────┘ │
│                          │
│ [   Back to Chat    ]    │  Primary button, full width
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Fetching session data | Centered spinner |
| `complete` | Session data loaded | Full layout as above |

**Interactions:**
- "Back to Chat" → pops back to ChatScreen

**Duration Calculation:**
- If `accepted_at` and `completed_at` both exist: `completed_at - accepted_at` formatted as hours/minutes
- If `completed_at` is missing (edge case): show "—"
- Round to nearest 15 minutes for display (e.g., "~2 hours", "~45 minutes")

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Auto-completed session (completed_at = end of day) | Duration calculated from accepted_at to end of session_date |
| Session date was yesterday | Shows actual date, not "today" |
| Very short session (< 5 min) | Shows "< 5 minutes" |

---

## Components

### SessionRequestCard

**File:** `src/components/session/SessionRequestCard.tsx`

**Purpose:** Inline card rendered in the chat timeline showing session status and actions

**Props:**
- `session`: Session
- `currentUserId`: string
- `onAccept`: (sessionId: string) => void
- `onDecline`: (sessionId: string) => void
- `onCancel`: (sessionId: string) => void
- `onViewSession`: (sessionId: string) => void
- `onViewSummary`: (sessionId: string) => void

**Card Base Styling:**
- Width: 100% of chat content area (no left/right alignment)
- Background: `#F7F5F2` (app background)
- Border: 1.5px `#E8DCD0` (cream)
- Border radius: 16px
- Padding: 16px
- Margin: 12px vertical (same as different-sender message gap)
- Centered horizontally in chat

**Status Variants:**

#### Pending — Invitee View
```
┌─────────────────────────┐
│ 📋  Session Request      │  Label: 13px, weight 600, #5C6B57
│                          │
│ [Name] wants to          │  14px, weight 400, #2D3A2D
│ co-work with you today   │
│                          │
│  [Accept]    [Decline]   │  Side by side, 12px gap
└─────────────────────────┘
```
- "Accept" button: primary variant (sage bg, white text)
- "Decline" button: ghost variant (#B57070 text)

#### Pending — Initiator View
```
┌─────────────────────────┐
│ 📋  Session Request      │
│                          │
│ You invited [Name]       │
│ to co-work today         │
│                          │
│ Waiting for response...  │  14px, italic, #968D82
│                          │
│       [Cancel]           │  Ghost variant, centered
└─────────────────────────┘
```

#### Active
```
┌─────────────────────────┐
│ ✅  Session Active       │  Label: 13px, weight 600, #6B9B6B
│                          │
│ Co-working with [Name]   │
│ Started at [time]        │  14px, #756C62
│                          │
│    [View Session]        │  Secondary button, centered
└─────────────────────────┘
```
- Border color changes to `#6B9B6B` (success green) with 1.5px

#### Declined
```
┌─────────────────────────┐
│ ✗  Session Declined      │  Label: 13px, weight 600, #B57070
│                          │
│ [Name] can't co-work     │  14px, #756C62
│ right now                │
└─────────────────────────┘
```
- Opacity: 0.7 (dimmed)
- No action buttons

#### Completed
```
┌─────────────────────────┐
│ ✅  Session Completed    │  Label: 13px, weight 600, #6B9B6B
│                          │
│ Co-worked with [Name]    │
│ [date]                   │  14px, #756C62
│                          │
│   [View Summary]         │  Ghost button, centered
└─────────────────────────┘
```

#### Cancelled
```
┌─────────────────────────┐
│ ✗  Session Cancelled     │  Label: 13px, weight 600, #968D82
│                          │
│ Session request was      │  14px, #968D82
│ cancelled                │
└─────────────────────────┘
```
- Opacity: 0.7 (dimmed)
- No action buttons

**Button Sizing:**
- Accept/Decline/Cancel: min height 40px, horizontal padding 20px, font 14px weight 600
- View Session/View Summary: min height 36px, font 14px weight 500

---

### StartSessionButton (Chat Header)

**File:** `src/components/session/StartSessionButton.tsx`

**Purpose:** Button in the chat header for initiating a session

**Props:**
- `onPress`: () => void
- `disabled`: boolean
- `hidden`: boolean

**Layout:**
```
[▶ Start Session]
```

**Styling:**
- Background: `#E8DCD0` (cream) when enabled
- Background: `#E2DDD6` (neutral.200) when disabled
- Text: 13px, weight 600, `#5C6B57` when enabled, `#B5ADA3` when disabled
- Icon: "▶" or play icon, 12px, same color as text
- Padding: 6px horizontal, 4px vertical
- Border radius: 8px
- Min touch target: 44px height (achieved via hit slop)

**States:**

| State | Condition | Appearance |
|-------|-----------|------------|
| `visible` | No active/pending session for this match | Normal styling, tappable |
| `disabled` | User has active/pending session in another match | Dimmed styling, not tappable |
| `hidden` | Active/pending session exists for THIS match | Not rendered |

---

## Phase 4 Interactions

### Start Session Flow

1. User A taps "Start Session" in chat header
2. Button shows brief loading state
3. `createSession(matchId, userId)` called
4. If success: session card appears in chat timeline (pending — initiator view)
5. If error (other user has active session): `Alert.alert('Cannot start session', 'One of you already has an active session')`
6. "Start Session" button becomes hidden (session exists for this match)

### Accept Session Flow

1. User B opens chat → sees session request card (pending — invitee view)
2. User B taps "Accept"
3. Button shows loading state (both buttons disabled)
4. `respondToSession(sessionId, userId, 'accept')` called
5. Card updates to "Session Active" state via Realtime or immediate state update
6. "Start Session" button hidden in all User B's other chats

### Decline Session Flow

1. User B taps "Decline" on session request card
2. `respondToSession(sessionId, userId, 'decline')` called
3. Card updates to "Session Declined" state
4. "Start Session" button becomes visible again in chat header

### Cancel Session Flow

1. User A (initiator) taps "Cancel" on their pending session card
2. `cancelSession(sessionId, userId)` called
3. Card updates to "Session Cancelled" state
4. "Start Session" button becomes visible again

### End Session Flow

1. User navigates to Active Session screen (via "View Session" on card)
2. Taps "End Session"
3. `completeSession(sessionId, userId)` called
4. Navigates to Session Complete screen with summary
5. Session card in chat updates to "Session Completed" state

### Auto-Complete Flow

1. App starts (user is authenticated)
2. `autoCompleteStaleSessions()` called silently
3. Any sessions with status='active' AND session_date < today → set to 'completed'
4. Next time user opens relevant chat, card shows "Session Completed"

---

## Phase 4 Edge Cases

| Scenario | Behavior |
|----------|----------|
| User A starts session, User B is offline | Card waits in pending state. User B sees it when they next open the chat. |
| Both users try to start session simultaneously | One succeeds, the other gets "already has active session" error. Race condition handled by database constraint. |
| User A starts session, then User A cancels, then starts again | Allowed. Cancelled sessions don't count toward the one-per-user limit. |
| Session still pending at end of day | Auto-complete only affects 'active' sessions. Pending sessions from previous days remain pending (stale). Initiator can cancel. |
| User A has active session with User B, tries to start session with User C | Blocked. One active/pending session per user across all matches. |
| User deletes account while session is active | ON DELETE CASCADE removes session and participants. |
| Chat has multiple historical sessions | All session cards render inline at their respective timestamps. Only the most recent pending/active session is "live." |
| Network error on accept/decline | Alert with error, card stays in pending state. User can retry. |
| View Session for a session that was just completed | Screen detects completed status, redirects to Session Complete screen. |

---

## Phase 4 Typography Additions

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Active Session header | 28px | 700 | `#2D3A2D` |
| Session co-worker name | 20px | 600 | `#2D3A2D` |
| Session co-worker subtitle | 14px | 400 | `#756C62` |
| Session detail label | 14px | 500 | `#968D82` |
| Session detail value | 14px | 500 | `#2D3A2D` |
| Session auto-complete hint | 13px | 400 | `#968D82` |
| Session Complete heading | 24px | 700 | `#2D3A2D` |
| Session Complete subtitle | 16px | 400 | `#756C62` |
| Session card label | 13px | 600 | varies by status |
| Session card body text | 14px | 400 | `#2D3A2D` |
| Session card secondary text | 14px | 400 | `#756C62` |
| Session card italic text | 14px | 400 italic | `#968D82` |
| Start Session button text | 13px | 600 | `#5C6B57` |

---

## Phase 3 Interactions

### Match Detection & Modal

1. User swipes right → `recordSwipe` called
2. If `check_match` returns true → `create_match` RPC called
3. MatchModal shown with `visible = true`
4. User taps "Send Message" → `onSendMessage(matchId, matchedUser)` called
5. DiscoverScreen navigates to `Matches` tab → `Chat` screen with params
6. OR user taps "Keep Swiping" → `onDismiss()` → modal hides, discovery continues

### Chat Send Flow

1. User types message in ChatInputBar
2. Send button enables (input not empty after trim)
3. User taps send
4. Message inserted to `messages` table via `sendMessage()`
5. Input clears
6. Message appears in list (optimistic: append immediately, or wait for insert response)
7. FlatList scrolls to bottom

### Chat Receive Flow (Real-time)

1. ChatScreen mounts → subscribes to `messages` table INSERT events for this `match_id`
2. Other user sends message → Supabase Realtime delivers event
3. New message appended to local messages array
4. FlatList scrolls to bottom
5. `markChatRead` called to update unread state

### Unread Badge Flow

1. MainTabs mounts → fetch unread count via `getUnreadCount(userId)`
2. Set `tabBarBadge` on Matches tab
3. On Matches tab focus → re-fetch unread count
4. After opening chat → `markChatRead` called → badge count decreases on next focus

---

## Phase 3 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Match already exists (re-swipe) | `create_match` returns existing match ID, no duplicate |
| User opens chat with 0 messages | Shows "Start the conversation!" empty state |
| Send message fails | Alert with error, message stays in input field |
| Real-time subscription disconnects | Messages still load on manual refresh or re-mount |
| Very long message text | Bubble wraps text, no max character limit for MVP |
| Both users send at same time | Both messages appear, ordered by `created_at` |
| User deletes account | ON DELETE CASCADE removes matches and messages |
| Match modal while card stack empty | Modal shows, "Keep Swiping" transitions to empty state |
| Navigate to chat from modal | Switches to Matches tab, pushes Chat screen onto stack |
| Back from chat | Returns to MatchesList, unread count refreshes |

---
---

# Phase 5: Friends & Polish

**Added:** 2026-02-15

---

## Navigation

### Tab Bar (4 Tabs)

| Tab | Label | Stack | Icon |
|-----|-------|-------|------|
| Discover | "Discover" | DiscoverScreen (direct) | 🔍 |
| Friends | "Friends" | FriendsStack | 👥 |
| Chat | "Chat" | ChatStack (renamed MatchesStack) | 💬 |
| Profile | "Profile" | ProfileStack | 👤 |

### FriendsStack

**File:** `src/navigation/FriendsStack.tsx`

**Purpose:** Stack navigator for the Friends tab

**Screens:**

| Screen | Route Name | Params |
|--------|-----------|--------|
| FriendsScreen | `Friends` | None |
| AddFriendScreen | `AddFriend` | None |

### ProfileStack

**File:** `src/navigation/ProfileStack.tsx`

**Purpose:** Stack navigator for the Profile tab

**Screens:**

| Screen | Route Name | Params |
|--------|-----------|--------|
| ProfileScreen | `Profile` | None |
| EditProfileScreen | `EditProfile` | None |

### ChatStack (renamed from MatchesStack)

Existing MatchesStack behavior, just tab label renamed from "Matches" to "Chat".

---

## Screens

### 7. FriendsScreen

**File:** `src/screens/friends/FriendsScreen.tsx`

**Purpose:** Display pending friend requests and friends split into two collapsible categories — "Available Today" (with intent) and "Not Available" (without intent)

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│ ┌─────────────────────┐  │
│ │    "Friends"     [+] │  │  Header: title + add button
│ └─────────────────────┘  │
│                          │
│ ▶ Pending Requests   🔴  │  Collapsed by default, red dot when count > 0
│                          │
│ ▼ Available Today (3)    │  Expanded by default
│ ┌──────────────────────┐ │
│ │ FriendCard (avail)   │ │  Photo + name + time · location
│ │ ──────────────────── │ │
│ │ FriendCard (avail)   │ │
│ │ ──────────────────── │ │
│ │ FriendCard (avail)   │ │
│ └──────────────────────┘ │
│                          │
│ ▶ Not Available (2)      │  Collapsed by default
│                          │
└─────────────────────────┘
```

**Expanded Pending Requests:**
```
│ ▼ Pending Requests (2)   │  Tap header to expand
│ ┌──────────────────────┐ │
│ │ FriendRequestCard    │ │
│ │ ──────────────────── │ │
│ │ FriendRequestCard    │ │
│ └──────────────────────┘ │
```

**Expanded Not Available:**
```
│ ▼ Not Available (2)      │  Tap header to expand
│ ┌──────────────────────┐ │
│ │ FriendCard (simple)  │ │  Photo + name only
│ │ ──────────────────── │ │
│ │ FriendCard (simple)  │ │
│ └──────────────────────┘ │
```

**Section Header Styling:**
- Tappable row with chevron indicator (▼ expanded, ▶ collapsed)
- Chevron: 14px, `#9B9B9B`
- Title: 14px, weight 600, `#968D82`, uppercase, letterSpacing 0.5
- Count in parentheses
- Red dot on "Pending Requests" header: 8px diameter, `#B85C4D`, only visible when count > 0
- Padding: 12px vertical, 16px horizontal
- Background: transparent

**Default Collapse State:**
- Pending Requests: **collapsed** (red dot visible if pending > 0)
- Available Today: **expanded**
- Not Available: **collapsed**

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Initial fetch in progress | Centered spinner + "Loading friends..." |
| `empty` | No friends and no pending requests | Centered illustration + "No friends yet" + "Match with people on Discover or add them here!" + "Add Friend" button |
| `list` | Has friends or pending requests | ScrollView with collapsible sections |

**Interactions:**
- "+" button in header → navigate to AddFriendScreen
- Tap section header → toggle expand/collapse for that section
- Accept on FriendRequestCard → calls `respondToFriendRequest('accept')` → card moves from pending to available/not-available
- Decline on FriendRequestCard → calls `respondToFriendRequest('decline')` → card removed from pending
- Tap a FriendCard → navigate to ChatScreen with `matchId` and `otherUser` params
- Pull-to-refresh → refetch pending requests and both friend categories
- Screen focus → refetch data (useFocusEffect)

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| 0 friends, 0 pending | Empty state with encouragement text and add button |
| 0 friends, has pending | Only pending section header shows (collapsed, red dot) |
| Has friends, 0 pending | Pending section header hidden entirely |
| All friends available | "Not Available" section header shows with count (0), collapsed |
| No friends available | "Available Today" section shows with count (0), expanded but empty |
| Accept fails (network) | Alert with error, card stays in pending state |
| Decline fails (network) | Alert with error, card stays in pending state |
| New request arrives while viewing | Visible on next pull-to-refresh or screen refocus; red dot appears |
| Friend's availability changes | Updates on next pull-to-refresh or screen refocus |

---

### 8. AddFriendScreen

**File:** `src/screens/friends/AddFriendScreen.tsx`

**Purpose:** Search for existing users and send friend requests

**Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│ ┌─────────────────────┐  │
│ │ ← Back "Add Friend" │  │  Header with back button
│ └─────────────────────┘  │
│                          │
│ ┌─────────────────────┐  │
│ │ 🔍 Search by username│  │  Search input (pill shape)
│ │   email, or phone   │  │
│ └─────────────────────┘  │
│                          │
│ ┌──────────────────────┐ │
│ │ UserSearchResultCard │ │  FlatList of results
│ │ ──────────────────── │ │
│ │ UserSearchResultCard │ │
│ │ ──────────────────── │ │
│ │ UserSearchResultCard │ │
│ └──────────────────────┘ │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `initial` | Input is empty | Centered text: "Search by username, email, or phone number" + magnifying glass icon |
| `searching` | Query in progress (3+ chars typed) | ActivityIndicator below search input |
| `results` | Query returned results | FlatList of UserSearchResultCard |
| `no_results` | Query returned 0 results | Centered text: "No users found" + "Try a different search term" |

**Search Behavior:**
- Debounced: 300ms after typing stops
- Minimum 3 characters before search triggers
- Fewer than 3 characters: stays on `initial` state (no error)
- Max 20 results returned
- Searches across `username`, `email`, and `phone_number` fields using ILIKE
- Current user excluded from results

**Interactions:**
- Type in search → debounced query fires
- Tap "Add" button on result → calls `sendFriendRequest` → button changes to "Requested" (optimistic)
- Tap "Accept" button on result (pending_received) → calls `respondToFriendRequest('accept')` → button changes to "Friends"
- Clear search input → returns to `initial` state
- Back button → returns to FriendsScreen

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Query < 3 characters | Stays on initial state, no search triggered |
| Query returns 0 results | Shows "No users found" empty state |
| Send request fails | Alert with error, button reverts from "Requested" to "Add" |
| User already requested | Button shows "Requested" (disabled), no action |
| User is already a friend | Button shows "Friends" with checkmark, no action |
| User previously declined | Button shows "Declined" (disabled), no action |
| Very fast typing | Only the final debounced query fires |
| Network error during search | Alert with error, stays on previous state |

---

## Components

### FriendRequestCard

**File:** `src/components/friends/FriendRequestCard.tsx`

**Purpose:** Single row in the pending requests section with accept/decline actions

**Props:**
- `friendship`: Friendship (with requester profile joined)
- `onAccept`: (friendshipId: string) => void
- `onDecline`: (friendshipId: string) => void

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌────┐  Alex Chen                   │  Row height: 72px
│ │photo│  @alexchen                   │  Padding: 16px horizontal
│ └────┘         [Accept]  [Decline]  │  Buttons right-aligned
└─────────────────────────────────────┘
```

**Photo:**
- Size: 48 x 48px
- Border radius: 24px (circular)
- If no photo_url: initials on `#D4DCD1` background
- Initials: 18px, weight 600, color `#6F8268`

**Text:**
- Name: 16px, weight 600, color `#2D3A2D`
- Username: 14px, weight 400, color `#756C62`

**Buttons:**
- "Accept": primary variant (sage bg `#A8B5A2`, white text), min height 36px, padding 12px horizontal, font 14px weight 600, border radius 10px
- "Decline": ghost variant (`#B57070` text, no background), min height 36px, padding 12px horizontal, font 14px weight 500
- 8px gap between buttons
- Both disabled during loading (opacity 0.5)

**Separator:**
- 1px line, color `#E2DDD6`
- Full width (no inset)

**Touch:**
- Minimum height: 72px (exceeds 44pt touch target)
- Buttons are tappable with 44pt touch targets (achieved via padding)

---

### FriendCard

**File:** `src/components/friends/FriendCard.tsx`

**Purpose:** Single row in the friends list showing a friend. Two variants: "available" (with intent summary) and "simple" (name + photo only).

**Props:**
- `friend`: FriendListItem
- `onPress`: () => void
- `variant`: 'available' | 'simple' (default: 'simple')

**Layout — Available (in "Available Today" section):**
```
┌─────────────────────────────────────┐
│ ┌────┐  Jordan Kim                  │  Row height: 64px
│ │photo│  14:00–18:00 · Blue Bottle  │  Time window + location
│ └────┘                              │
└─────────────────────────────────────┘
```

**Layout — Simple (in "Not Available" section):**
```
┌─────────────────────────────────────┐
│ ┌────┐  Taylor Swift                │  Row height: 56px
│ │photo│                             │  Name only, no subtitle
│ └────┘                              │
└─────────────────────────────────────┘
```

**Photo:**
- Size: 48 x 48px
- Border radius: 24px (circular)
- If no photo_url: initials on `#D4DCD1` background
- Initials: 18px, weight 600, color `#6F8268`

**Text — Available variant:**
- Name: 16px, weight 600, color `#2D3A2D`
- Intent summary: 14px, weight 400, color `#756C62`, numberOfLines={1}
- Format: `"{available_from}–{available_until} · {location_name || location_type}"`
- Example: "14:00–18:00 · Blue Bottle Coffee" or "09:00–13:00 · Library"
- If no location_name, falls back to location_type (e.g. "Cafe", "Library", "Anywhere")

**Text — Simple variant:**
- Name: 16px, weight 600, color `#2D3A2D`
- No subtitle

**Separator:**
- 1px line, color `#E2DDD6`
- Left inset: 80px (aligned past the photo)

**Touch:**
- Minimum height: 64px (available) / 56px (simple)
- Touchable feedback: opacity reduction on press

---

### UserSearchResultCard

**File:** `src/components/friends/UserSearchResultCard.tsx`

**Purpose:** Single row in search results showing a user with relationship-aware action button

**Props:**
- `user`: UserSearchResult
- `onAdd`: (userId: string) => void
- `onAccept`: (friendshipId: string) => void

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌────┐  Alex Chen         [Action] │  Row height: 64px
│ │photo│  @alexchen                  │  Padding: 16px horizontal
│ └────┘                              │
└─────────────────────────────────────┘
```

**Photo:**
- Size: 40 x 40px
- Border radius: 20px (circular)
- If no photo_url: initials on `#D4DCD1` background
- Initials: 16px, weight 600, color `#6F8268`

**Text:**
- Name: 16px, weight 600, color `#2D3A2D`
- Username: 13px, weight 400, color `#968D82`

**Action Button — varies by relationship status:**

| Status | Label | Style | Tappable |
|--------|-------|-------|----------|
| `none` | "Add" | Primary (sage bg, white text) | Yes |
| `pending_sent` | "Requested" | Disabled (gray bg `#E2DDD6`, muted text `#968D82`) | No |
| `pending_received` | "Accept" | Primary (sage bg, white text) | Yes |
| `friends` | "Friends ✓" | Disabled (sage text `#A8B5A2`, no background) | No |
| `declined` | "Declined" | Disabled (gray bg `#E2DDD6`, muted text `#968D82`) | No |

**Button Sizing:**
- Min width: 80px
- Height: 32px
- Padding: 10px horizontal
- Font: 13px, weight 600
- Border radius: 8px

**Separator:**
- 1px line, color `#E2DDD6`
- Left inset: 72px (aligned past the photo)

---

## Profile Screen (Redesigned — Hinge-Style)

**File:** `src/screens/profile/ProfileScreen.tsx` (rewritten)

**Purpose:** Show user's profile with Hinge-style interleaved photos and info cards

**Layout:**
```
┌──────────────────────────────┐
│ ← My Profile            ✏️  │  Header
├──────────────────────────────┤
│ ScrollView                   │
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │  Lead photo (~400px)
│ │      📷 Photo 1          │ │  borderRadius: 16
│ │                          │ │
│ │  Alex Chen               │ │  Name overlaid bottom-left
│ └──────────────────────────┘ │  White text, text shadow
│                              │
│  27 · East Village · NYC    │  Age · Neighborhood · City
│                              │
│ ┌──────────────────────────┐ │  Info card
│ │ 💼 Freelancer            │ │  Work type
│ │ "Building cool things"   │ │  Tagline (italic)
│ │                          │ │
│ │ CURRENTLY WORKING ON     │ │
│ │ "A productivity app..."  │ │
│ │ 🏢 Acme Corp             │ │  Work
│ │ 🎓 Stanford              │ │  School
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │  Photo 2 (if exists)
│ │      📷 Photo 2          │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │  Photo 3 (if exists)
│ │      📷 Photo 3          │ │
│ └──────────────────────────┘ │
│                              │
│ [Edit Profile]  [Sign Out]  │
└──────────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Profile data fetching | Centered spinner |
| `no_photos` | User has no photos | Initials fallback + migration banner |
| `complete` | Profile loaded with photos | Full Hinge-style layout |

**Info Card Styling:**
- Background: white (`#FFFFFF`)
- Border radius: 16px
- Padding: 16px
- Subtle shadow (same as card shadow)
- Section labels: 12px, weight 500, uppercase, color `#968D82`

**Name Overlay:**
- Position: absolute, bottom-left of lead photo
- Font: 28px, weight 700, color white
- Text shadow for readability

**Age · Location Line:**
- Format: `{age} · {neighborhood} · {city}`
- Only parts that exist are shown (e.g. just "27 · New York" if no neighborhood)
- Font: 16px, weight 400, color `#756C62`

**Migration Banner (no photos):**
- Shown when user has 0 photos
- Card with camera emoji + "Add a photo so people know who they're meeting!"
- Tapping navigates to EditProfile
- Card styling: `#FFFFFF` bg, 1.5px `#E8DCD0` border, 16px padding, 16px border radius

**Removed from Profile screen:**
- Phone Number row (deferred to Settings)
- My Friends row (moved to Friends tab)

---

## Friends Tab Badge

**File:** `src/navigation/MainTabs.tsx` (modified)

**Behavior:**
- Friends tab icon shows numeric badge when pending friend request count > 0
- Badge color: `#B57070` (same pattern as chat unread badge)
- Badge fetched via `getPendingRequestsCount(userId)` on Friends tab focus
- Badge disappears when count is 0

---

## Phase 5 Interactions

### Search and Send Friend Request Flow

1. User navigates to Friends tab → "+" (Add Friend)
2. Types query in search input (minimum 3 characters)
3. After 300ms debounce, search fires
4. Results appear with relationship-aware action buttons
5. User taps "Add" on a result
6. `sendFriendRequest` called
7. Button changes to "Requested" immediately (optimistic)
8. If error: Alert shown, button reverts to "Add"
9. Recipient sees pending request next time they open Friends screen

### Accept Friend Request Flow

1. User B opens Friends screen (or Friends tab badge prompts them)
2. Pending requests section shows at top
3. User B taps "Accept" on User A's request
4. `respondToFriendRequest(friendshipId, userId, 'accept')` called
5. RPC sets status='accepted' and creates match row via `create_match`
6. FriendRequestCard moves from pending section to friends list
7. Both users can now chat (match row exists)

### Decline Friend Request Flow

1. User B taps "Decline" on User A's request
2. `respondToFriendRequest(friendshipId, userId, 'decline')` called
3. RPC sets status='declined'
4. FriendRequestCard removed from pending section
5. User A's search results show "Declined" for User B (no re-request)

### Mutual Request Auto-Accept Flow

1. User A sends friend request to User B → pending (A→B)
2. User B searches for User A and taps "Add"
3. `send_friend_request` RPC detects existing pending (A→B)
4. Auto-accepts: sets A→B friendship to 'accepted', creates match
5. User B sees "Friends ✓" immediately
6. User A sees User B in friends list on next refresh

### Navigate to Friend's Chat Flow

1. User taps a FriendCard on Friends screen
2. FriendCard has `match_id` and `otherUser` data
3. Navigate to `Matches` tab → `Chat` screen with `{ matchId, otherUser }` params
4. Chat opens with existing conversation (or empty state for new friendship)

### Add Phone Number Flow

1. User taps "Phone Number" row on Profile screen
2. Alert.prompt (iOS) or modal appears with TextInput
3. User enters phone number and confirms
4. `updatePhoneNumber(userId, phoneNumber)` called
5. Row updates to show the new phone number
6. User is now searchable by this phone number

---

## Phase 5 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Search with < 3 characters | No search triggered, stays on initial state |
| Search returns self | Self excluded from results (filtered server-side) |
| Send request to already-matched user | Search results show "Friends ✓", no "Add" button |
| Request already sent to this user | Search results show "Requested" (disabled) |
| Request from this user pending | Search results show "Accept" button |
| User previously declined | Search results show "Declined" (disabled, no re-request) |
| Accept request while offline | Alert with error, card stays in pending |
| Tap friend with no match row | Should not happen (accept always creates match). Fallback: show error toast |
| Phone number empty string | Treated as null (cleared) |
| Very long phone number | TextInput max length 20 characters |
| Friends screen with 100+ friends | FlatList handles scrolling, no pagination for MVP |
| Profile tab badge while on Profile tab | Badge still visible; clears on next focus cycle |
| Navigate to chat from Friends screen | Cross-tab navigation: `navigation.navigate('Matches', { screen: 'Chat', params })` |

---

## Phase 5 Typography Additions

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Friends screen title | 28px | 700 | `#2D3A2D` |
| Friends section header | 14px | 600 | `#968D82` (uppercase) |
| Add Friend screen title | 28px | 700 | `#2D3A2D` |
| Search input text | 16px | 400 | `#2D3A2D` |
| Search input placeholder | 16px | 400 | `#968D82` |
| Friend request name | 16px | 600 | `#2D3A2D` |
| Friend request username | 14px | 400 | `#756C62` |
| Friend card name | 16px | 600 | `#2D3A2D` |
| Friend card subtitle (available) | 14px | 400 | `#756C62` |
| Friend card subtitle (not available) | 14px | 400 italic | `#968D82` |
| Search result name | 16px | 600 | `#2D3A2D` |
| Search result username | 13px | 400 | `#968D82` |
| Search result action button | 13px | 600 | varies |
| Profile phone label | 14px | 500 | `#968D82` |
| Profile phone value | 16px | 400 | `#2D3A2D` |
| Profile phone placeholder | 16px | 400 italic | `#B5ADA3` |
| Profile friends label | 16px | 600 | `#2D3A2D` |
| Profile friends count | 16px | 400 | `#756C62` |
| Empty state title | 24px | 600 | `#2D3A2D` |
| Empty state text | 16px | 400 | `#756C62` |

---
---

# Phase 5: Profile Redesign

**Added:** 2026-02-16

---

## Navigation Update

Navigation restructured as described in Phase 5: Friends & Polish Navigation section above. ProfileStack now contains only ProfileScreen and EditProfileScreen. FriendsScreen and AddFriendScreen moved to FriendsStack (new dedicated tab).

---

## Screens

### 9. ProfileScreen (Redesigned — Hinge-Style)

**File:** `src/screens/profile/ProfileScreen.tsx` (rewritten)

**Purpose:** Show user's profile with Hinge-style interleaved photos and info cards

**Layout:**
```
┌──────────────────────────────┐
│ ← My Profile            ✏️  │  Header
├──────────────────────────────┤
│ ScrollView                   │
│                              │
│ ┌──────────────────────────┐ │
│ │                          │ │  Lead photo (~400px)
│ │      📷 Photo 1          │ │  borderRadius: 16
│ │                          │ │
│ │  Alex Chen               │ │  Name overlaid bottom-left
│ └──────────────────────────┘ │  White text, text shadow
│                              │
│  27 · East Village · NYC    │  Age · Neighborhood · City
│                              │
│ ┌──────────────────────────┐ │  Info card
│ │ 💼 Freelancer            │ │  Work type
│ │ "Building cool things"   │ │  Tagline (italic)
│ │                          │ │
│ │ CURRENTLY WORKING ON     │ │
│ │ "A productivity app..."  │ │
│ │ 🏢 Acme Corp             │ │  Work
│ │ 🎓 Stanford              │ │  School
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │  Photo 2 (if exists)
│ │      📷 Photo 2          │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │  Photo 3 (if exists)
│ │      📷 Photo 3          │ │
│ └──────────────────────────┘ │
│                              │
│ [Edit Profile]  [Sign Out]  │
└──────────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | Profile data fetching | Centered spinner |
| `no_photos` | User has no photos | Initials fallback + migration banner |
| `complete` | Profile loaded with photos | Full Hinge-style layout |

**Info Card Styling:**
- Background: white (`#FFFFFF`)
- Border radius: 16px
- Padding: 16px
- Subtle shadow (same as card shadow)
- Section labels: 12px, weight 500, uppercase, color `#968D82`

**Name Overlay:**
- Position: absolute, bottom-left of lead photo
- Font: 28px, weight 700, color white
- Text shadow for readability

**Lead Photo:**
- Height: ~400px, full width (minus 32px horizontal margin)
- Border radius: 16px
- If photo exists: `expo-image` with `contentFit="cover"`
- If no photo: `#E8E7E4` background with initials (64px, weight 700, `#6F8268`)

**Age · Location Line:**
- Format: `{age} · {neighborhood} · {city}`
- Only parts that exist are shown (e.g. just "27 · New York" if no neighborhood)
- Font: 16px, weight 400, color `#756C62`

**Additional Photos:**
- Photos 2+ rendered as full-width images interspersed after the info card
- Each photo: full width (minus 32px horizontal margin), border radius 16px
- Photos displayed sequentially, not as thumbnails

**Migration Banner (no photos):**
- Shown when user has 0 photos
- Card with camera emoji + "Add a photo so people know who they're meeting!"
- Tapping navigates to EditProfile
- Card styling: `#FFFFFF` bg, 1.5px `#E8DCD0` border, 16px padding, 16px border radius

**Data Refresh:**
- `useFocusEffect` calls `getFullProfile()` to refresh data after navigating back from EditProfile

**Removed from Profile screen:**
- Phone Number row (deferred to Settings)
- My Friends row (moved to Friends tab)
- Thumbnail row (photos are full-width interspersed instead)

**Interactions:**
- "Edit Profile" → navigate to EditProfile screen
- Sign Out → existing sign out behavior

---

### 10. EditProfileScreen

**File:** `src/screens/profile/EditProfileScreen.tsx`

**Purpose:** Edit profile photos and text fields

**Layout:**
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │Cancel          Save │ │  Header buttons
│ └─────────────────────┘ │
│                          │
│ ┌──────────────────────┐ │
│ │ ┌────────────────┐   │ │  PhotoSlots grid
│ │ │                │   │ │  Large primary slot
│ │ │  Primary (0)   │   │ │
│ │ │                │   │ │
│ │ └────────────────┘   │ │
│ │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │ │  4 smaller slots (2x2)
│ │ │1 │ │2 │ │3 │ │4 │ │ │
│ │ └──┘ └──┘ └──┘ └──┘ │ │
│ └──────────────────────┘ │
│                          │
│ Name                     │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ Alex Chen            │ │
│ └──────────────────────┘ │
│                          │
│ Birthday                 │  Label + date picker
│ ┌──────────────────────┐ │
│ │ Jan 15, 1999         │ │
│ └──────────────────────┘ │
│                          │
│ Tagline                  │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ Building cool things │ │
│ └──────────────────────┘ │
│                          │
│ Currently Working On     │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ A productivity app   │ │
│ └──────────────────────┘ │
│                          │
│ Work                     │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ Acme Corp            │ │
│ └──────────────────────┘ │
│                          │
│ School                   │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ Stanford             │ │
│ └──────────────────────┘ │
│                          │
│ Neighborhood             │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ East Village         │ │
│ └──────────────────────┘ │
│                          │
│ City                     │  Label + TextInput
│ ┌──────────────────────┐ │
│ │ New York             │ │
│ └──────────────────────┘ │
│                          │
│ Work Type                │  Label + pill selection
│ [Freelancer] [Remote]    │
│ [Founder] [Student]      │
│ [Hybrid] [Other]         │
│                          │
└─────────────────────────┘
```

**Header:**
- Cancel (left): 16px, weight 500, `#756C62`. Navigates back without saving text changes.
- Save (right): 16px, weight 600, `#A8B5A2`. Saves text fields, refreshes profile, navigates back.
- Save disabled while saving (opacity 0.5, shows spinner)

**TextInput Styling:**
- Background: `#EEEDEA` (input bg)
- Border radius: 12px
- Padding: 12px horizontal, 10px vertical
- Font: 16px, weight 400, color `#2D3A2D`
- Placeholder color: `#968D82`
- Label: 14px, weight 600, color `#2D3A2D`, 8px margin-bottom

**Photo Behavior:**
- Tapping an empty slot → `pickImage()` → `uploadPhoto()` (immediate upload)
- Tapping a filled slot → Action Sheet: "Change Photo" / "Remove Photo" / "Set as Primary" (if not position 0) / "Cancel"
- Photos upload/delete immediately, not batched with Save
- If Cancel is tapped after uploading photos, the photos persist (they were already uploaded)

**Work Type Pills:**
- Single selection (same options as onboarding: Freelancer, Remote Employee, Founder, Student, Hybrid, Other)
- Selected state: sage bg `#A8B5A2`, white text
- Unselected state: white bg, `#E8DCD0` border

**Interactions:**
- Cancel → `goBack()` (text changes discarded, photo changes persist)
- Save → `updateProfile(userId, fields)` → `refreshProfile()` → `goBack()`
- Photo add/remove → immediate (not part of Save flow)

**Edge Cases:**

| Scenario | Behavior |
|----------|----------|
| Save with no changes | Still calls updateProfile (no-op), navigates back |
| Upload fails | Alert with error, slot stays empty |
| Delete last photo | Allowed (photos are soft requirement after onboarding) |
| Cancel after photo upload | Photos persist (already saved) |
| Network error on save | Alert with error, stays on screen |

---

## Components

### PhotoSlots

**File:** `src/components/profile/PhotoSlots.tsx`

**Purpose:** Reusable photo grid shared between EditProfileScreen and Onboarding Step 4

**Props:**
- `photos`: ProfilePhoto[] (current photos)
- `totalSlots`: number (default 5)
- `onAddPhoto`: (position: number) => void
- `onRemovePhoto?`: (position: number) => void
- `onSetPrimary?`: (position: number) => void
- `prompts?`: string[] (placeholder text for empty slots)
- `editable?`: boolean (default true)

**Layout:**
```
┌────────────────────────────┐
│ ┌──────────────────────┐   │
│ │                      │   │  Primary slot (position 0)
│ │   "A clear photo     │   │  ~160px height
│ │    of your face"     │   │  or filled photo
│ │                      │   │
│ └──────────────────────┘   │
│ ┌─────┐ ┌─────┐           │
│ │  1  │ │  2  │           │  4 smaller slots in 2x2 grid
│ │     │ │     │           │  ~80px each
│ └─────┘ └─────┘           │
│ ┌─────┐ ┌─────┐           │
│ │  3  │ │  4  │           │
│ │     │ │     │           │
│ └─────┘ └─────┘           │
└────────────────────────────┘
```

**Empty Slot Styling:**
- Dashed border: 2px dashed `#E4E3E0`
- Background: `#F5F4F1`
- Border radius: 12px (primary), 8px (small)
- "+" icon: 24px, `#9B9B9B`
- Prompt text: 12px, `#9B9B9B`, centered below icon

**Filled Slot Styling:**
- Photo via `expo-image`, `contentFit="cover"`
- Border radius matches empty slots
- If editable: small "×" remove button (20px circle, `#B85C4D` bg, white ×, top-right corner)

**Default Prompts:**
- Position 0: "A clear photo of your face"
- Position 1: "A photo of you working"
- Position 2: "A photo that shows your vibe"
- Position 3: "" (no prompt)
- Position 4: "" (no prompt)

---

## SwipeCard Update

**File:** `src/components/discover/SwipeCard.tsx` (modified)

**Change:** Add tagline display below work_type in the photo overlay section.

**Updated Overlay Layout:**
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │ Name          1.2km │ │
│ │ Work type           │ │  Existing
│ │ "Building cool..."  │ │  NEW: tagline (13px, white, italic)
│ └─────────────────────┘ │
```

**Tagline Styling:**
- Size: 13px
- Weight: 400
- Color: `rgba(255,255,255,0.7)` (slightly dimmer than work_type)
- Style: italic
- numberOfLines: 1 (truncated)
- Only renders if tagline is non-null and non-empty

---

## Onboarding Update

**File:** `src/screens/auth/OnboardingScreen.tsx` (modified)

**Change:** Add Step 4 for photo upload. `totalSteps` changes from 3 to 4.

**Step 4 Layout:**
```
┌─────────────────────────┐
│ SafeAreaView             │
│                          │
│   ● ● ● ●              │  Progress dots (4 total)
│                          │
│   "Add a photo"          │  Title: 28px, weight 700
│   "So people know who    │  Subtitle: 16px, weight 400, #756C62
│   they're meeting"       │
│                          │
│ ┌──────────────────────┐ │
│ │     PhotoSlots       │ │  PhotoSlots component
│ │   (1 required)       │ │  Only shows primary slot prominently
│ └──────────────────────┘ │
│                          │
│ [   Get Started   ]      │  Primary button
│                          │  Disabled until 1 photo uploaded
│                          │
│   ← Back                 │  Back button to Step 3
└─────────────────────────┘
```

**Behavior:**
- "Get Started" button disabled until at least 1 photo is uploaded to position 0
- Photo uploads immediately via `uploadPhoto()` when selected
- After tapping "Get Started": sets `onboarding_complete = true`, navigates to main app
- Existing Steps 1-3 unchanged

---

## Profile Redesign Typography Additions

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Profile lead photo initials | 64px | 700 | `#6F8268` |
| Profile name | 24px | 700 | `#2D3A2D` |
| Profile tagline | 16px | 400 italic | `#756C62` |
| Profile section label | 12px | 500 | `#968D82` (uppercase) |
| Profile currently working on | 16px | 400 | `#2D3A2D` |
| Profile work/school | 14px | 400 | `#756C62` |
| Migration banner text | 14px | 500 | `#2D3A2D` |
| Edit Profile header Cancel | 16px | 500 | `#756C62` |
| Edit Profile header Save | 16px | 600 | `#A8B5A2` |
| Edit Profile input label | 14px | 600 | `#2D3A2D` |
| Edit Profile input text | 16px | 400 | `#2D3A2D` |
| Edit Profile input placeholder | 16px | 400 | `#968D82` |
| PhotoSlot prompt text | 12px | 400 | `#9B9B9B` |
| PhotoSlot "+" icon | 24px | 400 | `#9B9B9B` |
| SwipeCard tagline | 13px | 400 italic | `rgba(255,255,255,0.7)` |
| Onboarding Step 4 title | 28px | 700 | `#2D3A2D` |
| Onboarding Step 4 subtitle | 16px | 400 | `#756C62` |

---

## Profile Redesign Edge Cases

| Scenario | Behavior |
|----------|----------|
| User has no photos | Profile shows initials fallback, migration banner appears |
| User has 1 photo | Lead photo shown, no thumbnail row |
| User has 5 photos | All slots filled, no empty slots in EditProfile |
| Delete primary photo with others remaining | Next photo promoted to position 0, profiles.photo_url updated |
| Delete last photo | Allowed — initials shown everywhere, migration banner reappears |
| Very long tagline | Truncated with numberOfLines={1} on SwipeCard |
| All text fields empty | Profile shows only name and work type (graceful null handling) |
| Upload fails mid-onboarding | Alert with error, user can retry. Cannot proceed without 1 photo. |
| Existing user logs in (no photos) | Migration banner on Profile screen, onboarding NOT re-triggered |
| Photo URL becomes stale (deleted from storage) | expo-image shows fallback/empty. User can re-upload via EditProfile. |

---

# Phase 6: Friend Profile View

**Added:** 2026-02-27

---

## Updated Component: FriendCard

**File:** `src/components/friends/FriendCard.tsx`

**Change:** Avatar becomes an independently tappable zone for opening the profile. The outer card tap (chat) is preserved.

**Updated Props:**
- `friend: FriendListItem` — unchanged
- `variant: 'available' | 'simple'` — unchanged
- `onPress: () => void` — unchanged (opens chat)
- `onProfilePress?: () => void` — NEW, optional; fires when avatar is tapped

**Updated Interaction Zones:**

| Tap Target | Area | Action |
|------------|------|--------|
| Avatar (40×40pt circle) | Left side | Calls `onProfilePress` |
| Name, meta text, availability dot, card body | Rest of card | Calls `onPress` (chat) |

**States:**
- `onProfilePress` not provided → avatar tap falls through to `onPress` (disabled inner touchable)
- `onProfilePress` provided → avatar tap fires `onProfilePress` only; does not bubble to outer press

**No visual changes** — card layout, spacing, colors unchanged.

---

## New Component: FriendProfileModal

**File:** `src/components/friends/FriendProfileModal.tsx`

**Purpose:** Bottom sheet modal for viewing a friend's full read-only profile from the Friends tab. Mirrors the `UserProfileModal` pattern from the Discover tab.

**Props:**
- `visible: boolean` — controls modal visibility
- `profile: Profile | null` — the friend's full profile
- `photos: ProfilePhoto[]` — the friend's photos (passed to `UserProfileView`)
- `intent: WorkIntent | null` — the friend's today's intent (may be null)
- `loading: boolean` — true while Supabase fetch is in progress
- `onDismiss: () => void` — called when modal is dismissed
- `onMessage: () => void` — called when `💬` icon is tapped

**Layout (top → bottom):**
```
┌─────────────────────────┐
│ ──── (drag handle)  💬  │  ← header: drag handle centered, 💬 icon top-right
├─────────────────────────┤
│                         │
│   [ActivityIndicator]   │  ← loading state (centered in scroll area)
│                         │
│     OR                  │
│                         │
│   [UserProfileView]     │  ← loaded state (scrollable)
│   photos                │
│   name · age · pills    │
│   today's focus         │
│   field rows            │
│                         │
└─────────────────────────┘
```

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `loading` | `loading === true` | Centered `ActivityIndicator` in scroll body; `💬` icon visible |
| `loaded` | `loading === false` and `profile` is non-null | Full `UserProfileView` in scroll body |

**Interactions:**
- Tap `💬` icon → calls `onMessage` (modal does not auto-dismiss; caller handles dismiss + navigate)
- Swipe sheet down → iOS calls `onDismiss` via `onRequestClose` (native `pageSheet` behavior)
- Tap outside sheet (iOS) → calls `onDismiss`

**Modal config:**
- `animationType="slide"`
- `presentationStyle="pageSheet"`
- `onRequestClose={onDismiss}`

**UserProfileView config inside modal:**
- `isOwnProfile={false}` — hides "Set Today's Focus" CTA
- `photos` passed when available — shows full photo stack
- `todayIntent` passed directly — shows Today's Focus card if non-null, hides if null

---

## Updated Screen: FriendsScreen

**File:** `src/screens/friends/FriendsScreen.tsx`

**Change:** Three new state fields + `handleOpenProfile` handler + `FriendProfileModal` rendered at bottom of JSX.

**New state:**
- `profileModalFriend: FriendListItem | null` — which friend's modal is open (null = closed)
- `profileLoading: boolean` — true while profile fetch is in progress
- `profileData: { profile: Profile | null; photos: ProfilePhoto[]; intent: WorkIntent | null } | null`

**New interaction flow:**

```
User taps avatar on FriendCard
  → handleOpenProfile(friend) called
  → Modal opens immediately (loading spinner)
  → getFullProfile + getTodayIntent fired in parallel
  → On resolve: profileData set, loading cleared
  → Modal shows full profile

User taps 💬 in modal
  → Modal closes
  → openChat(profileModalFriend) called → navigates to Matches tab / Chat

User swipes modal down
  → onDismiss called
  → profileModalFriend set to null
  → Returns to Friends list
```

**FriendCard usage (updated):**
```tsx
<FriendCard
  key={friend.user_id}
  friend={friend}
  variant="available"          // or "simple"
  onPress={() => openChat(friend)}
  onProfilePress={() => void handleOpenProfile(friend)}   // NEW
/>
```

**FriendProfileModal placement:** Rendered as a sibling to `<SafeAreaView>`, outside the scroll tree, at the bottom of the return statement.

---

## Phase 6 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Friend has no photos | `UserProfileView` falls back to `profile.photo_url` (single photo fallback) |
| Friend has no today's intent | `UserProfileView` hides Today's Focus card (`isOwnProfile=false`) |
| Profile fetch returns null profile | Modal stays in loading state; no crash (null guard in modal) |
| User taps two avatars quickly | Second fetch overwrites first; modal shows latest data (acceptable for MVP) |
| Friend has no `match_id` | `onMessage` falls through to `openChat` which shows an alert ("Chat unavailable") |

---

---

# Phase 7 — Group Chat

---

## New Screen: CreateGroupScreen

**File:** `src/screens/matches/CreateGroupScreen.tsx`

**Purpose:** Create a named group chat and select initial members before submitting.

**Components used:**
- `TextInput` — group name
- `TextInput` — friend search (debounced 300ms)
- `CollapsibleSection` — "Available Today" / "Others" friend sections
- `MemberChip` — selected member pills in horizontal `ScrollView`
- Header "Create" `Pressable` — disabled state until conditions met

**Layout order (top → bottom):**
```
┌─────────────────────────────────┐
│  ← Create Group        [Create] │  ← Create disabled until name + ≥1 member
├─────────────────────────────────┤
│  Group name                     │
│  ┌─────────────────────────┐   │
│  │ Friday Co-workers       │   │
│  └─────────────────────────┘   │
│                                 │
│  [Alex ✕] [Jamie ✕]            │  ← MemberChip row (scrollable, hidden if empty)
│                                 │
│  ┌─────────────────────────┐   │
│  │ 🔍 Search friends...   │   │
│  └─────────────────────────┘   │
│                                 │
│  ▼ AVAILABLE TODAY (2)          │  ← CollapsibleSection, expanded by default
│  ● Alex Chen                    │  ← checked = selected
│  ○ Sam Lee                      │
│                                 │
│  ▼ OTHERS (3)                   │  ← CollapsibleSection, expanded by default
│  ○ Jamie Park                   │
│  ○ ...                          │
└─────────────────────────────────┘
```

**States:**
- Loading friends: `ActivityIndicator` centered in list area
- No friends: "Add some friends first to create a group" empty state with link to Add Friend
- Create loading: "Create" button shows spinner, disabled

**Interactions:**
- Tap friend row → toggles selection (adds/removes MemberChip)
- Tap MemberChip ✕ → removes member from selection
- Group name input: empty → Create button disabled
- 0 members selected → Create button disabled
- "Create" tap → calls `createGroupChat` → on success, `navigation.replace('GroupChat', { groupChatId, groupName })`
- Back → confirm discard if name or members entered (optional; acceptable to discard silently for MVP)

**Edge cases:**
- Friend list empty (user has no friends): show empty state prompt
- All friends already searched and selected: search shows no results gracefully
- `createGroupChat` error: show inline error below the name input

---

## New Screen: GroupChatScreen

**File:** `src/screens/matches/GroupChatScreen.tsx`

**Purpose:** Real-time group conversation with messages and co-work session RSVP cards.

**Components used:**
- `GroupMessageBubble` — for message timeline items
- `GroupSessionRSVPCard` — for session timeline items
- `ChatInputBar` — text input + send button (reused unchanged)
- `InviteComposerCard` (date pill pattern) — shown when 📅 is tapped
- `UserProfileModal` — shown when avatar tapped on received message

**Layout order (top → bottom):**
```
┌─────────────────────────────────┐
│  ← GroupName (N members) [📅][ⓘ]│
├─────────────────────────────────┤
│  InviteComposerCard (if open)   │  ← slides in when 📅 tapped
├─────────────────────────────────┤
│                                 │
│  [Inverted FlatList timeline]   │
│                                 │
│  Alex · 2:30pm                  │
│  ┌─────────────────────┐        │  ← GroupMessageBubble (received)
│  │ Anyone free Friday? │        │
│  └─────────────────────┘        │
│                                 │
│         ┌────────────────────┐  │  ← GroupMessageBubble (sent, mine)
│         │ Let's do it!       │  │
│         └────────────────────┘  │
│                                 │
│  ┌─── 📅 Group Session ────┐   │  ← GroupSessionRSVPCard
│  │ Friday, Mar 13           │   │
│  │ Proposed by Alex         │   │
│  │ ✓ 2 going · 1 pending   │   │
│  │  [Yes ✓]  [No ✗]         │   │
│  └──────────────────────────┘   │
├─────────────────────────────────┤
│  Type a message...         [↑]  │
└─────────────────────────────────┘
```

**States:**
- Loading (initial fetch): `ActivityIndicator` centered in timeline area
- Empty (no messages): "No messages yet. Say hi! 👋" centered
- Date picker open: `InviteComposerCard` appears above timeline; tapping outside or "Cancel" closes it
- Sending message: send button disabled until content is non-empty (same as 1:1 ChatScreen)

**Interactions:**
- Type + Send: calls `sendGroupMessage` → message appears immediately via subscription
- Tap 📅: opens `InviteComposerCard` with 7-day options → tap "Send" → `proposeGroupSession` → card appears in timeline
- Tap ⓘ: `navigation.navigate('GroupInfo', { groupChatId })`
- Tap avatar on received bubble: opens `UserProfileModal` (read-only profile of sender)
- RSVP Yes/No on `GroupSessionRSVPCard`: calls `rsvpGroupSession` → card updates

**Edge cases:**
- Member leaves group while viewing chat: their messages remain in timeline (no retroactive deletion)
- Group renamed: header name updates when screen re-focuses from GroupInfoScreen
- Network error sending message: show brief error toast; message input retained

---

## New Screen: GroupInfoScreen

**File:** `src/screens/matches/GroupInfoScreen.tsx`

**Purpose:** View and manage group settings — rename, add members, leave.

**Components used:**
- `TextInput` — group name (edit mode)
- FlatList — members list

**Layout order (top → bottom):**
```
┌─────────────────────────────────┐
│  ← Group Info                   │
├─────────────────────────────────┤
│  [Edit] Friday Co-workers  [✓]  │  ← tap name or pencil → edit mode; ✓ to save
│  Created by Alex · 3 members    │
├─────────────────────────────────┤
│  MEMBERS                        │
│  ○ Alex Chen (You)              │
│  ○ Jamie Park                   │
│  ○ Sam Lee                      │
├─────────────────────────────────┤
│  [+ Add Members]                │
├─────────────────────────────────┤
│  [Leave Group]                  │  ← red text, confirmation alert
└─────────────────────────────────┘
```

**States:**
- Name edit mode: TextInput replaces name label; ✓ (save) and ✕ (cancel) buttons appear in header
- Saving name: spinner; input disabled
- Loading members: `ActivityIndicator`
- Adding members: navigate to a friend picker screen/modal filtered to friends not in group

**Interactions:**
- Tap group name or pencil icon → edit mode
- ✓ → calls `renameGroup` → returns to display mode; header updates
- ✕ → cancels edit, restores previous name
- "+ Add Members" → opens friend search filtered by not-already-in-group → confirm → `addGroupMembers`
- "Leave Group" → `Alert.alert` confirmation → `leaveGroup` → `navigation.popToTop()`

**Edge cases:**
- Rename to empty string: "Save" disabled when name is empty
- Rename server error: show error toast; stay in edit mode
- Last member leaves: group record persists in DB (soft leave); user navigates to MatchesList

---

## Modified Screen: MatchesListScreen

**File:** `src/screens/matches/MatchesListScreen.tsx`

**Change:** Two additions — "+" header button and group chat rows in the unified list.

**New "+" button:**
- Position: top-right of screen header, same row as "Chats" title
- Tap: `navigation.navigate('CreateGroup')`
- Always visible (not conditional on having any groups)

**Unified list logic:**
- `fetchMatches` + `fetchGroupChats` called in parallel on mount and `useFocusEffect`
- Results merged into single array, sorted by `lastMessageAt DESC` (nulls last)
- `MatchCard` rendered for `type: 'dm'` items (unchanged)
- `GroupChatCard` rendered for `type: 'group'` items

**Tab badge:**
- Existing: DM unread count via `get_unread_count` RPC
- New: sum of `GroupChatPreview.unreadCount` values from `fetchGroupChats`
- Total = DM unread + group unread

**Interactions (unchanged for 1:1):**
- Tap MatchCard → navigate to Chat (unchanged)
- Avatar tap on MatchCard → FriendProfileModal (unchanged)

**Interactions (new for groups):**
- Tap GroupChatCard → `navigation.navigate('GroupChat', { groupChatId, groupName })`
- No avatar tap interaction on GroupChatCard (👥 group icon is not tappable)

**Edge cases:**
- No groups yet: list shows 1:1 chats only; no "Groups" empty section shown
- No 1:1 chats or groups: existing empty state unchanged
- Group with no messages: `lastMessageAt` is null; sorted last; preview shows "No messages yet"

---

## New Component: GroupChatCard

**File:** `src/components/matches/GroupChatCard.tsx`

**Purpose:** Chat list row for a group chat in `MatchesListScreen`.

- Left: 👥 icon in a filled circle (40pt, primary color)
- Center: group name (bold, primary text) + "SenderName: last message" (1 line, muted, truncated) OR "No messages yet" (italic, muted)
- Right: "N members" label (small, muted) + green unread dot (✦) when `unreadCount > 0`
- Touch target: full row, ≥ 44pt height

---

## New Component: GroupMessageBubble

**File:** `src/components/matches/GroupMessageBubble.tsx`

**Purpose:** Message bubble for group chats with sender identity for received messages.

**Sent (mine):**
- Right-aligned
- Bubble: `accentSecondary` background, rounded corners
- No name or avatar shown
- Timestamp below bubble (11px, muted)

**Received:**
- Left-aligned
- Avatar (40pt circle, `photo_url` or initials) — tappable if `onAvatarPress` provided
- Sender name (12px, muted) above bubble
- Bubble: `bgCard` + border, rounded corners
- Timestamp below bubble (11px, muted)

---

## New Component: GroupSessionRSVPCard

**File:** `src/components/session/GroupSessionRSVPCard.tsx`

**Purpose:** Inline session proposal card in `GroupChatScreen` timeline.

**States:**

| State | Condition | UI |
|-------|-----------|-----|
| `unvoted` | `status='proposed'` + no rsvp for current user | Date, proposed by, RSVP counts, Yes/No buttons |
| `voted` | `status='proposed'` + rsvp exists for current user | Date, proposed by, RSVP counts, response pill, Cancel (proposer only) |
| `completed` | `status='completed'` | "Session confirmed 🎉" read-only |
| `cancelled` | `status='cancelled'` | Returns `null` — not rendered |

**RSVP count format:** `"3 going · 1 not going · 1 pending"`

**Response pill colors:**
- Yes: success green (`#6B9B6B`) background
- No: error red (`#B57070`) background

---

## New Component: MemberChip

**File:** `src/components/friends/MemberChip.tsx`

**Purpose:** Removable member chip in `CreateGroupScreen`.

- 28pt circular avatar (`photo_url` or initials)
- Name label (12px, truncated)
- ✕ button (right side, ≥ 20pt touch area)
- Displayed in horizontal `ScrollView`

---

## Phase 7 Edge Cases

| Scenario | Behavior |
|----------|----------|
| Group created with 0 messages | `GroupChatCard` shows "No messages yet" in muted italic; `lastMessageAt` null; sorted last in list |
| Group member leaves while others are viewing chat | Leaver's messages remain; member count in header updates on next focus |
| Two members RSVP simultaneously | Last write wins via `UNIQUE(group_session_id, user_id)` constraint; counts reflect actual DB state after re-fetch |
| Group renamed by another member | `GroupChatScreen` header updates when screen re-focuses (fetches group on `useFocusEffect`) |
| User is last member to leave | Group record remains in DB (soft leave); user sees MatchesList without that group |
| `GroupSessionRSVPCard` status is `cancelled` | Component returns `null`; filtered from timeline render |
| `fetchGroupChats` returns empty | MatchesList shows only 1:1 chats; no "Groups" empty section |
| Android platform | `presentationStyle="pageSheet"` is ignored; modal renders full-screen — acceptable for MVP |
