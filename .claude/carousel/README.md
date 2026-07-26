# Clover Instagram Launch Carousel

Six-slide Instagram launch carousel (1080×1350, 4:5) built in Clover's real brand
tokens and fonts. Slide 5 is a looping video; the rest are stills.

Review page (published Artifact): plays slide 5 inline, includes the caption + notes.

## Final slides (`exports/`)

| # | File | Headline | Content |
|---|------|----------|---------|
| 1 | `clover_slide1.png` | Meet the interesting people *in this café.* | Rebuilt login screen |
| 2 | `clover_slide2.png` | You're in the same café. *You'll never know.* | Problem + greyed profile card |
| 3 | `clover_slide3.png` | Set your focus, *drop a pin.* | Rebuilt "Today's focus" sheet |
| 4 | `clover_slide4.png` | See who's *here right now.* | Real Discover list (Iris, Mariia, Sam, Alex, Chloe) |
| 5 | `clover_slide5.mp4` | Invite before your *coffee's cold.* | Video: tap → "Invite sent ✓" → loops |
| 6 | `clover_slide6.png` | Find your clover. *Do the work.* | CTA |

`preview_all_slides.jpg` is a 2×3 contact sheet. `clover_slide4_scroll_video_alt.mp4`
is an optional alternate: slide 4 as a looping scroll video (unused in the final set,
kept in case you want slide 4 as video too).

Caption + hashtags: `caption.md`.

## Design system (reused from the app — not invented)

- Tokens (`src/constants/clover.ts`): `CLOVER_BG #ede8ff`, `CLOVER_FOREST #1e3d28`,
  `CLOVER_VIOLET #7c5cbf`, `CLOVER_LAVENDER #d0c8f0`. Slide ground is `#f3efff`.
- Fonts: Cormorant Garamond Light/Italic + DM Sans, embedded as base64 in `fonts.css`.
- Signature: DM Sans 700 forest headline with 1–2 emphasis words in Cormorant Light
  Italic violet.

## Source assets (beside `build.py`)

- `card_profile.png` — profile card for slide 2 (frame from the demo video).
- `user_discover.png` — real Discover list for slide 4 (surnames trimmed to Iris/Sam).
- `invite_tall.png` / `sent_tall.png` — profile-with-button states for the slide 5 video
  (touch dot removed, clean cream gap).

The login (slide 1) and focus sheet (slide 3) are reconstructed in HTML inside
`build.py` — no screenshot files needed.

## Rebuild

Requires Python (Pillow), the bundled Chromium, and ffmpeg (imageio-ffmpeg).

```bash
python3 build.py                 # renders out/clover_slide1..6.png (still slides)
KEYSCREEN=1 python3 build.py      # renders keyout/ with magenta screen holes (for video compositing)
python3 make_video5.py            # builds clover_slide5.mp4 (invite loop) + slide 5 still
python3 make_video.py             # optional: builds clover_slide4.mp4 (scroll loop)
```

To try a different background, `GROUND='#ffffff' python3 build.py` → `out_white/`.
