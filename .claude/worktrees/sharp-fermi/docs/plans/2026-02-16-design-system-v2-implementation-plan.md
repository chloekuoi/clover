# Design System v2 Implementation Plan (Phased)

Date: 2026-02-16
Scope: Implement the design-system-v2 transition plan in three phases with verification and atomic commits.

## Overview
- Phase 1: Foundation (tokens + shared components)
- Phase 2: Core Screens (Discover, Chat)
- Phase 3: Secondary Screens (Invite flow, Pending card, Profile/settings)

Each phase ends with:
- Manual verification steps
- A single atomic commit

---

## Phase 1 — Foundation

### Implementation Tasks
1. Update `src/constants/colors.ts` to match `design-system-v2.md` tokens:
   - Replace `accentPrimary` `#3D3D3D` → `#3F5443`
   - Add lavender tokens and secondary accent tokens
   - Align `bg*`, `text*`, `border*`, `status*`, `accentSubtle`
2. Update `typography` in `src/constants/colors.ts` to match v2 spec.
3. Update `shadows` in `src/constants/colors.ts` to match:
   - `shadow-card`
   - `shadow-button`
   - `shadow-dropdown`
4. Update shared components to use new tokens:
   - Button (primary/ghost)
   - Chip/Tag
   - Input
   - Card
   - Badge/Status
5. Replace all old accent color usages `#3D3D3D` with `#3F5443` in shared components and constants.

### Verification
1. Run the app and manually check Button/Chip/Input/Card/Badge visuals.
2. Confirm no remaining `#3D3D3D` in shared component files.

### Commit
- `chore: apply design system v2 foundation tokens and components`

---

## Phase 2 — Core Screens

### Implementation Tasks
1. Discover flow updates:
   - `IntentScreen` chips and CTA use green selection/CTA.
   - Inline time display uses green duration badge styling.
2. Chat updates:
   - Sent bubbles use lavender (`#C9AEFB`) with dark purple text.
   - Send button uses forest green.
3. Remove any remaining local overrides that conflict with v2 palette.

### Verification
1. Manual visual pass on Discover (intent + discovering) and Chat screen.
2. Validate sent vs received bubble contrast and readability.

### Commit
- `feat: align discover and chat screens with design system v2`

---

## Phase 3 — Secondary Screens

### Implementation Tasks
1. Invite flow:
   - Date pill selector uses green selected state.
   - Primary/ghost buttons match v2 specs.
2. Pending invite card:
   - Purple pending badge styles.
   - Icon container and text colors aligned to v2.
3. Profile/settings:
   - Card styling, green active toggles, purple notification tint.

### Verification
1. Manual visual pass on Invite flow, Pending card, Profile/Settings screens.
2. Validate badge variants (pending/confirmed/cancelled).

### Commit
- `feat: align secondary screens with design system v2`

