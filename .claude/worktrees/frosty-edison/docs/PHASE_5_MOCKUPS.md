# Phase 5: Friends & Polish + Profile Redesign — UI Mockups

**Created:** 2026-02-15
**Updated:** 2026-02-18
**Design System:** Digital Matcha

---

## 1. Profile Screen — Hinge-Style (Redesigned)

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │  System status bar
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │                                  │ │  Lead photo (~400px)
│ │                                  │ │  Full width (minus 32px margin)
│ │        [Lead Photo]              │ │  borderRadius: 16
│ │                                  │ │  contentFit: cover
│ │                                  │ │
│ │                                  │ │
│ │                                  │ │
│ │  Alex Chen                       │ │  Name overlaid, bottom-left
│ │                                  │ │  28px, w700, white
│ └──────────────────────────────────┘ │  textShadow: 0 1px 4px rgba(0,0,0,0.5)
│                                      │
│   27 · East Village · New York       │  16px, w400, #756C62
│                                      │  Age from birthday, neighborhood, city
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  Info Card
│ │  💼  Freelancer                  │ │  Work type pill
│ │                                  │ │
│ │  "Building cool things for       │ │  Tagline: 16px, italic, #756C62
│ │   remote workers"                │ │
│ │                                  │ │
│ │  CURRENTLY WORKING ON            │ │  12px, w500, #968D82, uppercase
│ │  A productivity app for          │ │  16px, w400, #2D3A2D
│ │  remote teams                    │ │
│ │                                  │ │
│ │  🏢  Acme Corp                   │ │  Work: 14px, w400, #756C62
│ │  🎓  Stanford                    │ │  School: 14px, w400, #756C62
│ │                                  │ │
│ └──────────────────────────────────┘ │  bg: #FFFFFF, border: 1px #E8DCD0
│                                      │  borderRadius: 16, padding: 20
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  Photo 2 (full width)
│ │        [Photo 2]                 │ │  borderRadius: 16
│ │                                  │ │  ~300px height
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  Photo 3 (full width)
│ │        [Photo 3]                 │ │  borderRadius: 16
│ │                                  │ │  ~300px height
│ └──────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Edit Profile           │  │  Secondary button, full width
│  └────────────────────────────────┘  │  #E8DCD0 bg, #2D3A2D text
│                                      │  16px, w600, borderRadius: 12
│  ┌────────────────────────────────┐  │
│  │         Sign Out               │  │  Ghost button, #B85C4D
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends ❶  Chat  Profile  │  4-tab bar
│    🔍       👥        💬     👤     │  Badge on Friends: #B85C4D
└──────────────────────────────────────┘
```

**No photos (migration banner):**
```
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  Banner card
│ │  📷 Add a photo so people know   │ │  bg: #FFFFFF
│ │     who they're meeting!         │ │  border: 1.5px #E8DCD0
│ │                                  │ │  borderRadius: 16, padding: 16
│ └──────────────────────────────────┘ │  Tappable → EditProfile
│                                      │
│ ┌──────────────────────────────────┐ │
│ │                                  │ │  Initials fallback (~400px)
│ │           A C                    │ │  bg: #E8E7E4
│ │                                  │ │  initials: 64px, w700, #6F8268
│ └──────────────────────────────────┘ │
│                                      │
│   Alex Chen                          │  Name below (not overlaid when
│                                      │  no photo)
```

---

## 2. Friends Screen — Empty State (Friends Tab)

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│             Friends             [+]  │  Header (no back button — tab root)
│                                      │  Title: 28px, w700, #1A1A1A
│                                      │  [+] 24px, #3F5443
│                                      │
│                                      │
│                                      │
│                                      │
│               👥                     │  48px emoji, centered
│                                      │
│        No friends yet                │  24px, w600, #1A1A1A
│                                      │
│    Match with people on Discover     │  16px, w400, #6B6B6B
│      or add them here!               │  centered, max-width 260px
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Add Friend             │  │  Primary button
│  │                                │  │  #3F5443 bg, white text
│  └────────────────────────────────┘  │  16px, w600, borderRadius 12
│                                      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │  4-tab bar
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 3. Friends Screen — Default State (Collapsed Sections)

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│             Friends             [+]  │
├──────────────────────────────────────┤
│                                      │
│  ▶ PENDING REQUESTS          🔴     │  Collapsed, red dot = has pending
│  ─────────────────────────────────── │  14px, w600, #9B9B9B, uppercase
│                                      │  Red dot: 8px, #B85C4D
│  ▼ AVAILABLE TODAY (2)               │  Expanded by default
│  ─────────────────────────────────── │
│  ┌────────────────────────────────┐  │
│  │ ┌────┐                        │  │
│  │ │    │  Jordan Kim            │  │  Name: 16px, w600, #1A1A1A
│  │ │ JK │  14:00–18:00 · Cafe   │  │  Intent: 14px, w400, #6B6B6B
│  │ └────┘                        │  │
│  ├──────────────────────── ──────┤  │  Separator inset 80px
│  │ ┌────┐                        │  │
│  │ │ 📷 │  Riley Johnson         │  │  Has photo_url
│  │ │    │  09:00–13:00 · Blue... │  │
│  │ └────┘                        │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▶ NOT AVAILABLE (2)                 │  Collapsed by default
│  ─────────────────────────────────── │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 3b. Friends Screen — All Sections Expanded

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│             Friends             [+]  │
├──────────────────────────────────────┤
│                                      │
│  ▼ PENDING REQUESTS (2)             │  Expanded (user tapped header)
│  ─────────────────────────────────── │
│  ┌────────────────────────────────┐  │
│  │ ┌────┐                        │  │
│  │ │ SC │  Sam Chen              │  │  Name: 16px, w600, #1A1A1A
│  │ │    │  @samchen              │  │  Username: 14px, w400, #6B6B6B
│  │ └────┘                        │  │
│  │         ┌────────┐ ┌────────┐ │  │
│  │         │ Accept │ │Decline │ │  │  Accept: #3F5443 bg, white
│  │         └────────┘ └────────┘ │  │  Decline: ghost, #B85C4D
│  ├────────────────────────────────┤  │  Separator: #E4E3E0
│  │ ┌────┐                        │  │
│  │ │ ML │  Morgan Lee            │  │
│  │ │    │  @morganlee            │  │
│  │ └────┘                        │  │
│  │         ┌────────┐ ┌────────┐ │  │
│  │         │ Accept │ │Decline │ │  │
│  │         └────────┘ └────────┘ │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▼ AVAILABLE TODAY (2)               │
│  ─────────────────────────────────── │
│  ┌────────────────────────────────┐  │
│  │ ┌────┐                        │  │
│  │ │ JK │  Jordan Kim            │  │  Name: 16px, w600, #1A1A1A
│  │ │    │  14:00–18:00 · Cafe    │  │  Intent: 14px, w400, #6B6B6B
│  │ └────┘                        │  │  time window + location
│  ├──────────────────────── ──────┤  │
│  │ ┌────┐                        │  │
│  │ │ 📷 │  Riley Johnson         │  │
│  │ │    │  09:00–13:00 · Blue... │  │
│  │ └────┘                        │  │
│  └────────────────────────────────┘  │
│                                      │
│  ▼ NOT AVAILABLE (2)                 │  Expanded (user tapped header)
│  ─────────────────────────────────── │
│  ┌────────────────────────────────┐  │
│  │ ┌────┐                        │  │
│  │ │ TP │  Taylor Park           │  │  Name only, no subtitle
│  │ └────┘                        │  │
│  ├──────────────────────── ──────┤  │
│  │ ┌────┐                        │  │
│  │ │ CW │  Casey Williams        │  │  Name only, no subtitle
│  │ └────┘                        │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 4. Friends Screen — Pending Only (No Accepted Friends Yet)

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│             Friends             [+]  │
├──────────────────────────────────────┤
│                                      │
│  ▶ PENDING REQUESTS          🔴     │  Collapsed, red dot
│  ─────────────────────────────────── │
│                                      │
│  ▼ AVAILABLE TODAY (0)               │  Expanded but empty
│  ─────────────────────────────────── │
│                                      │
│         No friends yet.              │  16px, w400, #6B6B6B
│   Accept requests or add friends     │  centered
│         to get started!              │
│                                      │
│  ▶ NOT AVAILABLE (0)                 │  Collapsed
│  ─────────────────────────────────── │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 5. Friends Screen — Loading State

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│             Friends             [+]  │
├──────────────────────────────────────┤
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│              ◌                       │  ActivityIndicator
│       Loading friends...             │  #3F5443 spinner
│                                      │  16px, w400, #6B6B6B
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 6. Add Friend Screen — Initial State

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│  ← Back       Add Friend            │  Header
│                                      │  Title: 28px, w700, #1A1A1A
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔍  Search by username,       │  │  Pill shape input
│  │     email, or phone           │  │  bg: #EEEDEA
│  └────────────────────────────────┘  │  borderRadius: 24px
│                                      │  placeholder: 16px, #9B9B9B
│                                      │
│                                      │
│                                      │
│               🔍                     │  40px emoji, centered
│                                      │
│     Search for friends by their      │  16px, w400, #6B6B6B
│     username, email address,         │  centered, max-width 240px
│     or phone number                  │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 7. Add Friend Screen — Searching (Loading)

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│  ← Back       Add Friend            │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔍  alex@gmai              ✕  │  │  Active input with text
│  └────────────────────────────────┘  │  ✕ clear button
│                                      │
│             ◌ Searching...           │  ActivityIndicator + text
│                                      │  16px, w400, #9B9B9B
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 8. Add Friend Screen — Results

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│  ← Back       Add Friend            │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔍  alex                   ✕  │  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ ┌──────┐                      │  │
│  │ │      │ Alex Chen    ┌─────┐ │  │  Name: 16px, w600, #1A1A1A
│  │ │  AC  │ @alexchen    │ Add │ │  │  Username: 13px, w400, #9B9B9B
│  │ │      │              └─────┘ │  │  Button: #3F5443 bg, white
│  │ └──────┘                      │  │  13px, w600
│  ├─────────────────────── ───────┤  │
│  │ ┌──────┐              ┌─────┐ │  │
│  │ │      │ Alex Park    │Requ-│ │  │
│  │ │  AP  │ @alexpark    │ested│ │  │  "Requested": #E4E3E0 bg
│  │ │      │              └─────┘ │  │  #9B9B9B text, disabled
│  │ └──────┘                      │  │
│  ├─────────────────────── ───────┤  │
│  │ ┌──────┐             ┌──────┐ │  │
│  │ │      │ Alex Kim    │Accept│ │  │
│  │ │  📷  │ @alexkim    │      │ │  │  "Accept": #3F5443 bg
│  │ │      │             └──────┘ │  │  (pending request from them)
│  │ └──────┘                      │  │
│  ├─────────────────────── ───────┤  │
│  │ ┌──────┐            ┌───────┐ │  │
│  │ │      │ Alex Wu    │Friends│ │  │
│  │ │  AW  │ @alexwu    │  ✓   │ │  │  "Friends ✓": #3F5443 text
│  │ │      │            └───────┘ │  │  no bg, disabled
│  │ └──────┘                      │  │
│  └────────────────────────────────┘  │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 9. Add Friend Screen — No Results

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│  ← Back       Add Friend            │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 🔍  xyznonexistent         ✕  │  │
│  └────────────────────────────────┘  │
│                                      │
│                                      │
│                                      │
│               😕                     │  40px emoji, centered
│                                      │
│         No users found               │  24px, w600, #1A1A1A
│                                      │
│    Try a different username,         │  16px, w400, #6B6B6B
│    email, or phone number            │  centered
│                                      │
│                                      │
│                                      │
│                                      │
├──────────────────────────────────────┤
│ Discover  Friends    Chat   Profile  │
│    🔍       👥        💬     👤     │
└──────────────────────────────────────┘
```

---

## 10. Edit Profile Screen

```
┌──────────────────────────────────────┐
│ ░░░░░░░░░░ STATUS BAR ░░░░░░░░░░░░░ │
├──────────────────────────────────────┤
│  Cancel                       Save   │  Cancel: 16px, w500, #756C62
│                                      │  Save: 16px, w600, #A8B5A2
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ┌──────────────────────────────┐ │ │  PhotoSlots grid
│ │ │                              │ │ │
│ │ │    Primary Photo (pos 0)     │ │ │  ~160px, borderRadius 12
│ │ │                              │ │ │  or dashed border + prompt
│ │ └──────────────────────────────┘ │ │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──┐ │ │  4 smaller slots (~80px)
│ │ │  1   │ │  2   │ │  3   │ │4 │ │ │  borderRadius 8
│ │ └──────┘ └──────┘ └──────┘ └──┘ │ │
│ └──────────────────────────────────┘ │
│                                      │
│  Name                                │  Label: 14px, w600, #2D3A2D
│  ┌────────────────────────────────┐  │
│  │ Alex Chen                     │  │  Input: bg #EEEDEA, 16px
│  └────────────────────────────────┘  │  borderRadius 12, padding 12h 10v
│                                      │
│  Tagline                             │
│  ┌────────────────────────────────┐  │
│  │ Building cool things          │  │
│  └────────────────────────────────┘  │
│                                      │
│  Currently Working On                │
│  ┌────────────────────────────────┐  │
│  │ A productivity app            │  │
│  └────────────────────────────────┘  │
│                                      │
│  Work                                │
│  ┌────────────────────────────────┐  │
│  │ Acme Corp                     │  │
│  └────────────────────────────────┘  │
│                                      │
│  School                              │
│  ┌────────────────────────────────┐  │
│  │ Stanford                      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Birthday                            │
│  ┌────────────────────────────────┐  │
│  │ 📅  January 15, 1999         │  │  Date picker
│  └────────────────────────────────┘  │
│                                      │
│  Neighborhood                        │
│  ┌────────────────────────────────┐  │
│  │ East Village                  │  │
│  └────────────────────────────────┘  │
│                                      │
│  City                                │
│  ┌────────────────────────────────┐  │
│  │ New York                      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Work Type                           │
│  ┌───────────┐ ┌──────────┐         │  Selected: #A8B5A2 bg, white
│  │Freelancer │ │ Remote   │         │  Unselected: white bg, #E8DCD0
│  └───────────┘ └──────────┘         │  border
│  ┌──────────┐ ┌──────────┐          │
│  │ Founder  │ │ Student  │          │
│  └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐          │
│  │ Hybrid   │ │  Other   │          │
│  └──────────┘ └──────────┘          │
│                                      │
└──────────────────────────────────────┘
```

---

## 11. Component Detail — Action Button States

```
┌───────────────────────────────────────────────────────┐
│  SEARCH RESULT ACTION BUTTONS                         │
│                                                       │
│  ┌─────────┐  "Add"        bg: #3F5443                │
│  │   Add   │               text: #FFFFFF, w600        │
│  └─────────┘               tappable                   │
│                                                       │
│  ┌───────────┐  "Requested" bg: #E4E3E0               │
│  │ Requested │              text: #9B9B9B, w600       │
│  └───────────┘              disabled, opacity 0.8     │
│                                                       │
│  ┌──────────┐  "Accept"    bg: #3F5443                │
│  │  Accept  │              text: #FFFFFF, w600        │
│  └──────────┘              tappable                   │
│                                                       │
│  ┌───────────┐  "Friends"  bg: transparent            │
│  │ Friends ✓ │             text: #3F5443, w600        │
│  └───────────┘             disabled                   │
│                                                       │
│  ┌───────────┐  "Declined" bg: #E4E3E0                │
│  │ Declined  │             text: #9B9B9B, w600        │
│  └───────────┘             disabled, opacity 0.8      │
│                                                       │
│  All buttons: h32, px10, borderRadius 8, font 13px   │
│  Min width: 80px                                      │
└───────────────────────────────────────────────────────┘
```

---

## 12. Component Detail — FriendRequestCard

```
┌───────────────────────────────────────────────────────┐
│  FRIEND REQUEST CARD                                  │
│                                                       │
│  Row height: 72px                                     │
│  Padding: 16px horizontal                             │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │ ┌────┐                                        │   │
│  │ │    │  Sam Chen              48x48px photo    │   │
│  │ │ SC │  @samchen              borderRadius 24  │   │
│  │ │    │                        initials: 18px   │   │
│  │ └────┘                        w600, #3F5443    │   │
│  │                                                │   │
│  │          ┌────────┐  ┌────────┐               │   │
│  │          │ Accept │  │Decline │  8px gap       │   │
│  │          └────────┘  └────────┘               │   │
│  │                                                │   │
│  │  Accept: #3F5443 bg, white text               │   │
│  │          h36, px12, 14px w600, borderRadius 10 │   │
│  │                                                │   │
│  │  Decline: transparent bg, #B85C4D text         │   │
│  │           h36, px12, 14px w500                 │   │
│  └────────────────────────────────────────────────┘   │
│  ─────────────────────────────────────────────────    │
│  Separator: 1px, #E4E3E0, full width                 │
└───────────────────────────────────────────────────────┘
```

---

## 13. Component Detail — FriendCard

```
┌───────────────────────────────────────────────────────┐
│  FRIEND CARD — AVAILABLE (variant: 'available')       │
│                                                       │
│  Row height: 64px                                     │
│  Padding: 16px horizontal                             │
│  Touchable: opacity reduction on press                │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │ ┌────┐                                         │   │
│  │ │    │  Jordan Kim                             │   │
│  │ │ JK │  14:00–18:00 · Blue Bottle Coffee      │   │
│  │ │    │                                         │   │
│  │ └────┘  Name: 16px, w600, #1A1A1A             │   │
│  │         Intent: 14px, w400, #6B6B6B            │   │
│  │         Format: "HH:MM–HH:MM · location"      │   │
│  │         numberOfLines={1}                      │   │
│  └────────────────────────────────────────────────┘   │
│  ──────────────────────────────────────────── ────    │
│  Separator: 1px, #E4E3E0, left inset 80px            │
│                                                       │
│  FRIEND CARD — SIMPLE (variant: 'simple')             │
│                                                       │
│  Row height: 56px                                     │
│  Padding: 16px horizontal                             │
│                                                       │
│  ┌────────────────────────────────────────────────┐   │
│  │ ┌────┐                                         │   │
│  │ │    │  Taylor Park                            │   │
│  │ │ TP │                                         │   │
│  │ │    │                                         │   │
│  │ └────┘  Name: 16px, w600, #1A1A1A             │   │
│  │         No subtitle                            │   │
│  └────────────────────────────────────────────────┘   │
│                                                       │
│  Section headers are collapsible:                     │
│  ▶ Collapsed  /  ▼ Expanded                          │
│  Chevron: 14px, #9B9B9B                              │
│  Title: 14px, w600, #9B9B9B, uppercase               │
│  Pending header: red dot (8px, #B85C4D) when count>0 │
└───────────────────────────────────────────────────────┘
```

---

## 14. Tab Bar — Badge on Friends Tab

```
┌──────────────────────────────────────┐
│                                      │
│ ┌────────┬────────┬────────┬───────┐ │
│ │        │   ❷   │        │       │ │  Badge: 16px circle
│ │   🔍   │  👥   │   💬   │  👤  │ │  bg: #B85C4D
│ │Discover│Friends │  Chat  │Profile│ │  text: white, 11px, w700
│ │        │        │        │       │ │  positioned top-right
│ └────────┴────────┴────────┴───────┘ │  of Friends tab icon
│                                      │
└──────────────────────────────────────┘

Badge visible:    ❷  (pending friend request count > 0)
Badge hidden:     👥  (pending count = 0)
```

---

## 15. Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      MainTabs (4 Tabs)                   │
│                                                          │
│  ┌───────────┐  ┌───────────┐  ┌─────────┐  ┌────────┐ │
│  │ Discover  │  │ Friends   │  │  Chat   │  │Profile │ │
│  │ Tab       │  │ Tab  ❷   │  │  Tab    │  │ Tab    │ │
│  └─────┬─────┘  └─────┬─────┘  └────┬────┘  └───┬────┘ │
│        │              │              │            │      │
│        ▼              ▼              ▼            ▼      │
│  DiscoverStack   FriendsStack   ChatStack    ProfileStack│
│                                                          │
└─────────────────────────────────────────────────────────┘

FriendsStack:

┌──────────────┐
│  Friends      │  (Tab root — no back button)
│  Screen       │
│               │
│ [+] ──────────┼──→ ┌──────────────┐
│               │    │  Add Friend   │
│               │    │  Screen       │
│               │    │               │
│ [Accept]→ RPC │    │ [Add] → RPC  │
│ [Decline]→RPC │    │ [Accept]→RPC │
│               │    │               │
│ [Tap Friend]──┼──→ Cross-tab nav  │    │  ← Back      │
│               │    to Chat tab    └──────┬───────┘
│               │    → Chat screen          │
└──────────────┘                    Back to Friends

ProfileStack:

┌──────────────┐
│  Profile      │  (Tab root — no back button)
│  Screen       │
│               │
│ [Edit Profile]┼──→ ┌──────────────┐
│               │    │ EditProfile   │
│ [Sign Out]    │    │  Screen       │
│               │    │               │
│               │    │ [Save] → RPC │
│               │    │ [Cancel]      │
│               │    │  ← Back      │
│               │    └──────┬───────┘
└──────────────┘            │
                     Back to Profile
```

---

## Color Reference (Phase 5)

| Token | Hex | Usage in Phase 5 |
|-------|-----|-------------------|
| `#3F5443` | Sage primary | Accept button bg, Add button bg, "+" icon, spinner |
| `#3F5443` | Accent | Back arrow |
| `#1A1A1A` | Text primary | Names, titles, headings |
| `#6B6B6B` | Text secondary | Usernames, subtitles, friend counts |
| `#9B9B9B` | Text muted | Section headers, placeholders, "Not available" |
| `#9B9B9B` | Placeholder | Empty input placeholders |
| `#E8E7E4` | Initials bg | Avatar fallback background |
| `#3F5443` | Initials text | Avatar initials text |
| `#3F5443` | Success green | Availability dot |
| `#B85C4D` | Error red | Decline button text, Friends tab badge |
| `#E4E3E0` | Border | Separators, disabled button bg |
| `#EEEDEA` | Input bg | Search input background |
| `#F5F4F1` | App bg | Screen backgrounds |
| `#FFFFFF` | Surface | Cards, button text on primary |
