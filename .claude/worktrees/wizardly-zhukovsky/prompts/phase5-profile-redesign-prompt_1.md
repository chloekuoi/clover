# Claude Code Planning Prompt — Phase 5 Profile Redesign

Please plan (do NOT execute yet) the following changes to our coworking app's Profile system. This is part of Phase 5: Friends & Polish. Our design system is "Digital Matcha" — warm neutrals (#F5F4F1 app bg), forest green primary (#3F5443), with a café-inspired, low-pressure aesthetic.

## Context
This is a social coworking app (think: find people to work alongside at cafés). It is NOT a dating app. The profile serves two purposes: (1) help people decide who to cowork with, and (2) give enough visual/personal info that people feel comfortable meeting in real life.

## Requirements

### 1. Photo System (Required)
- Users must upload 3–5 photos (3 minimum required, 2 optional)
- Photos are about comfort and safety — knowing what someone looks like before meeting IRL — NOT about attraction
- Include subtle placeholder prompts to guide photo selection (e.g., "A clear photo of your face", "A photo of you working", "A photo that shows your vibe")
- Primary photo replaces the current 80px initials avatar on the profile screen and Discover cards
- Additional photos viewable when tapping into a full profile view
- On the user's own profile screen: show lead photo prominently at top, with a scrollable thumbnail row of other photos below it

### 2. Profile Content (Keep It Simple)
- Add a "Currently working on" field — single line, casual tone (NOT a project portfolio)
- Add a short bio/tagline field (1-2 sentences max)
- Add 3–5 interest/skill tags (expand from the current single tag)
- Optional single-line fields for Work and School (context, not credentials — keep it low-pressure)
- Do NOT add Hinge-style prompt-and-response cards or anything that feels like "selling yourself"

### 3. Two Profile Views
- **Compact view**: What others see on Discover cards — primary photo, name, tagline, top interest tags
- **Full profile view**: What you see when tapping someone's card — all photos, bio, "currently working on", work/school, all tags, availability status
- **Own profile screen**: Existing profile screen updated with lead photo, photo thumbnails, and new fields. Keep existing elements (phone number, My Friends, Sign Out)

### 4. Design Constraints
- Maintain Digital Matcha design system (see color tokens below)
- Keep the café-inspired warmth — nothing should feel like LinkedIn or a dating app
- The energy should be "here's what I'm about" not "here's why you should pick me"
- Photos should feel natural and approachable, not polished or performative

### Color Tokens
- `#3F5443` — Sage primary (buttons, accents)
- `#1A1A1A` — Text primary
- `#6B6B6B` — Text secondary
- `#9B9B9B` — Text muted / placeholders
- `#E8E7E4` — Avatar fallback bg
- `#E4E3E0` — Borders / separators
- `#EEEDEA` — Input backgrounds
- `#F5F4F1` — App background
- `#FFFFFF` — Surface / cards
- `#B85C4D` — Error/destructive actions

## Deliverable
Produce a detailed implementation plan covering:
1. New/modified data models (what fields to add to the user profile)
2. New screens and components needed
3. Changes to existing screens (Profile, Discover cards)
4. Photo upload/storage approach
5. Onboarding flow changes (require 3 photos during signup)
6. Migration plan for existing users (prompt them to add photos)
7. File-by-file breakdown of what to create/modify

Do NOT write any code yet — plan only.
