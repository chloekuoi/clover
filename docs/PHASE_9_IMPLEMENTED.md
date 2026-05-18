# PHASE 9 — Apple Sign-In + Delete Account: Implementation Map

**Status:** DONE  
**Phase:** 9

---

## P9-01 — Database: `delete_account` RPC

**Status:** DONE

**Files changed:**
- `supabase/012_delete_account.sql`

**Intended Behavior:**
SECURITY DEFINER RPC `public.delete_account()` cascade-deletes all user data in FK-safe order, then removes the auth.users row. No parameters — uses `auth.uid()` internally.

**Deletion order:**
1. `group_session_rsvps` (no FK to user; keyed via group_members chain)
2. `group_messages` WHERE `sender_id = auth.uid()`
3. `group_chats` WHERE `created_by = auth.uid()` (cascades group_members + group_messages for that group)
4. `group_members` WHERE `user_id = auth.uid()` (removes from groups user did not create)
5. `profile_photos` WHERE `user_id = auth.uid()`
6. `work_intents` WHERE `user_id = auth.uid()`
7. `swipes` WHERE `swiper_id = auth.uid()` OR `swiped_id = auth.uid()`
8. `messages` WHERE `sender_id = auth.uid()`
9. `session_participants` WHERE `user_id = auth.uid()`
10. Orphaned `sessions` WHERE `initiated_by = auth.uid()` AND no remaining participants
11. `matches` WHERE `user1_id = auth.uid()` OR `user2_id = auth.uid()`
12. `friendships` WHERE `requester_id = auth.uid()` OR `addressee_id = auth.uid()`
13. `storage.objects` WHERE `bucket_id = 'avatars'` AND `name LIKE auth.uid() || '/%'`
14. `profiles` WHERE `id = auth.uid()`
15. `auth.users` WHERE `id = auth.uid()`

**Security:**
- `GRANT EXECUTE ON FUNCTION public.delete_account() TO authenticated`
- `REVOKE EXECUTE ON FUNCTION public.delete_account() FROM anon`
- `SET search_path = public, auth` (SECURITY DEFINER hardening)

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Flow 53 — pending manual Supabase SQL Editor verification

---

## P9-02 — Package: `expo-apple-authentication`

**Status:** DONE

**Files changed:**
- `package.json` — added `"expo-apple-authentication": "~8.0.8"`
- `app.json` — added `"usesAppleSignIn": true` under `ios`; added `"expo-apple-authentication"` to `plugins`

**Verification performed:**
- `npx tsc --noEmit` — PASS

---

## P9-03 — Types + AuthContext

**Status:** DONE

**Files changed:**
- `src/types/index.ts` — added `signInWithApple` and `deleteAccount` to `AuthContextType`; added `PostgrestError` import
- `src/context/AuthContext.tsx` — implemented both methods, exposed via Provider value

**signInWithApple:**
- Guards with `isAvailableAsync()`
- Requests `FULL_NAME` + `EMAIL` scopes
- `supabase.auth.signInWithIdToken({ provider: 'apple', token: identityToken })`
- `ERR_REQUEST_CANCELED` → returns `{ error: null }` silently
- Routing handled by existing `onAuthStateChange` — no navigation call here

**deleteAccount:**
- `supabase.rpc('delete_account')`
- On success: `supabase.auth.signOut()` clears stale AsyncStorage session
- Returns `{ error: PostgrestError | null }`

**Verification performed:**
- `npx tsc --noEmit` — PASS

---

## P9-04 — LoginScreen: Apple Sign-In button

**Status:** DONE

**Files changed:**
- `src/screens/auth/LoginScreen.tsx`

**Intended Behavior:**
iOS only. Black Apple button below "or" divider, above sign-up link. Loading state uses `pointerEvents` wrapper (not `disabled` prop). `buttonType: SIGN_IN`.

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Flows 55, 56 — pending manual app verification

---

## P9-05 — SignupScreen: Apple Sign-Up button

**Status:** DONE

**Files changed:**
- `src/screens/auth/SignupScreen.tsx`

**Intended Behavior:**
Same as P9-04 but `buttonType: SIGN_UP` ("Sign up with Apple" text).

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Flow 57 — pending manual app verification

---

## P9-06 — Navigation: Apple routing verification

**Status:** DONE

**Files changed:**
- `src/navigation/index.tsx` — added comment documenting Apple Sign-In routing path

**Verified:** `needsOnboarding = user && !profile?.onboarding_complete` already handles:
- New Apple user (no profile row) → Onboarding ✓
- Returning Apple user (profile.onboarding_complete = true) → MainTabs ✓

No logic changes required.

**Verification performed:**
- `npx tsc --noEmit` — PASS

---

## P9-07 — SettingsScreen

**Status:** DONE

**Files changed:**
- `src/screens/profile/SettingsScreen.tsx` (CREATE)

**Intended Behavior:**
- Header: ← Back | Settings | spacer
- Account card: email + sign-in method (Apple / Email derived from `user.app_metadata.provider`)
- Sign Out pill: theme.primary background, Alert confirmation
- Delete Account pill: `#8b1a1a` dark red, two-step Alert chain
- Full-screen `ActivityIndicator` overlay during `deleting` state
- On delete success: auth state change routes to Welcome automatically

**Verification performed:**
- `npx tsc --noEmit` — PASS
- RUNBOOK Flows 53, 54 — pending manual app verification

---

## P9-08 — ProfileStack: register SettingsScreen

**Status:** DONE

**Files changed:**
- `src/navigation/ProfileStack.tsx` — added `Settings: undefined` to param list; imported and registered `SettingsScreen`

**Verification performed:**
- `npx tsc --noEmit` — PASS

---

## P9-09 + P9-10 — ProfileScreen: Settings entry + Sign Out removal

**Status:** DONE

**Files changed:**
- `src/screens/profile/ProfileScreen.tsx`

**Changes:**
- Added `GearIcon` SVG component (inline, matches NibIcon pattern)
- Header: gear icon button (left) → "Profile" title (center) → NibIcon edit button (right). Gear navigates to Settings.
- Removed `handleSignOut`, `signOut` from `useAuth()` destructure, `Alert` import, sign-out TouchableOpacity, and `signOutLink`/`signOutLinkText` styles
- Sign Out now lives exclusively in SettingsScreen

**Verification performed:**
- `npx tsc --noEmit` — PASS

---

## P9-11 — Documentation

**Status:** DONE

**Files changed:**
- `docs/PHASE_9_PLAN.md` (CREATE)
- `docs/PHASE_9_IMPLEMENTED.md` (CREATE — this file)
- `docs/API_CONTRACT.md` (MODIFY — Phase 9 section appended)
- `docs/RUNBOOK.md` (MODIFY — Flows 53–57 appended)

---

## TypeScript

All new and modified files pass `npx tsc --noEmit` with zero errors.

---

## Phase 9 Exit Gate

**Exit Gate Status:** DONE (code) / Pending (manual flows)

**Required to pass:**
- `npx tsc --noEmit` — 0 errors ✅
- Expo Metro starts without fatal errors — pending manual verification
- RUNBOOK Flows 53–57 verified — pending manual verification (requires Apple Developer account + Supabase Apple provider enabled)
- All P9 tickets marked DONE ✅
