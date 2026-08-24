#!/usr/bin/env bash
set -euo pipefail

# `npm publish --dry-run` still runs the publish/postpublish lifecycle scripts:
# npm's publish.js guards only the upload with `if (!dryRun)`. npmrelease dry-runs
# at step 8 before publishing at step 9, so without this guard every release runs
# this script TWICE, and the first pass purges @latest while it still resolves to
# the PREVIOUS version — nothing has been published yet. A purge drops the cached
# object and the next request re-resolves, so that pass can re-cache the OLD build
# under @latest. The real pass below drops it again ~30s later, so the cost here is
# a wasted wait plus a window where @latest serves the old build, not a failed
# release. (hyperclayjs carries the same guard, where it matters more: that script
# verifies and exits non-zero, so its dry-run pass could fail the publish outright.)
if [ "${npm_config_dry_run:-}" = "true" ]; then
  echo "npm publish --dry-run — skipping CDN purge"
  exit 0
fi

PKG="overtype"
PURGE_BASE="https://purge.jsdelivr.net/npm/${PKG}@latest"
MAX_FILES=10
WAIT_SECONDS=30

# The two most recent RELEASE tags, and nothing else.
#
# `git tag --sort` orders EVERY tag in the repo, so any non-version marker tag
# sorts above the releases and gets read as the current one, diffing the wrong
# range and purging the wrong file list. npmrelease hit exactly this: makerclay
# carries a `last-mit` marker that sorted above every version. `for-each-ref`
# glob-matches the whole ref path, and the `[0-9]` class keeps non-releases out.
TAGS=$(git for-each-ref --count=2 --sort=-version:refname \
    --format='%(refname:strip=2)' 'refs/tags/v[0-9]*')
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
