# Claude Vision — Video Analyzer Skill

Join 550+ Performance Marketing Teams Inside SCALE AI: https://www.skool.com/scale-ai/about

Give Claude Code the ability to "watch" videos.

This is a Claude Code skill that routes any video file through Google's Gemini API (which has native video understanding) and returns a structured markdown report — top-level summary, scene-by-scene breakdown with timestamps, audio transcript, visual details, and key moments. Works on screen recordings, UGC ads, tutorials, demos, meeting recordings — anything Gemini can ingest.

It has strong anti-hallucination guardrails: it will not invent narrators, voiceovers, or speaker names that aren't actually in the video.

## Install

### 1. Clone this repo

```bash
git clone https://github.com/mikefutia/claude-vision.git
```

### 2. Move it into your Claude Code skills folder

```bash
mv claude-vision ~/.claude/skills/video-analyzer
```

The folder name **must** be `video-analyzer` — that's how Claude Code finds the skill.

### 3. Get a free Gemini API key

Go to [Google AI Studio](https://aistudio.google.com/apikey) and create a key. The free tier is generous and fine for personal use.

### 4. Set the API key

The easiest way: open Claude Code in any project and ask it to set up the key for you. Something like:

> "Set my GEMINI_API_KEY to `your_key_here` so it's available in every new shell."

Claude Code will add the export to your shell profile and confirm it works. You won't need to touch `.zshrc` yourself.

### 5. Install the Python dependency

The skill uses Google's official Gemini SDK:

```bash
pip install google-genai
```

If pip complains about an externally-managed environment, use:

```bash
pip install google-genai --break-system-packages
```

### 6. Use the skill

In Claude Code, just point it at a video:

> "Use the video-analyzer skill on /path/to/my-video.mp4"

Or invoke it directly:

> "/video-analyzer ~/Downloads/demo.mp4"

Claude will run the analysis and present the structured report.

## What you can do with it

- **Ad teardowns** — drop in a competitor's UGC ad, get a beat-by-beat breakdown
- **Tutorial → SOP** — turn a Loom recording into a written step-by-step guide
- **Meeting recaps** — extract decisions and action items from a call
- **Demo notes** — summarize what happened in a screen recording
- **General "what's in this video?"** — any video, any question

## Supported formats

mp4, mov, webm, avi, mpeg, mpg, flv, wmv, 3gpp, 3gp

## Optional flags

```
/video-analyzer <path> [--prompt "custom prompt"] [--fps N] [--model gemini-2.5-flash]
```

- `--prompt` — override the default structured-report prompt with anything you want
- `--fps` — change the frame sampling rate (default 1 fps; raise it for fast-cut content)
- `--model` — pick a different Gemini model (default `gemini-3-flash-preview`)

## Troubleshooting

- **"GEMINI_API_KEY environment variable is not set"** — your key isn't visible to the shell Claude Code is running in. Open a new terminal and try again, or ask Claude Code to fix it.
- **"google-genai is not installed"** — run `pip install google-genai` (see step 5).
- **Upload timeout on big files** — Gemini's Files API can take 30–60 seconds to process longer videos. The script polls for up to 5 minutes before giving up.
- **Model 404** — try `--model gemini-2.5-flash` if the default preview model isn't available in your region.

## License

MIT — do whatever you want with it.
