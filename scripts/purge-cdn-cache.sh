#!/usr/bin/env bash
set -euo pipefail

PKG="overtype"
PURGE_BASE="https://purge.jsdelivr.net/npm/${PKG}@latest"
MAX_FILES=10
WAIT_SECONDS=30

# Find the two most recent tags to determine what changed
TAGS=$(git tag --sort=-version:refname | head -2)
CURRENT_TAG=$(echo "$TAGS" | sed -n '1p')
PREV_TAG=$(echo "$TAGS" | sed -n '2p')

if [ -z "$PREV_TAG" ]; then
  echo "Only one tag found — purging main entry only"
  CHANGED_FILES=""
else
  echo "Diffing ${PREV_TAG}..${CURRENT_TAG}"
  CHANGED_FILES=$(git diff --name-only "$PREV_TAG" "$CURRENT_TAG" -- dist/ src/ | head -n "$MAX_FILES")
fi

echo "Waiting ${WAIT_SECONDS}s for npm registry to propagate..."
sleep "$WAIT_SECONDS"

echo "Purging ${PURGE_BASE}"
curl -fsS "$PURGE_BASE" > /dev/null 2>&1 || echo "  (failed — non-blocking)"

for FILE in $CHANGED_FILES; do
  URL="${PURGE_BASE}/${FILE}"
  echo "Purging ${URL}"
  curl -fsS "$URL" > /dev/null 2>&1 || echo "  (failed — non-blocking)"
done

echo "CDN cache purge complete"
