# Design Spec: Focus Screen Simplification + Always-On Discovery

**Date:** 2026-03-25
**Status:** Approved

---

## Overview

Two related changes:
1. Visually simplify the "what are we cooking today?" (`IntentScreen`) to feel less like a form and more like a lightweight daily check-in.
2. Remove the requirement for users to set a daily focus before being discoverable — users are visible in discovery at all times.

---

## Part 1 — IntentScreen Visual Refresh (Option C)

### Goal

Reduce visual noise without removing any fields. The screen should feel focused, minimal, and slightly playful — not like a form.

### Changes

**Chips (Work vibe + Where):**
- Remove emoji from all chip labels. Text-only: "Deep focus", "Chat mode", "Flexible" / "Cafe", "Library", "Anywhere".
- Keep the two separate chip rows with their existing section labels (`"Work vibe"` and `"Where"`) rendered via the `label` style.
- Keep the card wrapper (`optionsCard`) for the two chip groups.

**Time row:**
- The current layout uses `timeColumn` wrappers with `"Start"` / `"End"` `timeLabel` sub-labels above each picker box. Remove the `timeColumn` wrappers and both `timeLabel` sub-labels.
- Add a `→` separator (`Text` or `View`) between the two `timePicker` boxes.
- The result is a single inline row: `[9:00 AM]  →  [11:00 AM]  [2 HR]`
- The existing `timeRow` flexDirection row and `durationBadge` remain — this is a narrow delta, not a full rebuild.
- Left box taps to open the start-time picker modal. Right box taps to open the end-time picker modal. Duration badge stays non-tappable.

**CTA button:**
- Rename from "Find Co-Workers" → **"Save focus"**, since users are already discoverable and this is now an update action, not a gate.

**Remove empty-input validation:**
- The current `handleSubmit` blocks submission if `taskDescription.trim()` is empty (lines ~141–144). Remove this `Alert` check. An empty `task_description` is valid — users may not have set focus yet.

**Everything else stays the same:**
- Cormorant title + rotating `✦` star animation
- `task_description` text input (multiline, pre-filled from last session)
- `endTime > startTime` validation stays
- Specific place input (conditional on Cafe/Library)
- Location error / loading states

### Files

- `src/screens/discover/IntentScreen.tsx`

---

## Part 2 — Always-On Discovery

### Goal

Users appear in the discovery feed at all times. Setting a daily focus is optional and enhances their card, not a gate to discovery.

### Approach: Silent default intent

When the Discover tab loads and the user has no `work_intent` for today, **auto-create one silently** with defaults:
- `task_description: ''`
- `work_style: 'Flexible'`
- `location_type: 'Anywhere'`
- `location_name: null`
- `available_from`: current time rounded to the next 30-min interval (use the existing `getDefaultTimes()` logic currently in `IntentScreen`)
- `available_until`: `available_from` + 2 hours (clamped to 23:00)
- `latitude` / `longitude`: from the user's current location (already loaded by DiscoverScreen)

Move or export `getDefaultTimes()` from `IntentScreen.tsx` to `discoveryService.ts` (or a shared util) so `DiscoverScreen` can call it without importing UI code.

This keeps `fetchDiscoveryCards` unchanged — every user always has a record for today.

### DiscoverScreen changes

**Remove the gate:** Delete the `needs_intent` state value and all branches that set it:
- The `if (!todayIntent) { setState('needs_intent') }` block in `loadDiscoveryData`
- The `setState('needs_intent')` in the `locationError` branch — replace with `setState('error')` (use the existing `error` state or add one if not present)
- The `state === 'needs_intent'` render branch that returns `<IntentScreen ... />`

**Auto-create on load:** After location is resolved and `getTodayIntent` returns null, call `upsertIntent` with the default values above before proceeding to `fetchDiscoveryCards`. No UI change — this is silent.

**Add Edit Focus FAB:** In the `discovering` state render, add an absolutely-positioned floating action button:
- Position: `bottom: 96, right: 20` (above the tab bar, which is ~80px tall)
- Appearance: 56×56 circle, forest (`#0c1f0e`) background, lavender (`#ede8ff`) pencil icon (✎ character or simple SVG)
- Shadow: subtle — `elevation: 4` on Android, `shadowColor/opacity/radius` on iOS
- On press: open `IntentScreen` as a modal (sets a local `isFocusModalVisible` boolean state)

**FAB modal:** Wrap `IntentScreen` in a React Native `<Modal visible={isFocusModalVisible} animationType="slide">`. Pass an `onIntentSet` callback that:
1. Sets `isFocusModalVisible = false`
2. Refreshes the card stack (re-calls `fetchDiscoveryCards`) so the user's updated intent is reflected

**IntentScreen modal prop:** `IntentScreen` currently takes `onIntentSet: () => void`. No signature change needed — the modal's `onIntentSet` closes the modal + refreshes.

### SwipeCard fallback

`SwipeCard` renders `intent.task_description` in a dedicated intent line below a divider. `profile.work_type` is already rendered separately as a profession line above the divider.

When `task_description` is empty, **omit the intent line entirely** (do not substitute `work_type` to avoid duplication). Change the render to:

```tsx
{intent.task_description ? (
  <>
    <View style={styles.divider} />
    <Text style={styles.intent} numberOfLines={2}>
      {intent.task_description}
    </Text>
  </>
) : null}
```

### Files

- `src/screens/discover/DiscoverScreen.tsx`
- `src/screens/discover/IntentScreen.tsx` (export `getDefaultTimes` or move to util)
- `src/services/discoveryService.ts` (or a new `src/utils/timeUtils.ts` for `getDefaultTimes`)
- `src/components/discover/SwipeCard.tsx`

---

## What Does NOT Change

- `fetchDiscoveryCards` Supabase query — no schema or RPC changes
- `work_intents` table schema — unchanged
- Friends, Chats, Sessions screens — unaffected
- The conditional "Specific place" input in IntentScreen — kept as-is

---

## Success Criteria

- Opening Discover immediately shows cards without any intent prompt
- Users without a manually set focus still appear in others' discovery feeds
- The IntentScreen opens from the FAB and saves cleanly
- No emoji in work vibe or location chips
- Time row shows `[Start] → [End] [DURATION]` on one line with no Start/End sub-labels
- CTA reads "Save focus"
- SwipeCard omits the intent line when `task_description` is empty (no blank line)

---

## Edge Cases

- **Location not yet resolved when Discover loads:** auto-create is deferred until location resolves. Use `(0, 0)` as fallback coordinates only if location permission is denied.
- **User taps FAB while cards are loading:** FAB is only rendered in the `discovering` state (cards loaded), not during loading.
- **Save focus with empty task_description:** allowed. The empty-input `Alert` in `handleSubmit` is removed as part of Part 1.
- **`locationError` state after gate removal:** transition to `'error'` state (not `'needs_intent'`) and show an existing or new error UI prompting the user to enable location.
