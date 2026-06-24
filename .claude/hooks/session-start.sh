#!/bin/bash
set -euo pipefail

# Installs the Python dependency for the video-analyzer skill (google-genai).
# Only runs in Claude Code on the web — local machines manage their own Python env.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Idempotent: skip the install if the package is already importable.
if python3 -c "import google.genai" 2>/dev/null; then
  exit 0
fi

echo "[session-start] Installing google-genai for the video-analyzer skill..."
# cffi is installed alongside it: the base image's system cryptography ships
# without its _cffi_backend, which google-genai needs at import time.
python3 -m pip install --quiet --disable-pip-version-check google-genai cffi
echo "[session-start] google-genai installed."
