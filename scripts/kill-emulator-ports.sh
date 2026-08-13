#!/usr/bin/env bash
# Libera puertos de emuladores Firebase (Linux)
set -euo pipefail

PORTS=(9099 8080 9199 5001 4000 4400 4401 4500 4501)

echo "→ Liberando puertos de emuladores Firebase…"
if [ "$(uname)" = "Darwin" ]; then
  for port in "${PORTS[@]}"; do
    pids=$(lsof -ti "tcp:${port}" 2>/dev/null || true)
    for pid in $pids; do
      kill "$pid" 2>/dev/null && echo "  PID $pid (puerto $port) liberado"
    done
  done
else
  for port in "${PORTS[@]}"; do
    if command -v fuser >/dev/null 2>&1; then
      fuser -k "${port}/tcp" 2>/dev/null && echo "  Puerto $port liberado" || true
    else
      pids=$(ss -tlnp 2>/dev/null | grep ":${port} " | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | sort -u)
      for pid in $pids; do
        [ -n "$pid" ] && kill "$pid" 2>/dev/null && echo "  PID $pid (puerto $port)"
      done
    fi
  done
fi

pkill -f 'firebase emulators:start' 2>/dev/null || true
pkill -f 'cloud-firestore-emulator' 2>/dev/null || true
sleep 1
echo "✓ Listo. Ejecuta: cd Backend && npm run dev"
