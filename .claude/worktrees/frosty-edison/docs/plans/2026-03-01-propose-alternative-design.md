# Propose Alternative — Design Doc

**Date:** 2026-03-01
**Status:** Approved

## Problem

The receiver's pending invite card only has Accept and Decline. There is no way to suggest a counter-proposal without leaving the card. This feature adds a "Propose…" tertiary action that opens an inline text input, sending the proposal as a chat message.

## Approved Design

### Receiver card — default state

Identical visual DNA to the sender card (white card, lavender icon box, lavender PENDING badge, same typography). Only the right-side actions column differs.

```
[ ☕️ ] [ Cowork Invite   PENDING   Sat, Feb 28 ]  [  ✓ Accept  ]
                                                    [Dec][Prop…]
```

**Actions column structure (`inviteeActions`):**
```
inviteeActions (column, gap:4, flexShrink:0)
├── acceptBtn          — full-width green pill, paddingVertical:8
└── secondaryRow       — flexDirection:'row', gap:4
    ├── declineBtn     — flex:1, grey filled, paddingVertical:4
    └── proposeBtn     — flex:1, outline only, paddingVertical:4
```

### Receiver card — expanded state (after tapping "Propose…")

A full-width input row appears below the main card row, separated by a thin divider:

```
[ ☕️ ] [ Cowork Invite   PENDING   Sat, Feb 28 ]  [  ✓ Accept  ]
                                                    [Dec][Prop…]
──────────────────────────────────────────────────────────────────
[ Suggest an alternative…                  ] [ → ]
```

- `TextInput`: `flex:1`, placeholder "Suggest an alternative…", `autoFocus: true`, `fontSize: 13`
- Send button `→`: small green circle (`width:30, height:30`), disabled + dimmed when input is empty
- On send: calls `onSendMessage(text)` → input collapses, text clears, invite stays pending
- Tapping "Propose…" again while expanded: collapses without sending

### Styles

| Key | Values |
|---|---|
| `acceptBtn` | `backgroundColor: colors.accentPrimary`, `paddingVertical: 8`, `paddingHorizontal: 12`, `borderRadius: 20`, `alignItems: 'center'` |
| `acceptBtnText` | `fontSize: 12`, `fontWeight: '600'`, `color: '#FFFFFF'` |
| `secondaryRow` | `flexDirection: 'row'`, `gap: 4` |
| `declineBtn` | `backgroundColor: colors.bgSecondary`, `flex: 1`, `paddingVertical: 4`, `paddingHorizontal: 8`, `borderRadius: 20`, `alignItems: 'center'` |
| `declineBtnText` | `fontSize: 11`, `color: colors.textTertiary` |
| `proposeBtn` | `backgroundColor: 'transparent'`, `borderWidth: 1`, `borderColor: colors.textTertiary`, `flex: 1`, `paddingVertical: 4`, `paddingHorizontal: 8`, `borderRadius: 20`, `alignItems: 'center'` |
| `proposeBtnText` | `fontSize: 11`, `color: colors.textTertiary` |
| `proposeDivider` | `height: 1`, `backgroundColor: colors.bgSecondary`, `marginTop: 10` |
| `proposeInputRow` | `flexDirection: 'row'`, `alignItems: 'center'`, `paddingHorizontal: 14`, `paddingVertical: 10`, `gap: 8` |
| `proposeInput` | `flex: 1`, `fontSize: 13`, `color: colors.textPrimary` |
| `proposeSendBtn` | `width: 30`, `height: 30`, `borderRadius: 15`, `backgroundColor: colors.accentPrimary`, `alignItems: 'center'`, `justifyContent: 'center'` |
| `proposeSendBtnDisabled` | `opacity: 0.35` |

## State

Local to the invitee branch (no DB changes needed):

```tsx
const [showProposeInput, setShowProposeInput] = useState(false);
const [proposeText, setProposeText] = useState('');
```

## New Prop

```tsx
onSendMessage: (text: string) => void
```

Added to `SessionRequestCardProps`. Wired in `ChatScreen.tsx` to the existing `sendMessage` function.

## Files

- **Modify:** `src/components/session/SessionRequestCard.tsx`
  - Add `onSendMessage` prop
  - Add `useState` imports
  - Update invitee pending branch: new actions layout + input row
  - Add 9 new styles; update `acceptBtn`, `declineBtn` styles
- **Modify:** `src/screens/matches/ChatScreen.tsx`
  - Pass `onSendMessage={sendMessage}` to `<SessionRequestCard />`

## What Does Not Change

- Sender card — completely untouched
- All other session states (active, declined, completed, cancelled)
- No Supabase schema changes
