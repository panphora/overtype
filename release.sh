#!/bin/bash
set -e  # Exit on error

# Overtype Automated Release Script
# Automates most of the release process with command-line prompts

echo "╔════════════════════════════════════════╗"
echo "║     Overtype Release Automation       ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${BLUE}ℹ${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q '"name": "overtype"' package.json; then
    error "Must run from overtype root directory"
    exit 1
fi

# ============================================
# STEP 1: Collect Release Information
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Release Information"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get version bump type
echo "Select version bump type:"
echo "  1) patch   (bug fixes, 1.0.0 → 1.0.1)"
echo "  2) minor   (new features, 1.0.0 → 1.1.0)"
echo "  3) major   (breaking changes, 1.0.0 → 2.0.0)"
echo "  4) custom  (enter version manually)"
echo ""
read -p "Enter choice [1-4]: " version_choice

case $version_choice in
    1) VERSION_TYPE="patch" ;;
    2) VERSION_TYPE="minor" ;;
    3) VERSION_TYPE="major" ;;
    4)
        read -p "Enter custom version (e.g., 2.0.0-beta.1): " CUSTOM_VERSION
        VERSION_TYPE="custom"
        ;;
    *)
        error "Invalid choice"
        exit 1
        ;;
esac

# Get changelog entries - auto-generate from commits since last tag
echo ""
info "Generating changelog from commits since last release..."

# Get the last tag
LAST_TAG=$(git tag --sort=-version:refname | head -1)

if [ -n "$LAST_TAG" ]; then
    info "Last release: $LAST_TAG"

    # Get commit range
    COMMIT_RANGE="${LAST_TAG}..HEAD"

    # Get the git log
    GIT_LOG=$(git log "$COMMIT_RANGE" --pretty=format:"%s")

    if [ -z "$GIT_LOG" ]; then
        warn "No commits since last tag"
        echo ""
        info "Enter changelog entries manually (Ctrl+D when done):"
        echo "Format: Type: Description"
        echo "Types: Added, Changed, Fixed, Breaking"
        echo ""
        CHANGELOG_ENTRIES=$(cat)
    else
        echo ""
        echo "Commits since $LAST_TAG:"
        echo "$GIT_LOG"
        echo ""

        # Use claude CLI to generate changelog
        info "Analyzing commits with Claude..."
        CHANGELOG_ENTRIES=$(echo "$GIT_LOG" | npx @anthropic-ai/claude-code -p "Analyze these git commit messages and generate changelog entries. Format each entry as one of: 'Added: description', 'Changed: description', 'Fixed: description', or 'Breaking: description'. Only output the formatted changelog entries, nothing else. One entry per line.")

        echo ""
        echo "Generated changelog:"
        echo "$CHANGELOG_ENTRIES"
        echo ""

        read -p "Accept this changelog? [Y/n]: " accept_changelog
        if [[ $accept_changelog =~ ^[Nn]$ ]]; then
            echo ""
            info "Enter changelog entries manually (Ctrl+D when done):"
            echo "Format: Type: Description"
            echo "Types: Added, Changed, Fixed, Breaking"
            echo ""
            CHANGELOG_ENTRIES=$(cat)
        fi
    fi
else
    warn "No previous tags found"
    echo ""
    info "Enter changelog entries manually (Ctrl+D when done):"
    echo "Format: Type: Description"
    echo "Types: Added, Changed, Fixed, Breaking"
    echo ""
    CHANGELOG_ENTRIES=$(cat)
fi

# Publish tag (latest, beta, alpha)
echo ""
read -p "NPM publish tag [latest/beta/alpha] (default: latest): " NPM_TAG
NPM_TAG=${NPM_TAG:-latest}

# ============================================
# STEP 2: Pre-Release Checks
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Pre-Release Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check git status
info "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
    warn "You have uncommitted changes:"
    git status --short
    read -p "Continue anyway? [y/N]: " continue_dirty
    if [[ ! $continue_dirty =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    success "Working directory clean"
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warn "Not on main branch (currently on: $CURRENT_BRANCH)"
    read -p "Continue anyway? [y/N]: " continue_branch
    if [[ ! $continue_branch =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    success "On main branch"
fi

# Pull latest
info "Pulling latest changes..."
git pull origin main || warn "Could not pull (may need to merge)"

# ============================================
# STEP 3: Build and Test
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Build and Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Build
info "Building..."
npm run build
success "Build completed"

# Run tests (pipe through cat to avoid tty issues with test output)
info "Running tests..."
if npm test | cat; then
    success "All tests passed"
else
    error "Tests failed"
    read -p "Continue anyway? [y/N]: " continue_tests
    if [[ ! $continue_tests =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ============================================
# STEP 4: Version Bump
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 4: Version Bump"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
info "Current version: $CURRENT_VERSION"

# Bump version
if [ "$VERSION_TYPE" = "custom" ]; then
    NEW_VERSION="$CUSTOM_VERSION"
    npm version "$NEW_VERSION" --no-git-tag-version
else
    NEW_VERSION=$(npm version "$VERSION_TYPE" --no-git-tag-version | sed 's/^v//')
fi

success "Version bumped to: $NEW_VERSION"

# ============================================
# STEP 5: Update CHANGELOG
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 5: Update CHANGELOG"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

DATE=$(date +%Y-%m-%d)

# Create changelog entry
CHANGELOG_ENTRY="## [$NEW_VERSION] - $DATE

"

# Parse changelog entries by type
while IFS= read -r line; do
    if [[ $line =~ ^Added: ]]; then
        ADDED_ITEMS="${ADDED_ITEMS}- ${line#Added: }
"
    elif [[ $line =~ ^Changed: ]]; then
        CHANGED_ITEMS="${CHANGED_ITEMS}- ${line#Changed: }
"
    elif [[ $line =~ ^Fixed: ]]; then
        FIXED_ITEMS="${FIXED_ITEMS}- ${line#Fixed: }
"
    elif [[ $line =~ ^Breaking: ]]; then
        BREAKING_ITEMS="${BREAKING_ITEMS}- ${line#Breaking: }
"
    fi
done <<< "$CHANGELOG_ENTRIES"

# Build sections
[ -n "$ADDED_ITEMS" ] && CHANGELOG_ENTRY="${CHANGELOG_ENTRY}### Added
$ADDED_ITEMS
"
[ -n "$CHANGED_ITEMS" ] && CHANGELOG_ENTRY="${CHANGELOG_ENTRY}### Changed
$CHANGED_ITEMS
"
[ -n "$FIXED_ITEMS" ] && CHANGELOG_ENTRY="${CHANGELOG_ENTRY}### Fixed
$FIXED_ITEMS
"
[ -n "$BREAKING_ITEMS" ] && CHANGELOG_ENTRY="${CHANGELOG_ENTRY}### Breaking Changes
$BREAKING_ITEMS
"

# Insert into CHANGELOG.md
if [ -f "CHANGELOG.md" ]; then
    # Insert after header - use a temp file approach instead of awk -v
    TEMP_FILE=$(mktemp)
    TEMP_ENTRY=$(mktemp)

    # Write changelog entry to temp file
    echo "$CHANGELOG_ENTRY" > "$TEMP_ENTRY"

    # Insert after first header line
    awk -v entry_file="$TEMP_ENTRY" '
        /^# / && !inserted {
            print $0
            print ""
            while ((getline line < entry_file) > 0) {
                print line
            }
            close(entry_file)
            inserted=1
            next
        }
        {print}
    ' CHANGELOG.md > "$TEMP_FILE"

    mv "$TEMP_FILE" CHANGELOG.md
    rm -f "$TEMP_ENTRY"
    success "CHANGELOG.md updated"
else
    # Create new CHANGELOG.md
    echo "# Changelog

$CHANGELOG_ENTRY" > CHANGELOG.md
    success "CHANGELOG.md created"
fi

# ============================================
# STEP 6: Commit and Tag
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 6: Commit and Tag"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate commit message with Claude
info "Generating commit message with Claude..."
COMMIT_MSG=$(echo "$CHANGELOG_ENTRIES" | npx @anthropic-ai/claude-code -p "Based on these changelog entries, generate a single-line commit message (max 72 chars) for a release. Start with 'chore: release v$NEW_VERSION - ' followed by a brief summary of the main changes. Output only the commit message, nothing else.")

echo ""
echo "Generated commit message:"
echo "  $COMMIT_MSG"
echo ""

read -p "Accept this commit message? [Y/n]: " accept_commit_msg
if [[ $accept_commit_msg =~ ^[Nn]$ ]]; then
    echo ""
    read -p "Enter custom commit message: " COMMIT_MSG
fi

# Stage changes
git add package.json CHANGELOG.md

# Commit
git commit -m "$(cat <<EOF
$COMMIT_MSG

$CHANGELOG_ENTRIES
EOF
)"
success "Changes committed"

# Create tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"
success "Tag created: v$NEW_VERSION"

# ============================================
# STEP 7: Dry Run
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 7: Pre-Publish Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

info "Running npm publish --dry-run..."
npm publish --dry-run --tag "$NPM_TAG"

echo ""
warn "Review the output above carefully!"
echo ""

# ============================================
# STEP 8: Publish
# ============================================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 8: Publish to npm"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Summary:"
echo "  Version: $CURRENT_VERSION → $NEW_VERSION"
echo "  Tag: $NPM_TAG"
echo "  Git tag: v$NEW_VERSION"
echo ""

read -p "Publish to npm? [y/N]: " confirm_publish
if [[ ! $confirm_publish =~ ^[Yy]$ ]]; then
    warn "Publish cancelled"
    echo ""
    echo "To manually publish later:"
    echo "  git push origin main"
    echo "  git push origin --tags"
    echo "  npm publish --tag $NPM_TAG"
    exit 0
fi

# Publish to npm
info "Publishing to npm..."
npm publish --tag "$NPM_TAG"
success "Published to npm!"

# Push to git
info "Pushing to GitHub..."
git push origin main
git push origin --tags
success "Pushed to GitHub"

# ============================================
# STEP 9: Verify
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 9: Verification"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 5  # Give npm a moment to update

info "Verifying npm publication..."
NPM_VERSION=$(npm view overtype version 2>/dev/null || echo "unknown")
if [ "$NPM_VERSION" = "$NEW_VERSION" ]; then
    success "npm shows version: $NPM_VERSION"
else
    warn "npm shows version: $NPM_VERSION (expected: $NEW_VERSION)"
    warn "It may take a few moments for npm to update"
fi

# ============================================
# Done!
# ============================================

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "Release Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Released: overtype@$NEW_VERSION"
echo "npm tag: $NPM_TAG"
echo "Git tag: v$NEW_VERSION"
echo ""
echo "Next steps:"
echo "  • Test installation: npm install overtype@$NPM_TAG"
echo "  • Check jsDelivr CDN: https://cdn.jsdelivr.net/npm/overtype@$NEW_VERSION/dist/overtype.min.js"
echo "  • Announce the release"
echo ""