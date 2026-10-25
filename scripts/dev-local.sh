#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if command -v node >/dev/null 2>&1; then
  runtime_node=$(command -v node)
else
  runtime_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$runtime_node" ]; then
  printf '%s\n' 'Node 24가 필요합니다. 설치 후 npm ci, npm run dev를 실행하세요.' >&2
  exit 1
fi
if [ ! -f node_modules/vite/bin/vite.js ]; then
  printf '%s\n' '의존성이 없습니다. Node 24/npm 환경에서 npm ci를 먼저 실행하세요.' >&2
  exit 1
fi
exec "$runtime_node" node_modules/vite/bin/vite.js --host 127.0.0.1
