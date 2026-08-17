#!/usr/bin/env bash
set -u
DOMAINS=(
  mutfaksanatlari.com
  mutfakbahcesi.com
  mutfakyolculugu.com
  mutfakkervani.com
  mutfaksofrasi.com
  mutfakizi.com
  mutfakhikayeleri.com
  mutfakduragi.com
  mutfakkilavuzu.com
  mutfakoykusu.com
  mutfaktarifi.com
  mutfakatlasi.com
  mutfakrotasi.com
  mutfakpusulasi.com
  sefinmutfagi.com
  mutfaksefi.com
  sofrasefi.com
  sefnotlari.com
  sefyemekleri.com
  seflezzet.com
)
for domain in "${DOMAINS[@]}"; do
  echo "=== $domain ==="
  rdap=$(curl -L --max-time 12 -sS -H 'Accept: application/rdap+json' "https://rdap.verisign.com/com/v1/domain/$domain" || true)
  if printf '%s' "$rdap" | grep -q '"objectClassName"'; then
    status=$(printf '%s' "$rdap" | tr ',' '\n' | grep '"status"' | head -2 | tr '\n' ' ')
    echo "RDAP: REGISTERED $status"
  else
    echo "RDAP: NO_REGISTERED_RECORD_OR_UNAVAILABLE"
  fi
  dns=$(getent ahosts "$domain" 2>/dev/null | head -1 || true)
  if [ -n "$dns" ]; then echo "DNS: $dns"; else echo "DNS: NO_A_RECORD"; fi
done
