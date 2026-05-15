# Full App Redesign — Apply New Design System

## Overview
Update the entire app to use a new "warm neutral, productive & sharp" design system inspired by Notion. This is a palette and component-level redesign — layout structure stays the same, but colors, typography, spacing, borders, and shadows all change.

## Phase 1: Create/Update Theme Constants

Create or update the app's theme/constants file with these design tokens:

```typescript
export const colors = {
  // Backgrounds
  bgPrimary: '#FAFAF8',      // App background, main canvas
  bgSecondary: '#F4F3F0',    // Section backgrounds, subtle zones
  bgCard: '#FFFFFF',          // Cards, elevated surfaces

  // Text
  textPrimary: '#1A1A1A',    // Headings, primary content
  textSecondary: '#6B6B6B',  // Body text, descriptions
  textTertiary: '#9B9B9B',   // Placeholders, hints, labels
  textInverse: '#FFFFFF',     // Text on filled buttons/chips

  // Borders & Dividers
  borderDefault: '#E8E8E4',  // Input borders, card borders
  borderFocus: '#3D3D3D',    // Focused input state
  divider: '#F0EFEC',        // Section dividers inside cards

  // Accent
  accentPrimary: '#3D3D3D',  // Selected chips, primary buttons, CTA
  accentHover: '#2A2A2A',    // Button hover/press state
  accentSubtle: '#EAEAE6',   // Unselected chip hover, duration badge bg

  // Status
  accentSuccess: '#4A7A5B',
  accentWarning: '#C4973B',
  accentDanger: '#B85C4D',
  statusPendingBg: '#FDF6E8',
  statusPendingText: '#C4973B',
  statusConfirmedBg: '#EDF5EF',
  statusConfirmedText: '#4A7A5B',
  statusCancelledBg: '#F5F4F2',
  statusCancelledText: '#9B9B9B',
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
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
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
    shadowColor: '#3D3D3D',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
};
```

## Phase 2: Update Shared Components

### Chip / Pill Button Component
Used for Work vibe and Where selections.

**Unselected state:**
- `backgroundColor: 'transparent'`
- `borderWidth: 1.5, borderColor: '#E8E8E4'`
- `borderRadius: 12`
- `paddingVertical: 10, paddingHorizontal: 6`
- Text: `color: '#6B6B6B', fontSize: 13, fontWeight: '500'`
- Emoji: `fontSize: 14`, inline with text, `gap: 5`
- Layout: `flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flex: 1`

**Selected state:**
- `backgroundColor: '#3D3D3D'`
- `borderColor: '#3D3D3D'`
- Text: `color: '#FFFFFF'`

### Primary Button (CTA)
- `backgroundColor: '#3D3D3D'`
- `borderRadius: 12`
- `paddingVertical: 15`
- Text: `color: '#FFFFFF', fontSize: 15, fontWeight: '600', letterSpacing: 0.2`
- Shadow: `shadowColor: '#3D3D3D', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: {width: 0, height: 2}, elevation: 4`
- **Press state:** `backgroundColor: '#2A2A2A'`

### Ghost / Text Button
- `backgroundColor: 'transparent'`
- No border
- Text: `color: '#9B9B9B', fontSize: 13, fontWeight: '500'`

### Input Field
- `backgroundColor: '#FFFFFF'`
- `borderWidth: 1.5, borderColor: '#E8E8E4'`
- `borderRadius: 12`
- `paddingVertical: 13, paddingHorizontal: 16`
- Text: `color: '#1A1A1A', fontSize: 15`
- Placeholder: `color: '#9B9B9B'`
- **Focus state:** `borderColor: '#3D3D3D'` — if possible add a subtle outer glow effect

### Card Container
- `backgroundColor: '#FFFFFF'`
- `borderRadius: 16`
- `padding: 18`
- Shadow: `shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, shadowOffset: {width: 0, height: 4}, elevation: 3`

### Status Badge (Pill)
- `paddingVertical: 3, paddingHorizontal: 10`
- `borderRadius: 999`
- Text: `fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8`
- Variants:
  - Pending: `backgroundColor: '#FDF6E8', color: '#C4973B'`
  - Confirmed: `backgroundColor: '#EDF5EF', color: '#4A7A5B'`
  - Cancelled: `backgroundColor: '#F5F4F2', color: '#9B9B9B'`

## Phase 3: Update Discover / Set Intention Screen

Apply these changes to the main discover screen:

1. **Screen background:** `backgroundColor: '#FAFAF8'`

2. **Header:**
   - Subtitle: `fontSize: 13, color: '#9B9B9B', fontWeight: '500'` — text: "Set availability to connect"
   - Title: `fontSize: 26, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3` — text: "Today's focus"
   - `marginBottom: 20` between header and first input

3. **Task input:** Use updated Input Field component (single line, not textarea)
   - `marginBottom: 16`

4. **Work vibe + Where grouped card:**
   - Wrap both in a single Card Container
   - "Work vibe" label: `fontSize: 13, fontWeight: '600', color: '#1A1A1A', marginBottom: 10`
   - 3 chips in one row: Deep focus, Chat mode, Flexible (with emojis 🎧💬✌️)
   - Divider between sections: `height: 1, backgroundColor: '#F0EFEC'`, full-bleed (extend into card padding with negative margin)
   - "Where" label: same style as Work vibe
   - 3 chips in one row: Cafe, Library, Anywhere (with emojis ☕📚📍)
   - `marginBottom: 16`

5. **Available time — inline row (NOT two separate boxes):**
   - Label above: caption style (`fontSize: 11, fontWeight: '600', uppercase, letterSpacing: 1, color: '#9B9B9B'`)
   - Single row container with Input Field styling
   - Contents: [clock icon 15px stroke #9B9B9B] [start time bold] [— dash in #CCC] [end time bold] [duration badge on right]
   - Duration badge: `fontSize: 11, fontWeight: '600', color: '#6B6B6B', backgroundColor: '#EAEAE6', paddingVertical: 3, paddingHorizontal: 9, borderRadius: 20`
   - `marginBottom: 16`

6. **Add specific place:** Dashed border button
   - `borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#E8E8E4'`
   - `borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16`
   - Text: `fontSize: 13, color: '#9B9B9B'`

7. **Sticky CTA at bottom:** Primary Button, full width
   - Wrap in container with gradient fade: transparent → bgPrimary
   - `paddingHorizontal: 20, paddingBottom: 32`

## Phase 4: Update Chat Interface

1. **Chat background:** `backgroundColor: '#F4F3F0'` (bgSecondary)

2. **Received messages:**
   - `backgroundColor: '#FFFFFF'`
   - `borderRadius: 14` (bottom-left: 4)
   - `borderWidth: 1, borderColor: '#E8E8E4'`
   - Text: `fontSize: 14, color: '#1A1A1A'`

3. **Sent messages:**
   - `backgroundColor: '#3D3D3D'` (accentPrimary)
   - `borderRadius: 14` (bottom-right: 4)
   - Text: `fontSize: 14, color: '#FFFFFF'`

4. **Timestamps:** `fontSize: 11, color: '#9B9B9B'`

5. **Chat input bar:**
   - Input: `borderRadius: 24, borderWidth: 1.5, borderColor: '#E8E8E4', backgroundColor: '#FFFFFF'`
   - Send button: `width: 36, height: 36, borderRadius: 36, backgroundColor: '#3D3D3D'`

## Phase 5: Update Invite Flow (Date Picker)

1. **Card container:** Use Card Container styling, max width ~300px centered

2. **"Pick a day" heading:** `fontSize: 13, fontWeight: '600', color: '#1A1A1A'`

3. **Date pills — horizontal ScrollView:**
   - Each pill: `width: 54, paddingVertical: 10, paddingHorizontal: 4, borderRadius: 12`
   - Selected: `backgroundColor: '#3D3D3D', borderColor: '#3D3D3D'`
   - Unselected: `backgroundColor: '#FAFAF8', borderWidth: 1.5, borderColor: '#E8E8E4'`
   - Day label: `fontSize: 12, fontWeight: '600'`
   - Date subtitle: `fontSize: 10`
   - Gap: 6

4. **Send Invite button:** Primary Button style, `flex: 1`
5. **Cancel:** Ghost button style, next to Send Invite

## Phase 6: Update Pending Invite Card

1. **Card:** `backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14/16`
   - Shadow: card shadow
   - Layout: single row `flexDirection: 'row', alignItems: 'center', gap: 14`

2. **Clock icon container:**
   - `width: 42, height: 42, borderRadius: 10`
   - `backgroundColor: '#FDF6E8'`
   - Clock icon: `width: 20, stroke: '#C4973B'`

3. **Text block:** `flex: 1`
   - Title row: "Cowork Invite" (`fontSize: 15, fontWeight: '600', color: '#1A1A1A'`) + Pending badge
   - Date: `fontSize: 12.5, color: '#9B9B9B'`

4. **Cancel X button:**
   - `width: 30, height: 30, borderRadius: 15`
   - `backgroundColor: '#F4F3F0'`
   - Icon: `color: '#9B9B9B', fontSize: 14`

5. **Cancelled state:** Replace entire card with:
   - `backgroundColor: '#F5F4F2', borderRadius: 16, padding: 14/18`
   - `borderWidth: 1, borderColor: '#E8E8E4'`
   - Text: "Invite cancelled" — `fontSize: 13, color: '#9B9B9B'`

## Phase 7: Update Profile / Settings Screen

1. **Screen background:** `backgroundColor: '#FAFAF8'`
2. **Section cards:** Use Card Container for grouped settings
3. **Section headers:** caption style
4. **Text:** Follow typography scale
5. **Any buttons/toggles:** Use accent colors from the system

## Critical Rules

- **DO NOT** use any of the old green colors (`#6b7f5e`, `#8a9a7c`, etc.) anywhere
- **DO NOT** use the old earth-tone borders (`#e8e4de`, `#ddd8d0`, etc.)
- **DO** replace ALL hardcoded color values with theme constants
- **DO** ensure every component references the shared theme file
- **DO** keep all existing navigation, API calls, and business logic unchanged
- **DO** maintain all existing functionality — this is a visual-only update
