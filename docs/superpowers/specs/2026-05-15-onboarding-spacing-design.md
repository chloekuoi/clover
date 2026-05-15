# Spec: Onboarding Spacing & Vertical Rhythm

**Date:** 2026-05-15
**Status:** Approved

---

## Problem

The onboarding screens feel visually unbalanced. The specific issues are:

1. **44px dead zone** between the last content element and the progress bar — `bottomSpacer: { height: 32 }` plus the ProgressBar's own `paddingTop: 12` creates a hard, disconnected gap that makes the nav feel stranded
2. **Question → input gap too large** — ranges from 14–24px across screens with no consistent rationale, making the question and its input feel loosely related
3. **`screenPaddingBottom: 40px`** adds extra distance below the nav, pushing it higher than it needs to be

The elastic spacer above content (lower-anchor pattern) is correct and stays — it pushes the content cluster into the lower portion of the screen, which is the intended editorial feel.

---

## Design Direction

**Lower anchor with connected nav cluster.**

Layout pattern for all non-scroll screens:

```
screenPaddingTop: 20px  (unchanged)
wordmark
[elastic spacer — flex: 1 — fills all space above content]
─── content cluster ───────────────────────────────
  question        (marginBottom: 10–12px)
  input / CTA     (tight internal spacing)
────────────────────────────────────────────────────
[no bottomSpacer — removed entirely]
ProgressBar       (paddingTop: 12px internal — unchanged, provides the gap)
screenPaddingBottom: 28px
```

The 12px visual gap between content and nav comes entirely from the ProgressBar's own `paddingTop`. Removing `bottomSpacer` lets content and nav read as one cluster anchored at the bottom, rather than two separate elements with dead space between them.

---

## Spacing Values

### Theme changes (`src/screens/auth/onboarding/theme.ts`)

| Token | Before | After |
|---|---|---|
| `screenPaddingBottom` | `40` | `28` |

All other theme tokens unchanged (`screenPaddingTop: 20`, `screenPaddingH: 28`).

### Per-screen changes

#### HookScreen
| Element | Before | After |
|---|---|---|
| `question.marginBottom` | `20` | `10` |
| `ctaWrap.marginBottom` | `8` | `4` |
| `bottomSpacer` | `height: 32` | **removed** |

#### IdentityScreen
| Element | Before | After |
|---|---|---|
| `question.marginBottom` | `20` | `10` |
| `photoCircle.marginBottom` | `20` | `12` |
| `nameInput.marginBottom` | `16` | `8` |
| `bottomSpacer` | `height: 32` | **removed** |

#### BirthdayScreen
| Element | Before | After |
|---|---|---|
| `question.marginBottom` | `24` | `10` |
| `dateRow.marginBottom` | `16` | `8` |
| `bottomSpacer` | `height: 32` | **removed** |

#### NotificationsScreen
| Element | Before | After |
|---|---|---|
| `question.marginBottom` | `14` | `10` |
| `body.marginBottom` | `28` | `20` |
| `cta.marginBottom` | `12` | `8` |
| `bottomSpacer` | `height: 32` | **removed** |

#### ContactSyncScreen
| Element | Before | After |
|---|---|---|
| `question.marginBottom` | `14` | `10` |
| `body.marginBottom` | `28` | `20` |
| `cta.marginBottom` | `12` | `8` |
| `bottomSpacer` | `height: 32` | **removed** |

#### SuccessScreen
No `bottomSpacer` or ProgressBar — no changes needed beyond confirming `spacer: { flex: 1 }` is clean.

### ProgressBar component
No changes — `paddingTop: 12` stays as-is. It now provides the sole visual gap between content and the nav row.

### Scroll screens (AboutScreen, LookingForScreen)
These use a `ScrollView` that fills space between the wordmark and ProgressBar. The ProgressBar is already naturally anchored. No structural changes needed. Minor internal tightening only:

| Screen | Element | Before | After |
|---|---|---|---|
| LookingForScreen | `question.marginBottom` | `20` | `14` |
| AboutScreen | `sectionHeading.marginBottom` | `14` | `10` |
| AboutScreen | `input.marginBottom` (bottom pad) | `4` | `4` (unchanged) |

---

## What Does Not Change

- Elastic spacer (`flex: 1`) above content on all non-scroll screens — this is the intended lower-anchor
- `screenPaddingTop: 20` — wordmark stays at top
- `screenPaddingH: 28` — horizontal rhythm unchanged
- `ProgressBar` component internals
- Scroll screen structural layout (About, LookingFor)
- Typography (font sizes, families, colors) — untouched
- The `spacer` on SuccessScreen (no ProgressBar to connect to)

---

## Files to Modify

| File | Change |
|---|---|
| `src/screens/auth/onboarding/theme.ts` | `screenPaddingBottom: 40 → 28` |
| `src/screens/auth/onboarding/screens/HookScreen.tsx` | Tighten margins, remove bottomSpacer |
| `src/screens/auth/onboarding/screens/IdentityScreen.tsx` | Tighten margins, remove bottomSpacer |
| `src/screens/auth/onboarding/screens/BirthdayScreen.tsx` | Tighten margins, remove bottomSpacer |
| `src/screens/auth/onboarding/screens/NotificationsScreen.tsx` | Tighten margins, remove bottomSpacer |
| `src/screens/auth/onboarding/screens/ContactSyncScreen.tsx` | Tighten margins, remove bottomSpacer |
| `src/screens/auth/onboarding/screens/LookingForScreen.tsx` | Minor question marginBottom tweak |
| `src/screens/auth/onboarding/screens/AboutScreen.tsx` | Minor sectionHeading marginBottom tweak |

---

## Verification

After implementation:
1. Run the app on iOS simulator (`npm run ios`)
2. Step through all 8 onboarding screens
3. Confirm content cluster (question + input + optional CTA) reads as one unit near the bottom
4. Confirm ProgressBar feels visually connected — not floating in dead space
5. Check on iPhone SE (small screen) — elastic spacer should compress gracefully; content cluster must not overlap wordmark
6. Check on iPhone 15 Pro Max (large screen) — elastic spacer expands; bottom padding should clear the home indicator
