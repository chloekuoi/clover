# Profile Screen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign `ProfileScreen` to be the read-only "filled" version of `EditProfileScreen` — same vertical photo stack, same Hinge-style flat field rows, header with pencil icon, and a Today's Intent card.

**Architecture:** Full rewrite of `ProfileScreen.tsx` render tree and styles. Add `todayIntent` state fetched in parallel with profile. Inline a read-only photo stack (not reusing `PhotoSlots` which is tightly coupled to edit interactions). Mirror styles verbatim from `EditProfileScreen`.

**Tech Stack:** React Native, Expo SDK 54, `expo-image`, `react-native-safe-area-context`, Supabase via `discoveryService.getTodayIntent`.

---

## Task 1: Header with safe area + pencil icon

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

The current screen has no header — just a bare `ScrollView`. Replace the outer `ScrollView` with a `View` wrapper that holds a header row + a `ScrollView`.

**Step 1: Add imports**

At the top of `ProfileScreen.tsx`, add:
```ts
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```
Also add `Image` is already imported from `expo-image`. Keep all existing imports; just add the insets import.

**Step 2: Add insets hook inside the component**

```ts
const insets = useSafeAreaInsets();
```
Place it right after the `useNavigation` line.

**Step 3: Replace outer `<ScrollView>` with `<View>` + header + `<ScrollView>`**

Replace:
```tsx
return (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    ...
  </ScrollView>
);
```
With:
```tsx
return (
  <View style={styles.container}>
    {/* ── Header ── */}
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerSpacer} />
      <Text style={styles.headerTitle}>Profile</Text>
      <TouchableOpacity
        style={styles.headerAction}
        onPress={() => navigation.navigate('EditProfile')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.pencilIcon}>✏</Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* ... content goes here ... */}
    </ScrollView>
  </View>
);
```

**Step 4: Replace header-related styles, add new ones**

Remove `leadPhotoContainer`... wait, keep all content styles for now (they'll be replaced in later tasks). Just add header styles to the existing `StyleSheet.create({...})`:

```ts
// Add these:
header: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: spacing[4],
  minHeight: 56,
  backgroundColor: theme.surface,
  borderBottomWidth: 1,
  borderBottomColor: colors.borderDefault,
},
headerSpacer: {
  minWidth: 44,
},
headerTitle: {
  fontSize: 17,
  fontWeight: '600',
  color: theme.text,
},
headerAction: {
  minWidth: 44,
  alignItems: 'flex-end',
  justifyContent: 'center',
  minHeight: 44,
},
pencilIcon: {
  fontSize: 18,
  color: theme.textSecondary,
},
scroll: {
  flex: 1,
},
```

Also update `container` style to `flex: 1` (currently has no flex):
```ts
container: {
  flex: 1,
  backgroundColor: theme.background,
},
```

**Step 5: TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: no errors.

**Step 6: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: add profile screen header with pencil icon and safe area"
```

---

## Task 2: Read-only vertical photo stack

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

Replace the current `leadPhotoContainer` + `additionalPhotos` map with an inline read-only stack that mirrors `EditProfileScreen`'s photo card proportions.

**Step 1: Add the `PHOTO_PROMPTS` constant at the top of the file (outside the component)**

```ts
const PHOTO_PROMPTS = [
  "Hi, I'm a real person 👋",
  'Proof I touch grass sometimes',
  'What my camera roll actually looks like',
  'Currently building something...',
];
```

**Step 2: Remove `leadPhoto`, `additionalPhotos` derived values**

Delete these lines:
```ts
const leadPhoto = photos.find((photo) => photo.position === 0) || photos[0] || null;
const additionalPhotos = useMemo(
  () => photos.filter((photo) => !leadPhoto || photo.id !== leadPhoto.id),
  [leadPhoto, photos]
);
```

Replace with:
```ts
const filledPhotos = useMemo(
  () => [...photos].sort((a, b) => a.position - b.position),
  [photos]
);
```

**Step 3: Replace the photo rendering in the JSX**

Remove:
```tsx
<View style={styles.leadPhotoContainer}>...</View>
{additionalPhotos.map(...)}
```

Replace with:
```tsx
{/* ── Photo stack ── */}
<View style={styles.photoStack}>
  {filledPhotos.length === 0 ? (
    <View style={[styles.photoFrame, styles.primaryFrame, styles.initialsFrame]}>
      <Text style={styles.initialsText}>{initials}</Text>
    </View>
  ) : (
    filledPhotos.map((photo) => (
      <View key={photo.id} style={styles.photoBlock}>
        <View style={[styles.photoFrame, photo.position === 0 ? styles.primaryFrame : styles.secondaryFrame]}>
          <Image source={{ uri: photo.photo_url }} style={styles.photoImage} contentFit="cover" />
        </View>
        {PHOTO_PROMPTS[photo.position] ? (
          <Text style={styles.promptLabel}>{PHOTO_PROMPTS[photo.position]}</Text>
        ) : null}
      </View>
    ))
  )}
</View>
```

**Step 4: Add photo stack styles, remove old photo styles**

Remove: `leadPhotoContainer`, `leadPhoto`, `initialsContainer`, `nameOverlay`, `nameOverlayText`, `additionalPhoto`

Add:
```ts
photoStack: {
  gap: spacing[3],
  paddingHorizontal: spacing[4],
  paddingTop: spacing[4],
},
photoBlock: {
  gap: spacing[2],
},
photoFrame: {
  width: '100%',
  borderRadius: borderRadius.lg,
  overflow: 'hidden',
},
primaryFrame: {
  aspectRatio: 1.1,
},
secondaryFrame: {
  aspectRatio: 1.72,
},
photoImage: {
  width: '100%',
  height: '100%',
},
initialsFrame: {
  backgroundColor: colors.accentSubtle,
  alignItems: 'center',
  justifyContent: 'center',
},
initialsText: {
  fontSize: 72,
  fontWeight: '700',
  color: colors.textSecondary,
},
promptLabel: {
  fontSize: 13,
  fontWeight: '500',
  color: theme.textSecondary,
},
```

**Step 5: TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: no errors.

**Step 6: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: replace profile photo grid with read-only vertical stack"
```

---

## Task 3: Name + meta row

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

Replace the old `metaLine` text and `nameOverlay` (now removed) with a clean name + subtitle + work type pill below the photo stack.

**Step 1: Replace in JSX**

Remove:
```tsx
{locationLine ? <Text style={styles.metaLine}>{locationLine}</Text> : null}
{photos.length === 0 ? <TouchableOpacity ...migrationBanner.../> : null}
```

Replace with:
```tsx
{/* ── Name + meta ── */}
<View style={styles.nameBlock}>
  <Text style={styles.nameText}>{profileData?.name || 'Your Name'}</Text>
  <View style={styles.metaRow}>
    {locationLine ? <Text style={styles.metaText}>{locationLine}</Text> : null}
    {profileData?.work_type ? (
      <View style={styles.workTypePill}>
        <Text style={styles.workTypePillText}>{profileData.work_type}</Text>
      </View>
    ) : null}
  </View>
</View>
```

**Step 2: Add styles, remove old ones**

Remove: `metaLine`, `migrationBanner`, `migrationTitle`, `migrationCta`, `badge`, `badgeText`

Add:
```ts
nameBlock: {
  marginTop: spacing[4],
  marginHorizontal: spacing[4],
},
nameText: {
  fontSize: 28,
  fontWeight: '700',
  color: theme.text,
  letterSpacing: -0.3,
},
metaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: spacing[2],
  marginTop: spacing[1],
},
metaText: {
  fontSize: 15,
  color: theme.textSecondary,
  fontWeight: '500',
},
workTypePill: {
  backgroundColor: colors.accentPrimaryLight,
  paddingHorizontal: spacing[3],
  paddingVertical: 3,
  borderRadius: borderRadius.full,
},
workTypePillText: {
  fontSize: 12,
  color: colors.accentPrimary,
  fontWeight: '600',
},
```

**Step 3: TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: no errors.

**Step 4: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: add name and meta row to profile screen"
```

---

## Task 4: Today's Intent card

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

Add a new Today's Intent card that shows the user's current work intent (or a CTA to set one).

**Step 1: Add imports**
```ts
import { getTodayIntent } from '../../services/discoveryService';
import { WorkIntent } from '../../types';
```

**Step 2: Add state and fetch**

Inside the component, add:
```ts
const [todayIntent, setTodayIntent] = useState<WorkIntent | null>(null);
```

Update `loadProfile` to fetch intent in parallel:
```ts
const loadProfile = useCallback(async () => {
  if (!user) {
    setLoading(false);
    return;
  }

  setLoading(true);
  const [profileResult, intent] = await Promise.all([
    getFullProfile(user.id),
    getTodayIntent(user.id),
  ]);

  if (profileResult.error) {
    setError(profileResult.error);
    setProfileData(profile);
    setPhotos([]);
  } else {
    setError(null);
    setProfileData(profileResult.data.profile || profile);
    setPhotos(profileResult.data.photos);
  }
  setTodayIntent(intent);
  setLoading(false);
}, [profile, user]);
```

**Step 3: Add helper constants and function (outside component, top of file)**

```ts
const WORK_STYLE_EMOJI: Record<string, string> = {
  'Deep focus': '🎧',
  'Chat mode': '💬',
  'Flexible': '✌️',
};

const LOCATION_EMOJI: Record<string, string> = {
  'Cafe': '☕️',
  'Library': '📚',
  'Anywhere': '📍',
};

function formatDisplayTime(value: string): string {
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr);
  const minute = Number(minuteStr);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}
```

**Step 4: Add Intent card to JSX, after name block**

```tsx
{/* ── Today's Intent card ── */}
{todayIntent ? (
  <View style={styles.intentCard}>
    <View style={styles.intentCardHeader}>
      <Text style={styles.intentLabel}>TODAY'S FOCUS</Text>
      <View style={styles.intentDot} />
    </View>
    <Text style={styles.intentTask}>{todayIntent.task_description}</Text>
    <View style={styles.intentMeta}>
      <Text style={styles.intentMetaText}>
        {WORK_STYLE_EMOJI[todayIntent.work_style] ?? ''} {todayIntent.work_style}
      </Text>
      <Text style={styles.intentMetaDivider}>·</Text>
      <Text style={styles.intentMetaText}>
        {LOCATION_EMOJI[todayIntent.location_type] ?? ''} {todayIntent.location_type}
        {todayIntent.location_name ? ` · ${todayIntent.location_name}` : ''}
      </Text>
      <Text style={styles.intentMetaDivider}>·</Text>
      <Text style={styles.intentMetaText}>
        {formatDisplayTime(todayIntent.available_from)} – {formatDisplayTime(todayIntent.available_until)}
      </Text>
    </View>
  </View>
) : (
  <View style={[styles.intentCard, styles.intentCardEmpty]}>
    <Text style={styles.intentLabel}>TODAY'S FOCUS</Text>
    <Text style={styles.intentEmptyText}>Share what you're working on today</Text>
    <TouchableOpacity
      style={styles.intentCta}
      onPress={() => navigation.getParent()?.navigate('Discover' as never)}
      activeOpacity={0.8}
    >
      <Text style={styles.intentCtaText}>Set Today's Focus</Text>
    </TouchableOpacity>
  </View>
)}
```

**Step 5: Add intent card styles**

```ts
intentCard: {
  marginTop: spacing[4],
  marginHorizontal: spacing[4],
  backgroundColor: colors.accentPrimaryLight,
  borderRadius: borderRadius.xl,
  padding: spacing[4],
  borderWidth: 1,
  borderColor: '#D4E4D8',
},
intentCardEmpty: {
  backgroundColor: theme.surface,
  borderColor: colors.borderDefault,
},
intentCardHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: spacing[2],
},
intentLabel: {
  fontSize: 11,
  fontWeight: '600',
  color: colors.accentPrimary,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
},
intentDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: colors.accentPrimary,
},
intentTask: {
  fontSize: 17,
  fontWeight: '600',
  color: theme.text,
  lineHeight: 24,
  marginBottom: spacing[3],
},
intentMeta: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: spacing[2],
},
intentMetaText: {
  fontSize: 13,
  color: theme.textSecondary,
},
intentMetaDivider: {
  fontSize: 13,
  color: colors.textTertiary,
},
intentEmptyText: {
  fontSize: 15,
  color: theme.textSecondary,
  marginTop: spacing[1],
  marginBottom: spacing[3],
},
intentCta: {
  backgroundColor: colors.accentPrimary,
  borderRadius: borderRadius.md,
  paddingVertical: spacing[3],
  paddingHorizontal: spacing[4],
  alignSelf: 'flex-start',
  minHeight: 44,
  justifyContent: 'center',
},
intentCtaText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
},
```

**Step 6: TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: no errors.

**Step 7: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: add today's intent card to profile screen"
```

---

## Task 5: Flat read-only field rows

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

Replace the old `infoCard` with Hinge-style flat field rows that mirror `EditProfileScreen` exactly. Empty fields are hidden; empty groups are hidden.

**Step 1: Add birthday display helper (outside component)**

```ts
function formatBirthdayDisplay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
```

**Step 2: Add field group computed values inside the component**

```ts
const aboutYouRows = [
  { label: 'Name', value: profileData?.name },
  { label: 'Username', value: profileData?.username ? `@${profileData.username}` : null },
  { label: 'Tagline', value: profileData?.tagline },
  { label: 'Currently working on', value: profileData?.currently_working_on },
].filter((r): r is { label: string; value: string } => Boolean(r.value));

const workSchoolRows = [
  { label: 'Work', value: profileData?.work },
  { label: 'School', value: profileData?.school },
].filter((r): r is { label: string; value: string } => Boolean(r.value));

const locationRows = [
  { label: 'Neighbourhood', value: profileData?.neighborhood },
  { label: 'City', value: profileData?.city },
  {
    label: 'Birthday',
    value: profileData?.birthday ? formatBirthdayDisplay(profileData.birthday) : null,
  },
].filter((r): r is { label: string; value: string } => Boolean(r.value));

const workTypeRows = [
  { label: 'Work type', value: profileData?.work_type },
].filter((r): r is { label: string; value: string } => Boolean(r.value));
```

**Step 3: Add renderGroup helper (inside component, as a function or inline)**

```ts
const renderGroup = (rows: { label: string; value: string }[]) => {
  if (rows.length === 0) return null;
  return rows.map((row, index) => (
    <React.Fragment key={row.label}>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{row.label}</Text>
        <Text style={styles.fieldValue}>{row.value}</Text>
      </View>
      {index < rows.length - 1 ? <View style={styles.rowSep} /> : null}
    </React.Fragment>
  ));
};
```

**Step 4: Replace `infoCard` JSX with the fields area**

Remove the entire `<View style={styles.infoCard}>...</View>` block and the `{error ?...}` block.

Replace with:
```tsx
{/* ── Field rows ── */}
{(aboutYouRows.length > 0 || workSchoolRows.length > 0 || locationRows.length > 0 || workTypeRows.length > 0) ? (
  <View style={styles.fieldsArea}>
    {renderGroup(aboutYouRows)}

    {aboutYouRows.length > 0 && workSchoolRows.length > 0 ? <View style={styles.groupSep} /> : null}
    {renderGroup(workSchoolRows)}

    {workSchoolRows.length > 0 && locationRows.length > 0 ? <View style={styles.groupSep} /> : null}
    {renderGroup(locationRows)}

    {locationRows.length > 0 && workTypeRows.length > 0 ? <View style={styles.groupSep} /> : null}
    {renderGroup(workTypeRows)}
  </View>
) : null}
```

**Step 5: Add field styles (copied verbatim from EditProfileScreen)**

Remove: `infoCard`, `tagline`, `infoRow`, `infoLabel`, `infoValue`, `emptyInfoText`, `errorText`

Add:
```ts
fieldsArea: {
  backgroundColor: theme.surface,
  marginHorizontal: -spacing[4],
  paddingBottom: spacing[4],
  marginTop: spacing[3],
},
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
fieldValue: {
  fontSize: 14,
  color: theme.textSecondary,
},
rowSep: {
  height: 1,
  backgroundColor: colors.borderDefault,
  marginHorizontal: spacing[4],
},
groupSep: {
  height: 8,
  backgroundColor: colors.bgSecondary,
},
```

**Step 6: Fix content padding**

The `content` contentContainerStyle should have `paddingHorizontal: spacing[4]` — but `fieldsArea` uses `marginHorizontal: -spacing[4]` to break out. Make sure `content` has:
```ts
content: {
  paddingHorizontal: spacing[4],
  paddingBottom: spacing[12],
},
```

**Step 7: TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: no errors.

**Step 8: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: replace info card with hinge-style flat field rows on profile"
```

---

## Task 6: Sign out footer + empty profile nudge

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

Replace the current `editButton` + `signOutButton` with a small sign-out text link. Add an empty profile nudge card.

**Step 1: Remove the Edit Profile button JSX**

Delete:
```tsx
<TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
  <Text style={styles.editButtonText}>Edit Profile</Text>
</TouchableOpacity>
```

**Step 2: Replace Sign Out button with subtle text link**

Replace:
```tsx
<TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
  <Text style={styles.signOutText}>Sign Out</Text>
</TouchableOpacity>
```

With:
```tsx
<TouchableOpacity
  style={styles.signOutLink}
  onPress={handleSignOut}
  hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
>
  <Text style={styles.signOutLinkText}>Sign out</Text>
</TouchableOpacity>
```

**Step 3: Add empty profile nudge**

Add a computed value inside the component:
```ts
const isProfileEmpty =
  filledPhotos.length === 0 &&
  !profileData?.name &&
  !profileData?.tagline &&
  !profileData?.currently_working_on &&
  !profileData?.work &&
  !profileData?.school &&
  !profileData?.neighborhood &&
  !profileData?.city &&
  !profileData?.work_type;
```

After the photo stack (and before the name block), add:
```tsx
{isProfileEmpty ? (
  <View style={styles.nudgeCard}>
    <Text style={styles.nudgeTitle}>Your profile is blank</Text>
    <Text style={styles.nudgeBody}>
      Add a photo and a few details so co-workers know who they'll be meeting.
    </Text>
    <TouchableOpacity
      style={styles.nudgeCta}
      onPress={() => navigation.navigate('EditProfile')}
      activeOpacity={0.8}
    >
      <Text style={styles.nudgeCtaText}>Complete your profile</Text>
    </TouchableOpacity>
  </View>
) : null}
```

**Step 4: Add/replace styles**

Remove: `editButton`, `editButtonText`, `signOutButton`, `signOutText`

Add:
```ts
signOutLink: {
  alignSelf: 'center',
  marginTop: spacing[8],
  marginBottom: spacing[6],
},
signOutLinkText: {
  fontSize: 14,
  color: theme.textMuted,
  fontWeight: '400',
},
nudgeCard: {
  marginTop: spacing[4],
  marginHorizontal: spacing[4],
  backgroundColor: colors.accentSecondaryLight,
  borderRadius: borderRadius.xl,
  padding: spacing[5],
  borderWidth: 1,
  borderColor: colors.accentSecondary,
},
nudgeTitle: {
  fontSize: 17,
  fontWeight: '700',
  color: theme.text,
  marginBottom: spacing[2],
},
nudgeBody: {
  fontSize: 14,
  color: theme.textSecondary,
  lineHeight: 21,
  marginBottom: spacing[4],
},
nudgeCta: {
  backgroundColor: colors.accentPrimary,
  borderRadius: borderRadius.md,
  paddingVertical: spacing[3],
  paddingHorizontal: spacing[4],
  alignSelf: 'flex-start',
  minHeight: 44,
  justifyContent: 'center',
},
nudgeCtaText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#FFFFFF',
},
```

**Step 5: TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: no errors.

**Step 6: Commit**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "feat: add sign out footer and empty profile nudge card"
```

---

## Task 7: Final verification

**Step 1: Full TypeScript check**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npx tsc --noEmit 2>&1 | grep -v "npm notice"
```
Expected: zero errors.

**Step 2: Start app and verify manually**
```bash
cd /Users/chloe/Documents/Claude/cowork-connect && npm start
```

Open the Profile tab in the simulator and verify:
- [ ] Header shows "Profile" centered, pencil ✏ icon top-right
- [ ] Pencil tap → navigates to Edit Profile screen
- [ ] Photos render as vertical stack with prompts (or initials if none)
- [ ] Name shows large (28px bold), work type pill appears
- [ ] Today's Intent card: green if intent set, muted with CTA if not
- [ ] Field rows: only filled fields show, edge-to-edge white, group separators
- [ ] Sign out is a small muted text link at the bottom → tap shows confirmation alert
- [ ] Empty profile → nudge card appears above the name block

**Step 3: Final commit (if any straggling changes)**
```bash
git add src/screens/profile/ProfileScreen.tsx
git commit -m "fix: profile screen final polish"
```
