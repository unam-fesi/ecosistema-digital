#!/usr/bin/env bash
# 8 · ASÍNCRONO · Enviar dominio a enriquecimiento
HOST="${HOST:-http://192.168.1.79:8666}"
DIR="$(cd "$(dirname "$0")" && pwd)"; FMT="$DIR/../presentacion/fmt.py"
TARGET="unam.mx"
PAYLOAD='{"target":"'"$TARGET"'","mode":"async"}'
# --- muestra el curl que se envía ---
printf "\033[96m$\033[0m \033[2mcurl -s -X POST %s/analyze -H 'Content-Type: application/json' -d '%s'\033[0m\n" "$HOST" "$PAYLOAD"
curl -s -X POST "$HOST/analyze" -H "Content-Type: application/json" -d "$PAYLOAD" | python3 "$FMT" "unam.mx"
