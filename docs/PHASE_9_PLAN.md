# Phase 9 — Apple Sign-In + Delete Account: Plan

**Branch:** `feat/phase9`  
**Status:** IMPLEMENTED

---

## Goals

1. **Apple Sign-In** — Allow users to sign in or sign up with their Apple ID on both LoginScreen and SignupScreen (iOS only). Routing is handled by the existing RootNavigator — new Apple users land in Onboarding; returning users go straight to MainTabs.

2. **Delete Account** — Full cascade delete of all user data and the auth row. Exposed in a new SettingsScreen under the Profile tab, behind two confirmation Alerts.

---

## User Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Apple button placement | Login + Signup (not Welcome) | Users reach Welcome before signing in; shows on both auth screens |
| Settings screen | New screen in ProfileStack | Keeps ProfileScreen focused on profile display |
| Delete scope | Full cascade (all tables + auth.users) | Clean break; no partial data left |
| Base branch | `feat/phase8` as-is | P8 docs deferral accepted |

---

## Tickets

| ID | Title | File(s) | Action |
|----|-------|---------|--------|
| P9-01 | Database: `delete_account` RPC | `supabase/012_delete_account.sql` | CREATE |
| P9-02 | Package: `expo-apple-authentication` | `package.json`, `app.json` | MODIFY |
| P9-03 | Types + AuthContext: new methods | `src/types/index.ts`, `src/context/AuthContext.tsx` | MODIFY |
| P9-04 | LoginScreen: Apple Sign-In button | `src/screens/auth/LoginScreen.tsx` | MODIFY |
| P9-05 | SignupScreen: Apple Sign-Up button | `src/screens/auth/SignupScreen.tsx` | MODIFY |
| P9-06 | Navigation: verify Apple routing | `src/navigation/index.tsx` | MODIFY (comment) |
| P9-07 | SettingsScreen: Sign Out + Delete Account | `src/screens/profile/SettingsScreen.tsx` | CREATE |
| P9-08 | ProfileStack: register SettingsScreen | `src/navigation/ProfileStack.tsx` | MODIFY |
| P9-09 | ProfileScreen: Settings entry point | `src/screens/profile/ProfileScreen.tsx` | MODIFY |
| P9-10 | ProfileScreen: remove Sign Out | `src/screens/profile/ProfileScreen.tsx` | MODIFY |
| P9-11 | Documentation | `docs/` | CREATE/MODIFY |

---

## Key Technical Decisions

### Apple Sign-In

- Use `AppleAuthentication.AppleAuthenticationButton` (required by Apple HIG — custom buttons violate App Store guidelines)
- `cornerRadius` prop (not `borderRadius`) on AppleAuthenticationButton
- `buttonStyle: BLACK` — visible on the app's warm beige background
- `ERR_REQUEST_CANCELED` is treated as silent success (user cancelled intentionally)
- Platform.OS === 'ios' guard — no empty View rendered on Android
- Routing handled by existing `onAuthStateChange` → RootNavigator — no navigation code in signInWithApple

### Delete Account

- SECURITY DEFINER PostgreSQL function with `SET search_path = public, auth`
- `auth.uid()` captured at function start; raises exception if null (unauthenticated call)
- FK-safe deletion order (see P9-01)
- Two-step Alert confirmation — Alert.alert does not support TextInput cross-platform
- After `supabase.rpc('delete_account')` success, call `supabase.auth.signOut()` to clear stale AsyncStorage session
- `onAuthStateChange` fires with null session → RootNavigator renders AuthStack automatically

### Settings Navigation

- Gear icon (inline SVG) replaces the left header spacer on ProfileScreen — symmetric with NibIcon edit button on right
- SettingsScreen uses `navigation.goBack()` ← back, no tab involvement

---

## Pre-Implementation Manual Step

Before testing Apple Sign-In, enable the Apple provider in Supabase:
> Dashboard → Authentication → Providers → Apple → enable + configure Services ID, Team ID, Key ID, private key

Register the Supabase callback URL in Apple Developer Console.

---

## Verification Flows

See RUNBOOK.md Flows 53–57.
