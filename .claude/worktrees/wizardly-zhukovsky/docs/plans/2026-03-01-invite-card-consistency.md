# Invite Card UI Consistency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the receiver's pending invite card match the sender's compact row layout — icon box | title + badge + date | stacked Accept/Decline buttons.

**Architecture:** Single-file change to `SessionRequestCard.tsx`. Add a new early-return branch for `status === 'pending' && !isInitiator` that renders the same `pendingRowCard` JSX as the initiator branch, with Accept/Decline pill buttons instead of the ✕ cancel button. The old stacked "Session Pending" card and its helper functions become unused for the pending invitee state.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript, StyleSheet

---

### Task 1: Add invitee pending row branch and styles

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx`

**Context:**
- The initiator's pending branch lives at line ~189: `if (session.status === 'pending' && isInitiator)` — it renders `pendingRowCard` with ☕️ icon, title+badge, date, and a ✕ cancel button
- The invitee's pending state currently falls through to the general `return` at the bottom (the stacked `card` with "Session Pending" title, description, and full-width Accept/Decline buttons)
- All existing `pendingRowCard`, `pendingIconBox`, `pendingContent`, `pendingTitleRow`, `pendingTitle`, `pendingBadge`, `pendingBadgeText`, `pendingDate` styles can be reused as-is

**Step 1: Add the invitee pending branch**

Immediately after the initiator's pending early return (after the closing `);` of the `if (session.status === 'pending' && isInitiator)` block), add:

```tsx
if (session.status === 'pending' && !isInitiator) {
  return (
    <View style={styles.pendingRowCard}>
      <View style={styles.pendingIconBox}>
        <Text style={styles.pendingIcon}>☕️</Text>
      </View>
      <View style={styles.pendingContent}>
        <View style={styles.pendingTitleRow}>
          <Text style={styles.pendingTitle}>Cowork Invite</Text>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        </View>
        <Text style={styles.pendingDate}>{scheduledLabel}</Text>
      </View>
      <View style={styles.inviteeActions}>
        <TouchableOpacity onPress={onAccept} style={styles.acceptBtn} activeOpacity={0.8}>
          <Text style={styles.acceptBtnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDecline} style={styles.declineBtn} activeOpacity={0.8}>
          <Text style={styles.declineBtnText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Step 2: Add the 5 new styles to the StyleSheet**

Add inside `StyleSheet.create({...})`, after the `pendingCancelText` style:

```tsx
inviteeActions: {
  flexDirection: 'column',
  gap: 4,
  flexShrink: 0,
},
acceptBtn: {
  backgroundColor: colors.primary,
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
  alignItems: 'center',
},
acceptBtnText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#FFFFFF',
},
declineBtn: {
  backgroundColor: colors.bgSecondary,
  paddingVertical: 5,
  paddingHorizontal: 12,
  borderRadius: 20,
  alignItems: 'center',
},
declineBtnText: {
  fontSize: 12,
  color: colors.textTertiary,
},
```

**Step 3: Verify TypeScript compiles cleanly**

```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit
```

Expected: 0 errors

**Step 4: Commit**

```bash
git add src/components/session/SessionRequestCard.tsx
git commit -m "feat: receiver pending invite card matches sender row layout"
```

---

### Task 2: Clean up now-unused pending invitee dead code

**Files:**
- Modify: `src/components/session/SessionRequestCard.tsx`

**Context:**
With the new invitee branch added, the general `return` at the bottom of the component now only runs for `declined`, `completed` states. The `renderActions()` helper only returns Accept/Decline buttons (for `pending` invitee) and `null` for everything else — it's now dead. The `renderDescription()` helper still returns useful text for `declined`/`completed`/`cancelled` states, so keep it. Check whether `renderActions()` is still called anywhere; if its only non-null path was the pending invitee state, remove it.

**Step 1: Remove `renderActions()` call and function**

In the general `return` JSX, remove the line:
```tsx
{renderActions()}
```

Then delete the entire `renderActions()` function (lines ~109–136).

**Step 2: Verify TypeScript compiles cleanly**

```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit
```

Expected: 0 errors

**Step 3: Commit**

```bash
git add src/components/session/SessionRequestCard.tsx
git commit -m "refactor: remove unused renderActions after invite card consistency fix"
```
