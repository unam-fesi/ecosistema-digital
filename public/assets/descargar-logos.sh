#!/usr/bin/env bash
# Descarga los logos oficiales (Wikimedia Commons, archivos con licencia libre)
# y los deja en esta carpeta (public/assets/) con los nombres que usa el sitio.
# Uso:  bash public/assets/descargar-logos.sh
set -u
cd "$(dirname "$0")" || exit 1

dl(){ # $1 = URL, $2 = archivo destino
  if curl -L --fail --silent --show-error -o "$2" "$1"; then
    echo "  ✓ $2"
  else
    echo "  ✗ FALLÓ $2  ($1)"
  fi
}

echo "Descargando logos a $(pwd) ..."
dl "https://commons.wikimedia.org/wiki/Special:FilePath/Escudo-UNAM-escalable.svg" "unam-escudo.svg"
dl "https://commons.wikimedia.org/wiki/Special:FilePath/Google_Workspace_Logo.svg" "google-workspace-logo.svg"
dl "https://commons.wikimedia.org/wiki/Special:FilePath/Microsoft_365_logo.svg"     "microsoft365-logo.svg"
dl "https://commons.wikimedia.org/wiki/Special:FilePath/Google_Gemini_logo.svg"     "gemini-logo.svg"

echo
echo "Listos los oficiales de UNAM / Google Workspace / Microsoft 365 / Gemini."
echo "DGTIC, CUAED y BiDi no están en Wikimedia: consíguelos de sus sitios y"
echo "guárdalos aquí como dgtic-logo.png, cuaed-logo.png y bidi-logo.png (opcional)."
