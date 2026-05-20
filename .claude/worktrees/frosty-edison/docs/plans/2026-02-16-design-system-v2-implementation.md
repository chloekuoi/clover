# Design System v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the design-system-v2 transition plan across tokens, shared components, and screens with phased verification and atomic commits.

**Architecture:** Update design tokens in `src/constants`, propagate them through shared components, then align screen-specific styling in the specified phases. Keep changes strictly scoped per phase with manual visual verification and TypeScript checks.

**Tech Stack:** React Native (Expo), TypeScript, React Navigation.

---

### Task 1: Update v2 Color Tokens

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/constants/colors.ts`

**Step 1: Write the failing test (manual baseline)**
- Launch the app to capture baseline visuals for buttons/chips/inputs/cards/badges.
- Run: `npm start`
- Expected: Metro bundler starts and app shows existing (pre-v2) colors.

**Step 2: Run test to verify it fails**
- Verify that forest green (`#3F5443`) and lavender (`#C9AEFB`) are NOT yet visible in shared components.
- Expected: baseline still shows current warm-neutral palette.

**Step 3: Write minimal implementation**
- Update `colors` to match `design-system-v2.md` tokens.
- Replace `accentPrimary` with `#3F5443`, add lavender tokens, update status colors.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: base palette matches v2 token definitions (colors changed).

**Step 5: Commit**
- Defer commit until Phase 1 is complete (see Task 5).

---

### Task 2: Align Typography + Shadows

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/constants/colors.ts`

**Step 1: Write the failing test (manual baseline)**
- Verify typography and shadows still reflect pre-v2 values.

**Step 2: Run test to verify it fails**
- Expected: headings/body styles and card/button shadows are not yet v2-compliant.

**Step 3: Write minimal implementation**
- Update `typography` values to match v2 scale.
- Update `shadows` to include `shadow-card`, `shadow-button`, `shadow-dropdown`.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: typography and shadows align with v2 specs where used.

**Step 5: Commit**
- Defer commit until Phase 1 is complete (see Task 5).

---

### Task 3: Update Shared Button Styles

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/common/Button.tsx`

**Step 1: Write the failing test (manual baseline)**
- Identify all button variants in the app (primary/secondary/ghost).

**Step 2: Run test to verify it fails**
- Expected: buttons still use pre-v2 colors.

**Step 3: Write minimal implementation**
- Map variants to v2 colors (forest green primary, ghost styles, etc.).
- Ensure text colors and hover/press styles align with v2.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: buttons render with v2 colors and typography.

**Step 5: Commit**
- Defer commit until Phase 1 is complete (see Task 5).

---

### Task 4: Update Shared Tag/Chip Styles

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/common/Tag.tsx`

**Step 1: Write the failing test (manual baseline)**
- Locate Tag usage in intent/discover screens.

**Step 2: Run test to verify it fails**
- Expected: selected/unselected states still use pre-v2 colors.

**Step 3: Write minimal implementation**
- Apply v2 chip specs: selected forest green, unselected border, text colors.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: Tag styling matches v2 chip/pill specs.

**Step 5: Commit**
- Defer commit until Phase 1 is complete (see Task 5).

---

### Task 5: Phase 1 Verification + Commit

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/constants/colors.ts`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/common/Button.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/common/Tag.tsx`

**Step 1: Write the failing test (manual baseline)**
- Confirm there are no remaining `#3D3D3D` usages in shared components.

**Step 2: Run test to verify it fails**
- Run: `rg \"#3D3D3D\" /Users/chloe/Documents/Claude/cowork-connect/src/components/common`
- Expected: no matches.

**Step 3: Write minimal implementation**
- Replace any remaining legacy accent usage in shared components.

**Step 4: Run test to verify it passes**
- Run: `npx tsc --noEmit`
- Expected: exit code 0 with no errors.

**Step 5: Commit**
- Run:
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/constants/colors.ts`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/components/common/Button.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/components/common/Tag.tsx`
  - `git commit -m "chore: apply design system v2 foundation tokens and components"`

---

### Task 6: Phase 2 Discover Screen Alignment

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/discover/IntentScreen.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/discover/DiscoverScreen.tsx`

**Step 1: Write the failing test (manual baseline)**
- Observe chip selection, CTA button, and inline time display styling on Discover.

**Step 2: Run test to verify it fails**
- Expected: v2 green selection/CTA not fully applied.

**Step 3: Write minimal implementation**
- Apply v2 green accent for selections and CTA.
- Update inline time display to match v2 duration badge styling.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: Discover screens align with v2 green selection/CTA and time display.

**Step 5: Commit**
- Defer commit until Phase 2 is complete (see Task 8).

---

### Task 7: Phase 2 Chat Alignment

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/matches/MessageBubble.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/matches/ChatInputBar.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/matches/ChatScreen.tsx`

**Step 1: Write the failing test (manual baseline)**
- Observe sent/received bubbles and send button styling in Chat.

**Step 2: Run test to verify it fails**
- Expected: sent bubble is not lavender, send button is not forest green.

**Step 3: Write minimal implementation**
- Sent bubble uses `#C9AEFB` and text `#2E2440`.
- Send button uses forest green `#3F5443`.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: chat UI matches v2 bubble and send button spec.

**Step 5: Commit**
- Defer commit until Phase 2 is complete (see Task 8).

---

### Task 8: Phase 2 Verification + Commit

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/discover/IntentScreen.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/discover/DiscoverScreen.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/matches/MessageBubble.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/matches/ChatInputBar.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/matches/ChatScreen.tsx`

**Step 1: Write the failing test (manual baseline)**
- Review Discover and Chat screens for any remaining pre-v2 overrides.

**Step 2: Run test to verify it fails**
- Expected: no v2 regressions visible.

**Step 3: Write minimal implementation**
- Remove any conflicting local overrides discovered in the review.

**Step 4: Run test to verify it passes**
- Run: `npx tsc --noEmit`
- Expected: exit code 0 with no errors.

**Step 5: Commit**
- Run:
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/screens/discover/IntentScreen.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/screens/discover/DiscoverScreen.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/components/matches/MessageBubble.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/components/matches/ChatInputBar.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/screens/matches/ChatScreen.tsx`
  - `git commit -m "feat: align discover and chat screens with design system v2"`

---

### Task 9: Phase 3 Invite Flow Alignment

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/session/InviteComposerCard.tsx`

**Step 1: Write the failing test (manual baseline)**
- Observe date pill selector and buttons in invite flow.

**Step 2: Run test to verify it fails**
- Expected: selected state is not forest green, pill styles not v2.

**Step 3: Write minimal implementation**
- Apply v2 date pill selector styling and primary/ghost button styles.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: invite flow matches v2.

**Step 5: Commit**
- Defer commit until Phase 3 is complete (see Task 11).

---

### Task 10: Phase 3 Pending Invite Card + Profile Alignment

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/session/SessionRequestCard.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/profile/ProfileScreen.tsx`

**Step 1: Write the failing test (manual baseline)**
- Observe pending invite card and profile badge styles.

**Step 2: Run test to verify it fails**
- Expected: pending card still uses pre-v2 yellow, profile highlights not v2.

**Step 3: Write minimal implementation**
- Update pending badge and icon container to lavender/purple variants.
- Align profile badge/active states with v2.

**Step 4: Run test to verify it passes**
- Refresh the app.
- Expected: pending card and profile match v2 style.

**Step 5: Commit**
- Defer commit until Phase 3 is complete (see Task 11).

---

### Task 11: Phase 3 Verification + Commit

**Files:**
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/session/InviteComposerCard.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/components/session/SessionRequestCard.tsx`
- Modify: `/Users/chloe/Documents/Claude/cowork-connect/src/screens/profile/ProfileScreen.tsx`

**Step 1: Write the failing test (manual baseline)**
- Review Invite flow, Pending card, Profile for any remaining pre-v2 overrides.

**Step 2: Run test to verify it fails**
- Expected: no v2 regressions visible.

**Step 3: Write minimal implementation**
- Clean up any local overrides still using legacy colors.

**Step 4: Run test to verify it passes**
- Run: `npx tsc --noEmit`
- Expected: exit code 0 with no errors.

**Step 5: Commit**
- Run:
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/components/session/InviteComposerCard.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/components/session/SessionRequestCard.tsx`
  - `git add /Users/chloe/Documents/Claude/cowork-connect/src/screens/profile/ProfileScreen.tsx`
  - `git commit -m "feat: align secondary screens with design system v2"`

