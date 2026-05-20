# Invite Card UI Consistency — Design Doc

**Date:** 2026-03-01
**Status:** Approved

## Problem

The sender and receiver of a cowork invite see inconsistent card UIs for `status === 'pending'`:

- **Sender** — compact row card: coffee icon box | "Cowork Invite" + PENDING badge + date | ✕ cancel button
- **Receiver** — stacked card: "Session Pending" title + animated dot | description text | full-width Accept / Decline buttons

The sender's row card (first screenshot) is the source of truth.

## Approach

**Approach A — Direct swap.** Add a new early-return branch for `status === 'pending' && !isInitiator` that renders the same `pendingRowCard` JSX as the initiator branch, replacing the ✕ button with stacked Accept / Decline action buttons. Remove the old general `card` render path for the pending invitee state.

## Layout

```
[ ☕️ box ] [ "Cowork Invite"  PENDING  ]  [ Accept  ]
           [ Sat, Feb 28               ]  [ Decline ]
```

## Component Changes

**File:** `src/components/session/SessionRequestCard.tsx`

### New branch (before the existing general `return`)

When `status === 'pending' && !isInitiator`, render `pendingRowCard` with:
- Same `pendingIconBox` (☕️), `pendingContent` (title + badge + date) as the initiator branch
- Right side: `inviteeActions` View containing two pill buttons stacked vertically

### New styles

| Style | Properties |
|---|---|
| `inviteeActions` | `flexDirection: 'column'`, `gap: 4`, `flexShrink: 0` |
| `acceptBtn` | `backgroundColor: colors.primary`, `paddingVertical: 5`, `paddingHorizontal: 12`, `borderRadius: 20` |
| `acceptBtnText` | `fontSize: 12`, `fontWeight: '600'`, `color: '#FFFFFF'` |
| `declineBtn` | `backgroundColor: colors.bgSecondary`, `paddingVertical: 5`, `paddingHorizontal: 12`, `borderRadius: 20` |
| `declineBtnText` | `fontSize: 12`, `color: colors.textTertiary` |

### Removed

- The old general `card` render path for `pending` invitee state (the "Session Pending" / full-width Accept+Decline block)
- `renderActions()` and `renderDescription()` helper functions become unused for `pending` — remove if no longer needed by other states

## States Unchanged

`declined`, `completed`, `cancelled`, `active` (SessionReceiptCard) — all untouched.
