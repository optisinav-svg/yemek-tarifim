#!/usr/bin/env bash
set -u
for domain in sefinmutfagi.com mutfaksefi.com sofrasefi.com sefnotlari.com sefyemekleri.com seflezzet.com; do
  echo "=== $domain ==="
  rdap=$(curl -L --max-time 8 -sS -H 'Accept: application/rdap+json' "https://rdap.verisign.com/com/v1/domain/$domain" || true)
  if printf '%s' "$rdap" | grep -q '"objectClassName"'; then
    echo "RDAP: REGISTERED"
  else
    echo "RDAP: NO_REGISTERED_RECORD_OR_UNAVAILABLE"
  fi
  dns=$(getent ahosts "$domain" 2>/dev/null | head -1 || true)
  if [ -n "$dns" ]; then echo "DNS: $dns"; else echo "DNS: NO_A_RECORD"; fi
done
