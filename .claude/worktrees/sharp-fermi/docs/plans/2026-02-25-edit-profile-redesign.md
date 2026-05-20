# Edit Profile Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign EditProfileScreen to match the approved Hinge-style mockup — vertical photo stack with personality-driven prompts, and flat edge-to-edge field rows replacing the current bordered-input form.

**Architecture:** Two files change. `PhotoSlots.tsx` gains a `layout="stack"` prop and `promptSubtitles` prop that renders full-width vertical cards instead of the side-by-side grid. `EditProfileScreen.tsx` is restyled to use flat Hinge-style rows with inline TextInputs, a work-type ActionSheet, and updated photo prompts.

**Tech Stack:** React Native, StyleSheet.create, Alert.alert (ActionSheet for work type), existing design tokens (colors, spacing, borderRadius, theme)

---

## Approved Design (reference mockup)
`docs/mockups/edit-profile-combo.html`

Key decisions already locked:
- Photo stack: full-width vertical cards (primary tall, secondary shorter)
- Photo prompts: 4 personality-driven prompts with subtitles (see Task 1)
- Field rows: bold label top line + plain-text value/input below, no box borders
- No section header labels — group breaks only (8px warm-gray band)
- Work type: single tappable row → ActionSheet (replaces pill grid)
- Birthday: tappable row styled like other rows (unchanged logic)
- White background for fields area, warm off-white for photo area

---

## Task 1: Update photo prompts constant

**Files:**
- Modify: `src/screens/profile/EditProfileScreen.tsx` (lines 32–38)

**Step 1: Replace PHOTO_PROMPTS and add PHOTO_SUBTITLES**

Replace the existing constants block:
```tsx
const PHOTO_PROMPTS = [
  "Hi, I'm a real person 👋",
  'Proof I touch grass sometimes',
  'What my camera roll actually looks like',
  'Currently building something...',
  "A photo that shows your vibe",
];

const PHOTO_SUBTITLES = [
  'Not a stock photo, promise',
  'Hobbies, activities, general humanness',
  'Candid is an understatement',
  'Still figuring it out, send help',
  '',
];
```

**Step 2: Commit**
```bash
git add src/screens/profile/EditProfileScreen.tsx
git commit -m "feat: update photo prompts to personality-driven copy"
```

---

## Task 2: Extend PhotoSlots with stack layout + subtitles

**Files:**
- Modify: `src/components/profile/PhotoSlots.tsx`

**Step 1: Update props type**

Replace the existing `PhotoSlotsProps` type:
```tsx
type PhotoSlotsProps = {
  photos: PhotoSlotItem[];
  totalSlots?: number;
  onAddPhoto: (position: number) => void;
  onRemovePhoto?: (position: number) => void;
  onSetPrimary?: (position: number) => void;
  prompts?: string[];
  promptSubtitles?: string[];        // ← new: subtitle text per slot
  layout?: 'grid' | 'stack';         // ← new: 'grid' (default) or 'stack'
  editable?: boolean;
};
```

**Step 2: Update the component signature**

```tsx
export default function PhotoSlots({
  photos,
  totalSlots = 5,
  onAddPhoto,
  onRemovePhoto,
  onSetPrimary,
  prompts,
  promptSubtitles,
  layout = 'grid',
  editable = true,
}: PhotoSlotsProps) {
```

**Step 3: Add stack slot renderer (inside the component, before the return)**

Add this after the existing `renderSlot` function:

```tsx
const renderStackSlot = (position: number) => {
  const photo = photosByPosition.get(position);
  const slotPrompt = promptFor(prompts, position);
  const subtitle = promptSubtitles?.[position];
  const isPrimary = position === 0;

  const handlePress = () => {
    if (!editable) return;
    if (photo) {
      if (position !== 0 && onSetPrimary) { onSetPrimary(position); return; }
      if (onRemovePhoto) { onRemovePhoto(position); return; }
    }
    onAddPhoto(position);
  };

  return (
    <TouchableOpacity
      key={position}
      style={[styles.stackSlot, isPrimary ? styles.stackPrimary : styles.stackSecondary]}
      onPress={handlePress}
      disabled={!editable}
      activeOpacity={0.85}
    >
      {photo ? (
        <>
          <Image source={{ uri: photo.photo_url }} style={styles.photo} contentFit="cover" />
          {isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary ✓</Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>✏️  Edit</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyStackSlot}>
          <Text style={styles.stackPrompt}>{slotPrompt}</Text>
          {!!subtitle && <Text style={styles.stackSubtitle}>{subtitle}</Text>}
          <View style={styles.stackAddBtn}>
            <Text style={styles.stackAddBtnText}>+</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

**Step 4: Add stack layout branch to return**

Replace the existing `return (...)` with:

```tsx
  const secondaryPositions = Array.from({ length: Math.max(0, clampedSlots - 1) }, (_, i) => i + 1);

  // Stack layout: full-width vertical cards
  if (layout === 'stack') {
    const allPositions = Array.from({ length: clampedSlots }, (_, i) => i);
    return (
      <View style={styles.stackContainer}>
        {allPositions.map((position) => renderStackSlot(position))}
      </View>
    );
  }

  // Grid layout (original)
  return (
    <View style={styles.container}>
      {renderSlot(0, true)}
      <View style={styles.secondaryGrid}>
        {secondaryPositions.map((position) => renderSlot(position, false))}
      </View>
    </View>
  );
```

**Step 5: Add new styles to StyleSheet.create**

Append to the existing styles object:

```tsx
  // ── Stack layout ──
  stackContainer: {
    gap: spacing[3],
  },
  stackSlot: {
    width: '100%',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
  },
  stackPrimary: {
    aspectRatio: 1.1,   // slightly wider than tall — ~312px tall on 343px screen
  },
  stackSecondary: {
    aspectRatio: 1.72,  // landscape — ~200px tall on 343px screen
  },
  emptyStackSlot: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDefault,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[5],
    gap: spacing[2],
    backgroundColor: colors.bgCard,
  },
  stackPrompt: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  stackSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 17,
  },
  stackAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[1],
  },
  stackAddBtnText: {
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '300',
    color: theme.primary,
  },
  primaryBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 4,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editBadge: {
    position: 'absolute',
    bottom: spacing[3],
    right: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[3],
    paddingVertical: 5,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
  },
```

**Step 6: Verify the file compiles (no TS errors)**
```bash
npx tsc --noEmit 2>&1 | grep PhotoSlots
```
Expected: no output (no errors)

**Step 7: Commit**
```bash
git add src/components/profile/PhotoSlots.tsx
git commit -m "feat: add stack layout and subtitle support to PhotoSlots"
```

---

## Task 3: Redesign EditProfileScreen — photo section

**Files:**
- Modify: `src/screens/profile/EditProfileScreen.tsx`

**Step 1: Update PhotoSlots usage in JSX**

Find the `<PhotoSlots .../>` call and update it:

```tsx
<PhotoSlots
  photos={photos}
  totalSlots={5}
  onAddPhoto={onPhotoSlotAdd}
  onRemovePhoto={onPhotoSlotRemove}
  onSetPrimary={onPhotoSlotSetPrimary}
  prompts={PHOTO_PROMPTS}
  promptSubtitles={PHOTO_SUBTITLES}
  layout="stack"
  editable={!saving && !photoBusy}
/>
```

**Step 2: Verify photos section visually**
```bash
npm run ios
```
Navigate to Profile → Edit Profile. Confirm photo stack renders as full-width vertical cards.

**Step 3: Commit**
```bash
git add src/screens/profile/EditProfileScreen.tsx
git commit -m "feat: switch edit profile to vertical photo stack layout"
```

---

## Task 4: Redesign EditProfileScreen — field rows

**Files:**
- Modify: `src/screens/profile/EditProfileScreen.tsx`

**Step 1: Replace work type pills with ActionSheet handler**

Add this handler inside the component (near other handlers):

```tsx
const handleWorkTypePress = useCallback(() => {
  if (saving || photoBusy) return;
  Alert.alert('Work type', 'Select your work type', [
    ...WORK_TYPES.map((type) => ({
      text: type,
      onPress: () => setForm((prev) => ({ ...prev, work_type: type })),
    })),
    { text: 'Cancel', style: 'cancel' as const },
  ]);
}, [saving, photoBusy]);
```

**Step 2: Replace the entire ScrollView content (below PhotoSlots) with Hinge-style flat rows**

Replace everything from `<View style={styles.section}>` through the closing `</ScrollView>` with:

```tsx
        {/* ── Fields: white area with flat rows ── */}
        <View style={styles.fieldsArea}>

          {/* Group 1: About you */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.name}
              onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
              placeholder="Your name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.username}
              onChangeText={(text) => setForm((prev) => ({ ...prev, username: normalizeUsername(text) }))}
              placeholder="@handle"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Tagline</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.tagline}
              onChangeText={(text) => setForm((prev) => ({ ...prev, tagline: text }))}
              placeholder="One-line intro"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Currently working on</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.currently_working_on}
              onChangeText={(text) => setForm((prev) => ({ ...prev, currently_working_on: text }))}
              placeholder="What are you building?"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Group break */}
          <View style={styles.groupSep} />

          {/* Group 2: Work & School */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Work</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.work}
              onChangeText={(text) => setForm((prev) => ({ ...prev, work: text }))}
              placeholder="Company"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>School</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.school}
              onChangeText={(text) => setForm((prev) => ({ ...prev, school: text }))}
              placeholder="School"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Group break */}
          <View style={styles.groupSep} />

          {/* Group 3: Location */}
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Neighbourhood</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.neighborhood}
              onChangeText={(text) => setForm((prev) => ({ ...prev, neighborhood: text }))}
              placeholder="Your area"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.fieldInput}
              value={form.city}
              onChangeText={(text) => setForm((prev) => ({ ...prev, city: text }))}
              placeholder="Your city"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
          <View style={styles.rowSep} />

          {/* Birthday — tappable row */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={() => setShowBirthdayPicker(true)}
            disabled={saving || photoBusy}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Birthday</Text>
            <View style={styles.fieldRowRight}>
              <Text style={[styles.fieldValue, form.birthday ? styles.fieldValueFilled : null]}>
                {formatDateLabel(form.birthday)}
              </Text>
              <Text style={styles.rowChevron}>›</Text>
            </View>
          </TouchableOpacity>

          {showBirthdayPicker && (
            <DateTimePicker
              value={birthdayDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={handleBirthdayChange}
            />
          )}

          {/* Group break */}
          <View style={styles.groupSep} />

          {/* Group 4: Work type — ActionSheet row */}
          <TouchableOpacity
            style={styles.fieldRow}
            onPress={handleWorkTypePress}
            disabled={saving || photoBusy}
            activeOpacity={0.7}
          >
            <Text style={styles.fieldLabel}>Work type</Text>
            <View style={styles.fieldRowRight}>
              <Text style={[styles.fieldValue, form.work_type ? styles.fieldValueFilled : null]}>
                {form.work_type || 'Select type'}
              </Text>
              <Text style={styles.rowChevronDown}>▾</Text>
            </View>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
```

**Step 3: Replace the entire StyleSheet.create block**

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },

  // ── Header ──
  header: {
    minHeight: 56,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: theme.surface,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.text,
  },
  headerButton: {
    fontSize: 16,
    color: theme.textSecondary,
    minWidth: 64,
  },
  saveButton: {
    textAlign: 'right',
    color: theme.primary,
    fontWeight: '600',
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[12],
    gap: spacing[3],
  },

  // ── Fields white area ──
  fieldsArea: {
    backgroundColor: theme.surface,
    marginHorizontal: -spacing[4],  // bleed to screen edges
    paddingBottom: spacing[4],
  },

  // ── Field row ──
  fieldRow: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    minHeight: 56,
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: 14,
    color: theme.textSecondary,
    padding: 0,              // remove default TextInput padding
    margin: 0,
  },

  // ── Tappable row right side (birthday, work type) ──
  fieldRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fieldValue: {
    fontSize: 14,
    color: colors.textTertiary,   // placeholder state
    flex: 1,
  },
  fieldValueFilled: {
    color: theme.textSecondary,   // filled state
  },
  rowChevron: {
    fontSize: 16,
    color: colors.borderDefault,
  },
  rowChevronDown: {
    fontSize: 14,
    color: colors.borderDefault,
  },

  // ── Separators ──
  rowSep: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginHorizontal: spacing[4],
  },
  groupSep: {
    height: 8,
    backgroundColor: colors.bgSecondary,
  },
});
```

**Step 4: Verify TypeScript compiles cleanly**
```bash
npx tsc --noEmit 2>&1 | grep EditProfile
```
Expected: no output

**Step 5: Run on simulator and verify**
```bash
npm run ios
```
Check:
- [ ] Photo stack renders full-width vertical cards with personality prompts
- [ ] Field rows show bold label + plain text input below, no box borders
- [ ] Group breaks (8px gray band) appear between About / Work & School / Location / Work type
- [ ] Birthday row taps to open date picker
- [ ] Work type row taps to open ActionSheet with 6 options
- [ ] Selecting work type updates the row value
- [ ] Save still works correctly

**Step 6: Commit**
```bash
git add src/screens/profile/EditProfileScreen.tsx
git commit -m "feat: redesign edit profile with hinge-style flat rows and stack photos"
```

---

## Task 5: Write design doc

**Step 1: Save final design to docs**
```bash
# Already saved as docs/plans/2026-02-25-edit-profile-redesign.md (this file)
```

**Step 2: Final commit**
```bash
git add docs/plans/2026-02-25-edit-profile-redesign.md
git commit -m "docs: add edit profile redesign implementation plan"
```

---

## Notes

- No unit tests needed — this is pure UI restructure with zero logic changes. Manual visual testing is the verification.
- `helperText` under username is removed (no place for it in flat-row design). Username validation still runs on save.
- `borderRadius`, `section`, `label`, `input`, `dateButton`, `dateButtonText`, `pillsRow`, `pill`, `pillSelected`, `pillText`, `pillTextSelected` styles are all removed — they are fully replaced.
- The `WORK_TYPES` constant stays unchanged (still used by ActionSheet).
