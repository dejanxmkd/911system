#!/usr/bin/env bash
set -u

cd "${CODESPACE_VSCODE_FOLDER:-$(pwd)}"
mkdir -p checkpoints runtime dataset

python -m pip install -r requirements-api.txt >/tmp/bgremove-api-install.log 2>&1 || {
  echo "API dependency install failed. See /tmp/bgremove-api-install.log" >&2
  exit 1
}

pkill -f "uvicorn bgremove.api:app" 2>/dev/null || true
nohup env PYTHONPATH=src python -m uvicorn bgremove.api:app --host 0.0.0.0 --port 8000 >/tmp/bgremove-api.log 2>&1 &

for _ in $(seq 1 30); do
  if python - <<'PY'
import urllib.request
try:
    urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=1)
except Exception:
    raise SystemExit(1)
PY
  then
    break
  fi
  sleep 1
done

if command -v gh >/dev/null 2>&1 && [ -n "${CODESPACE_NAME:-}" ]; then
  gh codespace ports visibility 8000:public -c "$CODESPACE_NAME" >/tmp/bgremove-port.log 2>&1 || true
fi

# Install the heavier ML stack in the background so the UI/API is available immediately.
nohup python -m pip install -r requirements.txt >/tmp/bgremove-ml-install.log 2>&1 &
