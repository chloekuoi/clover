# Clover Onboarding Rebrand — Design Spec

**Date:** 2026-03-25
**Status:** Approved
**Scope:** Welcome screen + Sign In screen (2 screens)

---

## Overview

Full rebrand of CoWork Connect to **Clover**, applying the Clover Brand Design System to the two initial onboarding screens. The app name, tagline, visual identity, colour palette, and typography all change. No navigation structure or functional behaviour changes.

---

## Brand Identity Changes

| Before | After |
|---|---|
| App name: CoWork Connect | App name: **clover** (lowercase in UI) |
| Tagline: "Find your people. Do the work." | Tagline: *find your clover* |
| Colour: sage green `#A8B5A2` | Colour: Forest `#0c1f0e` + Lavender `#ede8ff` |
| Font: system default | Fonts: Cormorant Garamond + DM Sans |

---

## Design System Reference

Source: `clover-design-system.md`

### Colours Used

| Token | Hex | Usage |
|---|---|---|
| Soft Lavender | `#ede8ff` | Screen background |
| Forest | `#0c1f0e` | Logo mark, text, buttons |
| Violet | `#7c5cbf` | Tagline, accent |

### Typefaces

| Role | Font | Weight | Style | Size |
|---|---|---|---|---|
| Wordmark | Cormorant Garamond | 300 | Roman | 42px |
| Tagline | Cormorant Garamond | 300 | Italic | 15px |
| Screen heading | Cormorant Garamond | 300 | Roman | 36px |
| Body / labels | DM Sans | 300–500 | Roman | 12–15px |
| Secondary action | Cormorant Garamond | 300 | Italic | 15px |

Both fonts loaded from Google Fonts.

### Logo Mark

Four overlapping circles at cardinal points forming a clover, with a background-colour circle punched through the centre. Flat, two-tone, no gradients.

SVG construction (scaled to target size from 80×80 viewBox):
- Petal circles at: top (40,23), right (57,40), bottom (40,57), left (23,40) — radius 18
- Centre cutout circle at (40,40) — radius 10, fill = background colour

---

## Screen 1: Welcome

**File:** `src/screens/auth/WelcomeScreen.tsx`

### Layout

```
┌─────────────────────────┐
│  status bar             │  16px top padding
├─────────────────────────┤
│                         │
│   [ghost clover]        │  6.5% opacity, centred, rotated 8°, 390×390pt
│                         │
│      ●●●●               │  clover mark, 80×80pt
│       ●                 │
│                         │
│      clover             │  Cormorant 300 roman, 42px, tracking 0.06em
│  find your clover       │  Cormorant 300 italic, 15px, violet #7c5cbf, mt 10px
│                         │
│   [  Get Started  ]     │  forest pill button, 58px, full width
│  I already have an      │  Cormorant italic, forest, 15px, 55% opacity
│  account                │
│                         │
│    ─────────────        │  home indicator, 90×4pt, 14% opacity
└─────────────────────────┘
```

### Component Details

**Ghost clover** (decorative, behind all content):
- Position: absolute, centred vertically at 52% from top, rotated 8°
- Size: 390×390pt SVG
- Opacity: 0.065
- Colour: Forest `#0c1f0e` petals, background cutout

**Logo mark:** 80×80pt SVG, forest petals, lavender cutout, `margin-bottom: 18px`

**Wordmark:** `font-family: 'Cormorant Garamond'`, weight 300, 42px, `letter-spacing: 0.06em`, color `#0c1f0e`

**Tagline:** `font-family: 'Cormorant Garamond'`, weight 300, italic, 15px, `letter-spacing: 0.08em`, color `#7c5cbf`, `margin-top: 10px`

**"Get Started" button:**
- Width: 100% (with 26px horizontal padding on container)
- Height: 58px
- Background: `#0c1f0e`
- Border-radius: 9999px (full pill)
- Font: DM Sans 500, 15px, `letter-spacing: 0.05em`, color `#ede8ff`
- Shadow: `0 8px 24px rgba(12,31,14,0.30), 0 2px 8px rgba(12,31,14,0.14), 0 1px 0 rgba(255,255,255,0.07) inset`

**"I already have an account" link:**
- Font: Cormorant Garamond 300 italic, 15px, `letter-spacing: 0.04em`
- Color: `#0c1f0e` at 55% opacity
- No underline, plain text/Pressable

**CTA container padding:** `0 26px 46px` (bottom clears home indicator)

---

## Screen 2: Sign In

**File:** `src/screens/auth/LoginScreen.tsx`

### Layout

```
┌─────────────────────────┐
│  ‹ Back                 │  16px top, 22px left
│                         │
│  ⬟ clover               │  mini lockup: 20pt mark + wordmark 20px, 18px top
│                         │
│  Welcome                │  Cormorant 300, 36px, line-height 1.08
│  back                   │
│  Sign in to continue    │  DM Sans 300, 13px, 38% opacity, mb 28px
│                         │
│  ┌──────────────────┐   │  input, 52px, rounded 14px, frosted white
│  │ Email            │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Password         │   │
│  └──────────────────┘   │
│                         │
│  [     Sign In     ]    │  same forest pill button, 58px
│                         │
│  ─────── or ─────────   │  divider, mt 18px
│                         │
│  Don't have an account? │  DM Sans 300 12px 35% opacity
│  Sign up                │  Cormorant italic 15px forest 65% opacity
│                         │
│     [ghost corner]      │  5% opacity, bottom-right corner, −72px offset
│    ─────────────        │  home indicator
└─────────────────────────┘
```

### Component Details

**Back button row:** `‹` chevron (8×8pt, 1.5px border, forest 40% opacity) + "Back" DM Sans 300 13px forest 45% opacity. `padding: 16px 22px 0`.

**Mini logo lockup:** 20×20pt clover mark SVG + `clover` wordmark (Cormorant 300, 20px, tracking 0.06em, forest 65% opacity). `padding: 18px 26px 0`. Gap: 8px.

**"Welcome back" heading:** Cormorant Garamond 300, 36px, `line-height: 1.08`, color `#0c1f0e`. Rendered as two lines: "Welcome\nback".

**"Sign in to continue":** DM Sans 300, 13px, `rgba(12,31,14,0.38)`, `margin-bottom: 28px`.

**Input fields:**
- Height: 52px
- Background: `rgba(255,255,255,0.72)`
- Border: `1.5px solid rgba(12,31,14,0.08)`
- Border-radius: 14px
- Padding: `0 18px`
- Font: DM Sans 300 13px, placeholder color `rgba(12,31,14,0.28)`
- Shadow: `0 1px 4px rgba(12,31,14,0.04)`
- Gap between inputs: 10px

**"Sign In" button:** Identical spec to "Get Started" button above.

**Divider:** Two `flex: 1` lines (`rgba(12,31,14,0.09)`, 1px) with "or" label (DM Sans 300, 11px, `rgba(12,31,14,0.28)`, tracking 0.06em). `margin-top: 18px`.

**Sign up row:** "Don't have an account?" (DM Sans 300, 12px, `rgba(12,31,14,0.35)`) + "Sign up" (Cormorant Garamond 300 italic, 15px, `#0c1f0e` at 65% opacity). `margin-top: 14px`.

**Ghost clover (corner):**
- Position: absolute, `bottom: -72px`, `right: -72px`
- Size: 260×260pt SVG
- Opacity: 0.05

---

## Shared Tokens

```typescript
// Colours
const CLOVER_BG       = '#ede8ff';  // Soft Lavender
const CLOVER_FOREST   = '#0c1f0e';  // Forest (text, buttons, mark)
const CLOVER_VIOLET   = '#7c5cbf';  // Violet (tagline, accent)

// Button
const PILL_HEIGHT     = 58;
const PILL_RADIUS     = 9999;

// Typography (requires Google Fonts or @expo-google-fonts)
// 'Cormorant_Garamond' — weights 300, 400 (roman + italic)
// 'DM_Sans'           — weights 300, 400, 500
```

---

## Implementation Notes

1. **Google Fonts — App.tsx:** Install `@expo-google-fonts/cormorant-garamond` and `@expo-google-fonts/dm-sans` via `npx expo install`. Load fonts with `useFonts` in **`App.tsx`** (the app root). Return `null` (or a plain `#ede8ff` `View`) until `fontsLoaded` is `true`, so neither screen renders before fonts are ready.

2. **Shared colour tokens — `src/constants/clover.ts`:** Create a new file `src/constants/clover.ts` that exports the tokens listed in the Shared Tokens section above. Import from this file in both screens and in the `CloverMark` component to avoid hardcoding hex strings.

3. **CloverMark component — `src/components/common/CloverMark.tsx`:** Implement the SVG logo mark as a reusable component at this path. Accepts `size` (number), `color` (petal fill, defaults to `CLOVER_FOREST`), and `bg` (centre cutout fill, defaults to `CLOVER_BG`). Used at 80×80pt (logo), 20×20pt (mini lockup), and 390×390pt / 260×260pt (ghost decorations).

4. **Ghost clover:** Wrap `<CloverMark>` at large size in an absolutely positioned `<View>` with `opacity` and `transform: [{ rotate: '8deg' }]`. Set `pointerEvents="none"` so it doesn't intercept touches.

5. **No behaviour changes:** Navigation, auth logic, Supabase calls, and all other functional code are unchanged. Only visual/style properties change. The "Sign up" link on the Sign In screen retains its existing `navigation.navigate('Signup')` call.

6. **Button component — new `pill` variant:** Add a `'pill'` variant to `src/components/common/Button.tsx`. Do not modify or break the existing `'primary'`, `'secondary'`, and `'ghost'` variants. The `'pill'` variant applies the full pill spec: `height: 58`, `borderRadius: 9999`, forest background, lavender text, DM Sans 500, plus the layered shadow.

---

## Out of Scope

- Sign Up screen (unchanged for now)
- Onboarding steps 1–3 (unchanged for now)
- Any screen beyond the two listed above
- Dark mode variant
- App icon update (separate asset task)
- Navigation logic or auth behaviour
