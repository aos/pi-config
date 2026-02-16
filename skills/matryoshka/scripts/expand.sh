#!/usr/bin/env bash
# Expand a handle to see full data (with optional limit/offset)

set -e

LATTICE_PORT=${LATTICE_PORT:-3456}
LATTICE_HOST=${LATTICE_HOST:-localhost}

if [ -z "$1" ]; then
    echo "Usage: $0 <variable> [limit] [offset]"
    echo "Example: $0 RESULTS 10"
    echo "         $0 RESULTS 10 20  # Show 10 items starting at offset 20"
    exit 1
fi

VARIABLE="$1"
LIMIT="${2:-0}"
OFFSET="${3:-0}"

# Query the variable directly
RESPONSE=$(curl -s -X POST "http://${LATTICE_HOST}:${LATTICE_PORT}/query" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg cmd "$VARIABLE" '{"command": $cmd}')")

# Apply limit/offset client-side with jq if requested
if [ "$LIMIT" -gt 0 ]; then
    echo "$RESPONSE" | jq ".data |= (if type == \"array\" then .[$OFFSET:$((OFFSET + LIMIT))] else . end)"
else
    echo "$RESPONSE" | jq .
fi
