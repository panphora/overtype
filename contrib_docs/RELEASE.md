# Release Process for OverType

## Pre-Release Checklist

### 1. Check for Temporary Files
**IMPORTANT: Do this first before any other release steps**

Run `git status` and check for uncommitted files that might be temporary:
- Test files in root directory (test-*.js, test-*.html)
- Debug files
- Temporary documentation (FINAL_*, TEMP_*, etc.)
- Personal test HTML files

If temporary files are found:
- Review each file
- Delete temporary/debug files
- Move useful tests to test/ directory
- Report back what was cleaned up

### 2. Update Version
- Update version in package.json
- Follow semantic versioning (major.minor.patch)

### 3. Update CHANGELOG.md
- Add new version section with date
- List all changes, fixes, and features
- Credit contributors if applicable

### 4. Run Tests
```bash
npm test
```
All tests must pass before proceeding.

### 5. Build Distribution Files
```bash
npm run build
```

### 6. Commit Changes
```bash
git add -A
git commit -m "Release v{version}"
```
**IMPORTANT:** Do NOT add co-author attribution. Claude Code should never add itself as a co-author unless specifically requested by the user.

### 7. Create Git Tag
```bash
git tag v{version}
git push origin main --tags
```

### 8. Publish to NPM
```bash
npm publish
```

### 9. Prime unpkg Cache
```bash
curl -I https://unpkg.com/overtype@{version}/dist/overtype.min.js
```
This ensures the CDN cache is primed for the new version.

### 10. Post-Release
- Verify npm package is live
- Test installation in a clean project
- Update any example repos or documentation sites