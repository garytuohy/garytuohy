#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

printf "Serving ClarityHome from %s\n" "$root_dir"
printf "Open http://localhost:8000/index.html\n"

python -m http.server 8000 --directory "$root_dir"
