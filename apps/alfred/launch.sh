#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"

runtime="${node_path:-}"
if [[ -z "$runtime" ]]; then
  for candidate in "$HOME/.local/bin/node" /opt/homebrew/bin/node /usr/local/bin/node; do
    if [[ -x "$candidate" ]]; then
      runtime="$candidate"
      break
    fi
  done
fi
if [[ -z "$runtime" ]]; then
  runtime="$(command -v node || true)"
fi
if [[ -z "$runtime" || ! -x "$runtime" ]]; then
  echo '{"items":[{"title":"找不到 Node.js","subtitle":"在 Configure Workflow 中填写 Node.js 18+ 的绝对路径","valid":false}]}'
  exit 0
fi
exec "$runtime" dist/cli.js "$@"
