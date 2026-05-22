#!/bin/sh
set -e

export VITE_DEFAULT_VIEW="${VITE_DEFAULT_VIEW:-sandbox}"

exec npx vite --host 0.0.0.0 --port "${WEB_PORT:-5173}" --strictPort
