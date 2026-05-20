# CoWork Connect — Next Steps Guide

## Step 1: Set Up Supabase (30 mins)

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project → pick a name and region close to your users
3. Save your project URL and anon key (you'll need these)

### 1.2 Run the Schema
1. Go to SQL Editor in Supabase dashboard
2. Copy/paste the entire `cowork-connect-schema.sql` file
3. Click "Run" — this creates all tables, indexes, and security policies

### 1.3 Enable Auth Providers
1. Go to Authentication → Providers
2. Enable Email (for dev/testing)
3. Enable Google (for production) — needs Google Cloud credentials
4. Set your site URL and redirect URLs

### 1.4 Test It Works
1. Go to Table Editor
2. You should see all tables: profiles, intents, swipes, matches, friendships, etc.

---

## Step 2: Set Up Your App (1 hour)

### Option A: React Native (Expo) — if you want mobile
```bash
npx create-expo-app cowork-connect
cd cowork-connect
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install expo-location
```

### Option B: Next.js — if you want web first (faster to ship)
```bash
npx create-next-app@latest cowork-connect --typescript --tailwind --app
cd cowork-connect
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### 2.1 Configure Supabase Client
Create `lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Step 3: Build Phase 1 — Core Loop (Weekend 1)

Build in this order. Each piece should work before moving to the next.

### 3.1 Auth + Profile Setup
**Files to create:**
- `app/login/page.tsx` — email/password or Google sign in
- `app/onboarding/page.tsx` — collect name, username, photo, one-liner, city
- `lib/auth.ts` — auth helper functions

**Test:** Can you sign up, create a profile, and see it in Supabase?

### 3.2 Intent Screen
**Files to create:**
- `app/page.tsx` (or `app/home/page.tsx`) — the main intent form
- `components/IntentForm.tsx` — task, location pref, area, time, toggle

**Test:** Can you set your intent and see it update in the `intents` table?

### 3.3 Discover Tab + Swipe
**Files to create:**
- `app/discover/page.tsx` — the swipe interface
- `components/SwipeCard.tsx` — individual profile card
- `lib/discover.ts` — query to fetch swipeable users

**Key query:**
```typescript
const { data } = await supabase.rpc('get_swipeable_users', {
  current_user_id: userId,
  current_lat: lat,
  current_lng: lng,
  max_distance_miles: 5
})
```

You may need to create this as a Postgres function for the distance calculation.

**Test:** Can you see other users (create test accounts) and swipe?

### 3.4 Match Detection + Auto-Friend
**Logic in** `lib/swipes.ts`:
```typescript
async function handleSwipeRight(fromUserId: string, toUserId: string) {
  // 1. Record swipe
  await supabase.from('swipes').insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    direction: 'right'
  })
  
  // 2. Check for mutual swipe
  const { data: mutualSwipe } = await supabase
    .from('swipes')
    .select()
    .eq('from_user_id', toUserId)
    .eq('to_user_id', fromUserId)
    .eq('direction', 'right')
    .single()
  
  if (mutualSwipe) {
    // 3. It's a match! Create match + friendship
    await createMatchAndFriendship(fromUserId, toUserId)
  }
}
```

**Test:** Create two test accounts, swipe right on each other, verify friendship created.

### 3.5 Basic Chat
**Files to create:**
- `app/chat/[conversationId]/page.tsx` — chat screen
- `components/MessageList.tsx` — displays messages
- `components/MessageInput.tsx` — send new messages
- `lib/chat.ts` — message queries + realtime subscription

**Realtime subscription:**
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, (payload) => {
    // Add new message to state
  })
  .subscribe()
```

**Test:** Open chat in two browser windows, send messages, see them appear in realtime.

---

## Step 4: Build Phase 2 — Friends (Weekend 2)

### 4.1 Friends Tab
**Files to create:**
- `app/friends/page.tsx` — three sections (available, not available, waiting)
- `components/FriendCard.tsx` — individual friend row
- `lib/friends.ts` — queries for each section

### 4.2 Friend Limit + Pending Logic
Update your `createMatchAndFriendship` function to check count:
```typescript
const { count } = await supabase
  .from('friendships')
  .select('*', { count: 'exact' })
  .eq('user_id', userId)
  .eq('status', 'active')

const status = count >= 50 ? 'pending' : 'active'
```

### 4.3 Invite Links
**Files to create:**
- `app/invite/[code]/page.tsx` — claim invite page
- `lib/invites.ts` — create and claim invite functions

### 4.4 Add Friend by Username
**Files to create:**
- `app/add-friend/page.tsx` — search UI
- `components/UsernameSearch.tsx` — input + result

---

## Step 5: Build Phase 3 — Engagement (Weekend 3)

### 5.1 Confirm Co-work Button
Add to chat screen:
```typescript
async function confirmCowork(otherUserId: string) {
  // Create session
  await supabase.from('cowork_sessions').insert({
    user_1_id: min(myId, otherUserId),
    user_2_id: max(myId, otherUserId)
  })
  
  // Update friendship
  await supabase
    .from('friendships')
    .update({ last_cowork_at: new Date() })
    .or(`and(user_id.eq.${myId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${myId})`)
}
```

### 5.2 Expiry Warnings
In your friends query, calculate days remaining:
```typescript
const daysUntilExpiry = lastCoworkAt 
  ? 30 - daysSince(lastCoworkAt)
  : 30 - daysSince(createdAt)
```

### 5.3 Expiry Cron Job
Option A: Use Supabase pg_cron (see schema file)
Option B: Use Vercel Cron or similar external cron

---

## Quick Reference: File Structure

```
cowork-connect/
├── app/
│   ├── page.tsx              # Home / Intent screen
│   ├── login/page.tsx        # Auth
│   ├── onboarding/page.tsx   # Profile setup
│   ├── discover/page.tsx     # Swipe
│   ├── friends/page.tsx      # Friends list
│   ├── chat/[id]/page.tsx    # Chat
│   ├── add-friend/page.tsx   # Username search
│   └── invite/[code]/page.tsx # Claim invite
├── components/
│   ├── IntentForm.tsx
│   ├── SwipeCard.tsx
│   ├── FriendCard.tsx
│   ├── MessageList.tsx
│   └── MessageInput.tsx
├── lib/
│   ├── supabase.ts           # Client
│   ├── auth.ts               # Auth helpers
│   ├── discover.ts           # Swipe queries
│   ├── friends.ts            # Friend queries
│   ├── chat.ts               # Message queries
│   └── invites.ts            # Invite helpers
└── .env.local                # Supabase keys
```

---

## Testing Strategy

### Create Test Users
1. Open your app in 3 different browsers (or incognito windows)
2. Sign up as Alice, Bob, Charlie
3. Set intents for each
4. Swipe and match
5. Test chat
6. Test friend expiry by manually updating timestamps in Supabase

### Edge Cases to Test
- [ ] Match when at 50 friends → goes to pending
- [ ] Friend expires → pending promotes
- [ ] Username already taken
- [ ] Swipe on same person twice in one day (should fail)
- [ ] Chat with pending friend (should work)

---

## Launch Checklist

### Before Inviting Friends
- [ ] Auth works (sign up, sign in, sign out)
- [ ] Profile creation works
- [ ] Intent setting works
- [ ] Swipe and match works
- [ ] Chat works
- [ ] Friends list shows correctly
- [ ] Invite links work

### Before Public Launch
- [ ] Add block/report feature
- [ ] Add terms of service
- [ ] Test on mobile browsers
- [ ] Set up error tracking (Sentry)
- [ ] Set up analytics (Posthog, Mixpanel)

---

## Stuck? Debug Checklist

1. **Check Supabase logs** — Dashboard → Logs → Postgres
2. **Check RLS policies** — Most issues are permission errors
3. **Check browser console** — Network tab for API errors
4. **Test queries in Supabase SQL Editor** — Isolate the issue

---

*Now go build. Start with Step 1, don't skip ahead. Ship something ugly that works, then make it pretty.*
