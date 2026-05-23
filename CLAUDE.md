# Clover — AI Session Context

**"Find your people. Do the work."**
Co-working discovery app. Users set a daily work intent, browse nearby people working today, connect, and meet up. Think Hinge for co-working.

---

## Quick Commands

```bash
npm run ios       # Run on iOS simulator (primary target)
npm start         # Expo dev server
npx tsc --noEmit  # Type check — always run before committing
```

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Backend | Supabase (Postgres + Auth + Storage) |
| Navigation | React Navigation (native stack + bottom tabs) |
| Auth | Email/password + Apple Sign-In (iOS) |
| Location | expo-location |
| Images | expo-image |

---

## App Architecture

### Navigation Tree
```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── Welcome
│   ├── Login       ← Apple Sign-In + email/password
│   └── Signup      ← Apple Sign-In + email/password
└── MainTabs (authenticated, onboarding_complete = true)
    ├── Discover    → DiscoverScreen (Hinge-style scrollable profile feed)
    ├── Friends     → FriendsStack → FriendsScreen / FriendProfileModal
    ├── Matches     → MatchesStack → MatchesListScreen / ChatScreen / GroupChatScreen
    └── Profile     → ProfileStack → ProfileScreen / EditProfileScreen
```

### Key Routing Logic (`src/navigation/index.tsx`)
- `user == null` → AuthStack
- `user != null && !profile?.onboarding_complete` → Onboarding (CinematicOnboardingFlow)
- `user != null && onboarding_complete` → MainTabs
- Apple Sign-In new users land in Onboarding automatically via `onAuthStateChange`

---

## Design System

### Brand Tokens (`src/constants/clover.ts`)
```ts
CLOVER_BG       = '#ede8ff'  // Soft lavender — screen background
CLOVER_FOREST   = '#1e3d28'  // Dark green — primary text, buttons, icons
CLOVER_VIOLET   = '#7c5cbf'  // Violet — accents
CLOVER_LAVENDER = '#d0c8f0'  // Muted lavender — dividers, heart icon
```

### Typography
```ts
FONT_CORMORANT_LIGHT        // Serif — screen titles, profile names, card answers (32px headers, 22px cards)
FONT_CORMORANT_LIGHT_ITALIC // Serif italic — secondary decorative
FONT_DM_SANS_LIGHT          // Sans — body text, field inputs, labels (13–15px)
FONT_DM_SANS_MEDIUM         // Sans medium — buttons, bold labels
```

### Feed Layout (Discovery + Profile + Friend Profile)
All three screens share `DiscoverProfileView` (`src/components/discover/UserProfileModal.tsx`):
- `FEED_MARGIN_H = 16` horizontal margin on all cards and photos
- `FEED_GAP = 12` vertical gap between every feed item
- `FEED_RADIUS = 14` border radius on photos and cards
- Photos are **square** (`SCREEN_WIDTH - 32` × `SCREEN_WIDTH - 32`)
- Feed order: drag handle → name · distance → photo1 → About card → photo2 → info section → Currently Building card → photos 3–5

### Action Buttons
- **Discovery**: Pass (white 56px circle, black ✕, left) + Connect (forest green 56px circle, lavender ♥, right) — no text labels
- **Friend profile**: Message (white 56px circle, black chat SVG, right) — no text label
- **Profile screen**: Edit pill (forest green, top-right header)

---

## Core Features & Files

### Discovery (`src/screens/discover/DiscoverScreen.tsx`)
- Fetches cards via `fetchDiscoveryCards(userId, lat, lng)`
- One profile at a time, Pass/Connect advances the index
- Focus sheet (bottom sheet) lets user set today's work intent
- Match modal fires on mutual connect

### Profile (`src/screens/profile/ProfileScreen.tsx`)
- Uses `DiscoverProfileView` with `distance: 0` and no onPass/onConnect
- Header: `[Profile  ·  Edit pill →]` — left-aligned title matching other tabs

### Edit Profile (`src/screens/profile/EditProfileScreen.tsx`)
- Photo slots (stack layout, square, 4 slots)
- Form fields: Name, Username, Phone, About (tagline), Currently working on, Work, School, Neighbourhood, City, Birthday, Work type
- Bottom section: Account info (email + sign-in method) → Sign Out → Delete Account

### Friends (`src/screens/friends/FriendsScreen.tsx`)
- Lists friends, pending requests, available-today section
- Tap friend → `FriendProfileModal` (pageSheet modal, uses `DiscoverProfileView`)
- Friend profile has Message button (right side, white circle, chat SVG)

### Matches / Chat (`src/screens/matches/`)
- `MatchesListScreen` — DMs + Group Chats tabs
- `ChatScreen` — 1:1 messaging with session proposal cards in timeline
- `GroupChatScreen` — group messaging with session proposals

### Auth (`src/context/AuthContext.tsx`)
Key methods: `signIn`, `signUp`, `signOut`, `signInWithApple`, `deleteAccount`, `refreshProfile`

---

## Database Schema (Supabase)

### Key Tables
| Table | Purpose |
|-------|---------|
| `profiles` | User profile (name, bio, city, work, school, birthday, etc.) |
| `profile_photos` | Up to 5 photos per user, ordered by `position` |
| `work_intents` | Today's focus: task, availability window, location, coords |
| `swipes` | Pass/connect swipe records |
| `matches` | Mutual connects |
| `messages` | DM messages |
| `sessions` | Proposed co-work sessions within DMs |
| `friendships` | Friend connections (pending/accepted/declined) |
| `group_chats` / `group_messages` / `group_members` | Group chat system |

### Key RPCs
- `fetch_discovery_cards(user_id, lat, lng)` — returns nearby users with intent today
- `record_swipe(swiper, swiped, direction)` — returns `{ is_match, match_id }`
- `delete_account()` — cascade deletes all user data + auth.users row

---

## Service Layer (`src/services/`)

| File | Responsibility |
|------|---------------|
| `profileService.ts` | `getFullProfile`, `updateProfile` |
| `discoveryService.ts` | `fetchDiscoveryCards`, `recordSwipe`, `getTodayIntent` |
| `photoService.ts` | `getPhotos`, `uploadPhoto`, `deletePhoto`, `setPrimaryPhoto` |
| `messagingService.ts` | Messages, matches, sessions |
| `friendsService.ts` | Friendships, friend list, pending requests |
| `groupChatsService.ts` | Group chat CRUD |
| `sessionService.ts` | Session proposals and status |

---

## What's Been Built (Phase Summary)

| Phase | What shipped |
|-------|-------------|
| 1 | Auth, onboarding, profile creation |
| 2 | Discovery feed (swipe cards → Hinge scroll), matching |
| 3 | 1:1 messaging, chat screen |
| 4 | Session proposals in chat |
| 5 | Friends system, friend profile modal |
| 6 | Group chats |
| 7 | UI polish, design system unification |
| 8 | Unmatch flow |
| 9 | Apple Sign-In, Delete Account, Profile tab redesign, feed-style friend profiles |

---

## Developer Preferences

- **Non-developer user** — explain changes clearly, avoid jargon
- **UI/UX first** — design quality matters as much as function
- **Mockups before big UI changes** — create HTML mockup in `.claude/` and `open` it for review
- **Commit after each feature** — atomic commits, clear messages, `Co-Authored-By: Claude`
- **TypeScript must pass** — always run `npx tsc --noEmit` before committing
- **Branch strategy** — feature branches (`feat/phaseN`) merged into `main` when complete

---

## Docs Reference

Full details in `docs/` — key files:
- `docs/API_CONTRACT.md` — all Supabase RPC signatures
- `docs/RUNBOOK.md` — manual test flows (57 flows)
- `docs/UI_SPEC.md` — design spec
- `docs/STATUS.md` — current status and what's next
