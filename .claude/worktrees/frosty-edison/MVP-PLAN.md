# CoWork Connect - MVP Build Plan

## Overview
Build a React Native/Expo app for finding co-working partners. Swipe-based discovery, matching, messaging, and session tracking.

**Current state:** Fresh Expo project with Supabase client configured. No screens or navigation yet.

---

## Build Phases

### Phase 1: Foundation
**Goal:** User can sign up, create profile, see the app shell

1. Install navigation dependencies
2. Set up navigation structure (AuthStack + MainTabs)
3. Create AuthContext for login state
4. Build auth screens (Welcome, Login, Signup)
5. Create `profiles` table in Supabase
6. Build Onboarding screen (name, photo, work type, interests)
7. Build basic Profile screen

**Result:** User can create account and see tab bar

---

### Phase 2: Discovery
**Goal:** User can see and swipe on other users

1. Create `work_intents` table in Supabase
2. Build Intent screen (set today's availability/location)
3. Install gesture libraries (react-native-gesture-handler, react-native-reanimated)
4. Build swipe card components (SwipeCard, CardStack)
5. Create discovery service (fetch nearby users)
6. Build Discover screen with card stack
7. Create `swipes` table, implement swipe recording

**Result:** User can set intent and swipe through profiles

---

### Phase 3: Matching & Messaging
**Goal:** Matched users can chat

1. Create `matches` and `messages` tables
2. Implement match detection (mutual swipes → match)
3. Build "It's a Match!" modal
4. Build Matches screen (list of matches)
5. Build Chat screen with real-time messages

**Result:** Matched users can message each other

---

### Phase 4: Sessions
**Goal:** Users can invite a match to co-work and track the session through the day

1. Create `sessions` and `session_participants` tables (with RPCs for create, accept, decline, cancel, complete, auto-complete)
2. Add "Send Cowork Invite" button in chat header — sends an invitation card inline in the chat
3. Invite card includes a date selector (today + next 6 days)
4. Invitee sees Accept/Decline on the card; details discussed via regular chat messages
5. After acceptance, system message: "You can now plan coworking details with xxx 😀"
6. Replace "Session Active" UI with dual-lock confirmation ("Locked in 🔒 | Locked in 🔒")
7. Session completes only when both users lock in (🔒❤️)
8. Multiple pending invites across matches are allowed
9. Sessions auto-cancel after 24 hours if not fully locked

**Not included:** No live timer, no Pomodoro, no session notes/ratings, no add-friend prompt (Phase 5), no streak UI (planned later)

**Result:** Users can invite matches to co-work, accept/decline, coordinate details in chat, and confirm locked-in sessions together

---

### Phase 5: Friends & Polish
**Goal:** Users can manually add friends and see all friends (matched + manual) in one place

**Context:** In CoWork Connect, "friends" come from two sources:
- **Auto-friends:** Mutual swipe match in discovery (already stored in `matches` table)
- **Manual friends:** Added by username, email, or phone number (Phase 5)

1. Create `friendships` table with status field (`pending` / `accepted` / `declined`); `matches` table unchanged
2. Add optional `phone_number` field to `profiles` table
3. Build "Add Friend" screen — search existing users by username, email, or phone number
4. Friend request flow: sender taps "Add" → request sent (`pending`), recipient can Accept or Decline
5. Build Friends screen (sub-screen under Profile tab) — pending requests section at top + unified list of accepted friends (matches + manual)
6. Notification badge on Profile tab when pending friend requests exist
7. Friends show: photo, name, current availability status (from `work_intents`)
8. Tap a friend → navigate to their chat (open existing match chat, or create a new conversation if manual-only friend)
9. Polish: loading states, error handling, animations across the app

**Not included:** Contact import (expo-contacts), invite non-users via share link, friend suggestions, re-request after decline

**Result:** Friend system complete — add, manage, and message friends

---

### Phase 6: Friend Profile View
**Goal:** Users can view a friend's full profile from the Friends tab

1. Add tappable avatar zone to `FriendCard` — tap avatar → opens profile modal; tap rest of card → opens chat (unchanged)
2. Build `FriendProfileModal` — bottom sheet showing full `UserProfileView` with a `💬` chat icon in the top-right header corner
3. Fetch full profile (`profiles` + `profile_photos`) and today's intent (`work_intents`) in parallel when avatar is tapped
4. `💬` icon in modal → dismisses modal and navigates to chat

**Not included:** No new tables or RPCs; no profile editing from modal; no new navigator routes

**Result:** Full MVP complete — friends' profiles are accessible from the Friends tab

---

## Libraries to Install

```bash
# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context

# Gestures & Animation (for swipe cards)
npx expo install react-native-gesture-handler react-native-reanimated

# UI
npx expo install expo-image expo-linear-gradient expo-haptics

# Forms & Utils
npx expo install react-hook-form date-fns
```

---

## Folder Structure

```
src/
├── navigation/
│   ├── index.tsx        # Root navigator
│   ├── AuthStack.tsx    # Login/signup flow
│   └── MainTabs.tsx     # Bottom tabs
├── screens/
│   ├── auth/            # Welcome, Login, Signup, Onboarding
│   ├── discover/        # Discover, ProfileDetail
│   ├── matches/         # Matches list, Chat
│   ├── session/         # Intent, ActiveSession, SessionComplete
│   └── profile/         # Profile, EditProfile, Friends
├── components/
│   ├── common/          # Button, Input, Avatar, Card
│   ├── discover/        # SwipeCard, CardStack
│   ├── matches/         # MatchCard, MessageBubble
│   └── session/         # SessionTimer
├── hooks/               # useAuth, useProfile, useDiscovery, etc.
├── context/             # AuthContext, SessionContext
├── services/            # API calls to Supabase
├── constants/           # colors, spacing, typography
└── types/               # TypeScript types
```

---

## Database Tables (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | User info (name, photo, bio, work type, interests) |
| `work_intents` | Today's availability (location, time, status) |
| `swipes` | Swipe history (who swiped whom, direction) |
| `matches` | Mutual swipes |
| `messages` | Chat messages |
| `sessions` | Co-working session records |
| `session_participants` | Who was in each session |
| `friendships` | Friend connections |

---

## Design System: Digital Matcha

A calming, nature-inspired palette — soft sage greens with warm cream tones. Modern and aesthetic.

### Colors

**Primary (Sage Green)**
| Shade | Hex | Usage |
|-------|-----|-------|
| 50 | `#F4F7F3` | Subtle backgrounds |
| 100 | `#E8EDE6` | Hover states, badges |
| 200 | `#D4DCD1` | Borders, dividers |
| 300 | `#B8C7B3` | Disabled states |
| **400** | **`#A8B5A2`** | **Main primary (buttons, active states)** |
| 500 | `#8A9B84` | Hover on primary |
| 600 | `#6F8268` | Pressed states |
| **700** | **`#5C6B57`** | **Accent (icons, secondary text)** |
| 800 | `#4A5745` | Dark accents |
| 900 | `#3B4638` | Very dark |
| **950** | **`#2D3A2D`** | **Text color** |

**Secondary (Warm Cream)**
| Shade | Hex | Usage |
|-------|-----|-------|
| 200 | `#F2EBE1` | Card backgrounds |
| **300** | **`#E8DCD0`** | **Main secondary (highlights, cards)** |
| 400 | `#D9C9B8` | Borders |

**Neutral (Warm Gray)**
| Shade | Hex | Usage |
|-------|-----|-------|
| 0 | `#FFFFFF` | Pure white |
| **50** | **`#F7F5F2`** | **App background** |
| 100 | `#EFEBE6` | Input backgrounds |
| 200 | `#E2DDD6` | Borders |
| 400 | `#B5ADA3` | Placeholder text |
| 500 | `#968D82` | Secondary text |
| 600 | `#756C62` | Muted text |

**Semantic**
| Type | Hex | Usage |
|------|-----|-------|
| Success | `#6B9B6B` | Available, confirmed |
| Warning | `#C9A86C` | Busy, pending |
| Error | `#B57070` | Errors, declined |
| Info | `#7A9BAB` | Information |

**Swipe Colors**
| Action | Hex |
|--------|-----|
| Swipe Right (Like) | `#6B9B6B` (success green) |
| Swipe Left (Pass) | `#B57070` (soft red) |

### Typography

| Type | Font | Usage |
|------|------|-------|
| Headings | DM Sans | Titles, headers |
| Body | Inter | Paragraphs, labels |
| Mono | JetBrains Mono | Code, stats |

### Spacing Scale
`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`

### Border Radius
| Size | Value |
|------|-------|
| sm | 8px |
| md | 12px |
| lg | 16px |
| xl | 24px |
| full | 9999px (pills) |

### Touch Targets
Minimum 44pt for all interactive elements

---

## Quick Reference

```javascript
// Key colors for quick use
const colors = {
  // Primary actions
  primary: '#A8B5A2',      // Buttons, active states
  primaryHover: '#8A9B84',
  accent: '#5C6B57',       // Icons, links

  // Backgrounds
  background: '#F7F5F2',   // App background
  surface: '#FFFFFF',      // Cards
  highlight: '#E8DCD0',    // Featured cards

  // Text
  text: '#2D3A2D',         // Primary text
  textSecondary: '#756C62', // Secondary text
  textMuted: '#968D82',    // Placeholder

  // Semantic
  success: '#6B9B6B',
  warning: '#C9A86C',
  error: '#B57070',

  // Swipe
  swipeRight: '#6B9B6B',
  swipeLeft: '#B57070',
};
```

---

## Verification

After each phase, run the app to verify:
```bash
npm start
# Then press 'i' for iOS simulator
```

**Phase 1:** Can sign up, see profile, navigate tabs
**Phase 2:** Can set intent, see cards, swipe
**Phase 3:** Can match, open chat, send messages
**Phase 4:** Can start/end sessions
**Phase 5:** Can add friends, see friends list
