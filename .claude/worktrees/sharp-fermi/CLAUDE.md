# CoWork Connect

**"Find your people. Do the work."**

Location-based social app that helps remote workers, freelancers, and independent professionals find co-working partners. Think Tinder for co-working: swipe through profiles of people nearby who want to work together, match, and meet up.

## Tech Stack

- **Framework**: React Native 0.81 with Expo SDK 54
- **Backend**: Supabase
- **Storage**: AsyncStorage for local persistence
- **Location**: expo-location

## Commands

```bash
npm start       # Start development server
npm run ios     # Run on iOS simulator
npm run android # Run on Android emulator
```

## User Preferences

- **Non-developer user** - explain technical concepts simply, avoid jargon
- **UI/UX focused** - prioritize clean, modern, friendly design
- **Always show the running app** after making changes
- **Commit after each working feature** - atomic commits with clear messages

## Design Guidelines

- Modern, clean, friendly aesthetic - not corporate/sterile
- Plenty of whitespace, consistent spacing and typography
- Smooth animations and transitions
- Accessible touch targets (minimum 44pt)
- Clear visual feedback for interactions

## Product Context

### Target Users
- Remote workers (combat isolation, find structure)
- Freelancers (accountability, networking)
- Founders & indie hackers (community, motivation)
- Students (study partners, focus sessions)
- Digital nomads (meet locals, find work spots)

### MVP Features (v1)
1. User profiles with "today's work intent"
2. Swipe-based discovery (location + availability)
3. Matching and basic messaging
4. Add friends after session
5. Simple session check-in/check-out

### Deferred to v2
- Group chats and communities
- Virtual co-working sessions
- Gamification and challenges
- Premium features

## Core Screens

### Discovery (Swipe Interface)
Cards showing:
- Profile photo and name
- Current project/task
- Work style tags ("Deep focus", "Chat mode", "Flexible")
- Preferred location type (cafe, library, video call)
- Availability window
- Distance

Actions: swipe right (interested), swipe left (pass), tap (full profile)

### Profiles
- Basic: name, photo, bio, city, profession, links
- Work preferences: availability, session length, work style, favorite spots
- Today's intent: what working on, when available, where

### Friends & Connections
- Add friends after successful sessions
- See when friends are working/available
- Quick invite to propose sessions

### Sessions
- Check-in: share goal
- Timer (optional Pomodoro)
- Check-out: share accomplishment

## Key Metric
Weekly active co-working sessions per user
