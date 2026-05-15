# Full App Redesign — Apply Design System v2.0 (Green + Lavender)

## Overview
Update the entire app to use the new "productive warmth" design system. Forest green (#3F5443) is the primary accent for all selections and actions. Lavender (#C9AEFB) is the secondary accent for sent messages and pending states. Layout structure stays the same — this is a color, typography, and component-level update only.

## Phase 1: Create/Update Theme Constants

Create or update the app's theme/constants file with these design tokens:

```typescript
export const colors = {
  // Backgrounds
  bgPrimary: '#F5F4F1',
  bgSecondary: '#EEEDEA',
  bgCard: '#FFFFFF',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  borderDefault: '#E4E3E0',
  borderFocus: '#3F5443',
  divider: '#EEEDEA',

  // Primary Accent — Forest Green
  accentPrimary: '#3F5443',
  accentPrimaryHover: '#334536',
  accentPrimaryLight: '#EDF3EF',

  // Secondary Accent — Lavender
  accentSecondary: '#C9AEFB',
  accentSecondaryDark: '#8B6FC0',
  accentSecondaryText: '#2E2440',   // Text ON lavender backgrounds
  accentSecondaryLight: '#F5EEFF',

  // Status
  statusPendingBg: '#F5EEFF',       // Purple tint
  statusPendingText: '#9B7FD4',     // Muted purple
  statusConfirmedBg: '#EDF3EF',     // Green tint
  statusConfirmedText: '#3F5443',   // Forest green
  statusCancelledBg: '#F5F4F2',
  statusCancelledText: '#9B9B9B',

  // Semantic
  accentDanger: '#B85C4D',
  accentSubtle: '#E8E7E4',
};

export const typography = {
  headingXL: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  headingLG: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  headingMD: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodyMedium: { fontSize: 15, fontWeight: '500' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  chip: { fontSize: 13, fontWeight: '500' },
};

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32,
};

export const radius = {
  sm: 8, md: 12, lg: 16, full: 999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  button: {
    shadowColor: '#3F5443',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
};
```

## Phase 2: Update Shared Components

### Chip / Pill Button

**Unselected:**
- `backgroundColor: 'transparent'`
- `borderWidth: 1.5, borderColor: '#E4E3E0'`
- `borderRadius: 12`
- `paddingVertical: 10, paddingHorizontal: 6`
- Text: `color: '#6B6B6B', fontSize: 13, fontWeight: '500'`
- Emoji: `fontSize: 14`, inline, `gap: 5`
- Layout: `flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1`

**Selected:**
- `backgroundColor: '#3F5443'`
- `borderColor: '#3F5443'`
- Text: `color: '#FFFFFF'`
- Shadow: `0 2px 8px rgba(63,84,67,0.25)`

### Primary Button (CTA)
- `backgroundColor: '#3F5443'`
- `borderRadius: 12, paddingVertical: 15`
- Text: `color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.2`
- Shadow: `shadowColor: '#3F5443', shadowOpacity: 0.2`
- **Press:** `backgroundColor: '#334536'`

### Ghost Button
- `backgroundColor: 'transparent'`, no border
- Text: `color: '#9B9B9B', fontSize: 13, fontWeight: '500'`

### Input Field
- `backgroundColor: '#FFFFFF'`
- `borderWidth: 1.5, borderColor: '#E4E3E0'`
- `borderRadius: 12, padding: 13/16`
- Text: `color: '#1A1A1A', fontSize: 15`
- Placeholder: `color: '#9B9B9B'`
- **Focus:** `borderColor: '#3F5443'`

### Card Container
- `backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18`
- Shadow: card shadow
- Dividers: `1px #EEEDEA`, full-bleed

### Status Badge (Pill)
- `paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999`
- Text: `fontSize: 11, fontWeight: '600', uppercase, letterSpacing: 0.8`
- **Pending:** `backgroundColor: '#F5EEFF', color: '#9B7FD4'`
- **Confirmed:** `backgroundColor: '#EDF3EF', color: '#3F5443'`
- **Cancelled:** `backgroundColor: '#F5F4F2', color: '#9B9B9B'`

## Phase 3: Update Discover / Set Intention Screen

1. **Screen background:** `#F5F4F1`
2. **Header:** Subtitle `13px #9B9B9B`, Title `26px 700 #1A1A1A`
3. **Task input:** Updated Input component, `marginBottom: 16`
4. **Grouped card (Vibe + Where):** Card with green chips, divider between sections
5. **Time row:** Input styling, green duration badge (`#3F5443` on `#EDF3EF`)
6. **Add place:** Dashed border `#E4E3E0`, text `#9B9B9B`
7. **Sticky CTA:** Green primary button with gradient fade

## Phase 4: Update Chat Interface

1. **Background:** `#EEEDEA`
2. **Received:** `backgroundColor: '#FFFFFF', borderColor: '#E4E3E0'`, radius `14/14/14/4`
3. **Sent:** `backgroundColor: '#C9AEFB'` (LAVENDER), text `color: '#2E2440'` (dark purple), radius `14/14/4/14`, shadow `0 2px 8px rgba(201,174,251,0.3)`
4. **Timestamps:** `11px #9B9B9B`
5. **Send button:** `36px circle, backgroundColor: '#3F5443'` (GREEN)
6. **Chat input:** `borderRadius: 24, borderColor: '#E4E3E0'`

**IMPORTANT:** Sent bubbles use LAVENDER (#C9AEFB) with DARK PURPLE text (#2E2440), NOT white text. This is a light-on-dark-text pattern.

## Phase 5: Update Invite Flow (Date Picker)

1. **Date pills selected:** `backgroundColor: '#3F5443'`, text white
2. **Date pills unselected:** `backgroundColor: '#F5F4F1', borderColor: '#E4E3E0'`
3. **Send Invite button:** Green primary button
4. **Cancel:** Ghost button

## Phase 6: Update Pending Invite Card

1. **Icon container:** `backgroundColor: '#F5EEFF'` (light purple)
2. **Clock icon stroke:** `#9B7FD4` (muted purple)
3. **Badge:** Pending style — purple (`#9B7FD4` on `#F5EEFF`)
4. **Cancel X:** `backgroundColor: '#EEEDEA'`

## Phase 7: Update Profile / Settings

1. **Background:** `#F5F4F1`
2. **Active toggles:** `#3F5443` (green)
3. **Notification indicators:** `#C9AEFB` or `#F5EEFF` (purple tint)

## Critical Rules

- **DO NOT** use `#3D3D3D` (old dark grey) anywhere
- **DO NOT** use `#4A7A5B` or `#C4973B` (old success/warning) — replaced by new tokens
- **DO NOT** use white text on lavender bubbles — use `#2E2440` (dark purple)
- **DO** replace ALL hardcoded color values with theme constants
- **DO** ensure green (#3F5443) is used for: chips, CTA, date pills, send button, confirmations
- **DO** ensure lavender (#C9AEFB) is used for: sent messages ONLY
- **DO** ensure purple tints (#F5EEFF, #9B7FD4) are used for: pending states
- **DO** keep all existing navigation, API calls, and business logic unchanged
