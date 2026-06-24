---
name: video-analyzer
description: Analyzes a video file with Google Gemini and returns a structured markdown report covering top-level summary, scene-by-scene breakdown, audio transcript (or honest "silent" note), visual details, and key timestamped moments. Strong anti-hallucination guardrails — will not invent narrators, voiceovers, or speaker names. Use when you need to understand what actually happens in a video.
argument-hint: <path/to/video.mp4> [--prompt "..."] [--fps N] [--model ...]
disable-model-invocation: true
allowed-tools: Bash, Read
---

# Analyze Video

Analyze a video file with Gemini and return a structured markdown report.

## Prerequisites

- Python 3.10+
- `google-genai` installed globally (any Python the shell finds via `python3` works — verified working at version 1.64.0)
- `GEMINI_API_KEY` set in the user's shell environment (e.g. exported in `~/.zshrc`)

## Steps

1. Parse the arguments from `$ARGUMENTS`:
   - **video path** (required) — path to the video file
   - **--prompt** (optional) — custom analysis prompt; defaults to a structured-report prompt with anti-hallucination rules
   - **--fps** (optional) — custom frame sampling rate (useful for catching sub-second cuts in fast-paced footage)
   - **--model** (optional) — Gemini model ID; defaults to `gemini-3-flash-preview`

2. Verify the video file exists at the given path. If not, report the error and stop.

3. Run the analysis script. Use whichever install location exists — the
   project copy committed in the repo, or the personal copy under `~/.claude`:

```bash
SKILL_DIR=".claude/skills/video-analyzer"
[ -f "$SKILL_DIR/scripts/analyze_video.py" ] || SKILL_DIR="$HOME/.claude/skills/video-analyzer"
python3 "$SKILL_DIR/scripts/analyze_video.py" $ARGUMENTS
```

4. The script will:
   - Upload the video — inline for files ≤18MB, Files API for larger files (with up-to-300s polling for ACTIVE state)
   - Send the prompt to Gemini with the video attached
   - Print the full markdown report to stdout (info/progress lines go to stderr)

5. Capture stdout and present the report to the user.

6. If the script exits with an error, help the user troubleshoot:
   - **Missing API key**: confirm `echo $GEMINI_API_KEY` is non-empty in their shell. If it's only in `~/.zshrc`, they may need to start a new terminal or `source ~/.zshrc`.
   - **Unsupported format**: must be one of mp4, mov, avi, webm, mpeg, mpg, wmv, 3gpp, 3gp, flv
   - **Upload timeout**: large file or slow connection — retry, or use a shorter clip
   - **Model error / 404**: try a different model with `--model gemini-2.5-flash`

## Output

A markdown report printed to stdout with these sections:

- **Top-Level Summary** — 2-3 sentence overview of what actually happens
- **Scene-by-Scene Breakdown** — `MM:SS` timestamps for each cut/scene with on-screen content, actions, and verbatim text
- **Audio** — verbatim transcript with timestamps, OR an honest "no audio / silent / ambient only" note (the prompt explicitly forbids inventing narrators)
- **Visual Details** — on-screen text, UI elements, products, branding, people
- **Key Moments** — 3-7 timestamped highlights a viewer would remember
