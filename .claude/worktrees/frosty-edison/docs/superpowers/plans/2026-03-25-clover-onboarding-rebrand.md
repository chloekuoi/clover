# Clover Onboarding Rebrand — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand `WelcomeScreen` and `LoginScreen` from CoWork Connect to Clover, applying the Clover brand design system (Forest/Lavender colours, Cormorant Garamond + DM Sans typography, SVG clover mark, pill button).

**Architecture:** Four foundational pieces land first — colour tokens file, DM Sans font loading, `CloverMark` SVG component, and a `pill` variant on the shared `Button` component. Then both screens are rewritten to use these shared pieces. All auth logic, navigation wiring, and Supabase calls are preserved unchanged.

**Tech Stack:** React Native 0.81, Expo SDK 54, `react-native-svg` 15 (already installed), `@expo-google-fonts/dm-sans` (to be installed), `expo-font`, `react-native-safe-area-context` (already installed)

**Spec:** `docs/superpowers/specs/2026-03-25-clover-onboarding-rebrand-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| **Create** | `src/constants/clover.ts` | Clover colour tokens, font family name constants, pill button dimensions |
| **Modify** | `App.js` | Add DM Sans font loading alongside existing fonts |
| **Create** | `src/components/common/CloverMark.tsx` | Reusable SVG clover mark; props: `size`, `color`, `bg` |
| **Modify** | `src/components/common/Button.tsx` | Add `'pill'` variant; do not alter existing `primary`/`secondary`/`ghost` |
| **Modify** | `src/screens/auth/WelcomeScreen.tsx` | Full Clover rebrand — ghost mark, wordmark, tagline, pill CTA |
| **Modify** | `src/screens/auth/LoginScreen.tsx` | Full Clover rebrand — back button, mini lockup, heading, inputs, pill CTA |

---

## Chunk 1: Foundations

### Task 1: Create `src/constants/clover.ts`

Pure constants file — no UI, no runtime dependencies.

**Files:**
- Create: `src/constants/clover.ts`

- [ ] **Step 1: Create the constants file**

```typescript
// src/constants/clover.ts
// Clover brand design tokens — single source of truth for both screens

export const CLOVER_BG     = '#ede8ff';  // Soft Lavender — screen background
export const CLOVER_FOREST = '#0c1f0e';  // Forest — text, buttons, mark
export const CLOVER_VIOLET = '#7c5cbf';  // Violet — tagline, accent

export const PILL_HEIGHT = 58;
export const PILL_RADIUS = 9999;

// Font family names exactly as registered in App.js useFonts
export const FONT_CORMORANT_LIGHT        = 'CormorantGaramond-Light';
export const FONT_CORMORANT_LIGHT_ITALIC = 'CormorantGaramond-LightItalic';
export const FONT_DM_SANS_LIGHT          = 'DMSans_300Light';
export const FONT_DM_SANS_REGULAR        = 'DMSans_400Regular';
export const FONT_DM_SANS_MEDIUM         = 'DMSans_500Medium';
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors (or only pre-existing unrelated errors)

- [ ] **Step 3: Commit**

```bash
git add src/constants/clover.ts
git commit -m "feat: add Clover brand design tokens"
```

---

### Task 2: Install DM Sans and update font loading in `App.js`

`@expo-google-fonts/dm-sans` is not yet in `package.json`. The existing `useFonts` call (in `App.js`) loads fonts from local TTF files via `expo-font`. DM Sans font objects from the package can be passed directly into the same `useFonts` object — they register under their export name as the font family key.

**Files:**
- Modify: `App.js`

- [ ] **Step 1: Install `@expo-google-fonts/dm-sans`**

```bash
npx expo install @expo-google-fonts/dm-sans
```
Expected: package added to `node_modules` and `package.json`

- [ ] **Step 2: Update `App.js` — add the import and extend `useFonts`**

Add the import after the existing `expo-font` import line:
```javascript
import { DMSans_300Light, DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
```

Update the `useFonts` call to include the three DM Sans weights:
```javascript
const [fontsLoaded, fontError] = useFonts({
  'CormorantGaramond-Light': require('./assets/fonts/CormorantGaramond-Light.ttf'),
  'CormorantGaramond-LightItalic': require('./assets/fonts/CormorantGaramond-LightItalic.ttf'),
  'CormorantGaramond-Regular': require('./assets/fonts/CormorantGaramond-Regular.ttf'),
  'Inter-Light': require('./assets/fonts/Inter-Light.ttf'),
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
});
```

Note: Using object shorthand `DMSans_300Light` registers the font under the key `'DMSans_300Light'`, which matches `FONT_DM_SANS_LIGHT` in `src/constants/clover.ts`.

- [ ] **Step 3: Run the app and verify no font errors**

```bash
npm start
```
Open iOS simulator. Expected: app launches normally, Metro logs show no "Unrecognised font family" warnings.

- [ ] **Step 4: Commit**

```bash
git add App.js package.json package-lock.json
git commit -m "feat: load DM Sans fonts for Clover rebrand"
```

---

### Task 3: Create `CloverMark` SVG component

The logo mark appears at three sizes: 80×80pt (Welcome logo lockup), 20×20pt (Login mini lockup), and 390×390pt / 260×260pt (ghost decorations). A single component with a `size` prop handles all cases.

SVG viewBox is always `0 0 80 80`. Four petal circles at cardinal points (radius 18), centre cutout circle (radius 10).

**Files:**
- Create: `src/components/common/CloverMark.tsx`

- [ ] **Step 1: Create the component**

```typescript
// src/components/common/CloverMark.tsx
import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { CLOVER_FOREST, CLOVER_BG } from '../../constants/clover';

type CloverMarkProps = {
  /** Rendered width and height in points */
  size: number;
  /** Petal fill colour. Defaults to Forest #0c1f0e */
  color?: string;
  /** Centre cutout fill colour. Defaults to Soft Lavender #ede8ff */
  bg?: string;
};

/**
 * Clover logo mark: four overlapping circles at cardinal points
 * forming a clover shape, with a background-colour circle punched
 * through the centre. Flat, two-tone, no gradients.
 *
 * ViewBox: 80×80. Petals at top (40,23), right (57,40),
 * bottom (40,57), left (23,40) — radius 18 each.
 * Centre cutout at (40,40) — radius 10.
 */
export default function CloverMark({
  size,
  color = CLOVER_FOREST,
  bg = CLOVER_BG,
}: CloverMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* Top petal */}
      <Circle cx={40} cy={23} r={18} fill={color} />
      {/* Right petal */}
      <Circle cx={57} cy={40} r={18} fill={color} />
      {/* Bottom petal */}
      <Circle cx={40} cy={57} r={18} fill={color} />
      {/* Left petal */}
      <Circle cx={23} cy={40} r={18} fill={color} />
      {/* Centre cutout */}
      <Circle cx={40} cy={40} r={10} fill={bg} />
    </Svg>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no new errors

- [ ] **Step 3: Smoke-test the component in the simulator**

Temporarily add a `<CloverMark size={80} />` somewhere visible in `WelcomeScreen` (e.g. inside `<View style={styles.content}>`). Run the app. Confirm a forest-coloured four-petal clover appears. Remove the temporary addition afterwards.

- [ ] **Step 3a: Verify `WelcomeScreen.tsx` is clean before committing**

```bash
git diff src/screens/auth/WelcomeScreen.tsx
```
Expected: no output (empty diff). If the temporary addition was not removed, do so now.

- [ ] **Step 4: Commit**

```bash
git add src/components/common/CloverMark.tsx
git commit -m "feat: add CloverMark SVG component"
```

---

### Task 4: Add `pill` variant to `Button.tsx`

The existing `Button` component has three variants: `primary`, `secondary`, `ghost`. Add a fourth: `pill`. This is purely additive — no existing styles or behaviour changes.

**Files:**
- Modify: `src/components/common/Button.tsx`

- [ ] **Step 1: Extend `ButtonVariant` type**

In `Button.tsx`, change the type union from:
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost';
```
to:
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'pill';
```

- [ ] **Step 2: Update `ActivityIndicator` colour for `pill`**

The existing `ActivityIndicator` line uses:
```typescript
color={variant === 'primary' ? theme.surface : theme.primary}
```
Update to also cover `pill`:
```typescript
color={variant === 'primary' || variant === 'pill' ? theme.surface : theme.primary}
```

- [ ] **Step 3: Add `pill` and `pillText` to the `StyleSheet`**

**Important — `base` style interaction:** The `Button` component always applies `styles.base` first, then the variant style. `base` includes `paddingVertical: 15`, which would fight the explicit `height: 58` if not reset. The `pill` style must override this with `paddingVertical: 0`. It also overrides `borderRadius` (base uses `borderRadius.md`), so order matters — variant styles compose on top of base styles as expected via the style array.

**Shadow note:** The spec defines a three-layer CSS box-shadow (primary lift + ambient + inset highlight). React Native `StyleSheet` supports a single shadow per element. The `pill` style implements only the dominant primary shadow layer. The secondary ambient shadow and inset highlight are intentionally omitted — this is a platform limitation, not a bug.

Add inside `StyleSheet.create({...})`, after the existing `ghost` style:

```typescript
  pill: {
    height: 58,
    borderRadius: 9999,
    backgroundColor: '#0c1f0e',  // CLOVER_FOREST — inlined to avoid circular dep with clover.ts
    paddingVertical: 0,           // reset base's paddingVertical: 15 so height is respected
    paddingHorizontal: 0,         // full-width; caller controls width via style prop
    shadowColor: '#0c1f0e',       // CLOVER_FOREST — inlined for same reason
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },
  pillText: {
    fontFamily: 'DMSans_500Medium',  // FONT_DM_SANS_MEDIUM — inlined to avoid circular dep
    fontSize: 15,
    letterSpacing: 0.75,   // 0.05em at 15px
    color: '#ede8ff',      // CLOVER_BG — inlined for same reason
  },
```

- [ ] **Step 4: Wire `pillText` into the existing text style resolution**

The existing text style uses:
```typescript
styles[`${variant}Text` as keyof typeof styles]
```
Because `pillText` follows the same naming convention, this resolves automatically. No further change needed.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no new errors

- [ ] **Step 6: Smoke-test the `pill` variant in the simulator**

Temporarily render a pill button in any screen — for example add this inside `WelcomeScreen` before the existing content:
```tsx
import Button from '../../components/common/Button';
// Inside JSX:
<Button title="Test Pill" variant="pill" onPress={() => {}} style={{ width: '80%' }} />
```
Run the app. Verify: pill-shaped button (9999px radius), forest background, lavender "Test Pill" text, 58px tall (not taller due to padding). Remove the temporary code afterwards and run `git diff src/screens/auth/WelcomeScreen.tsx` — expected: empty.

- [ ] **Step 7: Confirm existing variants are unaffected**

Navigate to any screen that uses `<Button variant="primary">`. Confirm it still renders with the existing forest-green rounded style, unchanged from before this task.

- [ ] **Step 8: Commit**

```bash
git add src/components/common/Button.tsx
git commit -m "feat: add pill variant to Button for Clover rebrand"
```

---

## Chunk 2: Screen Rewrites

### Task 5: Rewrite `WelcomeScreen`

Full replacement of the screen's visual layer. Navigation calls (`navigate('Signup')`, `navigate('Login')`) are preserved unchanged.

**Files:**
- Modify: `src/screens/auth/WelcomeScreen.tsx`

Design reference: spec §"Screen 1: Welcome"

- [ ] **Step 1: Replace the file contents**

```typescript
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthStack';
import CloverMark from '../../components/common/CloverMark';
import {
  CLOVER_BG,
  CLOVER_FOREST,
  CLOVER_VIOLET,
  FONT_CORMORANT_LIGHT,
  FONT_CORMORANT_LIGHT_ITALIC,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Ghost clover — decorative, behind all content, rotated 8° */}
      <View
        style={[styles.ghostWrap, { top: '52%', marginTop: -195 }]}
        pointerEvents="none"
      >
        <CloverMark size={390} color={CLOVER_FOREST} bg={CLOVER_BG} />
      </View>

      {/* Logo lockup — centred in the screen */}
      <View style={[styles.logoArea, { paddingTop: insets.top + 16 }]}>
        <CloverMark size={80} color={CLOVER_FOREST} bg={CLOVER_BG} />
        <Text style={styles.wordmark}>clover</Text>
        <Text style={styles.tagline}>find your clover</Text>
      </View>

      {/* CTA area — pinned to bottom */}
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 46) }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Signup')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryLink}>I already have an account</Text>
        </TouchableOpacity>
      </View>

      {/* Home indicator */}
      <View
        style={[
          styles.homeIndicator,
          { marginBottom: Math.max(insets.bottom - 10, 6) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLOVER_BG,
  },

  // Ghost clover: absolutely positioned, centred horizontally, ~52% from top
  ghostWrap: {
    position: 'absolute',
    left: '50%',
    marginLeft: -195,         // half of 390
    opacity: 0.065,
    transform: [{ rotate: '8deg' }],
  },

  logoArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  wordmark: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 42,
    letterSpacing: 42 * 0.06,   // 0.06em
    color: CLOVER_FOREST,
    marginTop: 18,
  },

  tagline: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    letterSpacing: 15 * 0.08,   // 0.08em
    color: CLOVER_VIOLET,
    marginTop: 10,
  },

  cta: {
    paddingHorizontal: 26,
    gap: 14,
    zIndex: 1,
  },

  primaryButton: {
    height: 58,
    borderRadius: 9999,
    backgroundColor: CLOVER_FOREST,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: CLOVER_FOREST,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },

  primaryButtonText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    letterSpacing: 15 * 0.05,   // 0.05em
    color: CLOVER_BG,
  },

  secondaryLink: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    letterSpacing: 15 * 0.04,   // 0.04em
    color: CLOVER_FOREST,
    opacity: 0.55,
    textAlign: 'center',
  },

  homeIndicator: {
    alignSelf: 'center',
    width: 90,
    height: 4,
    borderRadius: 2,
    backgroundColor: CLOVER_FOREST,
    opacity: 0.14,
    marginBottom: 8,
  },
});
```

- [ ] **Step 2: Run app and do visual checklist**

```bash
npm run ios
```

On the Welcome screen, verify:
- [ ] Background is soft lavender `#ede8ff` edge-to-edge
- [ ] Ghost clover faintly visible (~6.5% opacity), rotated 8°, centred vertically at ~52%
- [ ] Clover mark 80×80pt: forest petals, lavender cutout
- [ ] Wordmark "clover" in Cormorant Light 42px, correct tracking, forest colour
- [ ] Tagline "find your clover" in Cormorant italic 15px, violet `#7c5cbf`, 10px below wordmark
- [ ] "Get Started" button: full-width pill, 58px tall, forest background, lavender text, has shadow lift
- [ ] "I already have an account" text link below the button, italic, dimmed
- [ ] Tapping "Get Started" navigates to Signup screen ✓
- [ ] Tapping "I already have an account" navigates to Login screen ✓
- [ ] No layout clipping on iPhone with notch or Dynamic Island

- [ ] **Step 3: Commit**

```bash
git add src/screens/auth/WelcomeScreen.tsx
git commit -m "feat: rebrand WelcomeScreen to Clover design system"
```

---

### Task 6: Rewrite `LoginScreen`

Full replacement of the screen's visual layer. Auth logic (`signIn` call, loading state, error alert), keyboard handling, and all navigation calls are preserved unchanged.

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`

Design reference: spec §"Screen 2: Sign In"

- [ ] **Step 1: Replace the file contents**

```typescript
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { useAuth } from '../../context/AuthContext';
import CloverMark from '../../components/common/CloverMark';
import {
  CLOVER_BG,
  CLOVER_FOREST,
  FONT_CORMORANT_LIGHT,
  FONT_CORMORANT_LIGHT_ITALIC,
  FONT_DM_SANS_LIGHT,
  FONT_DM_SANS_MEDIUM,
} from '../../constants/clover';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Auth logic unchanged
  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />

      {/* Ghost clover — bottom-right corner decoration */}
      <View style={styles.ghostCorner} pointerEvents="none">
        <CloverMark size={260} color={CLOVER_FOREST} bg={CLOVER_BG} />
      </View>

      {/* Back button */}
      <View style={[styles.backRow, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.6}
        >
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backLabel}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Mini logo lockup */}
      <View style={styles.miniLockup}>
        <CloverMark size={20} color={CLOVER_FOREST} bg={CLOVER_BG} />
        <Text style={styles.miniWordmark}>clover</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Heading */}
        <Text style={styles.heading}>{'Welcome\nback'}</Text>
        <Text style={styles.subheading}>Sign in to continue</Text>

        {/* Email input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(12,31,14,0.28)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <View style={styles.inputGap} />

        {/* Password input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="rgba(12,31,14,0.28)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {/* Sign In button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={CLOVER_BG} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign up row — navigation unchanged */}
        <View style={styles.signUpRow}>
          <Text style={styles.signUpPrompt}>Don't have an account?</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CLOVER_BG,
  },

  // Ghost clover: partially off-screen, bottom-right
  ghostCorner: {
    position: 'absolute',
    bottom: -72,
    right: -72,
    opacity: 0.05,
  },

  backRow: {
    paddingHorizontal: 22,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },

  backChevron: {
    fontSize: 20,
    color: CLOVER_FOREST,
    opacity: 0.40,
    lineHeight: 20,
  },

  backLabel: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: CLOVER_FOREST,
    opacity: 0.45,
  },

  miniLockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 26,
    paddingTop: 18,
  },

  miniWordmark: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 20,
    letterSpacing: 20 * 0.06,   // 0.06em
    color: CLOVER_FOREST,
    opacity: 0.65,
  },

  content: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 24,
  },

  heading: {
    fontFamily: FONT_CORMORANT_LIGHT,
    fontSize: 36,
    lineHeight: 36 * 1.08,   // line-height 1.08
    color: CLOVER_FOREST,
  },

  subheading: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: 'rgba(12,31,14,0.38)',
    marginBottom: 28,
    marginTop: 4,
  },

  input: {
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1.5,
    borderColor: 'rgba(12,31,14,0.08)',
    borderRadius: 14,
    paddingHorizontal: 18,
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 13,
    color: CLOVER_FOREST,
    shadowColor: CLOVER_FOREST,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  inputGap: {
    height: 10,
  },

  primaryButton: {
    height: 58,
    borderRadius: 9999,
    backgroundColor: CLOVER_FOREST,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: CLOVER_FOREST,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 24,
    elevation: 8,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  primaryButtonText: {
    fontFamily: FONT_DM_SANS_MEDIUM,
    fontSize: 15,
    letterSpacing: 15 * 0.05,   // 0.05em
    color: CLOVER_BG,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 10,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(12,31,14,0.09)',
  },

  dividerLabel: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 11,
    letterSpacing: 11 * 0.06,   // 0.06em
    color: 'rgba(12,31,14,0.28)',
  },

  signUpRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 14,
  },

  signUpPrompt: {
    fontFamily: FONT_DM_SANS_LIGHT,
    fontSize: 12,
    color: 'rgba(12,31,14,0.35)',
  },

  signUpLink: {
    fontFamily: FONT_CORMORANT_LIGHT_ITALIC,
    fontSize: 15,
    color: CLOVER_FOREST,
    opacity: 0.65,
  },
});
```

- [ ] **Step 2: Run app and do visual checklist**

Navigate to the Login screen (tap "I already have an account" on Welcome).

Verify:
- [ ] Background is soft lavender `#ede8ff`
- [ ] Back button (‹ Back) at top-left, forest at 40%/45% opacity
- [ ] Mini lockup: 20pt clover mark + "clover" wordmark at 65% opacity, gap 8px
- [ ] "Welcome\nback" heading in Cormorant Light 36px, two-line render, line-height 1.08
- [ ] "Sign in to continue" in DM Sans Light 13px, 38% opacity
- [ ] Two inputs: 52px tall, frosted-white (`rgba(255,255,255,0.72)`), border-radius 14px
- [ ] 10px gap between inputs
- [ ] "Sign In" pill button: 58px, full-width, forest background, lavender text, shadow
- [ ] Loading state: spinner visible, button disabled
- [ ] "or" divider with hairline lines on both sides
- [ ] "Don't have an account? Sign up" row below divider
- [ ] Ghost clover visible at bottom-right, 5% opacity, partially off-screen
- [ ] Keyboard avoiding: form shifts up when keyboard opens
- [ ] Tapping "Back" returns to Welcome screen ✓
- [ ] Tapping "Sign up" navigates to Signup screen ✓
- [ ] Auth error alert fires on bad credentials ✓

- [ ] **Step 3: Commit**

```bash
git add src/screens/auth/LoginScreen.tsx
git commit -m "feat: rebrand LoginScreen to Clover design system"
```

---

*End of plan.*
