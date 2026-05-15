# Cowork App — Design System v1.0

## Design Philosophy
**"Productive warmth"** — Sharp enough to feel like a tool you trust, warm enough to feel like a place you want to be. Think Notion's clarity meets the social warmth of a good coffee shop.

---

## 1. Color Palette

### Base Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#FAFAF8` | App background, main canvas |
| `bg-secondary` | `#F4F3F0` | Section backgrounds, subtle zones |
| `bg-card` | `#FFFFFF` | Cards, elevated surfaces |
| `bg-input` | `#FFFFFF` | Input fields |

### Text Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#1A1A1A` | Headings, primary content |
| `text-secondary` | `#6B6B6B` | Body text, descriptions |
| `text-tertiary` | `#9B9B9B` | Placeholders, hints, labels |
| `text-inverse` | `#FFFFFF` | Text on filled buttons/chips |

### Border & Divider Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `border-default` | `#E8E8E4` | Input borders, card borders |
| `border-focus` | `#3D3D3D` | Focused input state |
| `divider` | `#F0EFEC` | Section dividers inside cards |

### Accent Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-primary` | `#3D3D3D` | Selected chips, primary buttons, CTA |
| `accent-primary-hover` | `#2A2A2A` | Button hover/press state |
| `accent-success` | `#4A7A5B` | Confirmed states, success indicators |
| `accent-warning` | `#C4973B` | Pending states, amber indicators |
| `accent-danger` | `#B85C4D` | Cancel, destructive actions |
| `accent-subtle` | `#EAEAE6` | Unselected chip backgrounds on hover |

### Status Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `status-pending-bg` | `#FDF6E8` | Pending badge background |
| `status-pending-text` | `#C4973B` | Pending badge text |
| `status-confirmed-bg` | `#EDF5EF` | Confirmed badge background |
| `status-confirmed-text` | `#4A7A5B` | Confirmed badge text |
| `status-cancelled-bg` | `#F5F4F2` | Cancelled state background |
| `status-cancelled-text` | `#9B9B9B` | Cancelled state text |

---

## 2. Typography

### Font Family
- **Primary:** `SF Pro Display` (iOS) / `Inter` (Android/web fallback)
- **Rationale:** System-native on iOS for performance + familiarity. Inter is the closest cross-platform match. Both are crisp, neutral, and highly legible at small sizes.

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
| `shadow-button` | `0 2px 6px rgba(61,61,61,0.15), 0 4px 16px rgba(61,61,61,0.08)` | Primary CTA button |
| `shadow-dropdown` | `0 4px 20px rgba(0,0,0,0.08)` | Dropdowns, popovers |

---

## 6. Component Specifications

### 6a. Chips / Pills (Selection)
**Unselected:**
- Background: `transparent`
- Border: `1.5px solid #E8E8E4`
- Text: `#6B6B6B`, 13px, weight 500
- Padding: `10px 14px`
- Border radius: `radius-md` (12px)
- Emoji: 14px, inline with text, 6px gap

**Selected:**
- Background: `#3D3D3D` (accent-primary)
- Border: `1.5px solid #3D3D3D`
- Text: `#FFFFFF`, 13px, weight 500
- Same padding and radius

**Layout:** Single horizontal row, `flex: 1` per chip, gap `8px`

### 6b. Input Fields
- Background: `#FFFFFF`
- Border: `1.5px solid #E8E8E4`
- Border radius: `12px`
- Padding: `13px 16px`
- Font: 15px, weight 400, color `#1A1A1A`
- Placeholder: `#9B9B9B`
- **Focus state:** border `#3D3D3D`, box-shadow `0 0 0 3px rgba(61,61,61,0.06)`

### 6c. Primary Button (CTA)
- Background: `#3D3D3D`
- Border radius: `12px`
- Padding: `15px 0` (full width)
- Text: `#FFFFFF`, 15px, weight 600
- Shadow: `shadow-button`
- **Press state:** background `#2A2A2A`, translateY(1px)

### 6d. Ghost / Text Button
- Background: `transparent`
- Border: none
- Text: `#9B9B9B`, 13px, weight 500
- No shadow

### 6e. Cards
- Background: `#FFFFFF`
- Border radius: `16px`
- Padding: `18px`
- Shadow: `shadow-card`
- Internal dividers: 1px `#F0EFEC`, full-bleed (extend into padding)

### 6f. Status Badges
- Padding: `3px 10px`
- Border radius: `999px` (pill)
- Font: `caption` style (11px, weight 600, uppercase, letter-spacing 0.8px)
- Variants:
  - **Pending:** bg `#FDF6E8`, text `#C4973B`
  - **Confirmed:** bg `#EDF5EF`, text `#4A7A5B`
  - **Cancelled:** bg `#F5F4F2`, text `#9B9B9B`

### 6g. Inline Time Display
- Container: same as input field styling
- Layout: row — [clock icon] [start time] [dash] [end time] [duration badge]
- Clock icon: 15px, stroke `#9B9B9B`
- Times: 15px, weight 600, color `#1A1A1A`
- Dash: "—", color `#CCCCCC`
- Duration badge: `caption` style, bg `#EAEAE6`, text `#6B6B6B`, pill radius

### 6h. Pending Invite Card (Chat Inline)
- Layout: single row — [icon square] [text block] [X button]
- Icon container: 42px × 42px, radius 10px, bg `#FDF6E8`
- Title: `heading-md` (16px, 600), color `#1A1A1A`
- Badge: status-pending style, inline with title
- Subtitle: `body-small`, color `#9B9B9B`
- Cancel X: 30px × 30px circle, bg `#F4F3F0`, icon color `#9B9B9B`

### 6i. Date Pill Selector
- Horizontal ScrollView, gap 6px
- Each pill: 54px wide, padding `10px 4px`
- Radius: 12px
- **Selected:** bg `#3D3D3D`, text white
- **Unselected:** bg `#FAFAF8`, border `1.5px solid #E8E8E4`
- Day label: 12px, weight 600
- Date subtitle: 10px, weight 400

---

## 7. Screen-by-Screen Plan

### Screen 1: Discover / Set Intention
- Compact single-line task input
- Work vibe + Where grouped in one card, single-row chips
- Inline time display
- Optional "add place" as dashed border button
- Sticky CTA at bottom

### Screen 2: Invite Flow (Date Picker)
- Horizontal date pills (already implemented)
- Constrained card width (~300px), centered
- Primary "Send Invite" + ghost "Cancel"

### Screen 3: Pending Invite Card
- Compact single-row layout (already implemented)
- Clock icon + text + pending badge + X cancel
- Cancelled state: muted single-line text

### Screen 4: Chat Interface
- Apply new text colors and typography
- Message bubbles: sent = `accent-primary` (#3D3D3D), received = `bg-secondary`
- System cards (invites, status) use card styling
- Input bar: new input field styling

### Screen 5: Profile / Settings
- Clean section-based layout
- Use cards for grouped settings
- Consistent typography hierarchy
- Status badges for account state

---

## 8. Transition Plan

**Phase 1 — Foundation (do first)**
- Update color constants/theme file with new palette
- Update typography scale
- Update shared components: Button, Chip, Input, Card, Badge

**Phase 2 — Core Screens**
- Discover screen (most visible, sets the tone)
- Chat interface (most used)

**Phase 3 — Secondary Screens**
- Invite flow
- Pending card
- Profile / settings

---

## 9. Key Design Principles

1. **One accent color does the heavy lifting.** Dark charcoal (#3D3D3D) is the primary accent — it's selected chips, CTAs, and sent messages. This creates unity without being loud.

2. **Emojis are the personality layer.** The base UI is neutral and sharp. Emojis on chips and section headers inject warmth without cluttering the visual system.

3. **Information density over whitespace.** This is a productivity tool — respect the user's time. Compact chips, inline time displays, single-line inputs. No unnecessary vertical padding.

4. **Status through color, not size.** Pending/confirmed/cancelled states use small pill badges with soft backgrounds, never large banners or alerts.

5. **Consistency beats novelty.** Every chip, input, card, and button should feel like it belongs to the same family. When in doubt, reuse an existing component pattern.
