#!/usr/bin/env bash
# Reset bindings but keep document loaded

set -e

LATTICE_PORT=${LATTICE_PORT:-3456}
LATTICE_HOST=${LATTICE_HOST:-localhost}

RESPONSE=$(curl -s -X POST "http://${LATTICE_HOST}:${LATTICE_PORT}/reset")

echo "$RESPONSE" | jq -r 'if .success then .message else "Error: \(.error)" end'
