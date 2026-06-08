#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 20 or newer is required. Install Node.js first, then rerun install.sh." >&2
  exit 1
fi

if [ ! -d "$ROOT/node_modules/@electron/asar" ]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required to install patcher dependencies." >&2
    exit 1
  fi
  npm install --omit=dev --prefix "$ROOT"
fi

node "$ROOT/bin/antigravity-cn-patch.js" apply --prefer-download "$@"
