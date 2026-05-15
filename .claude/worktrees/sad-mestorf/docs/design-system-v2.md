# Cowork App — Design System v2.0

## Design Philosophy
**"Productive warmth"** — Sharp enough to feel like a tool you trust, warm enough to feel like a place you want to be. Notion's clarity meets the social warmth of a good coffee shop — with a signature green + lavender personality.

**Color story:** Deep forest green anchors all primary actions (selections, CTA, confirmations). Soft lavender adds personality to communication (sent messages, pending states, highlights). The warm neutral canvas ties them together.

---

## 1. Color Palette

### Base Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#F5F4F1` | App background, main canvas |
| `bg-secondary` | `#EEEDEA` | Section backgrounds, chat bg, subtle zones |
| `bg-card` | `#FFFFFF` | Cards, elevated surfaces |
| `bg-input` | `#FFFFFF` | Input fields |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#1A1A1A` | Headings, primary content |
| `text-secondary` | `#6B6B6B` | Body text, descriptions |
| `text-tertiary` | `#9B9B9B` | Placeholders, hints, labels |
| `text-inverse` | `#FFFFFF` | Text on green buttons/chips |

### Border & Divider Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#E4E3E0` | Input borders, card borders |
| `border-focus` | `#3F5443` | Focused input state |
| `divider` | `#EEEDEA` | Section dividers inside cards |

### Primary Accent — Forest Green (from 10dean "Directions" buttons)
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-primary` | `#3F5443` | Selected chips, CTA buttons, date pills, focus border |
| `accent-primary-hover` | `#334536` | Button hover/press state |
| `accent-primary-light` | `#EDF3EF` | Light green tint for badges, duration badge bg |

### Secondary Accent — Lavender (from 10dean "Sign up Today" button)
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-secondary` | `#C9AEFB` | Sent message bubbles |
| `accent-secondary-dark` | `#8B6FC0` | Purple text on light backgrounds, links |
| `accent-secondary-text` | `#2E2440` | Text ON lavender bubble (dark purple for contrast) |
| `accent-secondary-light` | `#F5EEFF` | Light purple tint for pending badges, highlights |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `status-pending-bg` | `#F5EEFF` | Pending badge background (purple tint) |
| `status-pending-text` | `#9B7FD4` | Pending badge text (muted purple) |
| `status-confirmed-bg` | `#EDF3EF` | Confirmed badge background (green tint) |
| `status-confirmed-text` | `#3F5443` | Confirmed badge text (forest green) |
| `status-cancelled-bg` | `#F5F4F2` | Cancelled state background |
| `status-cancelled-text` | `#9B9B9B` | Cancelled state text |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-danger` | `#B85C4D` | Cancel, destructive actions, errors |
| `accent-subtle` | `#E8E7E4` | Hover backgrounds, muted surfaces |

---

## 2. Typography

### Font Family
- **Primary:** `SF Pro Display` (iOS) / `Inter` (Android/web fallback)

### Type Scale
| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| `heading-xl` | 26px | 700 | 1.2 | -0.3px | Screen titles |
| `heading-lg` | 20px | 700 | 1.25 | -0.2px | Section headers |
| `heading-md` | 16px | 600 | 1.3 | 0px | Card titles, names |
| `body` | 15px | 400 | 1.5 | 0px | Primary body text |
| `body-medium` | 15px | 500 | 1.5 | 0px | Emphasized body text |
| `body-small` | 13px | 400 | 1.4 | 0px | Secondary text, descriptions |
| `caption` | 11px | 600 | 1.3 | 0.8px | Uppercase labels, badges |
| `chip` | 13px | 500 | 1 | 0px | Chip/pill labels |

---

## 3. Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `space-xs` | 4px | Tight gaps (icon + label) |
| `space-sm` | 8px | Chip gaps, inline spacing |
| `space-md` | 12px | Between related elements |
| `space-lg` | 16px | Between sections, card padding |
| `space-xl` | 20px | Screen horizontal padding |
| `space-2xl` | 24px | Between major sections |
| `space-3xl` | 32px | Top padding, large separations |

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 8px | Small badges, tags |
| `radius-md` | 12px | Input fields, buttons, chips |
| `radius-lg` | 16px | Cards, modals |
| `radius-full` | 999px | Circular elements, pill badges |

---

## 5. Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | `0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)` | Cards, elevated surfaces |
| `shadow-button` | `0 2px 6px rgba(63,84,67,0.2), 0 4px 16px rgba(63,84,67,0.1)` | Primary CTA button |
| `shadow-dropdown` | `0 4px 20px rgba(0,0,0,0.08)` | Dropdowns, popovers |

---

## 6. Component Specifications

### 6a. Chips / Pills (Selection)
**Unselected:**
- Background: `transparent`
- Border: `1.5px solid #E4E3E0`
- Text: `#6B6B6B`, 13px, weight 500
- Padding: `10px 14px`
- Border radius: 12px
- Emoji: 14px, inline with text, 5px gap

**Selected:**
- Background: `#3F5443` (forest green)
- Border: `1.5px solid #3F5443`
- Text: `#FFFFFF`, 13px, weight 500
- Shadow: `0 2px 8px rgba(63,84,67,0.25)`

**Layout:** Single horizontal row, `flex: 1` per chip, gap `8px`

### 6b. Input Fields
- Background: `#FFFFFF`
- Border: `1.5px solid #E4E3E0`
- Border radius: 12px
- Padding: `13px 16px`
- Font: 15px, weight 400, color `#1A1A1A`
- Placeholder: `#9B9B9B`
- **Focus state:** border `#3F5443`, box-shadow `0 0 0 3px rgba(63,84,67,0.08)`

### 6c. Primary Button (CTA)
- Background: `#3F5443` (forest green)
- Border radius: 12px
- Padding: `15px 0` (full width)
- Text: `#FFFFFF`, 15px, weight 600, letter-spacing 0.2
- Shadow: `shadow-button`
- **Press state:** background `#334536`, translateY(1px)

### 6d. Ghost / Text Button
- Background: `transparent`
- Border: none
- Text: `#9B9B9B`, 13px, weight 500
- No shadow

### 6e. Cards
- Background: `#FFFFFF`
- Border radius: 16px
- Padding: 18px
- Shadow: `shadow-card`
- Internal dividers: 1px `#EEEDEA`, full-bleed (extend into padding)

### 6f. Status Badges
- Padding: `3px 10px`
- Border radius: 999px (pill)
- Font: `caption` style (11px, weight 600, uppercase, letter-spacing 0.8)
- Variants:
  - **Pending:** bg `#F5EEFF`, text `#9B7FD4` (purple)
  - **Confirmed:** bg `#EDF3EF`, text `#3F5443` (green)
  - **Cancelled:** bg `#F5F4F2`, text `#9B9B9B`

### 6g. Inline Time Display
- Container: same as input field styling
- Layout: row — [clock icon] [start time] [dash] [end time] [duration badge]
- Clock icon: 15px, stroke `#9B9B9B`
- Times: 15px, weight 600, color `#1A1A1A`
- Dash: "—", color `#CCCCCC`
- Duration badge: `caption` style, bg `#EDF3EF`, text `#3F5443`, pill radius

### 6h. Pending Invite Card (Chat Inline)
- Layout: single row — [icon square] [text block] [X button]
- Icon container: 42px × 42px, radius 10px, bg `#F5EEFF` (light purple)
- Clock icon: stroke `#9B7FD4`
- Title: `heading-md` (16px, 600), color `#1A1A1A`
- Badge: status-pending style (purple)
- Subtitle: `body-small`, color `#9B9B9B`
- Cancel X: 30px × 30px circle, bg `#EEEDEA`, icon color `#9B9B9B`

### 6i. Date Pill Selector
- Horizontal ScrollView, gap 6px
- Each pill: 54px wide, padding `10px 4px`
- Radius: 12px
- **Selected:** bg `#3F5443`, text white
- **Unselected:** bg `#F5F4F1`, border `1.5px solid #E4E3E0`
- Day label: 12px, weight 600
- Date subtitle: 10px, weight 400

### 6j. Chat Bubbles
- **Received (incoming):**
  - Background: `#FFFFFF`
  - Border: `1px solid #E4E3E0`
  - Border radius: `14px 14px 14px 4px`
  - Text: 14px, color `#1A1A1A`

- **Sent (outgoing):**
  - Background: `#C9AEFB` (lavender)
  - Border: none
  - Border radius: `14px 14px 4px 14px`
  - Text: 14px, color `#2E2440` (dark purple)
  - Shadow: `0 2px 8px rgba(201,174,251,0.3)`

- **Timestamps:** 11px, color `#9B9B9B`, right-aligned

- **Chat input:** border-radius 24px, send button 36px circle bg `#3F5443`

---

## 7. Color Usage Map

| Element | Color | Token |
|---------|-------|-------|
| Selected chips | `#3F5443` | `accent-primary` |
| CTA button | `#3F5443` | `accent-primary` |
| Selected date pill | `#3F5443` | `accent-primary` |
| Input focus border | `#3F5443` | `border-focus` |
| Send button (chat) | `#3F5443` | `accent-primary` |
| Duration badge | `#3F5443` on `#EDF3EF` | `accent-primary` on `accent-primary-light` |
| Confirmed badge | `#3F5443` on `#EDF3EF` | `status-confirmed-text` on `status-confirmed-bg` |
| Sent message bubble | `#C9AEFB` | `accent-secondary` |
| Sent message text | `#2E2440` | `accent-secondary-text` |
| Pending badge | `#9B7FD4` on `#F5EEFF` | `status-pending-text` on `status-pending-bg` |
| Pending icon | `#9B7FD4` | `status-pending-text` |

---

## 8. Screen-by-Screen Plan

### Screen 1: Discover / Set Intention
- Compact single-line task input
- Work vibe + Where grouped in one card, single-row chips (green selected state)
- Inline time display with green duration badge
- Optional "add place" as dashed border button
- Sticky CTA at bottom (green)

### Screen 2: Invite Flow (Date Picker)
- Horizontal date pills (green selected state)
- Constrained card width (~300px), centered
- Primary "Send Invite" (green) + ghost "Cancel"

### Screen 3: Pending Invite Card
- Compact single-row layout
- Purple-tinted icon bg + purple pending badge
- Clock icon + text + pending badge + X cancel

### Screen 4: Chat Interface
- Received bubbles: white with border
- Sent bubbles: **lavender** (#C9AEFB) with dark purple text
- System cards (invites, status) use card styling
- Input bar with green send button

### Screen 5: Profile / Settings
- Clean section-based layout
- Use cards for grouped settings
- Green for active toggles / confirmed states
- Purple tints for notification indicators

---

## 9. Transition Plan

**Phase 1 — Foundation**
- Update color constants/theme file with new palette
- Replace ALL old accent colors (#3D3D3D) with new green (#3F5443)
- Add new purple tokens
- Update shared components: Button, Chip, Input, Card, Badge

**Phase 2 — Core Screens**
- Discover screen (green chips, green CTA)
- Chat interface (lavender sent bubbles, green send button)

**Phase 3 — Secondary Screens**
- Invite flow (green date pills)
- Pending card (purple pending badges)
- Profile / settings

---

## 10. Key Design Principles

1. **Green is the workhorse.** Forest green (#3F5443) handles all primary actions — selections, CTAs, confirmations. It's calm, trustworthy, and productive.

2. **Lavender is the personality.** Purple (#C9AEFB) shows up in communication — sent messages and pending states. It adds warmth and friendliness to the social layer of the app.

3. **They never compete.** Green and purple occupy different zones: green = actions/selections, purple = communication/status. They don't appear on the same component.

4. **The canvas is warm neutral.** The `#F5F4F1` background is warmer than pure white, giving the green and purple room to breathe.

5. **Emojis still carry warmth.** The base UI is clean and structured. Emojis on chips inject personality without cluttering.

6. **Information density over whitespace.** Compact chips, inline time displays, single-line inputs. Respect the user's time.
